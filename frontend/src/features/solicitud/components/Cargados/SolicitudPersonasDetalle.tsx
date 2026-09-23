import { Stack } from "@mui/material"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import type { SolicitudDetalle } from "../../types"
import { AdolescenteDetalle } from "./AdolescenteDetalle"
import { DatosSinAsignarSolicitud } from "./DatosSinAsignarSolicitud"
import { RelacionesAdolescentesCard } from "./RelacionesAdolescentesCard"
import { familiaresDelAdolescente } from "./solicitudDetalle"

export const SolicitudPersonasDetalle = ({ solicitud }: { solicitud: SolicitudDetalle }) => (
  <Stack spacing={{ xs: 2, sm: 3 }}>
    {solicitud.institucion && <InstitucionCard institucion={solicitud.institucion} />}
    <RelacionesAdolescentesCard
      adolescentes={solicitud.adolescentes}
      relaciones_adolescentes={solicitud.relaciones_adolescentes}
    />
    {(solicitud.adolescentes ?? []).map((adolescente) => (
      <AdolescenteDetalle
        key={adolescente.id}
        adolescente={adolescente}
        familiares={familiaresDelAdolescente(adolescente, solicitud.familiares ?? [])}
        validada={solicitud.validado}
      />
    ))}
    <DatosSinAsignarSolicitud solicitud={solicitud} />
  </Stack>
)
