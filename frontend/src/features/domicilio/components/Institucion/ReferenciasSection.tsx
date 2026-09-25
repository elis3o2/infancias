import { useState } from "react"
import { Alert, Button, Paper, Stack, Typography } from "@mui/material"
import type { Setter } from "@/common/types"
import { TitledCard } from "@/common/components/TitleCard"
import { ReferenciasEditor } from "@/pages/CreatePage/ReferenciasEditor"
import { agruparReferencias, guardarReferencia, quitarReferencia } from "@/pages/CreatePage/referencias"
import { nombreAdolescente, type AdolescenteFormulario, type ReferenciaFormulario } from "@/pages/CreatePage/formTypes"
import { InstitucionList } from "./InstitucionList"

type Props = {
  adolescentes: AdolescenteFormulario[]
  setAdolescentes: Setter<AdolescenteFormulario[]>
  editor: string | null
  setEditor: Setter<string | null>
}

export function ReferenciasSection({ adolescentes, setAdolescentes, editor, setEditor }: Props) {
  const [error, setError] = useState("")
  const grupos = agruparReferencias(adolescentes)
  const actual = grupos.find((grupo) => grupo.clave === editor)
  const cerrar = () => { setEditor(null); setError("") }
  function guardar(institucion: ReferenciaFormulario, seleccionados: string[]) {
    try {
      setAdolescentes(guardarReferencia(adolescentes, institucion, seleccionados, actual?.clave))
      cerrar()
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar la referencia.")
    }
  }
  return <TitledCard titulo="Instituciones de referencia" componente={<Stack spacing={2}>
    <Typography color="text.secondary">Elegí una institución y vinculala con uno o más adolescentes.</Typography>
    {grupos.map((grupo) => <Paper key={grupo.clave} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1}>
        <InstitucionList institucion={grupo.institucion} />
        <Typography variant="body2">Niñas, niños o adolescentes: {adolescentes.filter((item) => grupo.adolescentes.includes(item.id_temp))
          .map(nombreAdolescente).join(", ")}</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button disabled={editor !== null} onClick={() => { setError(""); setEditor(grupo.clave) }}>Editar vínculos</Button>
          <Button color="error" disabled={editor !== null}
            onClick={() => setAdolescentes((items) => quitarReferencia(items, grupo.clave))}>Quitar referencia</Button>
        </Stack>
      </Stack>
    </Paper>)}
    {!adolescentes.length && <Alert severity="info">Agregá una niña, niño o adolescente para vincular instituciones de referencia.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    {editor !== null ? <ReferenciasEditor key={editor} adolescentes={adolescentes} actual={actual}
      onGuardar={guardar} onCancelar={cerrar} /> :
      <Button variant="outlined" disabled={!adolescentes.length} onClick={() => { setError(""); setEditor("nuevo") }}>
        Agregar institución de referencia (opcional)
      </Button>}
  </Stack>} />
}
