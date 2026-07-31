import { Card, CardHeader, CardContent } from "@mui/material"
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
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
          title="Solicitante"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
        <CardContent>
      {finishSolicitante && solicitante != null ? (
        <SolicitanteView
          solicitante={solicitante}
          onEditar={() => setFinishSolicitante(false)}
        />
      ) : (
        <SolicitanteForm
          solicitante={solicitante}
          setSolicitante={setSolicitante}
          setFinishSolicitante={setFinishSolicitante}
        />
      )}
    </CardContent>
    </Card>
  )
}