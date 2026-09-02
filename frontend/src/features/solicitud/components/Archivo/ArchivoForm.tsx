import { useState, useRef, useCallback, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import type { Archivo } from "../../types";
import type { Setter } from "@/common/types";

type Props = {
  archivos: Archivo[];
  setArchivos: Setter<Archivo[]>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30 MB

const ALLOWED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

export function ArchivoForm({ archivos, setArchivos }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<Archivo[]>([]);
  const [nextId, setNextId] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const tamañoArchivos = archivos.reduce(
    (total, archivo) => total + archivo.contenido.size,
    0
  );

  const tamañoPreview = preview.reduce(
    (total, archivo) => total + archivo.contenido.size,
    0
  );

  const tamañoTotal = tamañoArchivos + tamañoPreview;

  const filesToArchivos = useCallback(
    (files: File[]): Archivo[] => {
      let id = nextId;
      const nuevosArchivos: Archivo[] = [];

      for (const file of files) {
        const errorArchivo = validarArchivo(file);

        if (errorArchivo) {
          setError(errorArchivo);
          continue;
        }

        nuevosArchivos.push({
          id: id++,
          nombre: file.name,
          tipo_mime: file.type,
          contenido: file,
        });
      }

      setNextId(id);

      return nuevosArchivos;
    },
    [nextId]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (!files || files.length === 0) {
        return;
      }

      setError(null);

      const seleccionados = Array.from(files);

      
      if (archivos.length + preview.length + seleccionados.length > MAX_FILES ) {
        const disponibles =
          MAX_FILES - archivos.length - preview.length;

        if (disponibles <= 0) {
          setError(
            `Se alcanzó el máximo de ${MAX_FILES} archivos.`
          );
        } else {
          setError(
            `El máximo de archivos es de ${MAX_FILES}.`
          );
        }

        return;
      }

      // Validación individual.
      const nuevos = filesToArchivos(seleccionados);

      if (nuevos.length === 0) {
        return;
      }

    
      const archivosExistentes = [
        ...archivos,
        ...preview,
      ];

      // Evitar duplicados.
      const sinDuplicados = nuevos.filter((nuevo) => {
        return !archivosExistentes.some(
          (existente) =>
            existente.nombre === nuevo.nombre &&
            existente.contenido.size === nuevo.contenido.size
        );
      });

      if (sinDuplicados.length === 0) {
        setError(
          "Los archivos seleccionados ya fueron agregados."
        );
        return;
      }

      // Tamaño de los nuevos archivos.
      const tamañoNuevos = sinDuplicados.reduce(
        (total, archivo) =>
          total + archivo.contenido.size,
        0
      );

      // Tamaño total incluyendo:
      if (tamañoTotal + tamañoNuevos > MAX_TOTAL_SIZE) {
        const disponible = MAX_TOTAL_SIZE - tamañoTotal;

        setError(
          `El tamaño total supera los 30 MB. ` +
            `Te quedan ${formatBytes(disponible)} disponibles.`
        );

        return;
      }


      setPreview((prev) => [
        ...prev,
        ...sinDuplicados,
      ]);
    },
    [
      archivos,
      preview,
      tamañoTotal,
      filesToArchivos,
    ]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);

      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const removeFromPreview = (id: number) => {
    setPreview((prev) =>
      prev.filter((archivo) => archivo.id !== id)
    );

    setError(null);
  };

  const confirmar = () => {
    if (preview.length === 0) {
      return;
    }

    /*
     * Última comprobación antes de confirmar.
     *
     * Esto evita que por algún cambio de estado
     * se excedan los límites.
     */
    if (archivos.length + preview.length > MAX_FILES) {
      setError(
        `No podés tener más de ${MAX_FILES} archivos.`
      );
      return;
    }

    if (tamañoTotal > MAX_TOTAL_SIZE) {
      setError(
        "El tamaño total de los archivos no puede superar los 30 MB."
      );
      return;
    }

    setArchivos((prev) => [
      ...prev,
      ...preview,
    ]);

    setPreview([]);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Zona de subida */}
      <div
        style={{
          ...styles.dropzone,
          ...(dragging
            ? styles.dropzoneDragging
            : {}),
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Zona para subir archivos"
        aria-describedby="upload-help"
      >
        <UploadIcon dragging={dragging} />

        <p style={styles.dropLabel}>
          {dragging
            ? "Soltá los archivos acá"
            : "Arrastrá archivos o hacé clic para seleccionar"}
        </p>

        <p
          id="upload-help"
          style={styles.dropSub}
        >
          PDF, JPG o PNG
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        style={{ display: "none" }}
        onChange={handleInputChange}
      />

      {/* Error */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          style={styles.error}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Archivos pendientes */}
      {preview.length > 0 && (
        <div style={styles.previewSection}>
          <div style={styles.previewHeader}>
            <p style={styles.previewTitle}>
              {preview.length} archivo
              {preview.length > 1 ? "s" : ""} por agregar
            </p>
          </div>

          <ul style={styles.previewList}>
            {preview.map((archivo) => (
              <li
                key={archivo.id}
                style={styles.previewItem}
              >
                <MimeIcon
                  mime={archivo.tipo_mime}
                />

                <div style={styles.fileInfo}>
                  <span
                    style={styles.previewName}
                    title={archivo.nombre}
                  >
                    {archivo.nombre}
                  </span>

                  <span style={styles.previewSize}>
                    {formatBytes(
                      archivo.contenido.size
                    )}
                  </span>
                </div>

                <span style={styles.previewMime}>
                  {shortMime(
                    archivo.tipo_mime
                  )}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    removeFromPreview(
                      archivo.id
                    )
                  }
                  style={
                    styles.btnRemovePreview
                  }
                  aria-label={`Quitar ${archivo.nombre}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={confirmar}
            style={styles.btnConfirm}
          >
            Agregar {preview.length} archivo
            {preview.length > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Validación                                                                 */
/* -------------------------------------------------------------------------- */

function validarArchivo(
  file: File
): string | null {
  // Archivo vacío
  if (file.size === 0) {
    return `El archivo "${file.name}" está vacío.`;
  }

  // Tamaño máximo individual
  if (file.size > MAX_FILE_SIZE) {
    return (
      `El archivo "${file.name}" ` +
      `supera el máximo permitido de 10 MB.`
    );
  }

  // MIME informado por el navegador
  if (!ALLOWED_TYPES[file.type]) {
    return (
      `El archivo "${file.name}" ` +
      `no tiene un formato permitido. ` +
      `Solo se aceptan PDF, JPG y PNG.`
    );
  }

  // Verificar extensión
  const extension =
    obtenerExtension(file.name);

  const extensionesPermitidas =
    ALLOWED_TYPES[file.type];

  if (
    !extensionesPermitidas.includes(
      extension
    )
  ) {
    return (
      `La extensión del archivo "${file.name}" ` +
      `no coincide con su tipo.`
    );
  }

  return null;
}

function obtenerExtension(
  nombre: string
): string {
  const ultimoPunto =
    nombre.lastIndexOf(".");

  if (ultimoPunto === -1) {
    return "";
  }

  return nombre
    .substring(ultimoPunto)
    .toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatBytes(
  bytes: number
): string {
  if (bytes <= 0) {
    return "0 Bytes";
  }

  const unidades = [
    "Bytes",
    "KB",
    "MB",
    "GB",
  ];

  const indice = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    ),
    unidades.length - 1
  );

  return `${(
    bytes /
    Math.pow(1024, indice)
  ).toFixed(
    indice === 0 ? 0 : 2
  )} ${unidades[indice]}`;
}

function shortMime(
  mime: string
): string {
  const map: Record<
    string,
    string
  > = {
    "application/pdf": "PDF",
    "image/png": "PNG",
    "image/jpeg": "JPG",
  };

  return (
    map[mime] ||
    mime
      .split("/")[1]
      ?.toUpperCase() ||
    "—"
  );
}

/* -------------------------------------------------------------------------- */
/* Iconos                                                                     */
/* -------------------------------------------------------------------------- */

function MimeIcon({
  mime,
}: {
  mime: string;
}) {
  const color = mime.startsWith(
    "image/"
  )
    ? "#6366F1"
    : mime ===
        "application/pdf"
      ? "#EF4444"
      : "#94A3B8";

  return (
    <span
      style={{
        ...styles.mimeIcon,
        background: color,
      }}
    >
      {shortMime(mime).slice(0, 3)}
    </span>
  );
}

function UploadIcon({
  dragging,
}: {
  dragging: boolean;
}) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke={
        dragging
          ? "#6366F1"
          : "#94A3B8"
      }
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition:
          "stroke 0.2s",
      }}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="15"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = {
  wrapper: {
    display: "flex",
    flexDirection:
      "column",
    gap: "16px",
    fontFamily:
      "'Inter', system-ui, sans-serif",
  },

  dropzone: {
    display: "flex",
    flexDirection:
      "column",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "8px",
    padding:
      "36px 24px",
    border:
      "2px dashed #CBD5E1",
    borderRadius: "12px",
    background:
      "#F8FAFC",
    cursor: "pointer",
    transition:
      "border-color 0.2s, background 0.2s",
    outline: "none",
  },

  dropzoneDragging: {
    borderColor:
      "#6366F1",
    background:
      "#EEF2FF",
  },

  dropLabel: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 500,
    color: "#475569",
  },

  dropSub: {
    margin: 0,
    fontSize: "12px",
    color: "#94A3B8",
  },

  error: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
    padding:
      "10px 12px",
    borderRadius: "8px",
    background:
      "#FEF2F2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  previewSection: {
    display: "flex",
    flexDirection:
      "column",
    gap: "8px",
  },

  previewHeader: {
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
  },

  previewTitle: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748B",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.05em",
  },

  previewList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection:
      "column",
    gap: "6px",
  },

  previewItem: {
    display: "flex",
    alignItems:
      "center",
    gap: "10px",
    padding:
      "8px 12px",
    background:
      "#F1F5F9",
    borderRadius: "8px",
  },

  fileInfo: {
    display: "flex",
    flexDirection:
      "column",
    flex: 1,
    minWidth: 0,
  },

  previewName: {
    fontSize: "13px",
    color: "#1E293B",
    overflow:
      "hidden",
    textOverflow:
      "ellipsis",
    whiteSpace:
      "nowrap",
  },

  previewSize: {
    marginTop: "2px",
    fontSize: "11px",
    color: "#94A3B8",
  },

  previewMime: {
    fontSize: "11px",
    color: "#94A3B8",
    whiteSpace:
      "nowrap",
  },

  btnRemovePreview: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94A3B8",
    fontSize: "14px",
    lineHeight: 1,
    padding:
      "2px 4px",
    borderRadius: "4px",
    transition:
      "color 0.15s",
  },

  mimeIcon: {
    display: "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    fontSize: "9px",
    fontWeight: 700,
    color: "#fff",
    letterSpacing:
      "0.02em",
    flexShrink: 0,
  },

  btnConfirm: {
    padding:
      "10px 20px",
    background:
      "#6366F1",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    alignSelf:
      "flex-end",
    transition:
      "background 0.15s",
  },
};