import type { Setter } from "@/common/types";
import { ContactoForm } from "./ContactoForm";
import {  ContactoList } from "./ContactoList";
import { ConditionalCard } from "@/common/components/ConditionalCard";

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
      <ConditionalCard
        titulo="Datos de contacto"
        condicion={finishContacto}
        componenteTrue={
          <ContactoList
            correo={correo}
            telefono={telefono}
            onEditar={()=> setFinishContacto(false)}
          />
        }
        componenteFalse={
          <ContactoForm
            correo={correo}
            setCorreo={setCorreo}
            telefono={telefono}
            setTelefono={setTelefono}
            setFinishContacto={setFinishContacto}
          />
        }
      />
  );
};