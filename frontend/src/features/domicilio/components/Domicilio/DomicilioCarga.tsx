import type { DomicilioFormData } from "../../types"
import { DomicilioView } from "./DomicilioView"
import { DomicilioForm } from "./DomicilioForm"
import { useState } from "react"

type Props = {
    domicilio: DomicilioFormData | null
    onGuardar: (domicilio: DomicilioFormData) => void
}

export const DomicilioCarga = ({ domicilio, onGuardar }: Props) => {
    const [editando, setEditando] = useState(domicilio == null)

    const handleGuardar = (data: DomicilioFormData) => {
        onGuardar(data)
        setEditando(false)
    }

    return editando ? (
        <DomicilioForm onGuardar={handleGuardar} />
    ) : (
        <DomicilioView
            domicilio={domicilio!.nombre}
            observaciones={domicilio!.observaciones}
            onEditar={() => setEditando(true)}
        />
    )
}