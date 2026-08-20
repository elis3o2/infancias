import type { Setter } from "@/common/types"
import type { Domicilio, DomicilioValidado, Geolocalizacion } from "../types"
import { DomicilioView } from "./DomicilioView"
import { DomicilioForm } from "./DomicilioForm"
import { useEffect, useState } from "react"

type Props = {
  domicilio: Domicilio | null
  setDomicilio: Setter<Domicilio | null>
  finishDomicilio: boolean
  setFinishDomicilio: Setter<boolean>
}

export const DomicilioComponent = ({ domicilio, setDomicilio, finishDomicilio, setFinishDomicilio }: Props) => {
  const [geoSeleccionada, setGeoSeleccionada] = useState<Geolocalizacion | null>(null)

  useEffect(() => {
    if (geoSeleccionada == null) {
      return
    }

    const domicilioValidado: DomicilioValidado = {
      id: null,
      codigo_calle: geoSeleccionada.properties.codigoCalle,
      altura: geoSeleccionada.properties.altura,
      bis: geoSeleccionada.properties.bis,
      letra: geoSeleccionada.properties.letra,
      piso: null,
      depto: null,
      monoblock: null,
      barrio: null,
      vecinal: null,
      distrito: null,
      seccion_policial: null,
      localidad: "ROSARIO",
      coordenada_x: geoSeleccionada.geometry.coordinates[0],
      coordenada_y: geoSeleccionada.geometry.coordinates[1],
      fraccion_censal: null,
      radio_censal: null,
    }

    setDomicilio({
      id: null,
      nombre: geoSeleccionada.properties.name,
      domicilio_validado: domicilioValidado,
      id_departamento: 520
    })
  }, [geoSeleccionada])

  return (
    <>
      {finishDomicilio && domicilio != null ? (
        <DomicilioView
          domicilio={domicilio.nombre}
          setFinishDomicilio={setFinishDomicilio}
        />
      ) : (
        <DomicilioForm
          setGeoSeleccionada={setGeoSeleccionada}
          finishDomicilio={finishDomicilio}
          setFinishDomicilio={setFinishDomicilio}
        />
      )}
    </>
  )
}