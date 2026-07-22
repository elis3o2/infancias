import { useState } from 'react'
import {Box, Divider} from '@mui/material'
import type { Setter } from '@/common/types'
import type { Geolocalizacion } from '@/features/domicilio/types'
import { NuevaDireccion } from './NuevaDireccion'
import { SelectDireccion } from './SelectDireccion'
import { DireccionButtons } from './DireccionButtons'
import { DireccionConfirmarButtons } from './DireccionConfirmarButtons'

type Props = {
    direccionRenaper: string
    setFinishDireccion: Setter<boolean>
    setGeoSeleccionada: Setter<Geolocalizacion>
}

export const DireccionComponent = ({direccionRenaper, setFinishDireccion, setGeoSeleccionada}: Props) => {
      
  const [mostrarNuevaDireccion, setMostrarNuevaDireccion] = useState(false);
  const [finishNuevaDireccion, setFinishNuevaDireccion] = useState(false);
  const [validarDireccion, setValidarDireccion] = useState(false);
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

          {(validarDireccion || finishNuevaDireccion) && (
            <SelectDireccion
              direccion={validarDireccion? direccionRenaper : nuevaDireccion}
              setCanConfirm={setCanConfirm}
              setGeoSeleccionada={setGeoSeleccionada}
            />
          )}

          <Divider sx={{ borderColor: "#e2e8f0", my: 3 }} />

          {/* Action buttons */}
          {(!validarDireccion && !mostrarNuevaDireccion) &&  
          <DireccionButtons
            setValidarDireccion={setValidarDireccion}
            mostrarNuevaDireccion={mostrarNuevaDireccion}
            setMostrarNuevaDireccion={setMostrarNuevaDireccion}
          />}

          {(validarDireccion || finishNuevaDireccion) && (
          <DireccionConfirmarButtons
            canConfirm={canConfirm}
            setFinishDireccion={setFinishDireccion}
            setValidarDireccion={setValidarDireccion}
            setMostrarNuevaDireccion={setMostrarNuevaDireccion}
            setFinishNuevaDireccion={setFinishNuevaDireccion}
          />)}
    </Box>
    )
}