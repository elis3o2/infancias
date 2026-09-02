import type { Setter } from "@/common/types"
import type { InstitucionFormData } from "../../types"
import { InstitucionForm } from "./InstitucionForm"
import { InstitucionList } from './InstitucionList';
import { ConditionalCard } from '@/common/components/ConditionalCard';

type Props = {
    institucion: InstitucionFormData
    setInstitucion: Setter<InstitucionFormData>
    finishInstitucion: boolean
    setFinishInstitucion: Setter<boolean>
}

export const InstitucionComponent = ({ institucion, setInstitucion, finishInstitucion, setFinishInstitucion}: Props) => {
    return (
      <ConditionalCard
        titulo='Institución solicitante'
        condicion={finishInstitucion && institucion != null}
        componenteTrue={
          <InstitucionList
              institucion={institucion}
              onEditar={() =>setFinishInstitucion(false)}
            />}
        componenteFalse={
          <InstitucionForm
              institucion={institucion}
              setInstitucion={setInstitucion}
              setFinshInstitucion={setFinishInstitucion}
            />
        }    
      />
  );
};