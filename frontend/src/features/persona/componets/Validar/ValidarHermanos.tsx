import type { Hermano, PersonaCreate } from "../../types"
import { useState } from "react"
import { Card, CardContent, Stack, Typography } from "@mui/material"
import type { Setter } from "@/common/types"
import { ValidarHermanosDatos } from "./ValidarHermanosDatos"
import { NuevasPersonas } from "../Persona/NuevasPersonas"
import { LegajoForm } from "./LegajoForm"

type Props = {
  hermanos: Hermano[]
  estados: ("confirmado" | "rechazado" | null)[]
  setEstados: Setter<("confirmado" | "rechazado" | null)[]>
  personas: (PersonaCreate | null)[]
  setPersonas: Setter<(PersonaCreate | null)[]>
  nuevosHermanos: PersonaCreate[]
  setNuevosHermanos: Setter<PersonaCreate[]>
}

export const ValidarHermanos = ({hermanos, estados, setEstados,
                  personas, setPersonas, nuevosHermanos, setNuevosHermanos }: Props) => {

  const [tieneLegajo, setTieneLegajo] = useState<boolean[]>(hermanos.map(() => false))

  const actualizarLegajo = (index: number, cambios: Partial<NonNullable<PersonaCreate["legajo"]>>) => {
    const persona = personas[index]

    if (!persona) return

    setPersonas((prev) => {
      const next = [...prev]

      next[index] = {
        ...persona,
        legajo: {
          id_insert: persona.legajo?.id_insert ?? null,
          letra: persona.legajo?.letra ?? "A",
          carpeta_id: persona.legajo?.carpeta_id ?? null,
          carpeta_letra: persona.legajo?.carpeta_letra ?? "A",
          ...cambios,
        },
      }

      return next
    })
  }

  const cambiarTieneLegajo = (index: number, valor: boolean) => {
    setTieneLegajo((prev) => {
      const next = [...prev]
      next[index] = valor
      return next
    })

    actualizarLegajo(index, {
      id_insert: valor
        ? personas[index]?.legajo?.id_insert ?? null
        : null,
    })
  }

  const cambiarLetraLegajo = ( index: number, valor: "A" | "B" ) => {
    actualizarLegajo(index, {
      letra: valor,
    })
  }

  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>

        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ lineHeight: 1.2 }}
          >
            Hermanos
          </Typography>
        </Stack>

        <Stack spacing={3}>

          {hermanos.map((hermano, index) => {

            const persona = personas[index]

            return (
              <Stack
                spacing={2}
                key={hermano.dni ?? index}
              >

                <ValidarHermanosDatos
                  hermano={hermano}
                  estado={estados[index]}
                  setEstado={(estado) => {
                    setEstados((prev) => {
                      const next = [...prev]
                      next[index] = estado
                      return next
                    })
                  }}
                  setPersona={(nuevaPersona) => {
                    setPersonas((prev) => {
                      const next = [...prev]
                      next[index] = nuevaPersona
                      return next
                    })
                  }}
                />

                {persona && (
                  <LegajoForm
                    legajo={persona.legajo?.id_insert ?? null}
                    letra={persona.legajo?.letra ?? "A"}
                    setLetra={(valor) =>
                      cambiarLetraLegajo(index, valor)
                    }
                    setLegajo={(valor) =>
                      actualizarLegajo(index, {
                        id_insert: valor,
                      })
                    }
                    tieneLegajo={tieneLegajo[index]}
                    setTieneLegajo={(valor) =>
                      cambiarTieneLegajo(index, valor)
                    }
                  />
                )}

              </Stack>
            )
          })}

          <NuevasPersonas
            nuevasPersonas={nuevosHermanos}
            setNuevasPersonas={setNuevosHermanos}
            datos_extra={false}
          />

        </Stack>

      </CardContent>
    </Card>
  )
}