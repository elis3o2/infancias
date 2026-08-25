import type { AdolescenteCrud, PersonaCreate } from "../../types"
import { Card, CardContent, Stack } from "@mui/material"

import { Mapa } from "@/features/domicilio/components/Mapa"
import type { Setter } from "@/common/types"
import { ValidarAdolescenteDatos } from "./ValidarAdolescenteDatos"
import { useState } from "react"
import { CarpetaForm } from "./CarpetaForm"
import { LegajoForm } from "./LegajoForm"

type Props = {
  adolescente: AdolescenteCrud
  estado: "confirmado" | "rechazado" | null
  setEstado: Setter<"confirmado" | "rechazado" | null>
  persona: PersonaCreate | null
  setPersona: Setter<PersonaCreate | null>
}

export const ValidarAdolescente = ({ adolescente, estado, setEstado, persona, setPersona }: Props) => {

  const [tieneLegajo, setTieneLegajo] = useState(false)
  const [tieneCarpeta, setTieneCarpeta] = useState(false)

  const actualizarLegajo = ( cambios: Partial<NonNullable<PersonaCreate["legajo"]>>) => {
    if (!persona) return

    setPersona({
      ...persona,
      legajo: {
        id_insert: persona.legajo?.id_insert ?? null,
        letra: persona.legajo?.letra ?? null,
        carpeta_id: persona.legajo?.carpeta_id ?? null,
        ...cambios,
      },
    })
  }

  const cambiarTieneCarpeta = (valor: boolean) => {
    setTieneCarpeta(valor)

    actualizarLegajo({
      carpeta_id: valor
        ? persona?.legajo?.carpeta_id ?? null
        : null,
    })
  }

  const cambiarTieneLegajo = (valor: boolean) => {
    setTieneLegajo(valor)

    actualizarLegajo({
      id_insert: valor
        ? persona?.legajo?.id_insert ?? null
        : null,
    })
  }

  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>

        <Stack spacing={2}>

          <ValidarAdolescenteDatos
            adolescente={adolescente}
            estado={estado}
            setEstado={setEstado}
            setPersona={setPersona}
          />

          {adolescente.domicilio?.domicilio_validado && (
            <Mapa
              latitud={adolescente.domicilio.domicilio_validado.latitud}
              longitud={adolescente.domicilio.domicilio_validado.longitud}
              nombre={adolescente.domicilio.nombre}
            />
          )}

          {persona && (
            <>
              <CarpetaForm
                carpeta={persona.legajo?.carpeta_id ?? null}
                setCarpeta={(valor) => actualizarLegajo({ carpeta_id: valor })}
                tieneCarpeta={tieneCarpeta}
                setTieneCarpeta={cambiarTieneCarpeta}
              />

              <LegajoForm
                legajo={persona.legajo?.id_insert ?? null}
                setLegajo={(valor) => actualizarLegajo({ id_insert: valor })}
                tieneLegajo={tieneLegajo}
                setTieneLegajo={cambiarTieneLegajo}
              />
            </>
          )}

        </Stack>

      </CardContent>
    </Card>
  )
}