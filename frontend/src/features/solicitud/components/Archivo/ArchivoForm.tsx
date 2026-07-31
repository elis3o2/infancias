import { useState, useRef, useCallback } from "react";
import type { Archivo } from "../../types";
import type { Setter } from "@/common/types";


type Props ={
  setArchivos: Setter<Archivo[]>
}

export function ArchivoForm({ setArchivos }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview]   = useState(/** @type {Archivo[]} */ ([]));
  const [nextId, setNextId]     = useState(1);
  const inputRef = useRef(null);

  const filesToArchivos = useCallback(
    (files: File[]) => {
      let id = nextId;
      const archivos = Array.from(files).map((file) => ({
        id:        id++,
        nombre:    file.name,
        tipo_mime: file.type || "application/octet-stream",
        contenido: file,         // File extiende Blob
      }));
      setNextId(id);
      return archivos;
    },
    [nextId]
  );

  const handleFiles = useCallback(
    (files) => {
      if (!files || files.length === 0) return;
      const nuevos = filesToArchivos(files);
      setPreview((prev) => [...prev, ...nuevos]);
    },
    [filesToArchivos]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = ()  => setDragging(false);

  const removeFromPreview = (id) =>
    setPreview((prev) => prev.filter((a) => a.id !== id));

  const confirmar = () => {
    if (preview.length === 0) return;
    setArchivos((prev) => [...prev, ...preview]);
    setPreview([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={styles.wrapper}>
      {/* Drop zone */}
      <div
        style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneDragging : {}) }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Zona para subir archivos"
      >
        <UploadIcon dragging={dragging} />
        <p style={styles.dropLabel}>
          {dragging
            ? "Soltá los archivos acá"
            : "Arrastrá archivos o hacé clic para seleccionar"}
        </p>
        <p style={styles.dropSub}>Podés seleccionar varios a la vez</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Preview de pendientes */}
      {preview.length > 0 && (
        <div style={styles.previewSection}>
          <p style={styles.previewTitle}>
            {preview.length} archivo{preview.length > 1 ? "s" : ""} por agregar
          </p>
          <ul style={styles.previewList}>
            {preview.map((a) => (
              <li key={a.id} style={styles.previewItem}>
                <MimeIcon mime={a.tipo_mime} />
                <span style={styles.previewName} title={a.nombre}>
                  {a.nombre}
                </span>
                <span style={styles.previewMime}>{shortMime(a.tipo_mime)}</span>
                <button
                  onClick={() => removeFromPreview(a.id)}
                  style={styles.btnRemovePreview}
                  aria-label={`Quitar ${a.nombre}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button onClick={confirmar} style={styles.btnConfirm}>
            Agregar {preview.length} archivo{preview.length > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
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

function MimeIcon({ mime }) {
  const color = mime.startsWith("image/")       ? "#6366F1"
              : mime.startsWith("video/")       ? "#EC4899"
              : mime.startsWith("audio/")       ? "#F59E0B"
              : mime === "application/pdf"       ? "#EF4444"
              : mime.startsWith("text/")        ? "#10B981"
              : "#94A3B8";
  return (
    <span style={{ ...styles.mimeIcon, background: color }}>
      {shortMime(mime).slice(0, 3)}
    </span>
  );
}

function UploadIcon({ dragging }) {
  return (
    <svg
      width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke={dragging ? "#6366F1" : "#94A3B8"} strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "stroke 0.2s" }}
    >
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
    gap:           "16px",
    fontFamily:    "'Inter', system-ui, sans-serif",
  },
  dropzone: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    gap:            "8px",
    padding:        "36px 24px",
    border:         "2px dashed #CBD5E1",
    borderRadius:   "12px",
    background:     "#F8FAFC",
    cursor:         "pointer",
    transition:     "border-color 0.2s, background 0.2s",
    outline:        "none",
  },
  dropzoneDragging: {
    borderColor: "#6366F1",
    background:  "#EEF2FF",
  },
  dropLabel: {
    margin:     0,
    fontSize:   "14px",
    fontWeight: 500,
    color:      "#475569",
  },
  dropSub: {
    margin:   0,
    fontSize: "12px",
    color:    "#94A3B8",
  },
  previewSection: {
    display:       "flex",
    flexDirection: "column",
    gap:           "8px",
  },
  previewTitle: {
    margin:     0,
    fontSize:   "12px",
    fontWeight: 600,
    color:      "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  previewList: {
    listStyle: "none",
    margin:    0,
    padding:   0,
    display:   "flex",
    flexDirection: "column",
    gap:       "6px",
  },
  previewItem: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    padding:      "8px 12px",
    background:   "#F1F5F9",
    borderRadius: "8px",
  },
  previewName: {
    flex:         1,
    fontSize:     "13px",
    color:        "#1E293B",
    overflow:     "hidden",
    textOverflow: "ellipsis",
    whiteSpace:   "nowrap",
  },
  previewMime: {
    fontSize:     "11px",
    color:        "#94A3B8",
    whiteSpace:   "nowrap",
  },
  btnRemovePreview: {
    background:   "none",
    border:       "none",
    cursor:       "pointer",
    color:        "#94A3B8",
    fontSize:     "14px",
    lineHeight:   1,
    padding:      "2px 4px",
    borderRadius: "4px",
    transition:   "color 0.15s",
  },
  mimeIcon: {
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    width:          "32px",
    height:         "32px",
    borderRadius:   "6px",
    fontSize:       "9px",
    fontWeight:     700,
    color:          "#fff",
    letterSpacing:  "0.02em",
    flexShrink:     0,
  },
  btnConfirm: {
    padding:       "10px 20px",
    background:    "#6366F1",
    color:         "#fff",
    border:        "none",
    borderRadius:  "8px",
    fontSize:      "13px",
    fontWeight:    600,
    cursor:        "pointer",
    alignSelf:     "flex-end",
    transition:    "background 0.15s",
  },
};