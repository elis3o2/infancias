import { Card, CardHeader, CardContent } from '@mui/material';
import type { Setter } from "@/common/types"
import type { Institucion, InstitucionCreate } from "../../types"
import { InstitucionView } from "./InstitucionView"
import { InstitucionForm } from "./InstitucionForm"


type Props = {
    institucion: Institucion | InstitucionCreate
    setInstitucion: Setter<Institucion | InstitucionCreate>
    finishInstitucion: boolean
    setFinishInstitucion: Setter<boolean>
}

export const InstitucionComponent = ({ institucion, setInstitucion, finishInstitucion, setFinishInstitucion }: Props) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title="Institución"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        {finishInstitucion && institucion != null ? (
          <InstitucionView
            institucion={institucion}
            setFinshInstitucion={setFinishInstitucion}
          />
        ) : (
          <InstitucionForm
            setInstitucion={setInstitucion}
            setFinshInstitucion={setFinishInstitucion}
          />
        )}
      </CardContent>
    </Card>
  );
};