import assert from "node:assert/strict"
import { after, test } from "node:test"
import { fileURLToPath } from "node:url"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "vite"
import react from "@vitejs/plugin-react"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

const root = fileURLToPath(new URL(".", import.meta.url))
const cacheDir = await mkdtemp(join(tmpdir(), "infancias-solicitud-test-"))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: "silent",
  plugins: [react()],
  resolve: { alias: { "@": `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { prepararAdolescentes, prepararInstitucion, errorFamiliaresSolicitud } = await server.ssrLoadModule("/src/pages/CreatePage/formPayload.ts")
const { agruparReferencias, guardarReferencia, quitarReferencia } = await server.ssrLoadModule("/src/pages/CreatePage/referencias.ts")
const { crearIdTemporal } = await server.ssrLoadModule("/src/pages/CreatePage/formTypes.ts")
const { crearPayloadValidacion } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/validacion/payload.ts")
const { ciudadanoToPersona, personaRegistradaAFormulario } = await server.ssrLoadModule("/src/features/persona/utils.ts")
const { DatosSalud } = await server.ssrLoadModule("/src/features/persona/componets/DatosSalud.tsx")
const { HistoriaClinicaCard } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/validacion/HistoriaClinicaCard.tsx")
const { FamiliarForm } = await server.ssrLoadModule("/src/features/persona/componets/Familiar/FamiliarForm.tsx")
const { FamiliaresSection } = await server.ssrLoadModule("/src/features/persona/componets/Familiar/FamiliaresSection.tsx")

const domicilio = { nombre: "Domicilio de prueba", id_departamento: 1, observaciones: null, domicilio_validado: null }
const institucion = {
  id: 7, nombre: "Institución de prueba", tipo: { id: 1, nombre: "Tipo de prueba" },
  domicilio: { nombre: "Dirección de prueba", provincia: null, departamento: { id: 1, nombre: "Departamento de prueba" } },
  modo: "seleccionar",
}
const familiar = {
  nombre: "Familiar", apellido: "Prueba", dni: "30000001", sexo: "F", telefono: "", domicilio: null,
  vinculo: { id: 9, nombre: "Referente" },
}
function adolescente(id, dni, relacion = null) {
  return {
    id_temp: id, datos: { nombre: "Adolescente", apellido: id, dni, sexo: "F", fecha_nacimiento: "2012-01-01", escolarizado: true, domicilio },
    familiares: [], referencias: [], relacion,
  }
}
function grupo() {
  return [
    { ...adolescente("uno", "50000001"), familiares: [familiar], referencias: [institucion] },
    adolescente("dos", "50000002", { id_temp: "uno", vinculo: { id: 2, nombre: "Hermana" } }),
  ]
}

test("conserva propietarios y envía relaciones con identificadores temporales", () => {
  const entrada = grupo()
  const original = structuredClone(entrada)
  const payload = prepararAdolescentes(entrada)
  assert.deepEqual(entrada, original)
  assert.equal(payload.adolescentes[0].familiares[0].id_vinculo, 9)
  assert.deepEqual(payload.adolescentes[1].familiares, [])
  assert.deepEqual(payload.adolescentes[0].referencias_instituciones_data, [{ id: 7 }])
  assert.deepEqual(payload.adolescentes[1].referencias_instituciones_data, [])
  assert.equal("id_institucion" in payload.adolescentes[0], false)
  assert.equal("institucion" in payload.adolescentes[0], false)
  assert.deepEqual(payload.relaciones_adolescentes, [{ id_temp1: "dos", id_temp2: "uno", id_vinculo: 2 }])
  assert.equal("familiares" in payload, false)
})

test("separa institución solicitante de las referencias de cada adolescente", () => {
  const entrada = grupo()
  const nueva = { ...institucion, id: null, modo: "cargar", id_temp: "ref-1" }
  entrada[0].referencias = [nueva]
  const [primero] = prepararAdolescentes(entrada).adolescentes
  assert.equal("id_institucion" in primero, false)
  assert.equal("institucion" in primero, false)
  assert.equal(primero.referencias_instituciones_data[0].id_temp, "ref-1")
  assert.deepEqual(prepararInstitucion(institucion), { id_institucion: 7 })
  const solicitante = prepararInstitucion(nueva)
  assert.equal(solicitante.institucion.id_tipo, 1)
  assert.equal(solicitante.institucion.domicilio.id_departamento, 1)
  assert.equal("id_temp" in solicitante.institucion, false)
})

test("requiere un familiar por solicitud y vuelve a bloquear si se elimina el último", () => {
  const entrada = grupo()
  assert.equal(errorFamiliaresSolicitud(entrada), null)
  entrada[1].familiares = entrada[0].familiares
  entrada[0].familiares = []
  assert.equal(prepararAdolescentes(entrada).adolescentes[1].familiares.length, 1)
  entrada[1].familiares = []
  assert.match(errorFamiliaresSolicitud(entrada), /al menos un familiar/)
  assert.throws(() => prepararAdolescentes(entrada), /al menos un familiar/)
})

test("todos los familiares requieren DNI válido aunque otro familiar ya lo tenga", () => {
  for (const dni of [undefined, null, "", "  ", "123456", "123456789", "3000000A", "30.000.001", "٣٠٠٠٠٠٠١"]) {
    const entrada = grupo()
    entrada[1].familiares = [{ ...familiar, dni }]
    assert.match(errorFamiliaresSolicitud(entrada), /Todos los familiares.*DNI/)
    assert.throws(() => prepararAdolescentes(entrada), /Todos los familiares.*DNI/)
  }
  for (const dni of ["1234567", " 30000001 "]) {
    const entrada = grupo()
    entrada[0].familiares = [{ ...familiar, dni }]
    assert.equal(prepararAdolescentes(entrada).adolescentes[0].familiares[0].dni, dni.trim())
  }
})

test("el formulario muestra DNI obligatorio y avisa cuando faltan familiares", () => {
  const html = renderToStaticMarkup(createElement(FamiliarForm, {
    setFamiliar: () => {}, setFinishFamiliar: () => {}, domicilios: [],
  }))
  assert.match(html, /Número de Documento/)
  assert.match(html, /<input[^>]*required=""/)
  assert.doesNotMatch(html, /CARGAR DNI/)
  assert.match(html.match(/<button[^>]*>Cargar familiar \/ referente<\/button>/)?.[0] ?? "", /disabled=""/)
  const seccion = renderToStaticMarkup(createElement(FamiliaresSection, {
    adolescentes: grupo().map((item) => ({ ...item, familiares: [] })),
    setAdolescentes: () => {}, editando: false, setEditando: () => {}, domicilios: [],
  }))
  assert.match(seccion, /Agregá al menos un familiar/)
})

test("rechaza listas vacías, duplicados, vínculos faltantes y vínculos huérfanos", () => {
  assert.throws(() => prepararAdolescentes([]), /al menos un adolescente/)
  const entrada = grupo()
  assert.throws(() => prepararAdolescentes([entrada[0], entrada[0]]), /repetidos/)
  assert.throws(() => prepararAdolescentes([entrada[0], { ...entrada[1], datos: entrada[0].datos }]), /repetidos/)
  assert.throws(() => prepararAdolescentes([entrada[0], { ...entrada[1], relacion: null }]), /vínculo/)
  entrada[1].relacion.id_temp = "inexistente"
  assert.throws(() => prepararAdolescentes(entrada), /vínculo/)
})

test("impide autorrelaciones tras editar la identidad del adolescente", () => {
  const entrada = grupo()
  entrada[0].datos.dni = familiar.dni
  assert.throws(() => prepararAdolescentes(entrada), /propio familiar/)
})

test("genera IDs temporales distintos sin depender de HTTPS", () => {
  assert.equal(new Set(Array.from({ length: 100 }, crearIdTemporal)).size, 100)
})

test("envía multipart con familiares anidados y adjuntos sin convertirlo a JSON", async () => {
  const { default: http } = await server.ssrLoadModule("/src/common/api/client.ts")
  const { postSolicitud } = await server.ssrLoadModule("/src/features/solicitud/api.ts")
  const previousStorage = globalThis.localStorage
  const previousAdapter = http.defaults.adapter
  globalThis.localStorage = { getItem: () => null }
  const payload = prepararAdolescentes(grupo())
  let captured
  http.defaults.adapter = async (config) => {
    captured = config
    return { data: { id: 123 }, status: 201, statusText: "Created", headers: {}, config }
  }
  try {
    const result = await postSolicitud({
      ...payload, ...prepararInstitucion(institucion), correo: " prueba@example.invalid ", telefono: " 123 ", id_motivo: 1,
      descripcion: " Prueba ", archivos: [new File(["prueba"], "prueba.txt")],
    })
    assert.equal(result.id, 123)
    assert.ok(captured.data instanceof FormData)
    assert.deepEqual(JSON.parse(captured.data.get("adolescentes")), payload.adolescentes)
    assert.deepEqual(JSON.parse(captured.data.get("relaciones_adolescentes")), payload.relaciones_adolescentes)
    assert.equal(captured.data.get("correo"), "prueba@example.invalid")
    assert.equal(captured.data.get("archivos").name, "prueba.txt")
    assert.equal(captured.data.has("familiares"), false)
    assert.equal(captured.data.has("institucion"), false)
    assert.equal(captured.data.get("id_institucion"), "7")
    await postSolicitud({ ...payload, ...prepararInstitucion({ ...institucion, modo: "cargar", id: null }),
      correo: "prueba@example.invalid", telefono: "123", id_motivo: 1, descripcion: "", archivos: [] })
    assert.equal(captured.data.has("id_institucion"), false)
    assert.equal(JSON.parse(captured.data.get("institucion")).nombre, institucion.nombre)
    assert.equal(http.defaults.headers["Content-Type"], "application/json")
  } finally {
    http.defaults.adapter = previousAdapter
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

test("una referencia puede asociarse a varios adolescentes sin duplicar la institución en pantalla", () => {
  const entrada = grupo().map((item) => ({ ...item, referencias: [] }))
  const referencia = { ...institucion, id: null, modo: "cargar", id_temp: "ref-compartida" }
  const resultado = guardarReferencia(entrada, referencia, ["uno", "dos"])
  assert.deepEqual(entrada.map((item) => item.referencias), [[], []])
  assert.equal(agruparReferencias(resultado).length, 1)
  assert.deepEqual(agruparReferencias(resultado)[0].adolescentes, ["uno", "dos"])
  const payload = prepararAdolescentes(resultado)
  assert.equal(payload.adolescentes[0].referencias_instituciones_data[0].id_temp, "ref-compartida")
  assert.deepEqual(payload.adolescentes[0].referencias_instituciones_data, payload.adolescentes[1].referencias_instituciones_data)
})

test("editar vínculos cambia solo los adolescentes de la referencia y permite quitarla", () => {
  const inicial = guardarReferencia(grupo(), institucion, ["uno", "dos"], "institucion-7")
  const resultado = guardarReferencia(inicial, institucion, ["dos"], "institucion-7")
  assert.equal(resultado[0].referencias.length, 0)
  assert.equal(resultado[1].referencias.length, 1)
  assert.equal(resultado[0].familiares[0], familiar)
  assert.equal(agruparReferencias(quitarReferencia(resultado, "institucion-7")).length, 0)
})

test("referencias exigen adolescentes válidos y no admiten cargar dos veces la misma institución", () => {
  assert.throws(() => guardarReferencia(grupo(), institucion, []), /al menos un adolescente/)
  assert.throws(() => guardarReferencia(grupo(), institucion, ["no-existe"]), /ya no está/)
  assert.throws(() => guardarReferencia(grupo(), institucion, ["dos"]), /ya está agregada/)
})

function personaRevision(dni) {
  return {
    nombre: "Persona", apellido: "Prueba", dni, sexo: "F", fecha_nacimiento: "2001-01-01",
    telefono: null, domicilio: null, vinculo: { id: 3, nombre: "Referente" },
    legajo: { id_insert: 100, carpeta_id: 50 },
    hc: 100, hcf: 8, discapacidades: true, consumos_problematicos: false,
    intentos_de_suicidio: false, problemas_socioambientales: true, violencias: false,
  }
}

function familiarRevision(dni, id = null) {
  return {
    original: id ? { id } : null, estado: "confirmado", persona: personaRevision(dni),
  }
}

function casoValidacion() {
  return {
    solicitud: { adolescentes: [{ id: 1, nombre: "Adolescente", apellido: "Uno" }, { id: 2, nombre: "Adolescente", apellido: "Dos" }] },
    revisiones: {
      1: { estado: "confirmado", persona: personaRevision("40000001"), legajoRegistrado: true, familiares: [familiarRevision("30000001", 5)] },
      2: { estado: "confirmado", persona: personaRevision("40000002"), legajoRegistrado: false, familiares: [familiarRevision("30000001")] },
    },
  }
}

test("validación envía la persona completa de cada adolescente y familiar, sin salud duplicada", () => {
  const { solicitud, revisiones } = casoValidacion()
  const original = structuredClone(revisiones)
  const payload = crearPayloadValidacion(solicitud, revisiones, " Prueba ")
  assert.deepEqual(revisiones, original)
  assert.equal(payload.descripcion_extra, "Prueba")
  assert.deepEqual(Object.keys(payload).sort(), ["adolescentes", "descripcion_extra"])
  assert.deepEqual(Object.keys(payload.adolescentes[0]).sort(), ["familiares", "id", "legajo", "persona"])
  assert.equal(payload.adolescentes[0].familiares[0].id, 5)
  assert.equal("id" in payload.adolescentes[1].familiares[0], false)
  assert.equal(payload.adolescentes[0].legajo, null)
  assert.deepEqual(payload.adolescentes[1].legajo, { id_insert: 100, carpeta_id: 50 })
  assert.equal(payload.adolescentes[0].familiares[0].id_vinculo, 3)
  assert.equal("legajo" in payload.adolescentes[0].familiares[0], false)
  assert.equal("nombre" in payload.adolescentes[0].familiares[0], false)
  assert.deepEqual(payload.adolescentes[0].persona, {
    nombre: "Persona", apellido: "Prueba", dni: "40000001", sexo: "F", fecha_nacimiento: "2001-01-01",
    hc: 100, hcf: 8, discapacidades: true, consumos_problematicos: false,
    intentos_de_suicidio: false, problemas_socioambientales: true, violencias: false,
  })
  assert.deepEqual(payload.adolescentes[0].familiares[0].persona, {
    ...payload.adolescentes[0].persona, dni: "30000001",
  })
  assert.equal("salud" in payload.adolescentes[0].familiares[0], false)
  assert.equal("dni" in payload.adolescentes[0].familiares[0], false)
})

test("conserva HC, HCF y los cinco indicadores desde las dos fuentes de personas", () => {
  const salud = { hc: "100", hcf: "8", discapacidades: 1, consumos_problematicos: 0,
    intentos_de_suicidio: 0, problemas_socioambientales: 1, violencias: 0 }
  const ciudadano = ciudadanoToPersona({ ...salud, nombre: "Persona", apellido: "Prueba",
    nroDocumento: 40000001, sexo: "F", fechaNacimiento: "Mon, 01 Jan 2001 00:00:00 GMT" })
  const registrada = personaRegistradaAFormulario({ ...salud, nombre: "Persona", apellido: "Prueba",
    dni: "40000001", sexo: "F", fecha_nacimiento: "2001-01-01", legajo: null, carpeta: null })
  assert.deepEqual({ ...ciudadano, fecha_nacimiento: registrada.fecha_nacimiento }, registrada)
  const { solicitud, revisiones } = casoValidacion()
  revisiones[1].persona = ciudadano
  assert.equal(crearPayloadValidacion(solicitud, revisiones, "").adolescentes[0].persona.fecha_nacimiento, "2001-01-01")
  assert.equal(ciudadano.discapacidades, true)
  assert.equal(ciudadano.violencias, false)
})

test("salud se muestra completa como texto, sin controles editables", () => {
  const html = renderToStaticMarkup(createElement(DatosSalud, { persona: personaRevision("40000001") }))
  for (const etiqueta of ["Historia clínica individual (HC)", "Historia clínica familiar (HCF)", "Discapacidades",
    "Consumos problemáticos", "Intentos de suicidio", "Problemas socioambientales", "Violencias"]) {
    assert.ok(html.includes(etiqueta), etiqueta)
  }
  assert.match(html, /Solo lectura/)
  assert.doesNotMatch(html, /<(input|select|textarea|button)\b/)
  assert.match(html, />Sí</)
  assert.match(html, />No</)
  const vacio = renderToStaticMarkup(createElement(DatosSalud, { persona: {} }))
  assert.equal(vacio.match(/Sin informar/g).length, 7)
})

test("no inventa indicadores de salud ausentes y rechaza identidad incompleta", () => {
  const { solicitud, revisiones } = casoValidacion()
  revisiones[1].persona = ciudadanoToPersona({ nombre: "Persona", apellido: "Prueba", nroDocumento: 40000001,
    sexo: "F", fechaNacimiento: "2001-01-01", hc: null })
  const persona = crearPayloadValidacion(solicitud, revisiones, "").adolescentes[0].persona
  assert.equal(persona.hc, null)
  assert.equal(persona.hcf, null)
  assert.equal("discapacidades" in persona, false)
  revisiones[1].persona.fecha_nacimiento = "inválida"
  assert.throws(() => crearPayloadValidacion(solicitud, revisiones, ""), /fecha de nacimiento/)
})

test("muestra identidad y salud de los integrantes adicionales de HCF con el contrato exacto", () => {
  const html = renderToStaticMarkup(createElement(HistoriaClinicaCard, { respuestas: [{
    idPersona: 20, nombre: "Integrante", apellido: "Prueba", DNI: "30000001", sexo: "F",
    numeroHCI: 200, hcf: "50", fechaNacimiento: "1980-01-01", flag_discapacidades: 1,
    flag_consumos_problematicos: 0, flag_intentos_de_suicidio: 0,
    flag_problemas_socioambientales: 1, flag_violencias: 0,
  }] }))
  assert.match(html, /30000001/)
  assert.match(html, />200</)
  assert.match(html, />50</)
  assert.match(html, /Violencias/)
  assert.doesNotMatch(html, /Sin informar|<(input|select|textarea|button)\b/)
})

test("validación permite compartir familiar entre adolescentes pero rechaza duplicados dentro de un grupo", () => {
  const { solicitud, revisiones } = casoValidacion()
  assert.equal(crearPayloadValidacion(solicitud, revisiones, "").adolescentes.length, 2)
  revisiones[1].familiares.push(familiarRevision("30000001"))
  assert.throws(() => crearPayloadValidacion(solicitud, revisiones, ""), /repetido/)
})

test("validación exige confirmar adolescentes y familiares y seleccionar sus vínculos", () => {
  const { solicitud, revisiones } = casoValidacion()
  revisiones[1].estado = "rechazado"
  assert.throws(() => crearPayloadValidacion(solicitud, revisiones, ""), /todos los adolescentes/)
  revisiones[1].estado = "confirmado"
  revisiones[1].familiares[0].estado = null
  assert.throws(() => crearPayloadValidacion(solicitud, revisiones, ""), /todos los familiares/)
  revisiones[1].familiares[0].estado = "confirmado"
  revisiones[1].familiares[0].persona.vinculo = null
  assert.throws(() => crearPayloadValidacion(solicitud, revisiones, ""), /vínculo/)
})

test("validación rechaza números de legajo o carpeta inválidos y convierte domicilios", () => {
  const { solicitud, revisiones } = casoValidacion()
  revisiones[2].persona.legajo.carpeta_id = 0
  assert.throws(() => crearPayloadValidacion(solicitud, revisiones, ""), /mayores a cero/)
  revisiones[2].persona.legajo.carpeta_id = 50
  revisiones[2].persona.legajo.id_insert = 1.5
  assert.throws(() => crearPayloadValidacion(solicitud, revisiones, ""), /mayores a cero/)
  revisiones[2].persona.legajo.id_insert = 100
  revisiones[1].familiares[0].persona.domicilio = domicilio
  const resultado = crearPayloadValidacion(solicitud, revisiones, "")
  assert.deepEqual(resultado.adolescentes[0].familiares[0].domicilio, domicilio)
})
