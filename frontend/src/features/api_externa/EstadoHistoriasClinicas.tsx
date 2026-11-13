import { Alert, Button, CircularProgress } from "@mui/material"

type Props = { cargando: boolean; error: boolean; reintentar: () => void }

export function EstadoHistoriasClinicas({ cargando, error, reintentar }: Props) {
  return <>
    {cargando && <Alert severity="info" icon={<CircularProgress size={20} />}>
      Cargando datos de salud e integrantes de la historia clínica familiar. Ya podés revisar las identidades.
    </Alert>}
    {error && <Alert severity="warning" action={
      <Button color="inherit" onClick={reintentar} disabled={cargando}>Reintentar historias</Button>
    }>
      No se pudieron consultar algunas historias clínicas. Las identidades y los datos ya obtenidos se conservan.
    </Alert>}
  </>
}
