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
const cacheDir = await mkdtemp(join(tmpdir(), "infancias-comentarios-test-"))
const server = await createServer({
  configFile: false, root, cacheDir, logLevel: "silent", plugins: [react()],
  resolve: { alias: { "@": `${root}src` } },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(async () => {
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
})
const { ComentarioFormulario } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/ComentarioFormulario.tsx")
const { ComentarioItem } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/ComentarioItem.tsx")
const { ComentariosSolicitud } = await server.ssrLoadModule("/src/features/solicitud/components/Cargados/ComentariosSolicitud.tsx")
const render = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const comentario = {
  id: 10, comentario: "Primer párrafo\n<b>Texto, no HTML</b>", usuario: 1, usuario_nombre: "Autora de prueba",
  fecha_hora_creacion: "2026-09-25T10:30:00", fecha_hora_ultmod: "2026-09-25T10:30:00", puede_editar: true,
}

test("formulario limita a 256 y no permite guardar texto vacío o solo espacios", () => {
  for (const inicial of ["", "  \n ", "x".repeat(257)]) {
    const html = render(ComentarioFormulario, { inicial, onGuardar: async () => {} })
    assert.match(html, /maxlength="256"/i)
    const guardar = html.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0]
    assert.ok(guardar)
    assert.match(guardar, /\bdisabled=""/)
  }
  const html = render(ComentarioFormulario, { inicial: "x".repeat(256), onGuardar: async () => {} })
  assert.match(html, /256\/256 caracteres/)
  assert.doesNotMatch(html, /<button[^>]*disabled=""/)
})

test("muestra autor, fecha y texto escapado, manteniendo saltos de línea", () => {
  const html = render(ComentarioItem, { comentario, habilitado: true, onEditar: async () => {} })
  assert.match(html, /Autora de prueba/)
  assert.match(html, /Creado:/)
  assert.match(html, /10:30/)
  assert.doesNotMatch(html, /Editado:/)
  assert.match(html, /&lt;b&gt;Texto, no HTML&lt;\/b&gt;/)
  assert.match(html, /Primer párrafo\n/)
  assert.match(html, /white-space:pre-wrap/)
  assert.match(html, />Editar</)
})

test("solo ofrece editar comentarios propios mientras esté habilitada admisión", () => {
  for (const [habilitado, puede_editar] of [[true, false], [false, true], [false, false]]) {
    const html = render(ComentarioItem, { comentario: { ...comentario, puede_editar }, habilitado, onEditar: async () => {} })
    assert.doesNotMatch(html, />Editar<|<textarea/)
  }
  const html = render(ComentarioItem, { comentario: { ...comentario, fecha_hora_ultmod: "2026-09-25T11:30:00" },
    habilitado: true, onEditar: async () => {} })
  assert.match(html, /Creado:/)
  assert.match(html, /Editado:/)
  assert.match(html, /11:30/)
})

test("historial fuera de admisión es de solo lectura; en admisión ofrece agregar", () => {
  const props = { solicitudId: 1, iniciales: [comentario] }
  const lectura = render(ComentariosSolicitud, { ...props, puedeComentar: false })
  assert.match(lectura, /Solo lectura/)
  assert.match(lectura, /Primer párrafo/)
  assert.doesNotMatch(lectura, /<textarea|>Editar<|Agregar comentario/)
  const admision = render(ComentariosSolicitud, { ...props, puedeComentar: true })
  assert.match(admision, /Agregar comentario/)
  assert.match(admision, /<textarea/)
  const vacio = render(ComentariosSolicitud, { ...props, iniciales: [], puedeComentar: true })
  assert.match(vacio, /Todavía no hay comentarios/)
})

test("crear y editar envían solo el texto al endpoint correspondiente", async () => {
  const { default: http } = await server.ssrLoadModule("/src/common/api/client.ts")
  const { comentarSolicitud, editarComentarioSolicitud } = await server.ssrLoadModule("/src/features/solicitud/api.ts")
  const anteriorStorage = globalThis.localStorage
  const anteriorAdapter = http.defaults.adapter
  globalThis.localStorage = { getItem: () => null }
  const llamadas = []
  http.defaults.adapter = async (config) => {
    llamadas.push({ metodo: config.method, url: config.url, datos: JSON.parse(config.data) })
    return { data: comentario, status: 200, statusText: "OK", headers: {}, config }
  }
  try {
    assert.deepEqual(await comentarSolicitud(1, "Nuevo"), comentario)
    assert.deepEqual(await editarComentarioSolicitud(1, 10, "Editado"), comentario)
    assert.deepEqual(llamadas, [
      { metodo: "post", url: "solicitud/solicitud/1/comentar/", datos: { comentario: "Nuevo" } },
      { metodo: "patch", url: "solicitud/solicitud/1/comentarios/10/", datos: { comentario: "Editado" } },
    ])
  } finally {
    http.defaults.adapter = anteriorAdapter
    if (anteriorStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = anteriorStorage
  }
})
