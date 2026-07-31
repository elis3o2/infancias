import type { Setter } from "@/common/types"
import type { Institucion } from "@/features/domicilio/types"
import { EducacionView } from "./EducacionView"
import { EducacionForm } from "./EducacionForm"

type Props = {
  educacion: Institucion | null
  setEducacion: Setter<Institucion | null>
  finishEducacion: boolean
  setFinishEducacion: Setter<boolean>
}

export const EducacionComponent = ({educacion, setEducacion, finishEducacion, setFinishEducacion}: Props) => {
  return (
    <>
      {finishEducacion && educacion != null ? (
        <EducacionView
          educacion={educacion}
          onEliminar={() => setFinishEducacion(false)}
        />
      ) : (
        <EducacionForm
        escuelaSeleccionada={educacion}
          setEscuelaSeleccionada={setEducacion}
          setFinishEducacion={setFinishEducacion}
        />
      )}
    </>
  )
}