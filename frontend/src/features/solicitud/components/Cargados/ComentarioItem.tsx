import { useState } from "react"
import { Button, Paper, Stack, Typography } from "@mui/material"
import type { SolicitudComentario } from "../../types"
import { ComentarioFormulario } from "./ComentarioFormulario"
import { formatFechaHora } from "@/common/utils"

type Props = {
  comentario: SolicitudComentario
  habilitado: boolean
  onEditar: (id: number, texto: string) => Promise<void>
}

export function ComentarioItem({ comentario, habilitado, onEditar }: Props) {
  const [editando, setEditando] = useState(false)
  const puedeEditar = habilitado && comentario.puede_editar
  return (
    <Paper component="article" variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>{comentario.usuario_nombre}</Typography>
            <Typography variant="caption" color="text.secondary">Creado: {formatFechaHora(comentario.fecha_hora_creacion)}</Typography>
            {comentario.fecha_hora_ultmod !== comentario.fecha_hora_creacion && (
              <Typography variant="caption" color="text.secondary">Editado: {formatFechaHora(comentario.fecha_hora_ultmod)}</Typography>
            )}
          </Stack>
          {puedeEditar && !editando && <Button size="small" onClick={() => setEditando(true)}>Editar</Button>}
        </Stack>
        {editando && puedeEditar ? (
          <ComentarioFormulario inicial={comentario.comentario} onCancelar={() => setEditando(false)}
            onGuardar={async (texto) => { await onEditar(comentario.id, texto); setEditando(false) }} />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{comentario.comentario}</Typography>
        )}
      </Stack>
    </Paper>
  )
}
