import http from '@/common/api/client'
import type { Derivacion, MotivoSolicitud, PrioridadSolicitud, Solicitud, SolicitudCreate, SolicitudSimple } from './types'


export const getMotivos = (): Promise<MotivoSolicitud[]> => {
  return http.get<MotivoSolicitud[]>('solicitud/motivo/').then(res => res.data)
}

export const getPrioridades = (): Promise<PrioridadSolicitud[]> => {
  return http.get<PrioridadSolicitud[]>('solicitud/prioridad/').then(res => res.data)
}


export const getSolicitudes = (): Promise<Solicitud[]> => {
  return http.get<Solicitud[]>('solicitud/solicitud/').then(res => res.data)
}


export const getSolicitudById = (id: number): Promise<Solicitud> => {
  return http.get<Solicitud>(`solicitud/solicitud/${id}/`).then(res => res.data)
}

export const postSolicitud = (solicitud: SolicitudCreate) => {
  const formData = new FormData();

  if (solicitud.id_institucion != null) {
    formData.append("id_institucion",solicitud.id_institucion.toString());
  } else if (solicitud.institucion) {
    formData.append("institucion", JSON.stringify(solicitud.institucion));
  }
  
  formData.append("adolescente",JSON.stringify(solicitud.adolescente));
  formData.append("correo", solicitud.correo)
  formData.append("telefono", solicitud.telefono)

  formData.append("id_motivo", solicitud.id_motivo.toString());

  formData.append("id_prioridad", solicitud.id_prioridad.toString());

  formData.append("descripcion", solicitud.descripcion);
  
  solicitud.archivos.forEach((archivo) => {
    formData.append("archivos", archivo);
  });

  return http.post("solicitud/solicitud/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
});};


export const getArchivoById = (id: number) => {
  return http.get(`solicitud/archivo/${id}/descargar/`, {
    responseType: "blob",
  });
};


export const getDerivaciones = (): Promise<Derivacion[]> => {
  return http.get<Derivacion[]>(`solicitud/derivacion/`).then(res => res.data)
}



type ValidarSolicitudParams = {
  solicitudId: number
  descripcionExtra: string | null
  idPrioridad: number
  idDerivacion: number
  adolescenteData: unknown
  archivoSeleccionado: Set<number>
  archivosNuevos: { file: File }[]
}

export const validarSolicitud = ({
  solicitudId,
  descripcionExtra,
  idPrioridad,
  idDerivacion,
  adolescenteData,
  archivoSeleccionado,
  archivosNuevos,
}: ValidarSolicitudParams) => {
  const formData = new FormData()
  formData.append("descripcion_extra", descripcionExtra ?? "")
  formData.append("id_prioridad", String(idPrioridad))
  formData.append("id_derivacion", String(idDerivacion))
  formData.append("adolescente", JSON.stringify(adolescenteData))

  // archivos existentes que quedaron seleccionados -> se validan (valido=true)
  archivoSeleccionado.forEach((id) => {
    formData.append("id_archivos", String(id))
  })

  // archivos nuevos subidos por el usuario
  archivosNuevos.forEach(({ file }) => {
    formData.append("archivos", file)
  })

  return http.put(`solicitud/solicitud/${solicitudId}/validar/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export const rechazarSolicitud = (id: number, motivo: string) => {
  return http.put(`solicitud/solicitud/${id}/rechazar/?motivo=${motivo}`).then(res => res.data)
}


export const getSolicitudSimple = (): Promise<SolicitudSimple[]> => {
  return http.get<SolicitudSimple[]>(`solicitud/solicitud/`).then(res => res.data)
}


