import { useRef, useState } from "react";
import { getArchivoById } from "../../api";
import type { ArchivoSimple } from "../../types";
import type { Setter } from "@/common/types";

type Props = {
  archivos: ArchivoSimple[]
  seleccionados: Set<number>
  setSeleccionados: Setter<Set<number>>
  onUpload: (file: File) => void | Promise<void>
}

export function ArchivoCard({ archivos, seleccionados, setSeleccionados, onUpload }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggleSeleccionado(id: number) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleClickSubir() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      await onUpload(file);
    } finally {
      setSubiendo(false);
      // permite volver a elegir el mismo archivo si hace falta
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <p style={styles.count}>
          {archivos.length} archivo{archivos.length !== 1 ? "s" : ""}
        </p>

        <button
          onClick={handleClickSubir}
          style={styles.btnSubir}
          disabled={subiendo}
          type="button"
        >
          <UploadIcon />
          {subiendo ? "Subiendo..." : "Subir archivo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {archivos.length > 0 && (
        <ul style={styles.list}>
          {archivos.map((archivo) => (
            <ArchivoRow
              key={archivo.id}
              archivo={archivo}
              deseleccionado={!seleccionados.has(archivo.id)}
              onToggleDeseleccionado={() => toggleSeleccionado(archivo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── fila individual ─────────────────────────────────────────────────────── */

function ArchivoRow({ archivo, deseleccionado, onToggleDeseleccionado }) {
    async function handleDownload (archivo: ArchivoSimple){
        
        const response = await getArchivoById(archivo.id);

        const url = window.URL.createObjectURL(response.data);

        const a = document.createElement("a");
        a.href = url;
        a.download = archivo.nombre; // por ejemplo "informe.pdf"
        a.click();

        window.URL.revokeObjectURL(url);
  };

  return (
    <li style={{ ...styles.row, ...(deseleccionado ? styles.rowDeseleccionado : {}) }}>
      <MimeIcon mime={archivo.tipo_mime} deseleccionado={deseleccionado} />

      <div style={styles.info}>
        <span style={{ ...styles.nombre, ...(deseleccionado ? styles.textoDeseleccionado : {}) }} title={archivo.nombre}>
          {archivo.nombre}
        </span>
        <span style={styles.meta}>
          {shortMime(archivo.tipo_mime)}
        </span>
      </div>

      <div style={styles.actions}>
        <button
            onClick={() => handleDownload(archivo)}
          style={styles.btnIcon}
          title="Descargar"
          aria-label={`Descargar ${archivo.nombre}`}
        >
          <DownloadIcon />
        </button>

        <button
          onClick={onToggleDeseleccionado}
          style={{
            ...styles.btnIcon,
            ...(deseleccionado ? styles.btnActivo : {}),
          }}
          title={deseleccionado ? "Recuperar" : "Quitar"}
          aria-label={deseleccionado ? `Recuperar ${archivo.nombre}` : `Quitar ${archivo.nombre}`}
        >
          <CloseIcon />
        </button>
      </div>
    </li>
  );
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