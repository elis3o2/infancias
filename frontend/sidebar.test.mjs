import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Writable } from 'node:stream'
import { createElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))
const cacheDir = await mkdtemp(join(tmpdir(), 'infancias-sidebar-test-'))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: 'silent', plugins: [
    {
      name: 'mapa-no-necesario-para-probar-navegacion',
      enforce: 'pre',
      load(id) {
        // Leaflet necesita un navegador; estas pruebas solo verifican la estructura de las rutas.
        if (id.endsWith('/src/features/domicilio/components/Mapa.tsx')) return 'export const Mapa = () => null'
      },
    },
    react(),
  ],
  resolve: { alias: { '@': `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { AppRoutes } = await server.ssrLoadModule('/src/routes/AppRoutes.tsx')
const { AuthContext } = await server.ssrLoadModule('/src/common/contex/AuthContext.tsx')

function pantalla(ruta, { autenticado = true, escritorio = true } = {}) {
  const theme = createTheme({ components: { MuiUseMediaQuery: { defaultProps: {
    ssrMatchMedia: () => ({ matches: escritorio }),
  } } } })
  const contexto = {
    authTokens: autenticado ? { access: 'prueba-local', refresh: 'prueba-local' } : null,
    username: 'Usuario de prueba', initializeAuth: () => {}, logout: () => {},
  }
  const elemento = createElement(ThemeProvider, { theme },
    createElement(AuthContext.Provider, { value: contexto },
      createElement(MemoryRouter, { initialEntries: [ruta] }, createElement(AppRoutes))))
  return new Promise((resolve, reject) => {
    let html = ''
    let conectado = false
    const destino = new Writable({ write(chunk, _encoding, done) { html += chunk.toString(); done() } })
    destino.on('finish', () => resolve(html))
    destino.on('error', reject)
    const stream = renderToPipeableStream(elemento, {
      onAllReady() {
        if (!conectado) {
          conectado = true
          stream.pipe(destino)
        }
      },
      onError: reject,
    })
  })
}

test('listado y detalle comparten una sola navegación y un solo pie', async () => {
  for (const ruta of ['/solicitud', '/solicitud/', '/validar/7', '/historial', '/historial/7', '/reportes']) {
    const html = await pantalla(ruta)
    assert.equal((html.match(/aria-label="Navegación principal"/g) ?? []).length, 1)
    assert.equal((html.match(/<footer\b/g) ?? []).length, 1)
    assert.match(html, /id="contenido-principal"/)
    assert.match(html, /href="\/solicitud"/)
    assert.match(html, /href="\/buscar"/)
    assert.match(html, /href="\/historial"/)
    assert.match(html, /href="\/reportes"/)
    assert.doesNotMatch(html, /href="\/atenciones"/)
    assert.match(html, /aria-current="page"/)
    assert.match(html, /margin-left:200px/)
    assert.match(html, /Usuario de prueba/)
    if (ruta.startsWith('/validar/')) assert.match(html, /aria-label="Volver a solicitudes"/)
  }
})

test('formulario público conserva su encabezado sin sidebar ni botón de menú', async () => {
  for (const autenticado of [false, true]) {
    const html = await pantalla('/buscar', { autenticado })
    assert.match(html, /Nueva solicitud/)
    assert.match(html, /Municipalidad de Rosario/)
    assert.doesNotMatch(html, /Navegación principal|Abrir menú|Cerrar menú|margin-left:200px/)
    assert.equal((html.match(/<footer\b/g) ?? []).length, 1)
  }
})

test('inicio de sesión y rutas privadas sin sesión no exponen el sidebar', async () => {
  const login = await pantalla('/login', { autenticado: false })
  assert.match(login, /Iniciar sesión/)
  assert.doesNotMatch(login, /Navegación principal|Abrir menú|Cerrar menú/)
  for (const ruta of ['/solicitud', '/validar/7', '/historial', '/historial/7', '/reportes']) {
    const html = await pantalla(ruta, { autenticado: false })
    assert.doesNotMatch(html, /Navegación principal|contenido-principal/)
  }
})

test('en móvil el menú comienza cerrado y el contenido no reserva espacio lateral', async () => {
  const html = await pantalla('/validar/7', { escritorio: false })
  assert.match(html, /aria-label="Abrir menú"/)
  assert.match(html, /aria-expanded="false"/)
  assert.doesNotMatch(html, /margin-left:200px/)
  assert.match(html, /id="contenido-principal"/)
})
