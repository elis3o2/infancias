import { Card, CardHeader, CardContent } from '@mui/material';
import type { Setter } from "@/common/types"
import type { InstitucionFormData } from "../../types"
import { InstitucionForm } from "./InstitucionForm"
import { InstitucionCard } from './InstitucionCard';


type Props = {
    institucion: InstitucionFormData
    setInstitucion: Setter<InstitucionFormData>
    finishInstitucion: boolean
    setFinishInstitucion: Setter<boolean>
}

export const InstitucionComponent = ({ institucion, setInstitucion, finishInstitucion, setFinishInstitucion}: Props) => {
  
    return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title="Institución solicitante"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        {finishInstitucion && institucion != null ? (
          <InstitucionCard
            institucion={institucion}
            onEditar={() =>setFinishInstitucion(false)}
          />
        ) : (
          <InstitucionForm
            institucion={institucion}
            setInstitucion={setInstitucion}
            setFinshInstitucion={setFinishInstitucion}
          />
        )}
      </CardContent>
    </Card>
  );
};