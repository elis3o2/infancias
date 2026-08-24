import type { Setter } from "@/common/types"
import type { APIGeo1, DomicilioFormData } from "../types"
import { DomicilioView } from "./DomicilioView"
import { DomicilioForm } from "./DomicilioForm"
import { useEffect, useState } from "react"

type Props = {
  domicilio: DomicilioFormData | null
  setDomicilio: (domicilio: DomicilioFormData | null) => void
  finishDomicilio: boolean
  setFinishDomicilio: Setter<boolean>
}

export const DomicilioComponent = ({ domicilio, setDomicilio, finishDomicilio, setFinishDomicilio }: Props) => {
  const [apiRespuesta, setApiRespuesta] = useState<APIGeo1 | null>(null)
  const [observaciones, setObservaciones] = useState("")
  useEffect(() => {
    if (apiRespuesta == null) {
      return
    }


    setDomicilio({
      nombre: apiRespuesta.name,
      domicilio_validado: apiRespuesta,
      id_departamento: 520,
      observaciones: observaciones
    })
  }, [finishDomicilio])

  return (
    <>
      {finishDomicilio && domicilio != null ? (
        <DomicilioView
          domicilio={domicilio.nombre}
          observaciones={domicilio.observaciones}
          setFinishDomicilio={setFinishDomicilio}
        />
      ) : (
        <DomicilioForm
          observaciones= {observaciones}
          setObservaciones={setObservaciones}
          setGeoSeleccionada={setApiRespuesta}
          finishDomicilio={finishDomicilio}
          setFinishDomicilio={setFinishDomicilio}
        />
      )}
    </>
  )
}