import { useState } from "react"
import { Stack } from "@mui/material"
import { DomicilioOpcionalForm } from "@/features/domicilio/components/DomicilioOpcionalForm"
import type { Departamento, Provincia } from "@/features/domicilio/types"
import { TelefonoOpcionalForm } from "@/features/persona/componets/TelefonoOpcionalForm"
import type { Familiar, PersonaCreate } from "@/features/persona/types"

type Props = { persona: PersonaCreate; familiar: Familiar | null; onChange: (persona: PersonaCreate) => void }

export function ContactoFamiliar({ persona, familiar, onChange }: Props) {
  const [telefonoVisible, setTelefonoVisible] = useState(Boolean(persona.telefono))
  const [domicilioVisible, setDomicilioVisible] = useState(Boolean(persona.domicilio))
  const [provincia, setProvincia] = useState<Provincia | null>(familiar?.domicilio?.departamento?.provincia ?? null)
  const [departamento, setDepartamento] = useState<Departamento | null>(familiar?.domicilio?.departamento ?? null)
  return (
    <Stack spacing={2}>
      <TelefonoOpcionalForm condicion={telefonoVisible} telefono={persona.telefono ?? ""}
        setTelefono={(telefono) => onChange({ ...persona, telefono: telefono || null })}
        mostrar={(visible) => {
          setTelefonoVisible(visible)
          if (!visible) onChange({ ...persona, telefono: null })
        }} />
      <DomicilioOpcionalForm condicion={domicilioVisible} domicilio={persona.domicilio}
        setDomicilio={(domicilio) => onChange({ ...persona, domicilio })}
        provincia={provincia} setProvincia={setProvincia} departamento={departamento}
        setDepartamento={setDepartamento} mostrar={setDomicilioVisible} />
    </Stack>
  )
}
