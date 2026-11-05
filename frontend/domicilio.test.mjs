import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))
const cacheDir = await mkdtemp(join(tmpdir(), 'infancias-domicilio-test-'))
const server = await createServer({ configFile: false, root, cacheDir, logLevel: 'silent', plugins: [react()],
  resolve: { alias: { '@': `${root}src` } }, server: { middlewareMode: true, hmr: false, watch: null } })
after(async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }) })
const { editarDomicilioManual, domicilioFormToDomicilioInput, domicilioToFormData } = await server.ssrLoadModule('/src/features/domicilio/utils.ts')
const { DomicilioOpcionalForm } = await server.ssrLoadModule('/src/features/domicilio/components/DomicilioOpcionalForm.tsx')
const { DomicilioSelect } = await server.ssrLoadModule('/src/features/domicilio/components/Domicilio/DomicilioSelect.tsx')
const render = (component, props) => renderToStaticMarkup(createElement(component, props))
const provincia = { id: 1, nombre: 'Santa Fe' }
const departamento = { id: 520, nombre: 'Rosario', provincia }
const geo = { codigoCalle: 1, altura: 100, latitud: -32, longitud: -60 }
const domicilio = { nombre: 'Calle 100', id_departamento: 520, observaciones: 'Piso 2', domicilio_validado: geo }
const props = { condicion: true, domicilio: null, provincia: null, departamento: null,
  setDomicilio: () => {}, setProvincia: () => {}, setDepartamento: () => {}, mostrar: () => {} }

test('editar dirección o departamento descarta la geolocalización anterior sin mutar el original', () => {
  for (const cambio of [{ nombre: 'Otra calle 200' }, { id_departamento: 10 }, { id_departamento: null }]) {
    const editado = editarDomicilioManual(domicilio, cambio)
    assert.equal(editado.domicilio_validado, null)
    assert.equal(editado.observaciones, 'Piso 2')
    assert.notEqual(editado, domicilio)
  }
  assert.equal(domicilio.domicilio_validado, geo)
  assert.equal(editarDomicilioManual(domicilio, { nombre: domicilio.nombre }).domicilio_validado, geo)
  assert.equal(editarDomicilioManual(domicilio, { observaciones: 'Otro piso' }).domicilio_validado, geo)
})

test('cargar desde cero y convertir a envío conserva departamento, observaciones y nombre', () => {
  const nuevo = editarDomicilioManual(null, { nombre: 'Dirección nueva', id_departamento: 520 })
  assert.deepEqual(domicilioFormToDomicilioInput(nuevo), { nombre: 'Dirección nueva', id_departamento: 520, observaciones: null, domicilio_validado: null })
  assert.throws(() => domicilioFormToDomicilioInput(editarDomicilioManual(nuevo, { id_departamento: null })), /departamento/)
  assert.equal(domicilioToFormData({ ...domicilio, departamento }).id_departamento, 520)
})

test('domicilio opcional funciona sin lista y espera recuperar la ubicación guardada', () => {
  const oculto = render(DomicilioOpcionalForm, { ...props, condicion: false })
  assert.match(oculto, /CARGAR DOMICILIO/)
  const nuevo = render(DomicilioOpcionalForm, props)
  assert.match(nuevo, /Provincia/)
  assert.match(nuevo, /Departamento/)
  const guardado = render(DomicilioOpcionalForm, { ...props, domicilio })
  assert.match(guardado, /Cargando provincia y departamento/)
  assert.match(guardado, /value="Calle 100"/)
  const resuelto = render(DomicilioOpcionalForm, { ...props, domicilio, provincia, departamento })
  assert.match(resuelto, /value="Santa Fe"/)
  assert.match(resuelto, /value="Rosario"/)
  assert.doesNotMatch(resuelto, /Cargando provincia y departamento/)
  assert.match(resuelto, /aria-label="Quitar domicilio"/)
})

test('direcciones con igual nombre se seleccionan por posición, no por nombre', () => {
  const domicilios = [domicilio, { ...domicilio, id_departamento: 22, observaciones: 'Casa' }]
  const selector = { domicilios, setIndiceElegido: () => {}, onConfirmar: () => {}, onCargarOtro: () => {} }
  const primero = render(DomicilioSelect, { ...selector, indiceElegido: '0' })
  const segundo = render(DomicilioSelect, { ...selector, indiceElegido: '1' })
  assert.match(primero, /Departamento 520/)
  assert.match(segundo, /Departamento 22/)
  assert.match(segundo, /Casa/)
  assert.doesNotMatch(primero, /<button[^>]*disabled=""/)
  assert.match(render(DomicilioSelect, { ...selector, indiceElegido: '' }), /<button[^>]*disabled=""/)
  assert.match(render(DomicilioSelect, { ...selector, indiceElegido: '99' }), /<button[^>]*disabled=""/)
})

test('recupera el departamento por su id con provincia completa sin consultar servicios externos', async () => {
  const { default: http } = await server.ssrLoadModule('/src/common/api/client.ts')
  const { getDepartamento } = await server.ssrLoadModule('/src/features/domicilio/api.ts')
  const anteriorAdapter = http.defaults.adapter
  const anteriorStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: () => null }
  http.defaults.adapter = async (config) => {
    assert.equal(config.method, 'get')
    assert.equal(config.url, 'domicilio/departamento/520/')
    return { data: departamento, status: 200, statusText: 'OK', headers: {}, config }
  }
  try { assert.deepEqual(await getDepartamento(520), departamento) }
  finally {
    http.defaults.adapter = anteriorAdapter
    if (anteriorStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = anteriorStorage
  }
})
