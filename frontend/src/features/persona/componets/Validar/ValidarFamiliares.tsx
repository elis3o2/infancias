import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, Divider, Stack } from "@mui/material"
import type { Setter } from "@/common/types"
import { DomicilioOpcionalForm } from "@/features/domicilio/components/DomicilioOpcionalForm"
import type { Departamento, DomicilioFormData, Provincia } from "@/features/domicilio/types"
import type { Familiar, PersonaCreate } from "../../types"
import type { FamiliarResp } from "@/features/api_externa/types"
import { NuevasPersonas } from "../Persona/NuevasPersonas"
import { TelefonoOpcionalForm } from "../TelefonoOpcionalForm"
import { ValidarFamiliarDatos } from "./ValidarFamiliarDatos"

type Estado = "confirmado" | "rechazado" | null

type Props = {
  familiares: Familiar[]
  estados: Estado[]
  setEstados: Setter<Estado[]>
  personas: (PersonaCreate | null)[]
  setPersonas: Setter<(PersonaCreate | null)[]>
  nuevosFamiliares: PersonaCreate[]
  setNuevosFamiliares: Setter<PersonaCreate[]>
  resultados: FamiliarResp[]
  busquedaRealizada: boolean
}

const domicilioAFormulario = (familiar: Familiar): DomicilioFormData | null => {
  const domicilio = familiar.domicilio
  if (!domicilio) return null

  return {
    nombre: domicilio.nombre,
    observaciones: domicilio.observaciones,
    id_departamento: domicilio.departamento?.id ?? null,
    domicilio_validado: null,
  }
}

const esDomicilio = (domicilio: DomicilioFormData | null): domicilio is DomicilioFormData =>
  domicilio !== null

export const ValidarFamiliares = ({
  familiares,
  estados,
  setEstados,
  personas,
  setPersonas,
  nuevosFamiliares,
  setNuevosFamiliares,
  resultados,
  busquedaRealizada,
}: Props) => {
  const [telefonos, setTelefonos] = useState<string[]>(() =>
    familiares.map((familiar) => familiar.telefono ?? ""),
  )
  const [provincias, setProvincias] = useState<(Provincia | null)[]>(() =>
    familiares.map((familiar) => familiar.domicilio?.departamento?.provincia ?? null),
  )
  const [departamentos, setDepartamentos] = useState<(Departamento | null)[]>(() =>
    familiares.map((familiar) => familiar.domicilio?.departamento ?? null),
  )
  const [domicilios, setDomicilios] = useState<(DomicilioFormData | null)[]>(() =>
    familiares.map(domicilioAFormulario),
  )
  const [camposVisibles, setCamposVisibles] = useState<
    { telefono: boolean; domicilio: boolean }[]
  >(() =>
    familiares.map((familiar) => ({
      telefono: Boolean(familiar.telefono),
      domicilio: Boolean(familiar.domicilio),
    })),
  )

  const domiciliosDisponibles = useMemo(() => domicilios.filter(esDomicilio), [domicilios])

  const cambiarCampo = (index: number, campo: "telefono" | "domicilio", valor: boolean) => {
    setCamposVisibles((prev) => {
      const next = [...prev]
      next[index] = { ...(next[index] ?? { telefono: false, domicilio: false }), [campo]: valor }
      return next
    })
  }

  const actualizarPersona = (index: number, cambios: Partial<PersonaCreate>) => {
    setPersonas((prev) => {
      const persona = prev[index]
      if (!persona) return prev

      const next = [...prev]
      next[index] = { ...persona, ...cambios }
      return next
    })
  }

  const actualizarEstado = (index: number, estado: Estado) => {
    setEstados((prev) => {
      const next = [...prev]
      next[index] = estado
      return next
    })
  }

  const actualizarPersonaAt = (index: number, persona: PersonaCreate | null) => {
    setPersonas((prev) => {
      const next = [...prev]
      next[index] = persona
      return next
    })
  }

  if (familiares.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardHeader
          title="Familiares y referentes"
          subheader="No se cargaron familiares o referentes en esta solicitud."
          titleTypographyProps={{ variant: "h6", fontWeight: 700 }}
        />
        <CardContent>
          <NuevasPersonas
            nuevasPersonas={nuevosFamiliares}
            setNuevasPersonas={setNuevosFamiliares}
            datos_extra
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: "divider",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
      }}
    >
      <CardHeader
        title="Familiares y referentes"
        subheader="Los resultados se obtienen junto con la búsqueda principal de identidad."
        titleTypographyProps={{ variant: "h6", fontWeight: 700 }}
        sx={{ px: { xs: 2, sm: 3 }, pb: 1 }}
      />
      <CardContent sx={{ px: { xs: 2, sm: 3 }, pt: 1.5 }}>
        <Stack spacing={3}>
          {familiares.map((familiar, index) => {
            const persona = personas[index]
            const confirmado = estados[index] === "confirmado"
            const campos = camposVisibles[index] ?? { telefono: false, domicilio: false }
            const resultado = resultados.find((item) => item.id === familiar.id) ?? null

            return (
              <Stack
                key={familiar.id}
                spacing={2}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  bgcolor: "action.hover",
                }}
              >
                <ValidarFamiliarDatos
                  familiar={familiar}
                  estado={estados[index] ?? null}
                  setEstado={(estado) => actualizarEstado(index, estado)}
                  setPersona={(nuevaPersona) => actualizarPersonaAt(index, nuevaPersona)}
                  resultado={resultado}
                  busquedaRealizada={busquedaRealizada}
                />

                {confirmado && persona && (
                  <Stack spacing={1.5}>
                    <TelefonoOpcionalForm
                      condicion={campos.telefono}
                      telefono={telefonos[index] ?? ""}
                      setTelefono={(valor) => {
                        setTelefonos((prev) => {
                          const next = [...prev]
                          next[index] = valor
                          return next
                        })
                        actualizarPersona(index, { telefono: valor || null })
                      }}
                      mostrar={(valor) => cambiarCampo(index, "telefono", valor)}
                    />

                    <DomicilioOpcionalForm
                      condicion={campos.domicilio}
                      domicilio={domicilios[index] ?? null}
                      domicilios={domiciliosDisponibles}
                      setDomicilio={(valor) => {
                        setDomicilios((prev) => {
                          const next = [...prev]
                          next[index] = valor
                          return next
                        })
                        actualizarPersona(index, { domicilio: valor })
                      }}
                      provincia={provincias[index] ?? null}
                      setProvincia={(valor) => {
                        setProvincias((prev) => {
                          const next = [...prev]
                          next[index] = valor
                          return next
                        })
                      }}
                      departamento={departamentos[index] ?? null}
                      setDepartamento={(valor) => {
                        setDepartamentos((prev) => {
                          const next = [...prev]
                          next[index] = valor
                          return next
                        })
                      }}
                      mostrar={(valor) => cambiarCampo(index, "domicilio", valor)}
                    />
                  </Stack>
                )}
              </Stack>
            )
          })}
        </Stack>

        <Divider variant="middle" sx={{ my: 3 }} />

        <NuevasPersonas
          nuevasPersonas={nuevosFamiliares}
          setNuevasPersonas={setNuevosFamiliares}
          datos_extra
        />
      </CardContent>
    </Card>
  )
}
