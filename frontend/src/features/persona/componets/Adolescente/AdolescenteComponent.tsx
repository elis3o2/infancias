import { useState } from "react"
import { Divider, Stack } from "@mui/material"
import type { Setter } from "@/common/types"
import type  { DomicilioFormData } from "@/features/domicilio/types"
import { AdolescenteInicial, type AdolescenteCreate } from "@/features/persona/types"
import { AdolescenteForm } from "@/features/persona/componets/Adolescente/AdolescenteForm"
import { RelacionAdolescenteForm } from "../../../../pages/CreatePage/RelacionAdolescenteForm"
import { crearIdTemporal, type AdolescenteFormulario } from "../../../../pages/CreatePage/formTypes"

type Props = {
  actual?: AdolescenteFormulario
  anteriores: AdolescenteFormulario[]
  domicilios: DomicilioFormData[]
  setDomicilios: Setter<DomicilioFormData[]>
  onGuardar: (adolescente: AdolescenteFormulario) => void
  onCancelar: () => void
}

export function AdolescenteComponent({ actual, anteriores, domicilios, setDomicilios, onGuardar, onCancelar }: Props) {
  const [datos, setDatos] = useState<AdolescenteCreate>(actual?.datos ?? AdolescenteInicial)
  const [relacion, setRelacion] = useState(actual?.relacion ?? null)
  const puedeCargar =  !anteriores.length || relacion !== null

  return (
    <AdolescenteForm
      adolescente={datos}
      setAdolescente={setDatos}
      domicilios={domicilios}
      setDomicilios={setDomicilios}
      onCancelar={onCancelar}
      puedeCargar={puedeCargar}
      textoGuardar={actual ? "Guardar cambios del adolescente" : "Agregar adolescente"}
      onCargar={() => onGuardar({
        id_temp: actual?.id_temp ?? crearIdTemporal(), datos, referencias: actual?.referencias ?? [],
        familiares: actual?.familiares ?? [], relacion,
    })}>
    <Divider />
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      {anteriores.length > 0 && <RelacionAdolescenteForm adolescentes={anteriores}
        relacion={relacion} onChange={setRelacion} />}
    </Stack>
  </AdolescenteForm>
  )
}
