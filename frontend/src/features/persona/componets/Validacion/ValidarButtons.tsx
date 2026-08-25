import { Stack, Button, Chip } from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import CloseIcon from "@mui/icons-material/Close"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"


type Props = {
    estado: null | "confirmado" | "rechazado"
    setEstado: (v : null | "confirmado" | "rechazado") => void
}

export const ValidarButtons = ({ estado, setEstado } : Props) => {
    return (<>
        {estado === null ? (
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={() => setEstado("confirmado")}
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Confirmar
            </Button>

            <Button
              onClick={() => setEstado("rechazado")}
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Rechazar
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={
                estado === "confirmado"
                  ? <CheckCircleIcon />
                  : <CancelIcon />
              }
              label={
                estado === "confirmado"
                  ? "Confirmado"
                  : "Rechazado"
              }
              color={estado === "confirmado" ? "success" : "error"}
              sx={{ fontWeight: 600 }}
            />

            <Tooltip title="Limpiar">
              <IconButton
                size="small"
                onClick={() => setEstado(null)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        </>
    )
}