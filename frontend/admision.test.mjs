import assert from "node:assert/strict"
import { after, test } from "node:test"
import { fileURLToPath } from "node:url"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer } from "vite"
import react from "@vitejs/plugin-react"

const root = fileURLToPath(new URL(".", import.meta.url))
const cacheDir = await mkdtemp(join(tmpdir(), "infancias-admision-test-"))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: "silent", plugins: [react()],
  resolve: { alias: { "@": `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { familiarAdmisionInput, adolescenteAdmisionInput, consultarPersonaAdmision } = await server.ssrLoadModule("/src/features/solicitud/admision.ts")
const { PersonasAdmision, AltaPersonaAdmision } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/PersonasAdmision.tsx")
const { DatosPersonaAdmision } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/DatosPersonaAdmision.tsx")
const { AdolescenteDetalle } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/AdolescenteDetalle.tsx")
const { RelacionesAdolescentesCard } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/RelacionesAdolescentesCard.tsx")
const { nombreDelAdolescente } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/solicitudDetalle.ts")
const { default: http } = await server.ssrLoadModule("/src/common/api/client.ts")
const { agregarAdolescenteSolicitud, agregarFamiliarSolicitud } = await server.ssrLoadModule("/src/features/solicitud/api.ts")
const persona = {
  dni: "50000002", sexo: "M", nombre: " Nombre ", apellido: " Prueba ", fecha_nacimiento: "Wed, 02 Jan 2008 00:00:00 GMT",
  hc: 123, hcf: 456, discapacidades: true, consumos_problematicos: false, intentos_de_suicidio: true,
  problemas_socioambientales: false, violencias: true, telefono: null, vinculo: { id: 4, nombre: "Referente" },
  domicilio: { nombre: "Domicilio", id_departamento: 1, observaciones: null, domicilio_validado: null }, legajo: null,
}
const render = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const props = { solicitud: { id: 7, puede_agregar_personas: true, puede_agregar_familiares: true, adolescentes: [] },
  bloqueado: false, onActualizar: () => {}, onGuardando: () => {} }

test("después de validar usa el nombre de Persona en títulos y vínculos, sin modificar el original", () => {
  const adolescente = {
    ...persona, id: 10, nombre: "Declarado", apellido: "Original", domicilio: null,
    persona: { ...persona, nombre: "Verificado", apellido: "Correcto", domicilio: null },
    familiares: [], referencias_instituciones: [], relaciones: [],
  }
  assert.equal(nombreDelAdolescente(adolescente), "Verificado Correcto")
  const html = render(AdolescenteDetalle, { adolescente, familiares: [], validada: true })
  assert.match(html, /aria-label="Verificado Correcto"/)
  assert.doesNotMatch(html, /Declarado|Original/)
  const pendiente = { ...adolescente, id: 11, persona: null }
  assert.equal(nombreDelAdolescente(pendiente), "Declarado Original")
  const sinValidar = render(AdolescenteDetalle, { adolescente: pendiente, familiares: [], validada: false })
  assert.match(sinValidar, /aria-label="Declarado Original"/)
  const vinculos = render(RelacionesAdolescentesCard, {
    adolescentes: [adolescente, pendiente],
    relaciones_adolescentes: [{ id: 1, adolescente1: 10, adolescente2: 11, vinculo: { nombre: "Hermano" } }],
  })
  assert.match(vinculos, /Verificado Correcto/)
  assert.match(vinculos, /Declarado Original/)
  assert.equal(adolescente.nombre, "Declarado")
  assert.equal(adolescente.apellido, "Original")
})

async function simularHTTP(respuesta, accion) {
  const anteriorStorage = globalThis.localStorage
  const anteriorAdapter = http.defaults.adapter
  globalThis.localStorage = { getItem: () => null }
  const llamadas = []
  http.defaults.adapter = async (config) => {
    llamadas.push(config)
    return { data: respuesta, status: 200, statusText: "OK", headers: {}, config }
  }
  try { await accion(llamadas) } finally {
    http.defaults.adapter = anteriorAdapter
    if (anteriorStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = anteriorStorage
  }
}

test("el alta envía persona completa y contacto, sin id, letras ni salud duplicada", () => {
  const datos = familiarAdmisionInput(10, persona)
  assert.deepEqual(Object.keys(datos).sort(), ["domicilio", "id_adolescente", "id_vinculo", "persona", "telefono"])
  assert.equal(datos.id_adolescente, 10)
  assert.equal(datos.id_vinculo, 4)
  assert.equal(datos.persona.nombre, "Nombre")
  assert.equal(datos.persona.fecha_nacimiento, "2008-01-02")
  for (const campo of ["hc", "hcf", "discapacidades", "consumos_problematicos", "intentos_de_suicidio", "problemas_socioambientales", "violencias"]) {
    assert.equal(datos.persona[campo], persona[campo])
  }
  assert.equal(datos.domicilio.id_departamento, 1)
})

test("requiere adolescente, vínculo y domicilio solo para adolescentes", () => {
  assert.throws(() => familiarAdmisionInput(0, persona), /Seleccioná .*adolescente/)
  assert.throws(() => familiarAdmisionInput(10, { ...persona, vinculo: null }), /vínculo/)
  assert.throws(() => adolescenteAdmisionInput(10, { ...persona, domicilio: null }, false), /domicilio/)
  assert.equal(familiarAdmisionInput(10, { ...persona, domicilio: null }).domicilio, null)
  assert.throws(() => familiarAdmisionInput(10, { ...persona, telefono: "123" }), /teléfono/)
})

test("conserva legajos locales y envía solamente los números externos nuevos", () => {
  const existente = { ...persona, legajo: { id_insert: 11, carpeta_id: 12 } }
  assert.equal(adolescenteAdmisionInput(10, existente, true).legajo, null)
  assert.deepEqual(adolescenteAdmisionInput(10, existente, false).legajo, existente.legajo)
  assert.equal(adolescenteAdmisionInput(10, persona, false).legajo, null)
  assert.throws(() => adolescenteAdmisionInput(10, { ...existente, legajo: { id_insert: -1 } }, false), /mayores a cero/)
})

test("la consulta elige el grupo correcto y preserva el legajo del adolescente", async () => {
  const registrada = { ...persona, legajo: 11, carpeta: 12 }
  await simularHTTP({ adolescentes: [{ persona: registrada }], familiares: [{ persona: registrada }] }, async (llamadas) => {
    const adolescente = await consultarPersonaAdmision("adolescente", persona.dni, persona.sexo)
    assert.equal(adolescente.legajoRegistrado, true)
    assert.deepEqual(adolescente.persona.legajo, { id_insert: 11, carpeta_id: 12 })
    const familiar = await consultarPersonaAdmision("familiar", persona.dni, persona.sexo)
    assert.equal(familiar.legajoRegistrado, false)
    assert.equal(familiar.persona.legajo, null)
    assert.equal(JSON.parse(llamadas[0].params.adolescentes)[0].dni, persona.dni)
    assert.equal(JSON.parse(llamadas[1].params.familiares)[0].dni, persona.dni)
  })
})

test("la consulta admite ciudadano y no permite guardar identidad inexistente o distinta", async () => {
  const ciudadano = { nombre: "Nombre", apellido: "Prueba", nroDocumento: 50000002, sexo: "M", fechaNacimiento: persona.fecha_nacimiento, hc: 123, hcf: 456 }
  await simularHTTP({ familiares: [{ ciudadano }] }, async () => {
    const consultada = await consultarPersonaAdmision("familiar", persona.dni, persona.sexo)
    assert.equal(consultada.persona.dni, persona.dni)
    assert.equal(consultada.persona.hcf, 456)
    await assert.rejects(consultarPersonaAdmision("familiar", "50000003", "M"), /no coincide/)
  })
  await simularHTTP({ familiares: [] }, async () => {
    await assert.rejects(consultarPersonaAdmision("familiar", persona.dni, persona.sexo), /No se encontró/)
  })
})

test("ofrece ambos tipos de alta solo con permiso y bloquea mientras se deriva", () => {
  const html = render(PersonasAdmision, props)
  assert.match(html, /Agregar familiar/)
  assert.match(html, /Agregar adolescente/)
  assert.equal(render(PersonasAdmision, { ...props, solicitud: { ...props.solicitud,
    puede_agregar_personas: false, puede_agregar_familiares: false } }), "")
  const bloqueado = render(PersonasAdmision, { ...props, bloqueado: true })
  assert.equal((bloqueado.match(/<button[^>]*disabled=""/g) ?? []).length, 2)
  const formulario = render(AltaPersonaAdmision, { ...props, tipo: "adolescente", onCancelar: () => {} })
  assert.match(formulario, /Seleccioná primero un adolescente/)
  assert.doesNotMatch(formulario, /Guardar adolescente/)
})

test("Entrada y Admisión después de derivar pueden agregar solo familiares", () => {
  const solicitud = { ...props.solicitud, puede_agregar_personas: false, puede_agregar_familiares: true }
  const html = render(PersonasAdmision, { ...props, solicitud })
  assert.match(html, /Agregar familiar/)
  assert.doesNotMatch(html, /Agregar adolescente|en admisión/)
  assert.match(render(AltaPersonaAdmision, { ...props, solicitud, tipo: 'familiar', onCancelar: () => {} }), /Nuevo familiar/)
  assert.equal(render(AltaPersonaAdmision, { ...props, solicitud, tipo: 'adolescente', onCancelar: () => {} }), '')
  const bloqueado = render(PersonasAdmision, { ...props, solicitud, bloqueado: true })
  assert.equal((bloqueado.match(/<button[^>]*disabled=""/g) ?? []).length, 1)
})

test("muestra salud completa de solo lectura y distingue legajos por tipo", () => {
  const html = render(DatosPersonaAdmision, { tipo: "adolescente", persona, legajoRegistrado: false, onChange: () => {} })
  const salud = html.match(/<section[^>]*aria-label="Datos de salud de solo lectura"[^>]*>([\s\S]*?)<\/section>/)?.[1]
  assert.ok(salud)
  for (const nombre of ["HC", "HCF", "Discapacidades", "Consumos problemáticos", "Intentos de suicidio", "Problemas socioambientales", "Violencias"]) assert.ok(salud.includes(nombre))
  assert.doesNotMatch(salud, /<input|<select|<textarea|<button/)
  assert.match(html, /El domicilio es obligatorio/)
  assert.match(html, /¿Tiene legajo y carpeta\?/)
  const familiar = render(DatosPersonaAdmision, { tipo: "familiar", persona, legajoRegistrado: false, onChange: () => {} })
  assert.doesNotMatch(familiar, /¿Tiene legajo|El domicilio es obligatorio/)
})

test("guardar usa rutas independientes y devuelve el detalle actualizado", async () => {
  const detalle = { id: 7, adolescentes: [{ id: 1 }], familiares: [{ id: 2 }] }
  await simularHTTP(detalle, async (llamadas) => {
    const familiar = familiarAdmisionInput(10, persona)
    const adolescente = adolescenteAdmisionInput(10, persona, false)
    assert.deepEqual(await agregarFamiliarSolicitud(7, familiar), detalle)
    assert.deepEqual(await agregarAdolescenteSolicitud(7, adolescente), detalle)
    assert.deepEqual(llamadas.map(({ method, url, data }) => ({ method, url, data: JSON.parse(data) })), [
      { method: "post", url: "solicitud/solicitud/7/familiares/", data: familiar },
      { method: "post", url: "solicitud/solicitud/7/adolescentes/", data: adolescente },
    ])
  })
})
