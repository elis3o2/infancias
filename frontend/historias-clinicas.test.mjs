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
const cacheDir = await mkdtemp(join(tmpdir(), "infancias-historias-test-"))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: "silent", plugins: [react()],
  resolve: { alias: { "@": `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { consultarHistoriasPorEtapas, aplicarSalud, numeroHC, historiaResuelta, integrantesHistorias } =
  await server.ssrLoadModule("/src/features/api_externa/historiasClinicas.ts")
const { completarConsulta, completarRevisiones } =
  await server.ssrLoadModule("/src/features/solicitud/components/Cargados/validacion/historiasValidacion.ts")
const { consultarPorEtapas } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/validacion/consultaProgresiva.ts")
const { crearPayloadValidacion } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/validacion/payload.ts")
const { EstadoHistoriasClinicas } = await server.ssrLoadModule("/src/features/api_externa/EstadoHistoriasClinicas.tsx")
const { HistoriaClinicaCard } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/validacion/HistoriaClinicaCard.tsx")
const { getHistoriaClinica } = await server.ssrLoadModule("/src/features/api_externa/api.ts")
const { default: http } = await server.ssrLoadModule("/src/common/api/client.ts")
const signal = () => new AbortController().signal
const persona = (hc, dni = String(50000000 + hc)) => ({
  nombre: "Nombre", apellido: "Prueba", fecha_nacimiento: "2001-01-01", dni, sexo: "F", hc, hcf: 50,
  legajo: null, domicilio: null, telefono: null, vinculo: { id: 3, nombre: "Referente" },
})
const integrante = (hc, dni = String(50000000 + hc)) => ({
  idPersona: hc, numeroHCI: hc, numeroHCF: 50, DNI: dni, sexo: "F", nombre: "NO REEMPLAZAR", apellido: "Prueba",
  fechaNacimiento: "2001-01-01", flag_discapacidades: 1, flag_consumos_problematicos: 0,
  flag_intentos_de_suicidio: 1, flag_problemas_socioambientales: 0, flag_violencias: 1,
})
const hcf = (...hcis) => ({ hcf: 50, resultados: hcis.map((hc) => integrante(hc)) })
const cache = (respuesta) => new Map([[1, { datos: respuesta }]])

test("las identidades se entregan antes de empezar la segunda etapa lenta", async () => {
  const personas = { adolescentes: [{ id: 1, dni: "50000001", sexo: "F" }], familiares: [] }
  const eventos = []
  let visible = null
  await consultarPorEtapas(personas, null, (datos) => { visible = datos; eventos.push("persona visible") }, signal(),
    async () => ({ adolescentes: [{ id: 1, persona: persona(1), ciudadano: null }], familiares: [], hcf: [] }))
  assert.equal(visible.adolescentes[0].persona.nombre, "Nombre")
  let resolver
  const lenta = new Promise((resolve) => { resolver = resolve })
  const consulta = consultarHistoriasPorEtapas([1], new Map(), (historias) => {
    visible = completarConsulta(visible, personas, historias)
    eventos.push("salud visible")
  }, signal(), async () => { eventos.push("consulta HCF"); return lenta })
  assert.deepEqual(eventos, ["persona visible", "consulta HCF"])
  assert.equal(visible.adolescentes[0].persona.violencias, undefined)
  resolver(hcf(1, 8))
  await consulta
  assert.deepEqual(eventos, ["persona visible", "consulta HCF", "salud visible"])
  assert.equal(visible.adolescentes[0].persona.violencias, true)
  assert.deepEqual(visible.hcf.map((item) => item.numeroHCI), [8])
  assert.equal(visible.hcf[0].hcf, 50)
})

test("una HCF resuelve varios integrantes y no consulta dos veces una misma HC", async () => {
  const llamadas = []
  const resultados = await consultarHistoriasPorEtapas([1, 1, 2, 3], new Map(), () => {}, signal(), async (hc) => {
    llamadas.push(hc)
    return hc === 1 ? hcf(1, 2, 8) : hcf(3, 8)
  })
  assert.deepEqual(llamadas, [1, 3])
  assert.equal(historiaResuelta(2, resultados), true)
  assert.deepEqual(integrantesHistorias(resultados).map((item) => item.numeroHCI), [1, 2, 8, 3])
  await consultarHistoriasPorEtapas([1, 2, 3], resultados, () => assert.fail("Sin resultados nuevos"), signal(),
    () => assert.fail("No debe repetir consultas"))
})

test("una historia fallida no borra datos ni impide consultar las demás; reintenta solo la fallida", async () => {
  let intentos = 0
  const parcial = await consultarHistoriasPorEtapas([1, 2, 3], new Map(), () => {}, signal(), async (hc) => {
    intentos += 1
    if (hc === 2) throw new Error("Timeout")
    return hcf(hc)
  })
  assert.equal(intentos, 3)
  assert.equal(historiaResuelta(2, parcial), false)
  assert.deepEqual(parcial.get(2), { error: true })
  await consultarHistoriasPorEtapas([1, 2, 3], parcial, () => {}, signal(), () => assert.fail("Sin reintentos automáticos"))
  const exitosas = new Map([...parcial].filter(([, item]) => "datos" in item))
  const llamadas = []
  const completo = await consultarHistoriasPorEtapas([1, 2, 3], exitosas, () => {}, signal(), async (hc) => {
    llamadas.push(hc)
    return hcf(hc)
  })
  assert.deepEqual(llamadas, [2])
  assert.equal(historiaResuelta(2, completo), true)
  assert.deepEqual(parcial.get(2), { error: true })
})

test("la salud tardía entra en el payload sin cambiar confirmaciones ni datos editados", () => {
  const revisiones = { 1: { estado: "confirmado", legajoRegistrado: false,
    persona: { ...persona(1), legajo: { id_insert: 77, carpeta_id: 88 } },
    familiares: [{ original: { id: 2 }, estado: "confirmado", persona: { ...persona(2), telefono: "3415000000" } }],
  } }
  const original = structuredClone(revisiones)
  const completas = completarRevisiones(revisiones, cache(hcf(1, 2)))
  assert.deepEqual(revisiones, original)
  assert.equal(completas[1].estado, "confirmado")
  const payload = crearPayloadValidacion({ adolescentes: [{ id: 1 }] }, completas, "Revisión")
  assert.equal(payload.adolescentes[0].persona.nombre, "Nombre")
  assert.equal(payload.adolescentes[0].persona.discapacidades, true)
  assert.equal(payload.adolescentes[0].persona.consumos_problematicos, false)
  assert.deepEqual(payload.adolescentes[0].legajo, { id_insert: 77, carpeta_id: 88 })
  const familiar = payload.adolescentes[0].familiares[0]
  assert.equal(familiar.id_vinculo, 3)
  assert.equal(familiar.telefono, "3415000000")
  assert.equal(familiar.persona.violencias, true)
})

test("no inventa salud si no hay historia o si falla, ni usa HCF como HCI", async () => {
  for (const valor of [null, undefined, "", " ", 0, -1, "no", 1.5]) assert.equal(numeroHC(valor), null)
  assert.equal(numeroHC("001"), 1)
  const datos = { ...persona(null), hcf: 50, violencias: true }
  for (const consultas of [new Map(), cache(null), new Map([[1, { error: true }]])]) {
    assert.strictEqual(aplicarSalud(datos, datos.dni, datos.sexo, consultas), datos)
  }
  const resultados = await consultarHistoriasPorEtapas([1], new Map(), () => {}, signal(), async () => null)
  assert.equal(historiaResuelta(1, resultados), true)
  assert.deepEqual(integrantesHistorias(resultados), [])
})

test("conserva la HCF de RNP si el servicio HCF no aporta número", () => {
  const datos = persona(1)
  const completa = aplicarSalud(datos, datos.dni, datos.sexo, cache({ ...hcf(1), hcf: 0 }))
  assert.equal(completa.hcf, 50)
  assert.equal(completa.violencias, true)
})

test("solo aplica salud cuando coinciden HCI, DNI y sexo", () => {
  const datos = persona(1)
  for (const cambios of [{ numeroHCI: 9 }, { DNI: "99999999" }, { sexo: "M" }]) {
    assert.strictEqual(aplicarSalud(datos, datos.dni, datos.sexo,
      cache({ hcf: 50, resultados: [{ ...integrante(1), ...cambios }] })), datos)
  }
})

test("los integrantes excluyen a las personas originales, incluso si su identidad está pendiente", () => {
  const personas = { adolescentes: [{ id: 1, dni: "50000001", sexo: "F" }], familiares: [{ id: 2, dni: "50000002", sexo: "F" }] }
  const datos = { adolescentes: [{ id: 1, persona: persona(1), ciudadano: null }], familiares: [], hcf: [] }
  const resultado = completarConsulta(datos, personas, cache(hcf(1, 2, 8)))
  assert.deepEqual(resultado.hcf.map((item) => item.numeroHCI), [8])
  assert.equal(datos.adolescentes[0].persona.violencias, undefined)
})

test("salir de la pantalla cancela pendientes y no publica resultados tardíos", async () => {
  const control = new AbortController()
  let llamadas = 0
  await assert.rejects(consultarHistoriasPorEtapas([1, 2], new Map(), () => assert.fail("No publicar"), control.signal,
    async (_hc, signal) => {
      llamadas += 1
      assert.equal(signal, control.signal)
      control.abort()
      return hcf(1)
    }), { name: "AbortError" })
  assert.equal(llamadas, 1)
})

test("el cliente usa el endpoint separado con solo hci y admite una respuesta vacía", async () => {
  const anteriorStorage = globalThis.localStorage
  const anteriorAdapter = http.defaults.adapter
  globalThis.localStorage = { getItem: () => null }
  const control = new AbortController()
  http.defaults.adapter = async (config) => {
    assert.equal(config.url, "externa/historia-clinica/")
    assert.deepEqual(config.params, { hci: 100 })
    assert.equal(config.signal, control.signal)
    return { data: "", status: 200, statusText: "OK", headers: {}, config }
  }
  try { assert.equal(await getHistoriaClinica(100, control.signal), null) } finally {
    http.defaults.adapter = anteriorAdapter
    if (anteriorStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = anteriorStorage
  }
})

test("la pantalla distingue carga, error y ausencia de integrantes", () => {
  const render = (componente, props) => renderToStaticMarkup(createElement(componente, props))
  assert.match(render(EstadoHistoriasClinicas, { cargando: true, error: false, reintentar() {} }), /Cargando datos de salud/)
  assert.match(render(EstadoHistoriasClinicas, { cargando: false, error: true, reintentar() {} }), /Reintentar historias/)
  assert.equal(render(EstadoHistoriasClinicas, { cargando: false, error: false, reintentar() {} }), "")
  const pendiente = render(HistoriaClinicaCard, { respuestas: [], pendiente: true })
  assert.doesNotMatch(pendiente, /No se encontraron/)
  assert.match(render(HistoriaClinicaCard, { respuestas: [], pendiente: false }), /No se encontraron integrantes adicionales/)
})
