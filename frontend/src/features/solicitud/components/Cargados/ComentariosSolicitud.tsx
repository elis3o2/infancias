import { useState } from "react"
import { Paper, Stack, Typography } from "@mui/material"
import type { SolicitudComentario } from "../../types"
import { comentarSolicitud, editarComentarioSolicitud } from "../../api"
import { ComentarioFormulario } from "./ComentarioFormulario"
import { ComentarioItem } from "./ComentarioItem"

type Props = {
  solicitudId: number
  iniciales: SolicitudComentario[]
  puedeComentar: boolean
}

export function ComentariosSolicitud({ solicitudId, iniciales, puedeComentar }: Props) {
  const [comentarios, setComentarios] = useState(iniciales)

  async function agregar(texto: string) {
    const nuevo = await comentarSolicitud(solicitudId, texto)
    setComentarios((prev) => [...prev, nuevo])
  }

  async function editar(id: number, texto: string) {
    const actualizado = await editarComentarioSolicitud(solicitudId, id, texto)
    setComentarios((prev) => prev.map((item) => item.id === id ? actualizado : item))
  }

  return (
    <Paper component="section" aria-label="Comentarios de la solicitud" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Registro de situaciones</Typography>
          <Typography variant="body2" color="text.secondary">
            {puedeComentar ? "Entrada y Admisión pueden registrar situaciones incluso después de derivar la solicitud. Solo podés editar los comentarios que escribiste vos."
              : "Historial de situaciones registradas en la solicitud. Solo lectura."}
          </Typography>
        </Stack>
        {comentarios.length === 0 && <Typography variant="body2" color="text.secondary">Todavía no hay comentarios.</Typography>}
        {comentarios.map((comentario) => <ComentarioItem key={comentario.id} comentario={comentario}
          habilitado={puedeComentar} onEditar={editar} />)}
        {puedeComentar && <ComentarioFormulario onGuardar={agregar} />}
      </Stack>
    </Paper>
  )
}
