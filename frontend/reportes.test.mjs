import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))
const cacheDir = await mkdtemp(join(tmpdir(), 'infancias-reportes-test-'))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: 'silent', plugins: [react()],
  resolve: { alias: { '@': `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { leerFiltrosReporte, prepararFiltrosReporte, estadoReporte } = await server.ssrLoadModule('/src/features/reportes/utils.ts')
const { EquiposReporte } = await server.ssrLoadModule('/src/features/reportes/EquiposReporte.tsx')
const { ListadoReporte } = await server.ssrLoadModule('/src/features/reportes/ListadoReporte.tsx')
const { ResumenReporte } = await server.ssrLoadModule('/src/features/reportes/ResumenReporte.tsx')
const { FiltrosReporteForm } = await server.ssrLoadModule('/src/features/reportes/FiltrosReporteForm.tsx')
const render = (componente, props) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(componente, props)))
const vacios = { periodo: 'semana', desde: '', hasta: '', equipo: '', estado: '', solicitud: '' }
const equipos = [{ id: 1, nombre: 'Entrada', total: 2 }, { id: 2, nombre: 'Admisión', total: 0 },
  { id: 'rechazadas', nombre: 'Rechazadas', total: 1 }]
const solicitud = { id: 123, equipo: 'Rechazadas', motivo: 'Consulta', fecha_hora_creacion: '2026-10-06T12:30:00',
  validado: false, rechazado: true, cantidad_adolescentes: 2, cantidad_comentarios: 3 }

test('inicia en semana y prepara filtros combinados sin conservar página ni fechas irrelevantes', () => {
  assert.deepEqual(leerFiltrosReporte(new URLSearchParams()), vacios)
  assert.equal(prepararFiltrosReporte(vacios).toString(), 'periodo=semana')
  const filtros = leerFiltrosReporte(new URLSearchParams('periodo=todo&equipo=rechazadas&estado=rechazada&solicitud=123&page=3'))
  assert.equal(prepararFiltrosReporte({ ...filtros, desde: '2026-10-01', hasta: '2026-10-02' }).toString(),
    'periodo=todo&equipo=rechazadas&solicitud=123&estado=rechazada')
  assert.equal(prepararFiltrosReporte({ ...vacios, equipo: '2' }).get('equipo'), '2')
  const periodo = prepararFiltrosReporte({ ...vacios, periodo: 'personalizado', desde: '2026-10-01', hasta: '2026-10-31' })
  assert.equal(periodo.get('desde'), '2026-10-01')
  assert.equal(periodo.get('hasta'), '2026-10-31')
})

test('rechaza criterios inválidos y rangos incompletos o invertidos', () => {
  assert.throws(() => leerFiltrosReporte(new URLSearchParams('periodo=otro')))
  for (const cambios of [{ periodo: 'personalizado' }, { periodo: 'personalizado', desde: '2026-10-02', hasta: '2026-10-01' },
    { solicitud: 'abc' }, { solicitud: '0' }, { equipo: '-1' }, { equipo: 'otro' }, { equipo: '2147483648' }, { estado: 'cerrada' }]) {
    assert.throws(() => prepararFiltrosReporte({ ...vacios, ...cambios }))
  }
})

test('distribución incluye equipos vacíos y grupo Rechazadas con enlaces a todas las fechas', () => {
  const html = render(EquiposReporte, { equipos })
  assert.match(html, /href="\/reportes\?periodo=todo&amp;equipo=rechazadas"/)
  assert.match(html, /Ver 1 solicitudes de Rechazadas/)
  assert.match(html, /Ver 0 solicitudes de Admisión/)
  assert.match(html, /no suman en su equipo anterior/)
  assert.doesNotMatch(html, /NaN|Infinity/)
  assert.doesNotMatch(render(EquiposReporte, { equipos: equipos.map((equipo) => ({ ...equipo, total: 0 })) }), /NaN|Infinity/)
})

test('listado de solo lectura muestra ubicación, estado, cantidades y paginación', () => {
  const solicitudes = { pagina: 1, count: 21, previous: null, next: '?page=2', results: [solicitud] }
  const html = render(ListadoReporte, { solicitudes, pagina: 1, onPagina: () => {} })
  for (const texto of [/Solicitud #123/, /Equipo \/ grupo: Rechazadas/, /06-10-2026/, /Intervenciones: 3/, /Adolescentes: 2/,
    /Página 1 de 2/, /Ubicación actual de las solicitudes/, /display:none/, /display:grid/]) assert.match(html, texto)
  assert.match(html, /<button[^>]*disabled=""[^>]*>Anterior</)
  assert.doesNotMatch(html, /<textarea|>Editar<|href="\/validar/)
  assert.match(render(ListadoReporte, { solicitudes: { ...solicitudes, count: 0, results: [] }, pagina: 1, onPagina: () => {} }), /No hay solicitudes/)
  assert.equal(estadoReporte({ validado: true, rechazado: true }).texto, 'Rechazada')
  assert.equal(estadoReporte({ validado: true, rechazado: false }).texto, 'Validada')
  assert.equal(estadoReporte({ validado: false, rechazado: false }).texto, 'Pendiente de validación')
})

test('resumen aclara que intervenciones son comentarios y formulario permite filtrar por el grupo virtual', () => {
  const html = render(ResumenReporte, { resumen: { total: 3, pendientes: 1, validadas: 1, rechazadas: 1, intervenciones: 7,
    motivos: [{ motivo__nombre: 'Consulta', total: 3 }] } })
  assert.match(html, /Todos los comentarios de estas solicitudes/)
  assert.match(html, /Consulta: 3/)
  const form = render(FiltrosReporteForm, { inicial: { ...vacios, equipo: 'rechazadas', periodo: 'personalizado' }, equipos, onAplicar: () => {} })
  assert.match(form, /Rechazadas/)
  assert.match(form, /Equipo \/ grupo/)
  assert.doesNotMatch(form, /type="date"/)
  assert.match(form, /DD-MM-AAAA/)
  assert.match(form, /Las fechas filtran por creación/)
})

test('API consulta reportes por GET con filtros, página y señal de cancelación', async () => {
  const { default: http } = await server.ssrLoadModule('/src/common/api/client.ts')
  const { getReporteSolicitudes } = await server.ssrLoadModule('/src/features/reportes/api.ts')
  const anteriorStorage = globalThis.localStorage
  const anteriorAdapter = http.defaults.adapter
  globalThis.localStorage = { getItem: () => null }
  const llamadas = []
  http.defaults.adapter = async (config) => {
    llamadas.push({ metodo: config.method, url: config.url, params: config.params.toString(), signal: config.signal })
    return { data: { correcto: true }, status: 200, statusText: 'OK', headers: {}, config }
  }
  try {
    const signal = new AbortController().signal
    assert.deepEqual(await getReporteSolicitudes(new URLSearchParams('periodo=todo&equipo=rechazadas&page=2'), signal), { correcto: true })
    assert.deepEqual(llamadas, [{ metodo: 'get', url: 'solicitud/reportes/', params: 'periodo=todo&equipo=rechazadas&page=2', signal }])
  } finally {
    http.defaults.adapter = anteriorAdapter
    if (anteriorStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = anteriorStorage
  }
})
