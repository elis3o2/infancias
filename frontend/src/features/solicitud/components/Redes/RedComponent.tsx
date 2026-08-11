import { useEffect, useState } from "react"
import { Card, CardContent, Stack, Typography } from "@mui/material"
import type { Referencia } from "@/features/domicilio/types"
import { OtrosComponent } from "./OtrosComponent"
import { ReferenciaComponent } from "./ReferenciaComponent"
import type { Setter } from "@/common/types"
import { getReferenciaGubernamental, getReferenciaNoGubernamental } from "@/features/domicilio/api"

type Props = {
  gubernamentales: (Referencia | number)[]
  setGubernamentales: Setter<(Referencia | number)[]>
  noGubernamentales: (Referencia | number)[]
  setNoGubernamentales: Setter<(Referencia | number)[]>
}

export const RedComponent = ({ gubernamentales,noGubernamentales, setGubernamentales, setNoGubernamentales }: Props) => {
  const [copyGubernamentales, setCopyGubernamentales] = useState<Referencia[]>(gubernamentales.filter((g): g is Referencia => typeof g !== "number"))
  const [copyNoGubernamentales, setCopyNoGubernamentales] = useState<Referencia[]>(noGubernamentales.filter((g): g is Referencia => typeof g !== "number"))
  const [otrosGubernamentales, setOtrosGubernamentales] = useState<Referencia[]>([])
  const [otrosNoGubernamentales, setOtrosNoGubernamentales] = useState<Referencia[]>([])

  console.log()
  useEffect(() => {
    setGubernamentales([
      ...copyGubernamentales.map((g) => g.id),
      ...otrosGubernamentales,
    ])
  }, [copyGubernamentales, otrosGubernamentales, setGubernamentales])

  useEffect(() => {
    setNoGubernamentales([
      ...copyNoGubernamentales.map((g) => g.id),
      ...otrosNoGubernamentales,
    ])
  }, [copyNoGubernamentales, otrosNoGubernamentales, setNoGubernamentales])



  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Intituciones de referencia
        </Typography>

        <Stack spacing={3}>

          <ReferenciaComponent
            referencias={copyGubernamentales}
            setReferencias={setCopyGubernamentales}
            api={getReferenciaGubernamental}
            nombre="Instituciones Gubernamentales"
          />
          <OtrosComponent otros={otrosGubernamentales} setOtros={setOtrosGubernamentales}  texto="Otros"/>

          <OtrosComponent otros={otrosNoGubernamentales} setOtros={setOtrosNoGubernamentales} texto="Instituciones no Gubernamentales"/>

        </Stack>
      </CardContent>
    </Card>
  )
}