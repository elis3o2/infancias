import { useEffect, useState } from "react"
import { Card, CardContent, Stack, Typography } from "@mui/material"
import type { Institucion } from "@/features/domicilio/types"
import { OtrosComponent } from "./OtrosComponent"
import { TerritorialComponent } from "./TerrirtorialComponent"
import { EducacionComponent } from "./EducacionComponent"

type Props = {
  redes: {
    educacion: Institucion | null
    territorial: Institucion[]
    otros: Institucion[]
  }
}

export const RedComponent = ({ redes }: Props) => {
  const [educacion, setEducacion] = useState<Institucion | null>(redes.educacion)
  const [finishEducacion, setFinishEducacion] = useState(false)
  const [territoriales, setTerritoriales] = useState<Institucion[]>(redes.territorial)
  const [otros, setOtros] = useState<Institucion[]>(redes.otros)

  useEffect(() => {
    setEducacion(redes.educacion)
  }, [redes.educacion])

  useEffect(() => {
    setTerritoriales(redes.territorial)
  }, [redes.territorial])

  useEffect(() => {
    setOtros(redes.otros)
  }, [redes.otros])

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Redes
        </Typography>

        <Stack spacing={3}>
          <EducacionComponent
            educacion={educacion}
            setEducacion={setEducacion}
            finishEducacion={finishEducacion}
            setFinishEducacion={setFinishEducacion}
          />

          <TerritorialComponent
            territoriales={territoriales}
            setTerritorials={setTerritoriales}
          />

          <OtrosComponent otros={otros} setOtros={setOtros} />
        </Stack>
      </CardContent>
    </Card>
  )
}