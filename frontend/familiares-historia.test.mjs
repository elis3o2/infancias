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
const cacheDir = await mkdtemp(join(tmpdir(), "infancias-familiar-historia-test-"))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: "silent", plugins: [react()],
  resolve: { alias: { "@": `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const modulo = "/src/features/solicitud/components/Cargados/validacion/"
const { errorIdentidadHistoria, familiarDesdeHistoria, familiarYaAsociado, nombreDestino, puedeAgregarFamiliar } =
  await server.ssrLoadModule(`${modulo}familiaresHistoria.ts`)
const { HistoriaClinicaCard } = await server.ssrLoadModule(`${modulo}HistoriaClinicaCard.tsx`)
const { crearPayloadValidacion } = await server.ssrLoadModule(`${modulo}payload.ts`)
const { completarRevisiones } = await server.ssrLoadModule(`${modulo}historiasValidacion.ts`)
const { default: http } = await server.ssrLoadModule("/src/common/api/client.ts")

const integrante = {
  idPersona: 900, numeroHCI: 200, numeroHCF: 50, hcf: 50, DNI: "30000001", sexo: "F",
  nombre: " Familiar ", apellido: " Prueba ", fechaNacimiento: "1980-01-02",
  flag_discapacidades: 1, flag_consumos_problematicos: 0, flag_intentos_de_suicidio: 0,
  flag_problemas_socioambientales: 1, flag_violencias: 0,
}
const vinculo = { id: 3, nombre: "Madre" }
const adolescente = { id: 1, nombre: "Declarado", apellido: "Uno", dni: "50000001", sexo: "M" }
const otro = { ...adolescente, id: 2, nombre: "Otro", dni: "50000002" }
const vacia = () => ({ estado: null, persona: null, legajoRegistrado: false, familiares: [] })
const familiar = () => familiarDesdeHistoria(integrante, vinculo)
const incorporado = () => ({ original: null, estado: "confirmado", persona: familiar() })
const render = (adolescentes = [adolescente], revisiones = { 1: vacia() }, registro = integrante) =>
  renderToStaticMarkup(createElement(HistoriaClinicaCard, {
    respuestas: [registro], altaFamiliar: { adolescentes, revisiones, onAgregar: () => assert.fail("No agregar durante render") },
  }))

test("convierte el integrante sin nuevas consultas y conserva identidad, HC, HCF y salud", async () => {
  const original = structuredClone(integrante)
  const adapter = http.defaults.adapter
  const storage = globalThis.localStorage
  globalThis.localStorage = { getItem: () => null }
  http.defaults.adapter = () => assert.fail("No debe consultar identidad ni historia clínica")
  try {
    assert.deepEqual(familiar(), {
      nombre: "Familiar", apellido: "Prueba", dni: "30000001", sexo: "F", fecha_nacimiento: "1980-01-02",
      hc: 200, hcf: 50, discapacidades: true, consumos_problematicos: false, intentos_de_suicidio: false,
      problemas_socioambientales: true, violencias: false,
      vinculo, id_vinculo: 3, telefono: null, domicilio: null, legajo: null,
    })
    assert.deepEqual(integrante, original)
    assert.match(render(), /Agregar como familiar/)
    await Promise.resolve()
  } finally {
    http.defaults.adapter = adapter
    if (storage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = storage
  }
})

test("el vínculo es obligatorio y no usa el identificador externo como id de familiar", () => {
  for (const valor of [null, { id: 0 }, { id: -1 }, { id: 1.5 }]) {
    assert.throws(() => familiarDesdeHistoria(integrante, valor), /vínculo/)
  }
  assert.equal("id_familiar" in familiar(), false)
  assert.equal("id" in familiar(), false)
  assert.equal("idPersona" in familiar(), false)
})

test("no agrega identidades incompletas ni fechas inexistentes y muestra una advertencia", () => {
  for (const cambios of [{ DNI: "" }, { DNI: null }, { DNI: "123" }, { sexo: "" }, { nombre: " " },
    { apellido: "" }, { fechaNacimiento: "" }, { fechaNacimiento: "2025-02-30" }]) {
    const registro = { ...integrante, ...cambios }
    assert.ok(errorIdentidadHistoria(registro))
    assert.throws(() => familiarDesdeHistoria(registro, vinculo), /identidad/)
    const html = render([adolescente], { 1: vacia() }, registro)
    assert.match(html, /incompletos o no son válidos/)
    assert.doesNotMatch(html, /Agregar como familiar/)
  }
})

test("impide duplicados del mismo grupo, incluyendo familiares originales pendientes", () => {
  const revision = { ...vacia(), familiares: [incorporado()] }
  assert.equal(familiarYaAsociado(revision, familiar()), true)
  assert.equal(puedeAgregarFamiliar(adolescente, revision, familiar()), false)
  revision.familiares = [{ original: { dni: "30000001", sexo: "F" }, persona: null, estado: null }]
  assert.equal(puedeAgregarFamiliar(adolescente, revision, familiar()), false)
  revision.familiares[0].original.sexo = "M"
  assert.equal(puedeAgregarFamiliar(adolescente, revision, familiar()), true)
})

test("permite compartir un familiar con otro adolescente y volver a agregarlo si se quitó", () => {
  const primera = { ...vacia(), familiares: [incorporado()] }
  const segunda = vacia()
  assert.equal(puedeAgregarFamiliar(adolescente, primera, familiar()), false)
  assert.equal(puedeAgregarFamiliar(otro, segunda, familiar()), true)
  assert.match(render([adolescente, otro], { 1: primera, 2: segunda }), /Agregar como familiar/)
  assert.match(render([adolescente], { 1: primera }), /Familiar agregado a:/)
  assert.doesNotMatch(render([adolescente], { 1: primera }), /Agregar como familiar/)
  primera.familiares = []
  assert.equal(puedeAgregarFamiliar(adolescente, primera, familiar()), true)
})

test("evita autorrelaciones tanto con la identidad declarada como con la confirmada", () => {
  assert.equal(puedeAgregarFamiliar({ ...adolescente, dni: integrante.DNI, sexo: "F" }, vacia(), familiar()), false)
  assert.equal(puedeAgregarFamiliar(adolescente, { ...vacia(), persona: familiar() }, familiar()), false)
  assert.equal(puedeAgregarFamiliar(adolescente, undefined, familiar()), false)
})

test("muestra el nombre confirmado del adolescente y la fecha sin depender del idioma", () => {
  const revision = { ...vacia(), estado: "confirmado", persona: { nombre: "Verificado", apellido: "Correcto" } }
  assert.equal(nombreDestino(adolescente, revision), "Verificado Correcto")
  assert.equal(nombreDestino(adolescente, vacia()), "Declarado Uno")
  assert.match(render(), /02-01-1980/)
})

test("el payload envía el nuevo familiar al grupo correcto con vínculo y salud, sin legajo", () => {
  const persona = { ...familiar(), nombre: "Adolescente", dni: adolescente.dni, sexo: "M", hc: 100 }
  const revisiones = { 1: { ...vacia(), estado: "confirmado", persona, familiares: [incorporado()] } }
  const original = structuredClone(revisiones)
  const finales = completarRevisiones(revisiones, new Map())
  const payload = crearPayloadValidacion({ adolescentes: [adolescente] }, finales, "")
  const enviado = payload.adolescentes[0].familiares[0]
  assert.equal(payload.adolescentes[0].id, adolescente.id)
  assert.equal(enviado.id_vinculo, vinculo.id)
  assert.equal(enviado.persona.nombre, "Familiar")
  assert.equal(enviado.persona.hc, 200)
  assert.equal(enviado.persona.hcf, 50)
  assert.equal(enviado.persona.discapacidades, true)
  assert.equal(enviado.persona.violencias, false)
  assert.equal("id" in enviado, false)
  assert.equal("legajo" in enviado, false)
  assert.deepEqual(revisiones, original)
})
