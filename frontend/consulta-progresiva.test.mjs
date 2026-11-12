import assert from "node:assert/strict"
import { after, test } from "node:test"
import { fileURLToPath } from "node:url"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "vite"

const root = fileURLToPath(new URL(".", import.meta.url))
const cacheDir = await mkdtemp(join(tmpdir(), "infancias-consulta-test-"))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: "silent",
  resolve: { alias: { "@": `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { consultarPorEtapas, obtenerPendientes } = await server.ssrLoadModule(
  "/src/features/solicitud/components/Cargados/validacion/consultaProgresiva.ts",
)
const identidad = (id, dni = String(50000000 + id), sexo = "F") => ({ id, dni, sexo })
const ciudadano = ({ id, dni, sexo }) => ({
  id, persona: null, relaciones: [], solicitudes: [],
  ciudadano: { nombre: "Prueba", apellido: "Ficticia", nroDocumento: Number(dni), sexo, fechaNacimiento: "2000-01-01", hc: String(id), hcf: "50" },
})
const respuesta = (adolescentes, familiares) => ({
  adolescentes: adolescentes.map(ciudadano), familiares: familiares.map(ciudadano), hcf: [],
})

test("al llegar al límite conserva dos personas y continúa solo con la tercera", async () => {
  const entrada = { adolescentes: [identidad(1)], familiares: [identidad(2), identidad(3)] }
  const limite = { response: { status: 429, headers: { "retry-after": "54" }, data: { detail: "Esperá 54 segundos." } } }
  let acumulado = null
  let cupo = 2
  const llamadas = []
  const consultar = async (adolescentes, familiares) => {
    llamadas.push([...adolescentes, ...familiares].map((item) => item.id))
    if (cupo === 0) throw limite
    cupo -= 1
    return respuesta(adolescentes, familiares)
  }
  await assert.rejects(
    consultarPorEtapas(entrada, null, (datos) => { acumulado = datos }, undefined, consultar),
    (error) => error === limite,
  )
  assert.deepEqual(llamadas, [[1], [2], [3]])
  assert.equal(acumulado.adolescentes[0].ciudadano.hc, "1")
  assert.equal(acumulado.familiares[0].ciudadano.hcf, "50")
  assert.deepEqual(obtenerPendientes(entrada, acumulado), { adolescentes: [], familiares: [identidad(3)] })
  const anterior = structuredClone(acumulado)
  cupo = 2
  const resultado = await consultarPorEtapas(entrada, acumulado, () => {}, undefined, consultar)
  assert.deepEqual(acumulado, anterior)
  assert.deepEqual(llamadas, [[1], [2], [3], [3]])
  assert.deepEqual(obtenerPendientes(entrada, resultado), { adolescentes: [], familiares: [] })
  assert.equal(resultado.familiares.length, 2)
})

test("agrupa familiares compartidos por DNI y sexo conservando sus identificadores", async () => {
  const entrada = {
    adolescentes: [identidad(1)],
    familiares: [identidad(2, "50000001"), identidad(3, "50000001"), identidad(3, "50000001"), identidad(4, "50000001", "M")],
  }
  const llamadas = []
  const resultado = await consultarPorEtapas(entrada, null, () => {}, undefined, async (adolescentes, familiares) => {
    llamadas.push({ adolescentes, familiares })
    return respuesta(adolescentes, familiares)
  })
  assert.equal(llamadas.length, 2)
  assert.deepEqual(llamadas[0].familiares.map((item) => item.id), [2, 3])
  assert.deepEqual(llamadas[1].familiares, [identidad(4, "50000001", "M")])
  assert.deepEqual(resultado.familiares.map((item) => item.id), [2, 3, 4])
})

test("un 404 remoto detiene la búsqueda sin reintentos ni marcar a la persona como no encontrada", async () => {
  const entrada = { adolescentes: [identidad(1), identidad(2)], familiares: [identidad(3)] }
  const fallo = { response: { status: 502, data: { detail: "Identidad respondió HTTP 404." } } }
  let acumulado = null
  let llamadas = 0
  await assert.rejects(consultarPorEtapas(entrada, null, (datos) => { acumulado = datos }, undefined, async (adolescentes, familiares) => {
    llamadas += 1
    if (llamadas === 2) throw fallo
    return respuesta(adolescentes, familiares)
  }), (error) => error === fallo)
  assert.equal(llamadas, 2)
  assert.deepEqual(acumulado.adolescentes.map((item) => item.id), [1])
  assert.deepEqual(obtenerPendientes(entrada, acumulado).adolescentes, [identidad(2)])
  assert.deepEqual(acumulado.familiares, [])
})

test("la HCF combina grupos sin repetir integrantes ni incluir a personas del formulario", async () => {
  const entrada = { adolescentes: [identidad(1)], familiares: [identidad(2)] }
  const miembros = [1, 2, 8].map((id) => ({ ...identidad(id), DNI: identidad(id).dni, numeroHCI: id, hcf: "50" }))
  const avances = []
  const resultado = await consultarPorEtapas(entrada, null, (datos) => avances.push(datos), undefined, async (adolescentes, familiares) => ({
    ...respuesta(adolescentes, familiares), hcf: miembros,
  }))
  assert.deepEqual(avances[0].hcf.map((item) => item.numeroHCI), [8])
  assert.deepEqual(resultado.hcf.map((item) => item.numeroHCI), [8])
})

test("una respuesta válida sin identidad queda consultada, sin repeticiones automáticas", async () => {
  const entrada = { adolescentes: [identidad(1)], familiares: [] }
  const resultado = await consultarPorEtapas(entrada, null, () => {}, undefined, async () => ({
    adolescentes: [{ id: 1, persona: null, ciudadano: null, relaciones: [], solicitudes: [] }], familiares: [], hcf: [],
  }))
  assert.deepEqual(obtenerPendientes(entrada, resultado), { adolescentes: [], familiares: [] })
  await consultarPorEtapas(entrada, resultado, () => assert.fail("No debe volver a consultar"), undefined,
    () => assert.fail("No debe hacer HTTP"))
})

test("una respuesta incompleta no da por consultados registros ausentes", async () => {
  let notificaciones = 0
  await assert.rejects(consultarPorEtapas(
    { adolescentes: [identidad(1)], familiares: [] }, null, () => { notificaciones += 1 }, undefined,
    async () => ({ adolescentes: [], familiares: [], hcf: [] }),
  ), /respuesta incompleta/)
  assert.equal(notificaciones, 0)
})

test("al salir de la pantalla no inicia más consultas ni publica resultados tardíos", async () => {
  const control = new AbortController()
  let llamadas = 0
  await assert.rejects(consultarPorEtapas(
    { adolescentes: [identidad(1), identidad(2)], familiares: [] }, null,
    () => assert.fail("No debe actualizar la pantalla desmontada"), control.signal,
    async (adolescentes, familiares, signal) => {
      llamadas += 1
      assert.equal(signal, control.signal)
      control.abort()
      return respuesta(adolescentes, familiares)
    },
  ), { name: "AbortError" })
  assert.equal(llamadas, 1)
})
