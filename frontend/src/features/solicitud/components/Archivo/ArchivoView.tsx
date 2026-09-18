import { IconButton, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material"
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined"
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined"
import type { Archivo } from "../../types"

type Props = {
  archivos: Archivo[]
  onRemove: (id: number) => void
}

function tipoArchivo(mime: string) {
  if (mime === "application/pdf") return "PDF"
  if (mime === "image/jpeg") return "JPG"
  if (mime === "image/png") return "PNG"
  return mime.split("/").at(-1)?.toUpperCase() ?? "Archivo"
}

function tamanoArchivo(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ArchivoView({ archivos, onRemove }: Props) {
  if (archivos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        No hay archivos adjuntos todavía.
      </Typography>
    )
  }

  const descargar = (archivo: Archivo) => {
    const url = URL.createObjectURL(archivo.contenido)
    const enlace = document.createElement("a")
    enlace.href = url
    enlace.download = archivo.nombre
    enlace.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {archivos.length} archivo{archivos.length === 1 ? "" : "s"} adjunto{archivos.length === 1 ? "" : "s"}
      </Typography>
      <List disablePadding>
        {archivos.map((archivo) => (
          <ListItem
            key={archivo.id}
            disableGutters
            secondaryAction={
              <>
                <IconButton
                  edge="end"
                  aria-label={`Descargar ${archivo.nombre}`}
                  onClick={() => descargar(archivo)}
                >
                  <DownloadOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  color="error"
                  aria-label={`Quitar ${archivo.nombre}`}
                  onClick={() => onRemove(archivo.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </>
            }
            sx={{ borderBottom: 1, borderColor: "divider", pr: 11 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <DescriptionOutlinedIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={<Typography noWrap variant="body2">{archivo.nombre}</Typography>}
              secondary={`${tipoArchivo(archivo.tipo_mime)} · ${tamanoArchivo(archivo.contenido.size)}`}
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  )
}
