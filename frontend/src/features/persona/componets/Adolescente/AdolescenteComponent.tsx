import type { Setter } from "@/common/types"
import type { AdolescenteCreate } from "../../types"
import { AdolescenteForm } from "./AdolescenteForm"
import { Card, CardHeader, CardContent} from "@mui/material"
import { AdolescenteSimpleCard } from "./AdolescenteSimpleCard"

type Props = {
  adolescente: AdolescenteCreate
  setAdolescente: Setter<AdolescenteCreate>
  finishAdolescente: boolean
  setFinishAdolescente: Setter<boolean>
}

export const AdolescenteComponent = ({ adolescente, setAdolescente, finishAdolescente, setFinishAdolescente}: Props) => {
  return (
    <Card variant="outlined" sx={{ minWidth: 1028, borderRadius: 2 }}>
      <CardHeader
          title="Niño, Niña o Adolescente"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
        <CardContent>
      {finishAdolescente && adolescente != null ? (
        <AdolescenteSimpleCard
          nombre={adolescente.nombre}
          apellido={adolescente.apellido}
          dni={adolescente.dni}
          sexo={adolescente.sexo != "" ? adolescente.sexo: null}
          escolarizado={adolescente.escolarizado}
          fecha_nacimiento={adolescente.fecha_nacimiento}
          domicilio={adolescente.domicilio.nombre}
          onEditar={() => setFinishAdolescente(false)}
        />
      ) : (
        <AdolescenteForm
          adolescente={adolescente}
          setAdolescente={setAdolescente}
          setFinishAdolescente={setFinishAdolescente}
        />
      )}
      </CardContent>
    </Card>
  )
}