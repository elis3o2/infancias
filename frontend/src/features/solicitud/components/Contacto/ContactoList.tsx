import { ListData } from "@/common/components/ListData";

type Props = {
  correo: string
  telefono: string
  onEditar?: () => void
}

export const ContactoList = ({ correo, telefono, onEditar }: Props) => {
  return (

        <ListData
          correo={correo}
          telefono={telefono}
          onEditar={onEditar}
          texto="Editar"
        />
  )
}