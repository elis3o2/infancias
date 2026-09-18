import { getArchivoById } from "../../api";
import type { ArchivoSimple } from "../../types";
import { TitledCard } from "@/common/components/TitleCard";
import { Alert } from "@mui/material";
import { useState, type CSSProperties, type SVGProps } from "react";

type Props = {
  archivos: ArchivoSimple[]
}

export function ArchivoVistaCard({ archivos }: Props) {
  const [error, setError] = useState<string | null>(null)

  if (archivos.length === 0) {
    return (
      <></>
    );
  }

  return (
    <TitledCard
      titulo={`Archivos adjuntos (${archivos.length})`}
      componente={
      <div style={styles.wrapper}>
        <p style={styles.count}>
          {archivos.length} archivo{archivos.length > 1 ? "s" : ""}
        </p>

        <ul style={styles.list}>
          {archivos.map((archivo) => (
            <ArchivoRow
              key={archivo.id}
              archivo={archivo}
              onError={setError}
            />
          ))}
        </ul>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </div>
      }
    />
  );
}
/* ── fila individual ─────────────────────────────────────────────────────── */

function ArchivoRow({ archivo, onError }: { archivo: ArchivoSimple; onError: (mensaje: string) => void }) {
  async function handleDownload() {
    try {
      const response = await getArchivoById(archivo.id)
      const url = window.URL.createObjectURL(response.data)
      const enlace = document.createElement("a")
      enlace.href = url
      enlace.download = archivo.nombre
      enlace.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0)
    } catch {
      onError(`No se pudo descargar “${archivo.nombre}”. Intentá nuevamente.`)
    }
  }

  return (
    <li style={styles.row}>
      <MimeIcon mime={archivo.tipo_mime} />

      <div style={styles.info}>
        <span style={styles.nombre} title={archivo.nombre}>
          {archivo.nombre}
        </span>
        <span style={styles.meta}>
          {shortMime(archivo.tipo_mime)}
        </span>
      </div>

      <div style={styles.actions}>
        <button
            onClick={handleDownload}
          style={styles.btnIcon}
          title="Descargar"
          aria-label={`Descargar ${archivo.nombre}`}
        >
        
          <DownloadIcon />
          </button>
      </div>
    </li>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function shortMime(mime: string) {
  const map: Record<string, string> = {
    "application/pdf":  "PDF",
    "image/png":        "PNG",
    "image/jpeg":       "JPG",
    "image/gif":        "GIF",
    "image/webp":       "WEBP",
    "video/mp4":        "MP4",
    "audio/mpeg":       "MP3",
    "audio/ogg":        "OGG",
    "text/plain":       "TXT",
    "text/csv":         "CSV",
    "application/json": "JSON",
    "application/zip":  "ZIP",
  };
  return map[mime] || mime.split("/")[1]?.toUpperCase() || "—";
}


function mimeColor(mime: string) {
  if (mime.startsWith("image/"))       return "#6366F1";
  if (mime.startsWith("video/"))       return "#EC4899";
  if (mime.startsWith("audio/"))       return "#F59E0B";
  if (mime === "application/pdf")      return "#EF4444";
  if (mime.startsWith("text/"))        return "#10B981";
  return "#94A3B8";
}

function MimeIcon({ mime }: { mime: string }) {
  return (
    <span style={{ ...styles.mimeIcon, background: mimeColor(mime) }}>
      {shortMime(mime).slice(0, 3)}
    </span>
  );
}

/* ── SVG icons ───────────────────────────────────────────────────────────── */
const svgProps: SVGProps<SVGSVGElement> = {
  width: 16, height: 16, viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
};

function DownloadIcon() {
  return (
    <svg {...svgProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}



/* ── estilos ─────────────────────────────────────────────────────────────── */
const styles: Record<string, CSSProperties> = {
  wrapper: {
    display:       "flex",
    flexDirection: "column",
    gap:           "10px",
    fontFamily:    "'Inter', system-ui, sans-serif",
  },
  count: {
    margin:        0,
    fontSize:      "12px",
    fontWeight:    600,
    color:         "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  list: {
    listStyle: "none",
    margin:    0,
    padding:   0,
    display:   "flex",
    flexDirection: "column",
    gap:       "6px",
  },
  row: {
    display:      "flex",
    alignItems:   "center",
    gap:          "12px",
    padding:      "12px 14px",
    background:   "#F8FAFC",
    border:       "1px solid #E2E8F0",
    borderRadius: "12px",
    transition:   "box-shadow 0.15s",
  },
  mimeIcon: {
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    width:          "36px",
    height:         "36px",
    borderRadius:   "8px",
    fontSize:       "9px",
    fontWeight:     700,
    color:          "#fff",
    letterSpacing:  "0.02em",
    flexShrink:     0,
  },
  info: {
    flex:          1,
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
    minWidth:      0,          // permite ellipsis en hijos flex
  },
  nombre: {
    fontSize:     "13px",
    fontWeight:   500,
    color:        "#1E293B",
    overflow:     "hidden",
    textOverflow: "ellipsis",
    whiteSpace:   "nowrap",
  },
  meta: {
    fontSize: "11px",
    color:    "#94A3B8",
  },
  actions: {
    display:    "flex",
    gap:        "4px",
    flexShrink: 0,
  },
  btnIcon: {
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    width:          "34px",
    height:         "34px",
    background:     "none",
    border:         "1px solid #E2E8F0",
    borderRadius:   "6px",
    cursor:         "pointer",
    color:          "#64748B",
    transition:     "background 0.15s, color 0.15s",
  },
  btnDanger: {
    color: "#EF4444",
  },
  empty: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:            "8px",
    padding:        "32px",
    color:          "#CBD5E1",
  },
  emptyText: {
    margin:   0,
    fontSize: "13px",
    color:    "#94A3B8",
  },
};
