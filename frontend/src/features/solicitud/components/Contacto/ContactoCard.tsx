import { ContactoList } from "./ContactoList"
import { TitledCard } from "@/common/components/TitleCard"

type Props = {
  telefono: string
  correo: string
}

export const ContactoCard = ({telefono, correo}: Props) => {
  return (
    <TitledCard
      titulo="Datos de contacto"
      componente={
        <ContactoList 
          telefono={telefono}
          correo={correo}
        />
      }
    />
  )
}