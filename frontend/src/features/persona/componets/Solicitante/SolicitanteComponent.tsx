import type { Setter } from "@/common/types"
import type { Solicitante } from "../../types"
import { SolicitanteForm } from "./SolicitanteForm"
import { SolicitanteView } from "./SolicitanteView"

type Props = {
  solicitante: Solicitante | null
  setSolicitante: Setter<Solicitante | null>
  finishSolicitante: boolean
  setFinishSolicitante: Setter<boolean>
}

export const SolicitanteComponent = ({solicitante, setSolicitante, finishSolicitante, setFinishSolicitante}: Props) => {
  return (
    <>
      {finishSolicitante && solicitante != null ? (
        <SolicitanteView
          solicitante={solicitante}
          onEditar={() => setFinishSolicitante(false)}
        />
      ) : (
        <SolicitanteForm
          setSolicitante={setSolicitante}
          setFinishSolicitante={setFinishSolicitante}
        />
      )}
    </>
  )
}