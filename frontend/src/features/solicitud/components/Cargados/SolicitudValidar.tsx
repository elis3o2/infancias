import { Alert, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import AlertMessage from "@/common/components/AlertMessage"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import type { SolicitudCrud } from "../../types"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { ContactoCard } from "../Contacto/ContactoCard"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"
import { AceptarButtons } from "./AceptarButtons"
import { DatosSinAsignarSolicitud } from "./DatosSinAsignarSolicitud"
import { RelacionesAdolescentesCard } from "./RelacionesAdolescentesCard"
import { AdolescenteRevisionCard } from "./validacion/AdolescenteRevisionCard"
import { AgregarFamiliarValidacion } from "./validacion/AgregarFamiliarValidacion"
import { HistoriaClinicaCard } from "./validacion/HistoriaClinicaCard"
import { useSolicitudValidacion } from "./validacion/useSolicitudValidacion"

export const SolicitudValidar = ({ solicitud }: { solicitud: SolicitudCrud }) => {
  const validacion = useSolicitudValidacion(solicitud)
  const { ciudadanos, buscando } = validacion
  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <ContactoCard telefono={solicitud.telefono} correo={solicitud.correo} />
      {solicitud.institucion && <InstitucionCard institucion={solicitud.institucion} />}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "action.hover" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Verificar identidad y antecedentes</Typography>
            <Typography variant="body2" color="text.secondary">
              Revisá cada adolescente junto con sus familiares e instituciones de referencia.
            </Typography>
          </Stack>
          <Button variant="contained" onClick={validacion.buscar} disabled={buscando}
            startIcon={buscando ? <CircularProgress size={16} color="inherit" /> : <SearchRoundedIcon />}>
            {buscando ? "Buscando..." : ciudadanos && validacion.hayPendientes ? "Continuar búsqueda" : ciudadanos ? "Actualizar datos" : "Buscar datos"}
          </Button>
        </Stack>
        {validacion.errorBusqueda && <Alert severity="warning" sx={{ mt: 2 }}>{validacion.errorBusqueda}</Alert>}
        {ciudadanos && validacion.hayPendientes && <Alert severity="info" sx={{ mt: 2 }}>
          Los datos obtenidos se conservan mientras permanezcas en esta pantalla. Continuar consulta solamente
          a las personas pendientes. Si se alcanzó el límite, esperá el tiempo indicado antes de continuar.
        </Alert>}
      </Paper>

      <RelacionesAdolescentesCard adolescentes={solicitud.adolescentes} relaciones_adolescentes={solicitud.relaciones_adolescentes} />

      {solicitud.adolescentes.map((adolescente) => (
        <AdolescenteRevisionCard key={adolescente.id} adolescente={adolescente}
          revision={validacion.revisiones[adolescente.id]}
          onChange={(cambios) => validacion.actualizar(adolescente.id, cambios)}
          resultado={ciudadanos?.adolescentes.find((resultado) => resultado.id === adolescente.id) ?? null}
          resultadosFamiliares={ciudadanos?.familiares ?? []} />
      ))}
      <DatosSinAsignarSolicitud solicitud={solicitud} />
      <AgregarFamiliarValidacion adolescentes={solicitud.adolescentes} onAgregar={validacion.agregarFamiliar} />
      {ciudadanos && <HistoriaClinicaCard respuestas={ciudadanos.hcf} />}
      <DescripcionCard nombre="Descripción" texto={solicitud.descripcion} />
      <TextField label="Agregar más información" value={validacion.descripcion}
        onChange={(event) => validacion.setDescripcion(event.target.value.slice(0, 256))}
        multiline minRows={3} fullWidth helperText={`${validacion.descripcion.length}/256`} />
      <ArchivoVistaCard archivos={solicitud.archivos} />

      <Alert severity="info">
        Todos los niños, niñas o adolescentes deben compartir carpeta. Si ya tienen carpetas distintas, se detendrá
        la validación y se informará el conflicto.
      </Alert>
      {validacion.familiaresSinAdolescente.length > 0 && <Alert severity="warning">
        Esta solicitud tiene familiares anteriores sin niño, niña o adolescente asociado. Es necesario asociarlos
        antes de confirmar la solicitud: {validacion.familiaresSinAdolescente.map((familiar) => `${familiar.nombre} ${familiar.apellido}`).join(", ")}.
      </Alert>}
      {validacion.hayRechazados && <Alert severity="warning">
        Para aceptar deben estar confirmados todos los niños, niñas o adolescentes y sus familiares. Revisá los datos
        rechazados o rechazá la solicitud completa.
      </Alert>}
      <AceptarButtons disabledConfirmar={!validacion.puedeAceptar} disabledRechazar={buscando}
        rechazoObligatorio={validacion.todosRechazados} onConfirmar={validacion.aceptar} onRechazar={validacion.rechazar} />
      <AlertMessage open={validacion.alerta !== null} handleClose={validacion.cerrarAlerta}
        message={validacion.alerta?.mensaje ?? ""} severity={validacion.alerta?.severity ?? "info"} />
    </Stack>
  )
}
