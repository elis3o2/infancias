import type { Setter } from "@/common/types"
import type { PrioridadSolicitud, MotivoSolicitud } from "../../types"
import { useState } from "react"
import { SolicitudForm } from "./SolicitudForm"
import { SolicitudView } from "./SolicitudView"

type Props = {
    prioridadSeleccionada: PrioridadSolicitud
    setPrioridadSeleccionada: Setter<PrioridadSolicitud | null>
    motivoSeleccionado: MotivoSolicitud
    setMotivoSeleccionado: Setter<MotivoSolicitud | null>
    descripcion: string
    setDescripcion: Setter<string>
}

export const SolicitudComponent = ({ prioridadSeleccionada, setPrioridadSeleccionada, motivoSeleccionado,
                                            setMotivoSeleccionado, descripcion, setDescripcion }: Props) => {
  const [finishSolicitudSection, setFinishSolicitudSection] = useState(false)

  return (
    <>
      {finishSolicitudSection && motivoSeleccionado != null && prioridadSeleccionada != null ? (
        <SolicitudView
          motivo={motivoSeleccionado}
          prioridad={prioridadSeleccionada}
          descripcion={descripcion}
          setFinishSolicitudSection={setFinishSolicitudSection}
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