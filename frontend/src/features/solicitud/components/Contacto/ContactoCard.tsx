import { Card, CardContent, Typography } from "@mui/material"
import { ListData } from "@/common/components/ListData";

type Props = {
  correo: string
  telefono: string
  onEditar?: () => void
}

export const ContactoCard = ({ correo, telefono, onEditar }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" lineHeight={1.2} sx={{ mb: 2 }}>
          Datos de contacto
        </Typography>

        <ListData
          correo={correo}
          telefono={telefono}
          onEditar={onEditar}
        />
      </CardContent>
    </Card>
  )
}