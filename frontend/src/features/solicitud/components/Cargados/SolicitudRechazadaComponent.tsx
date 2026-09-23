import { Stack } from "@mui/material"
import type { SolicitudRechazada } from "../../types"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { ContactoCard } from "../Contacto/ContactoCard"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"
import { SolicitudPersonasDetalle } from "./SolicitudPersonasDetalle"

type Props = {
  solicitud: SolicitudRechazada
}

export const SolicitudRechazadaComponent = ({ solicitud }: Props) => (
  <Stack spacing={{ xs: 2, sm: 3 }}>
    <ContactoCard telefono={solicitud.telefono} correo={solicitud.correo} />
    <SolicitudPersonasDetalle solicitud={solicitud} />

    <DescripcionCard nombre="Descripción" texto={solicitud.descripcion} />
    <DescripcionCard nombre="Motivo del rechazo" texto={solicitud.motivo_rechazo} />
    <ArchivoVistaCard archivos={solicitud.archivos ?? []} />
  </Stack>
)
