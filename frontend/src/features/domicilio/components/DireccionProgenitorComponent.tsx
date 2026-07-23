import { useState } from 'react'
import {Box, Divider} from '@mui/material'
import type { Setter } from '@/common/types'
import type { Geolocalizacion } from '@/features/domicilio/types'
import { NuevaDireccion } from './DireccionForm'
import { SelectDireccion } from './SelectDireccion'
import { DireccionButtons } from './DireccionButtons'
import { DireccionConfirmarButtons } from './DireccionConfirmarButtons'

type Props = {
    setFinishDireccion: Setter<boolean>
    setGeoSeleccionada: Setter<Geolocalizacion>
}

export const DireccionProgenitorComponent = ({setFinishDireccion, setGeoSeleccionada}: Props) => {
      
  const [mostrarNuevaDireccion, setMostrarNuevaDireccion] = useState(true);
  const [finishNuevaDireccion, setFinishNuevaDireccion] = useState(false);
  const [canConfirm, setCanConfirm] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState("");

      
  return (
    <Box>
        {mostrarNuevaDireccion && !finishNuevaDireccion && (
            <NuevaDireccion
              setNuevaDireccion={setNuevaDireccion}
              setFinishNuevaDireccion={setFinishNuevaDireccion}
              setMostrarNuevaDireccion={setMostrarNuevaDireccion}
            />
          )}

          { finishNuevaDireccion && (
            <SelectDireccion
              direccion={nuevaDireccion}
              setCanConfirm={setCanConfirm}
              setGeoSeleccionada={setGeoSeleccionada}
            />
          )}

          <Divider sx={{ borderColor: "#e2e8f0", my: 3 }} />

          {finishNuevaDireccion && (
          <DireccionConfirmarButtons
            canConfirm={canConfirm}
            setFinishDireccion={setFinishDireccion}
            setValidarDireccion={() => null}
            setMostrarNuevaDireccion={setMostrarNuevaDireccion}
            setFinishNuevaDireccion={setFinishNuevaDireccion}
          />)}
    </Box>
    )
}