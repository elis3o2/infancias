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
const { consultarHistoriasPorEtapas, aplicarSalud, numeroHC, historiaResuelta, historiasFamiliares, integrantesHistorias } =
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
  idPersona: hc, numeroHCI: hc, DNI: dni, sexo: "F", nombre: "NO REEMPLAZAR", apellido: "Prueba",
  fechaNacimiento: "2001-01-01", flag_discapacidades: 1, flag_consumos_problematicos: 0,
  flag_intentos_de_suicidio: 1, flag_problemas_socioambientales: 0, flag_violencias: 1,
})
const hcf = (...hcis) => ({ hcf: 50, resultados: hcis.map((hc) => integrante(hc)) })
const cache = (respuesta) => new Map([[50, { datos: respuesta }]])

test("las identidades se entregan antes de empezar la segunda etapa lenta", async () => {
  const personas = { adolescentes: [{ id: 1, dni: "50000001", sexo: "F" }], familiares: [] }
  const eventos = []
  let visible = null
  await consultarPorEtapas(personas, null, (datos) => { visible = datos; eventos.push("persona visible") }, signal(),
    async () => ({ adolescentes: [{ id: 1, persona: persona(1), ciudadano: null }], familiares: [], hcf: [] }))
  assert.equal(visible.adolescentes[0].persona.nombre, "Nombre")
  let resolver
  const lenta = new Promise((resolve) => { resolver = resolve })
  const consulta = consultarHistoriasPorEtapas([50], new Map(), (historias) => {
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
  assert.equal("numeroHCF" in visible.hcf[0], false)
})

test("adolescentes y familiares con distintas HCI comparten una sola consulta por HCF", async () => {
  const adolescentes = [persona(1), { ...persona(2), hcf: "050" }]
  const familiares = [persona(3), { ...persona(4), hcf: 60 }, { ...persona(5), hcf: 60 }]
  const numeros = historiasFamiliares([...adolescentes, ...familiares])
  assert.deepEqual(numeros, [50, 60])
  const llamadas = []
  const resultados = await consultarHistoriasPorEtapas([...numeros, 50, 60], new Map(), () => {}, signal(), async (numero) => {
    llamadas.push(numero)
    return numero === 50 ? hcf(1, 2, 3, 8) : {
      hcf: 60, resultados: [4, 5, 9].map((hc) => integrante(hc)),
    }
  })
  assert.deepEqual(llamadas, [50, 60])
  assert.equal(historiaResuelta(50, resultados), true)
  assert.equal(historiaResuelta(60, resultados), true)
  assert.equal(historiaResuelta(1, resultados), false) // Una HCI no es una clave de consulta.
  assert.deepEqual(integrantesHistorias(resultados).map((item) => item.numeroHCI), [1, 2, 3, 8, 4, 5, 9])
  for (const datos of [...adolescentes, ...familiares]) {
    assert.equal(aplicarSalud(datos, datos.dni, datos.sexo, resultados).violencias, true)
  }
  await consultarHistoriasPorEtapas(numeros, resultados, () => assert.fail("Sin resultados nuevos"), signal(),
    () => assert.fail("No debe repetir consultas"))
})

test("una historia fallida no borra datos ni impide consultar las demás; reintenta solo la fallida", async () => {
  let intentos = 0
  const numeros = [50, 60, 60, 70]
  const parcial = await consultarHistoriasPorEtapas(numeros, new Map(), () => {}, signal(), async (numero) => {
    intentos += 1
    if (numero === 60) throw new Error("Timeout")
    return { hcf: numero, resultados: [] }
  })
  assert.equal(intentos, 3)
  assert.equal(historiaResuelta(60, parcial), false)
  assert.deepEqual(parcial.get(60), { error: true })
  await consultarHistoriasPorEtapas(numeros, parcial, () => {}, signal(), () => assert.fail("Sin reintentos automáticos"))
  const exitosas = new Map([...parcial].filter(([, item]) => "datos" in item))
  const llamadas = []
  const completo = await consultarHistoriasPorEtapas(numeros, exitosas, () => {}, signal(), async (numero) => {
    llamadas.push(numero)
    return { hcf: numero, resultados: [] }
  })
  assert.deepEqual(llamadas, [60])
  assert.equal(historiaResuelta(60, completo), true)
  assert.deepEqual(parcial.get(60), { error: true })
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
  for (const consultas of [new Map(), cache(null), new Map([[50, { error: true }]])]) {
    assert.strictEqual(aplicarSalud(datos, datos.dni, datos.sexo, consultas), datos)
  }
  let llamadas = 0
  const resultados = await consultarHistoriasPorEtapas([50, 50], new Map(), () => {}, signal(), async () => {
    llamadas += 1
    return null
  })
  assert.equal(llamadas, 1)
  assert.equal(historiaResuelta(50, resultados), true)
  assert.deepEqual(integrantesHistorias(resultados), [])
})

test("consulta por HCF aunque no haya HCI y no usa HCI cuando falta HCF", async () => {
  const sinHcf = [null, undefined, ...[null, undefined, "", " ", 0, -1, "no", 1.5].map((hcf) => ({ hc: 173715, hcf }))]
  const numeros = historiasFamiliares(sinHcf)
  assert.deepEqual(numeros, [])
  await consultarHistoriasPorEtapas(numeros, new Map(), () => assert.fail("Sin resultados"), signal(),
    () => assert.fail("Sin HCF no debe consultar"))
  assert.deepEqual(historiasFamiliares([{ hc: null, hcf: 3656 }, { hc: 173715, hcf: "3656" }]), [3656])
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
  await assert.rejects(consultarHistoriasPorEtapas([50, 60], new Map(), () => assert.fail("No publicar"), control.signal,
    async (_hcf, signal) => {
      llamadas += 1
      assert.equal(signal, control.signal)
      control.abort()
      return hcf(1)
    }), { name: "AbortError" })
  assert.equal(llamadas, 1)
})

test("el cliente usa el endpoint separado con solo hcf y admite una respuesta vacía", async () => {
  const anteriorStorage = globalThis.localStorage
  const anteriorAdapter = http.defaults.adapter
  globalThis.localStorage = { getItem: () => null }
  const control = new AbortController()
  http.defaults.adapter = async (config) => {
    assert.equal(config.url, "externa/historia-clinica/")
    assert.deepEqual(config.params, { hcf: 3656 })
    assert.equal(config.signal, control.signal)
    return { data: "", status: 200, statusText: "OK", headers: {}, config }
  }
  try { assert.equal(await getHistoriaClinica(3656, control.signal), null) } finally {
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
