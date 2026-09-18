import { Stack } from "@mui/material"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { InstitucionesCard } from "@/features/domicilio/components/Institucion/InstitucionesCard"
import { AdolescenteCard } from "@/features/persona/componets/Adolescente/AdolescenteCard"
import { FamiliaresCard } from "@/features/persona/componets/Familiar/FamiliaresCard"
import type { SolicitudRechazada } from "../../types"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { ContactoCard } from "../Contacto/ContactoCard"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"

type Props = {
  solicitud: SolicitudRechazada
}

export const SolicitudRechazadaComponent = ({ solicitud }: Props) => (
  <Stack spacing={{ xs: 2, sm: 3 }}>
    <ContactoCard telefono={solicitud.telefono} correo={solicitud.correo} />
    <InstitucionCard institucion={solicitud.institucion} />

    {solicitud.adolescentes.map((adolescente) => (
      <AdolescenteCard key={adolescente.id} adolescente={adolescente} />
    ))}

    {solicitud.familiares.length > 0 && <FamiliaresCard familiares={solicitud.familiares} />}

    <DescripcionCard nombre="Descripción" texto={solicitud.descripcion} />
    <DescripcionCard nombre="Motivo del rechazo" texto={solicitud.motivo_rechazo} />
    <ArchivoVistaCard archivos={solicitud.archivos} />

    {solicitud.referencias_instituciones.length > 0 && (
      <InstitucionesCard instituciones={solicitud.referencias_instituciones} />
    )}
  </Stack>
)
