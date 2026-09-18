import type { DomicilioFormData } from "../../types";
import { DomicilioComponent } from "./DomicilioComponent";


type Props = {
    domicilios: DomicilioFormData[]
    domicilio: DomicilioFormData | null
    onGuardar: (domicilio: DomicilioFormData) => void
    onLimpiar: () => void
}

export const DomicilioFamiliar = ({ domicilios, domicilio, onGuardar, onLimpiar }: Props) => {
    return (
        <DomicilioComponent
          domicilio={domicilio}
          domicilios={domicilios}
          onGuardar={onGuardar}
          onLimpiar={onLimpiar}
        />
    );
};
