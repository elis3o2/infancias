import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { Alert, Box, Button, Stack, Typography } from "@mui/material"
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined"
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined"
import type { Setter } from "@/common/types"
import type { Archivo } from "../../types"

type Props = {
  archivos: Archivo[]
  setArchivos: Setter<Archivo[]>
}

const MAX_ARCHIVOS = 5
const MAX_TAMANO_ARCHIVO = 10 * 1024 * 1024
const MAX_TAMANO_TOTAL = 30 * 1024 * 1024
const TIPOS_ADMITIDOS = new Set(["application/pdf", "image/jpeg", "image/png"])
const EXTENSIONES_ADMITIDAS = new Set(["pdf", "jpg", "jpeg", "png"])

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function esArchivoAdmitido(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  return TIPOS_ADMITIDOS.has(file.type) || EXTENSIONES_ADMITIDAS.has(extension)
}

export function ArchivoForm({ archivos, setArchivos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agregarArchivos = (files: FileList | File[]) => {
    const seleccionados = Array.from(files)
    if (seleccionados.length === 0) return

    const existentes = archivos.reduce((total, archivo) => total + archivo.contenido.size, 0)
    const nombresExistentes = new Set(
      archivos.map((archivo) => `${archivo.nombre}:${archivo.contenido.size}`),
    )
    const nuevos: File[] = []

    for (const file of seleccionados) {
      if (!esArchivoAdmitido(file)) {
        setError("Solo se admiten archivos PDF, JPG o PNG.")
        return
      }
      if (file.size > MAX_TAMANO_ARCHIVO) {
        setError(`“${file.name}” supera el máximo de ${formatBytes(MAX_TAMANO_ARCHIVO)}.`)
        return
      }
      if (nombresExistentes.has(`${file.name}:${file.size}`)) continue
      nuevos.push(file)
      nombresExistentes.add(`${file.name}:${file.size}`)
    }

    if (nuevos.length === 0) {
      setError("Los archivos seleccionados ya estaban agregados.")
      return
    }
    if (archivos.length + nuevos.length > MAX_ARCHIVOS) {
      setError(`Podés adjuntar hasta ${MAX_ARCHIVOS} archivos.`)
      return
    }

    const totalNuevo = nuevos.reduce((total, file) => total + file.size, existentes)
    if (totalNuevo > MAX_TAMANO_TOTAL) {
      setError(`El total de adjuntos no puede superar ${formatBytes(MAX_TAMANO_TOTAL)}.`)
      return
    }

    const siguienteId = archivos.reduce((maximo, archivo) => Math.max(maximo, archivo.id), 0) + 1
    setArchivos((prev) => [
      ...prev,
      ...nuevos.map((contenido, indice) => ({
        id: siguienteId + indice,
        nombre: contenido.name,
        tipo_mime: contenido.type || "application/octet-stream",
        contenido,
      })),
    ])
    setError(null)
  }

  const seleccionarArchivos = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) agregarArchivos(event.target.files)
    event.target.value = ""
  }

  const soltarArchivos = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setArrastrando(false)
    agregarArchivos(event.dataTransfer.files)
  }

  return (
    <Stack spacing={1.5}>
      <Box
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltarArchivos}
        sx={{
          border: "1.5px dashed",
          borderColor: arrastrando ? "primary.main" : "divider",
          borderRadius: 2,
          cursor: "pointer",
          px: 2,
          py: 2.5,
          textAlign: "center",
          bgcolor: arrastrando ? "primary.50" : "background.default",
          transition: "150ms ease",
          "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
        }}
      >
        <CloudUploadOutlinedIcon color="primary" sx={{ fontSize: 30, mb: 0.5 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Arrastrá los adjuntos o hacé clic para seleccionarlos
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PDF, JPG o PNG · hasta 5 archivos · máximo 10 MB por archivo
        </Typography>
      </Box>

      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={seleccionarArchivos}
      />

      <Button
        size="small"
        variant="text"
        startIcon={<AttachFileOutlinedIcon />}
        onClick={() => inputRef.current?.click()}
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
      >
        Seleccionar archivos
      </Button>

      {error && <Alert severity="warning" onClose={() => setError(null)}>{error}</Alert>}
    </Stack>
  )
}
