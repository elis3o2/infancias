import { Alert, Stack } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import { InstitucionesList } from "@/features/domicilio/components/Institucion/InstitucionesList"
import { PersonasCard } from "@/features/persona/componets/Persona/PersonasCard"
import type { SolicitudDetalle } from "../../types"
import { FamiliaresDetalle } from "./FamiliaresDetalle"
import { datosSinAdolescente } from "./solicitudDetalle"

export const DatosSinAsignarSolicitud = ({ solicitud }: { solicitud: SolicitudDetalle }) => {
  const { familiares, personas, referencias } = datosSinAdolescente(solicitud)
  if (!familiares.length && !personas.length && !referencias.length) return null

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Estos datos fueron cargados en la solicitud sin asociación a un niña, niño o adolescente.
      </Alert>
      <FamiliaresDetalle familiares={familiares} validada={solicitud.validado} />
      {personas.length > 0 && (
        <PersonasCard personas={personas} titulo="Familiares validados sin niña, niño o adolescente asociado" />
      )}
      {referencias.length > 0 && (
        <TitledCard
          titulo="Instituciones de referencia sin niña, niño o adolescente asociado"
          componente={<InstitucionesList instituciones={referencias} />}
        />
      )}
    </Stack>
  )
}
