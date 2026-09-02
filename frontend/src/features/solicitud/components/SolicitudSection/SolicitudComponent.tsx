import type { Setter } from "@/common/types"
import type { MotivoSolicitud } from "../../types"
import { SolicitudForm } from "./SolicitudForm"
import { SolicitudCard } from "./SolicitudCard"
import { ConditionalCard } from "@/common/components/ConditionalCard"

type Props = {
    motivoSeleccionado: MotivoSolicitud | null
    setMotivoSeleccionado: Setter<MotivoSolicitud | null>
    descripcion: string
    setDescripcion: Setter<string>
    finishSolicitudSection: boolean
    setFinishSolicitudSection: Setter<boolean>
}

export const SolicitudComponent = ({  motivoSeleccionado, setMotivoSeleccionado, descripcion, setDescripcion,
                                            finishSolicitudSection, setFinishSolicitudSection }: Props) => {

  return (
    <ConditionalCard
      condicion={finishSolicitudSection && motivoSeleccionado != null}
      titulo="Descripción"
      componenteTrue={
        <SolicitudCard
          motivo={motivoSeleccionado}
          descripcion={descripcion}
          onEditar={() => setFinishSolicitudSection(false)}
        />
      }
      componenteFalse={
        <SolicitudForm
          motivoSeleccionado={motivoSeleccionado}
          setMotivoSeleccionado={setMotivoSeleccionado}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          setFinishSolicitudSection={setFinishSolicitudSection}
        />
      }
    />
  )
}