import { useMemo } from "react"
import { Stack, Typography } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"

type PersonaHistoria = { nombre?: string; apellido?: string; dni?: string; sexo?: string }

function extraerPersonas(respuestas: unknown[]): PersonaHistoria[] {
  const personas: PersonaHistoria[] = []
  const vistos = new Set<string>()
  const texto = (valor: unknown) => typeof valor === "string" || typeof valor === "number" ? String(valor) : undefined
  const recorrer = (valor: unknown) => {
    if (Array.isArray(valor)) return valor.forEach(recorrer)
    if (!valor || typeof valor !== "object") return
    const registro = valor as Record<string, unknown>
    const persona = { nombre: texto(registro.nombre), apellido: texto(registro.apellido),
      dni: texto(registro.dni ?? registro.documento ?? registro.nroDocumento), sexo: texto(registro.sexo) }
    if (persona.nombre || persona.apellido) {
      const clave = `${persona.dni ?? ""}-${persona.sexo ?? ""}-${persona.nombre ?? ""}-${persona.apellido ?? ""}`
      if (!vistos.has(clave)) { vistos.add(clave); personas.push(persona) }
    }
    Object.values(registro).forEach(recorrer)
  }
  recorrer(respuestas)
  return personas
}

export function HistoriaClinicaCard({ respuestas }: { respuestas: unknown[] }) {
  const personas = useMemo(() => extraerPersonas(respuestas), [respuestas])
  return <TitledCard titulo="Personas de la historia clínica familiar" componente={
    personas.length === 0 ? <Typography color="text.secondary">No se encontraron personas asociadas a una historia clínica familiar.</Typography> : (
      <Stack spacing={1}>
        {personas.map((persona, index) => <Typography key={index}>
          <strong>{persona.nombre} {persona.apellido}</strong>
          {persona.dni && ` — DNI ${persona.dni}`}{persona.sexo && ` — Sexo ${persona.sexo}`}
        </Typography>)}
      </Stack>
    )
  } />
}
