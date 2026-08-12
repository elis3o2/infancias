import { Card, CardHeader, CardContent } from '@mui/material';
import type { Setter } from "@/common/types"
import type { Institucion } from "../../types"
import { InstitucionForm } from "./InstitucionForm"
import { InstitucionCard } from './InstitucionCard';


type Props = {
    institucion: Institucion 
    setInstitucion: Setter<Institucion>
    finishInstitucion: boolean
    setFinishInstitucion: Setter<boolean>
    correo: string
    setCorreo: Setter<string>
    telefono: string
    setTelefono: Setter<string>
}

export const InstitucionComponent = ({ institucion, setInstitucion, finishInstitucion, setFinishInstitucion, 
          correo, setCorreo, telefono, setTelefono }: Props) => {
  
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
            correo={correo}
            setCorreo={setCorreo}
            telefono={telefono}
            setTelefono={setTelefono}
          />
        )}
      </CardContent>
    </Card>
  );
};