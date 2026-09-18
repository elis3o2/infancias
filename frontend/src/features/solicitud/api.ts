import type { AxiosResponse } from "axios"
import http from "@/common/api/client"
import type {
  ArchivoSimple,
  MotivoSolicitud,
  SolicitudCreate,
  SolicitudDetalle,
  SolicitudSimple,
  SolicitudValidacionInput,
} from "./types"
import type { Equipo } from "../persona/types"

const SOLICITUDES_URL = "solicitud/solicitud/"

export const getMotivos = (): Promise<MotivoSolicitud[]> =>
  http.get<MotivoSolicitud[]>("solicitud/motivo/").then(({ data }) => data)

export const getSolicitudes = (): Promise<SolicitudSimple[]> =>
  http.get<SolicitudSimple[]>(SOLICITUDES_URL).then(({ data }) => data)

export const getSolicitudById = (id: number): Promise<SolicitudDetalle> =>
  http.get<SolicitudDetalle>(`${SOLICITUDES_URL}${id}/`).then(({ data }) => data)

/** Serializes the request and its attachments using the names expected by the API. */
export const postSolicitud = (solicitud: SolicitudCreate): Promise<SolicitudDetalle> => {
  const formData = new FormData()

  if (solicitud.id_institucion != null) {
    formData.append("id_institucion", String(solicitud.id_institucion))
  } else {
    formData.append("institucion", JSON.stringify(solicitud.institucion))
  }

  formData.append("adolescentes", JSON.stringify(solicitud.adolescentes))
  formData.append("familiares", JSON.stringify(solicitud.familiares))
  formData.append(
    "referencias_instituciones_data",
    JSON.stringify(solicitud.referencias_instituciones_data),
  )
  formData.append("correo", solicitud.correo.trim())
  formData.append("telefono", solicitud.telefono.trim())
  formData.append("id_motivo", String(solicitud.id_motivo))
  formData.append("descripcion", solicitud.descripcion.trim())

  solicitud.archivos.forEach((archivo) => {
    formData.append("archivos", archivo, archivo.name)
  })

  // Do not manually set multipart/form-data: Axios adds the required boundary.
  return http.post<SolicitudDetalle>(SOLICITUDES_URL, formData).then(({ data }) => data)
}

export const getArchivoById = (id: number): Promise<AxiosResponse<Blob>> =>
  http.get<Blob>(`solicitud/archivo/${id}/descargar/`, { responseType: "blob" })

export const validarSolicitud = (
  solicitudId: number,
  payload: SolicitudValidacionInput,
): Promise<void> =>
  http.put<void>(`${SOLICITUDES_URL}${solicitudId}/validar/`, payload).then(() => undefined)

export const rechazarSolicitud = (id: number, motivo: string): Promise<SolicitudDetalle> =>
  http
    .put<SolicitudDetalle>(`${SOLICITUDES_URL}${id}/rechazar/`, undefined, {
      params: { motivo: motivo.trim() },
    })
    .then(({ data }) => data)

export const getSolicitudSimple = getSolicitudes

export const derivarSolicitud = (idSolicitud: number, idDerivacion: number): Promise<void> =>
  http
    .put<void>(`${SOLICITUDES_URL}${idSolicitud}/derivar/`, { equipo_id: idDerivacion })
    .then(() => undefined)

export const getEquipos = (): Promise<Equipo[]> =>
  http.get<Equipo[]>("equipos/").then(({ data }) => data)

export type { ArchivoSimple }
