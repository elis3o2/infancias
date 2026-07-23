import type { Setter } from "@/common/types"
import type { Adolescente } from "../../types"
import { AdolescenteForm } from "./AdolescenteForm"
import { AdolescenteView } from "./AdolescenteView"

type Props = {
  adolescente: Adolescente | null
  setAdolescente: Setter<Adolescente | null>
  finishAdolescente: boolean
  setFinishAdolescente: Setter<boolean>
}

export const AdolescenteComponent = ({ adolescente, setAdolescente, finishAdolescente, setFinishAdolescente}: Props) => {
  return (
    <>
      {finishAdolescente && adolescente != null ? (
        <AdolescenteView
          adolescente={adolescente}
          onEditar={() => setFinishAdolescente(false)}
        />
      ) : (
        <AdolescenteForm
          setAdolescente={setAdolescente}
          setFinishAdolescente={setFinishAdolescente}
        />
      )}
    </>
  )
}