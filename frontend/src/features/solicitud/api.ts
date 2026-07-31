import http from '@/common/api/client'
import type { MotivoSolicitud, PrioridadSolicitud, Solicitud, SolicitudCreate } from './types'


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
  formData.append("solicitante", JSON.stringify(solicitud.solicitante));
  
  formData.append("adolescente",JSON.stringify(solicitud.adolescente));

  formData.append("id_motivo", solicitud.id_motivo.toString());

  formData.append("id_prioridad", solicitud.id_prioridad.toString());

  formData.append("descripcion", solicitud.descripcion);
  
  solicitud.archivos.forEach((archivo) => {
    formData.append("archivos", archivo);
  });

  return http.post("solicitud/solicitud/", formData);
};