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
const cacheDir = await mkdtemp(join(tmpdir(), 'infancias-historial-test-'))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: 'silent', plugins: [react()],
  resolve: { alias: { '@': `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { leerFiltrosHistorial, prepararBusquedaHistorial, intervencionesDelHistorial, estadoSolicitudHistorial } =
  await server.ssrLoadModule('/src/features/persona/historialUtils.ts')
const { ResultadosHistorial } = await server.ssrLoadModule('/src/features/persona/componets/ResultadosHistorial.tsx')
const { HistorialNinoDetalle } = await server.ssrLoadModule('/src/features/persona/componets/HistorialNinoDetalle.tsx')
const { IntervencionesHistorial } = await server.ssrLoadModule('/src/features/persona/componets/IntervencionesHistorial.tsx')
const render = (componente, props) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(componente, props)))
const vacios = { nombre: '', apellido: '', dni: '', legajo: '' }
const nino = { id: 7, nombre: 'Clara', apellido: 'Diaz', dni: '50000001', sexo: 'F',
  fecha_nacimiento: '2012-02-18', legajo: 1234, carpeta: 900, validado: true }
const comentario = { id: 10, comentario: 'Primera línea\n<b>Texto libre</b>', usuario_nombre: 'Autora',
  fecha_hora_creacion: '2026-09-25T10:30:00', fecha_hora_ultmod: '2026-09-25T10:30:00' }
const solicitud = { id: 1, motivo: 'Consulta', equipo: 'Admisión', validado: true, rechazado: false,
  descripcion: 'Descripción declarada', descripcion_extra: '', motivo_rechazo: '',
  fecha_hora_creacion: '2026-09-24T09:00:00', fecha_hora_entrada: null, fecha_hora_admision: null,
  comentarios: [comentario] }

test('prepara filtros combinados, sin campos vacíos ni parámetros ajenos', () => {
  const filtros = leerFiltrosHistorial(new URLSearchParams('nombre= Clara &apellido=Diaz&dni=50000001&legajo=1234&equipo=1'))
  assert.deepEqual(prepararBusquedaHistorial(filtros), { nombre: 'Clara', apellido: 'Diaz', dni: '50000001', legajo: '1234' })
  assert.deepEqual(prepararBusquedaHistorial({ ...vacios, dni: ' 50000001 ' }), { dni: '50000001' })
  for (const valores of [vacios, { nombre: 'x' }, { apellido: 'x'.repeat(65) }, { dni: '50.000.001' },
    { dni: 'abc' }, { dni: '123456' }, { legajo: 'A123' }, { legajo: '0' }, { legajo: '-1' }, { legajo: '2147483648' }]) {
    assert.throws(() => prepararBusquedaHistorial({ ...vacios, ...valores }))
  }
})

test('intervenciones reúnen comentarios de todas las solicitudes en orden sin modificar los originales', () => {
  const solicitudes = [solicitud, { ...solicitud, id: 2, equipo: 'Territorial', comentarios: [
    { ...comentario, id: 11, fecha_hora_creacion: '2026-09-26T12:00:00' },
    { ...comentario, id: 12, fecha_hora_creacion: '2026-09-26T12:00:00' },
  ] }]
  const antes = JSON.stringify(solicitudes)
  const intervenciones = intervencionesDelHistorial(solicitudes)
  assert.deepEqual(intervenciones.map(({ id }) => id), [12, 11, 10])
  assert.equal(intervenciones[0].solicitud, 2)
  assert.equal(intervenciones[0].equipo, 'Territorial')
  assert.equal(JSON.stringify(solicitudes), antes)
  assert.deepEqual(intervencionesDelHistorial([]), [])
})

test('comentarios muestran origen, autor y fechas, sin editar ni interpretar HTML', () => {
  const html = render(IntervencionesHistorial, { intervenciones: intervencionesDelHistorial([
    { ...solicitud, comentarios: [{ ...comentario, fecha_hora_ultmod: '2026-09-26T11:00:00' }] },
  ]) })
  for (const texto of [/Autora/, /Solicitud #1/, /Admisión/, /Creado:/, /Editado:/, /Primera línea\n/,
    /&lt;b&gt;Texto libre&lt;\/b&gt;/, /white-space:pre-wrap/]) assert.match(html, texto)
  assert.doesNotMatch(html, /<textarea|<input|>Editar<|<b>Texto/)
  assert.match(render(IntervencionesHistorial, { intervenciones: [] }), /Todavía no hay intervenciones/)
})

test('detalle muestra identidad validada, solicitudes de todos los estados y conteos', () => {
  const solicitudes = [solicitud, { ...solicitud, id: 2, validado: false, comentarios: [] },
    { ...solicitud, id: 3, validado: false, rechazado: true, motivo_rechazo: 'Datos incorrectos', comentarios: [] }]
  assert.deepEqual(solicitudes.map((item) => estadoSolicitudHistorial(item).texto), ['Validada', 'Pendiente', 'Rechazada'])
  const html = render(HistorialNinoDetalle, { historial: { nino, solicitudes } })
  for (const texto of [/Clara Diaz/, /1234/, /Carpeta/, />900</, /Identidad validada/, /Solicitudes \(3\)/, /Intervenciones \(1\)/,
    /Validada/, /Pendiente/, /Rechazada/, /Datos incorrectos/, /Solo lectura/]) assert.match(html, texto)
  assert.doesNotMatch(html, /<textarea|>Editar<|href="\/validar/)
})

test('resultados conservan búsqueda, identifican pendientes y muestran paginación y vacío', () => {
  const datos = { count: 21, previous: null, next: '?page=2', results: [nino, { ...nino, id: 8, legajo: null, validado: false }] }
  const html = render(ResultadosHistorial, { datos, pagina: 1, consulta: 'dni=50000001&page=1', onPagina: () => {} })
  assert.match(html, /href="\/historial\/7\?dni=50000001&amp;page=1"/)
  assert.match(html, /21 resultados/)
  assert.match(html, /Carpeta 900/)
  assert.match(html, /Sin asignar/)
  assert.match(html, /Sin validar/)
  assert.match(html, /<button[^>]*disabled=""[^>]*>Anterior</)
  assert.match(html, /Página 1/)
  assert.match(render(ResultadosHistorial, { datos: { ...datos, count: 0, results: [] }, pagina: 1, consulta: '', onPagina: () => {} }), /No se encontraron/)
})

test('consultas utilizan endpoints de solo lectura, filtros, página y cancelación', async () => {
  const { default: http } = await server.ssrLoadModule('/src/common/api/client.ts')
  const { buscarNinos, getHistorialNino } = await server.ssrLoadModule('/src/features/persona/historialApi.ts')
  const anteriorStorage = globalThis.localStorage
  const anteriorAdapter = http.defaults.adapter
  const signal = new AbortController().signal
  globalThis.localStorage = { getItem: () => null }
  const llamadas = []
  http.defaults.adapter = async (config) => {
    llamadas.push({ metodo: config.method, url: config.url, params: config.params, signal: config.signal })
    return { data: { correcto: true }, status: 200, statusText: 'OK', headers: {}, config }
  }
  try {
    assert.deepEqual(await buscarNinos({ dni: '50000001' }, 2, signal), { correcto: true })
    assert.deepEqual(await getHistorialNino(7, signal), { correcto: true })
    assert.deepEqual(llamadas, [
      { metodo: 'get', url: 'persona/historial/', params: { dni: '50000001', page: 2 }, signal },
      { metodo: 'get', url: 'persona/historial/7/', params: undefined, signal },
    ])
  } finally {
    http.defaults.adapter = anteriorAdapter
    if (anteriorStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = anteriorStorage
  }
})
