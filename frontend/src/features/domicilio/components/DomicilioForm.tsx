import { useState } from 'react'
import {Box, Divider} from '@mui/material'
import type { Setter } from '@/common/types'
import type { Geolocalizacion } from '@/features/domicilio/types'
import { DireccionForm } from './DireccionForm'
import { SelectDireccion } from './SelectDireccion'
import { DireccionConfirmarButtons } from './DireccionConfirmarButtons'

type Props = {
    finishDomicilio: boolean
    setFinishDomicilio: Setter<boolean>
    setGeoSeleccionada: Setter<Geolocalizacion>
}

export const DomicilioForm = ({finishDomicilio, setFinishDomicilio, setGeoSeleccionada}: Props) => {
      
    const [finishDireccion, setFinishDireccion] = useState(false);
    const [canConfirm, setCanConfirm] = useState(false);
    const [direccion, setDireccion] = useState("");

    
      
    return (
    <Box>
        {!finishDireccion && ( 
            <DireccionForm
                direccion={direccion}
                setDireccion={setDireccion}
                setFinishDireccion={setFinishDireccion}
            />)
        }
        {finishDireccion && !finishDomicilio && ( 
            <>
            <DireccionForm
                direccion={direccion}
                setDireccion={setDireccion}
                setFinishDireccion={setFinishDireccion}
            />
            <SelectDireccion
                direccion={direccion}
                setCanConfirm={setCanConfirm}
                setGeoSeleccionada={setGeoSeleccionada}
            />
            </>)}

            <Divider sx={{ borderColor: "#e2e8f0", my: 3 }} />

            {(finishDireccion && canConfirm && !finishDomicilio ) && (
            <DireccionConfirmarButtons
                canConfirm={canConfirm}
                setFinishDomicilio={setFinishDomicilio}
                setFinishDireccion={setFinishDireccion}
            />)}
    </Box>
    )
}
