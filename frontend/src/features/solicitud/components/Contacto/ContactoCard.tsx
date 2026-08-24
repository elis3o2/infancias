import { Card, CardContent, CardHeader} from "@mui/material"
import { ContactoList } from "./ContactoList"

type Props = {
  telefono: string
  correo: string
}

export const ContactoCard = ({telefono, correo}: Props) => {
  return (
    <Card sx={{minWidth: 1028}}> 
    <CardHeader
          title="Datos de contacto"
          titleTypographyProps={{ variant: 'h6', fontWeight: 300 }}
        />
      <CardContent>
        <ContactoList
          telefono={telefono}
          correo={correo}
        />
      </CardContent>
    </Card>
  )
}