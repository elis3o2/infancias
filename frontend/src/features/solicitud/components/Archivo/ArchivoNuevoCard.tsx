import type { ArchivoPendiente } from "../../types"
import type { Setter } from "@/common/types"

type ArchivoNuevoCardProps = {
  archivos: ArchivoPendiente[]
  setArchivos: Setter<ArchivoPendiente[]>
}

export function ArchivoNuevoCard({ archivos, setArchivos }: ArchivoNuevoCardProps) {
  if (archivos.length === 0) return null

  function handleQuitar(id: string) {
    setArchivos((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div style={styles.wrapper}>
      <p style={styles.count}>
        {archivos.length} archivo{archivos.length !== 1 ? "s" : ""} nuevo{archivos.length !== 1 ? "s" : ""}
      </p>
      <ul style={styles.list}>
        {archivos.map(({ id, file }) => (
          <li key={id} style={styles.row}>
            <span style={styles.mimeIcon}>
              {(file.type.split("/")[1] || "?").slice(0, 3).toUpperCase()}
            </span>
            <div style={styles.info}>
              <span style={styles.nombre} title={file.name}>{file.name}</span>
              <span style={styles.meta}>{(file.size / 1024).toFixed(0)} KB</span>
            </div>
            <button
              onClick={() => handleQuitar(id)}
              style={styles.btnIcon}
              title="Quitar"
              aria-label={`Quitar ${file.name}`}
              type="button"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}



/* ── helpers ─────────────────────────────────────────────────────────────── */

function shortMime(mime) {
  const map = {
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


function mimeColor(mime) {
  if (mime.startsWith("image/"))       return "#6366F1";
  if (mime.startsWith("video/"))       return "#EC4899";
  if (mime.startsWith("audio/"))       return "#F59E0B";
  if (mime === "application/pdf")      return "#EF4444";
  if (mime.startsWith("text/"))        return "#10B981";
  return "#94A3B8";
}

function MimeIcon({ mime, deseleccionado }: { mime: string, deseleccionado?: boolean }) {
  return (
    <span style={{ ...styles.mimeIcon, background: deseleccionado ? "#CBD5E1" : mimeColor(mime) }}>
      {shortMime(mime).slice(0, 3)}
    </span>
  );
}

/* ── SVG icons ───────────────────────────────────────────────────────────── */
const svgProps = {
  width: "16", height: "16", viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor",
  strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
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

function CloseIcon() {
  return (
    <svg {...svgProps}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg {...svgProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}



/* ── estilos ─────────────────────────────────────────────────────────────── */
const styles = {
  wrapper: {
    display:       "flex",
    flexDirection: "column",
    gap:           "8px",
    fontFamily:    "'Inter', system-ui, sans-serif",
  },
  header: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
  },
  count: {
    margin:        0,
    fontSize:      "12px",
    fontWeight:    600,
    color:         "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  btnSubir: {
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "6px",
    padding:        "6px 12px",
    fontSize:       "12px",
    fontWeight:     600,
    color:          "#334155",
    background:     "#F1F5F9",
    border:         "1px solid #E2E8F0",
    borderRadius:   "8px",
    cursor:         "pointer",
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
    padding:      "10px 14px",
    background:   "#fff",
    border:       "1px solid #E2E8F0",
    borderRadius: "10px",
    transition:   "box-shadow 0.15s, background 0.15s, opacity 0.15s",
  },
  rowDeseleccionado: {
    background: "#F1F5F9",
    opacity:    0.6,
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
  textoDeseleccionado: {
    color:         "#94A3B8",
    textDecoration: "line-through",
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
    width:          "30px",
    height:         "30px",
    background:     "none",
    border:         "1px solid #E2E8F0",
    borderRadius:   "6px",
    cursor:         "pointer",
    color:          "#64748B",
    transition:     "background 0.15s, color 0.15s",
  },
  btnActivo: {
    background:  "#E2E8F0",
    color:       "#334155",
    borderColor: "#CBD5E1",
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