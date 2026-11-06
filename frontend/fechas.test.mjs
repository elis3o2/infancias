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
const cacheDir = await mkdtemp(join(tmpdir(), 'infancias-fechas-test-'))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: 'silent', plugins: [react()],
  resolve: { alias: { '@': `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { formatFecha, formatFechaHora, fechaAISO, validarFechaIngresada } = await server.ssrLoadModule('/src/common/fechas.ts')
const { FechaInput } = await server.ssrLoadModule('/src/common/components/FechaInput.tsx')

test('el formato es fijo y no cambia con la zona horaria o el idioma del sistema', () => {
  const tz = process.env.TZ
  const lang = process.env.LANG
  try {
    for (const zona of ['UTC', 'America/Argentina/Buenos_Aires', 'Pacific/Honolulu', 'Asia/Tokyo']) {
      process.env.TZ = zona
      for (const idioma of ['en_US.UTF-8', 'es_AR.UTF-8']) {
        process.env.LANG = idioma
        assert.equal(formatFecha('2012-02-18'), '18-02-2012')
        assert.equal(formatFecha('Tue, 18 Feb 2003 00:00:00 GMT'), '18-02-2003')
        assert.equal(formatFecha('2026-11-06T23:30:00-03:00'), '06-11-2026')
        assert.equal(formatFechaHora('2026-11-06T23:30:00-03:00'), '06-11-2026 23:30')
        assert.equal(formatFechaHora('2026-11-06T00:15:12.123456Z'), '06-11-2026 00:15')
        assert.equal(formatFechaHora('2026-11-06T00:15:00'), '06-11-2026 00:15')
        assert.equal(formatFechaHora('2012-02-18'), '18-02-2012')
      }
    }
  } finally {
    if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz
    if (lang === undefined) delete process.env.LANG; else process.env.LANG = lang
  }
})

test('fechas vacías, imposibles o ambiguas no se muestran en otro formato', () => {
  for (const valor of [null, undefined, '', 'inválida', '11/06/2026', '2026-02-29', '2026-04-31', '0000-01-01', '2026-11-06T25:30:00']) {
    assert.equal(formatFecha(valor), '—')
    assert.equal(formatFechaHora(valor), '—')
  }
  assert.equal(formatFecha('2024-02-29'), '29-02-2024')
})

test('la carga DD-MM-AAAA se convierte a ISO sin cambiar el contrato del backend', () => {
  assert.equal(fechaAISO('06-11-2026'), '2026-11-06')
  assert.equal(fechaAISO('29-02-2000'), '2000-02-29')
  for (const valor of ['29-02-1900', '29-02-2026', '31-04-2026', '1-2-2026', '2026-11-06', '06/11/2026', '06-11-', '00-11-2026']) {
    assert.equal(fechaAISO(valor), '')
    assert.match(validarFechaIngresada(valor), /DD-MM-AAAA/)
  }
  assert.equal(validarFechaIngresada(''), '')
  assert.equal(validarFechaIngresada('06-11-2026', '2026-11-06'), '')
  assert.match(validarFechaIngresada('07-11-2026', '2026-11-06'), /posterior a 06-11-2026/)
})

test('los campos presentan texto fijo, instrucciones y restricciones en lugar de fechas nativas', () => {
  const html = renderToStaticMarkup(createElement(FechaInput, {
    label: 'Fecha de nacimiento', value: '2012-02-18', onChange: () => {}, required: true,
  }))
  assert.match(html, /value="18-02-2012"/)
  assert.match(html, /placeholder="DD-MM-AAAA"/)
  assert.match(html, /required=""/)
  assert.doesNotMatch(html, /type="date"|value="2012-02-18"/)
  const vacio = renderToStaticMarkup(createElement(FechaInput, { label: 'Desde', value: '', onChange: () => {} }))
  assert.match(vacio, /value=""/)
})
