import type { Setter } from "@/common/types";
import { ContactoForm } from "./ContactoForm";
import { Card, CardHeader, CardContent } from "@mui/material";
import { ContactoCard } from "./ContactoCard";

type Props = {
    correo: string
    setCorreo: Setter<string>
    telefono: string
    setTelefono: Setter<string>
    finishContacto: boolean
    setFinishContacto: Setter<boolean>
}

export const ContactoComponent = ({correo, setCorreo, telefono, setTelefono, finishContacto, setFinishContacto }: Props) => {
  
    return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title="Datos de contacto"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        {finishContacto? (
          <ContactoCard
          correo={correo}
          telefono={telefono}
          onEditar={()=> setFinishContacto(false)}
          />
        ) : (
          <ContactoForm
            correo={correo}
            setCorreo={setCorreo}
            telefono={telefono}
            setTelefono={setTelefono}
            setFinishContacto={setFinishContacto}
          />
        )}
      </CardContent>
    </Card>
  );
};