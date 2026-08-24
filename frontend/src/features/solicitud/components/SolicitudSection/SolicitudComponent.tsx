import type { Setter } from "@/common/types"
import type { PrioridadSolicitud, MotivoSolicitud } from "../../types"
import { SolicitudForm } from "./SolicitudForm"
import { SolicitudCard } from "./SolicitudCard"

type Props = {
    prioridadSeleccionada: PrioridadSolicitud | null 
    setPrioridadSeleccionada: Setter<PrioridadSolicitud | null>
    motivoSeleccionado: MotivoSolicitud | null
    setMotivoSeleccionado: Setter<MotivoSolicitud | null>
    descripcion: string
    setDescripcion: Setter<string>
    finishSolicitudSection: boolean
    setFinishSolicitudSection: Setter<boolean>
}

export const SolicitudComponent = ({ prioridadSeleccionada, setPrioridadSeleccionada, motivoSeleccionado,
          setMotivoSeleccionado, descripcion, setDescripcion, finishSolicitudSection, setFinishSolicitudSection }: Props) => {

  return (
    <>
      {finishSolicitudSection && motivoSeleccionado != null && prioridadSeleccionada != null ? (
        <SolicitudCard
          motivo={motivoSeleccionado}
          prioridad={prioridadSeleccionada}
          descripcion={descripcion}
          onEditar={() => setFinishSolicitudSection(false)}
        />
      ) : (
        <SolicitudForm
          prioridadSeleccionada={prioridadSeleccionada}
          setPrioridadSeleccionada={setPrioridadSeleccionada}
          motivoSeleccionado={motivoSeleccionado}
          setMotivoSeleccionado={setMotivoSeleccionado}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          setFinishSolicitudSection={setFinishSolicitudSection}
        />
      )}
    </>
  )
}