// PersonaForm.tsx
import { Grid } from "@mui/material"
import PersonIcon from "@mui/icons-material/Person"
import CakeIcon from "@mui/icons-material/Cake"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import HomeIcon from "@mui/icons-material/Home"
import { DatoItem } from "@/common/components/DatoItem"
import { TelefonoComponent } from "../../TelefonoComponent"
import type { Ciudadano } from "@/features/persona/types"
import type { Setter } from "@/common/types"
import { VerDireccion } from "./VerDireccion"
import { formatFecha } from "@/common/utils"

type Props = {
  ciudadano: Ciudadano
  domicilio: string
  finishDireccion: boolean
  setFinishDireccion: Setter<boolean>
  telefono: string
  setTelefono: Setter<string>
}

export const PersonaForm = ({ ciudadano, domicilio, finishDireccion, setFinishDireccion, telefono, setTelefono }: Props) => (
  <Grid container spacing={2.5}>
    <Grid item xs={12}>
      <DatoItem
        icon={<PersonIcon fontSize="small" />}
        label="Nombre completo"
        value={`${ciudadano.nombre} ${ciudadano.apellido}`}
      />
    </Grid>
    <Grid item xs={12}>
      <DatoItem
        icon={<CakeIcon fontSize="small" />}
        label="Fecha de nacimiento"
        value={formatFecha(ciudadano.fechaNacimiento)}
      />
    </Grid>
    <Grid item xs={12}>
      <DatoItem
        icon={<LocationOnIcon fontSize="small" />}
        label="Localidad"
        value={ciudadano.localidad}
      />
    </Grid>
    <Grid item xs={12}>
      {finishDireccion? 
        <VerDireccion
        domicilio={domicilio}
        setFinishDireccion={setFinishDireccion}
     /> :
      <DatoItem
        icon={<HomeIcon fontSize="small" />}
        label="Domicilio"
        value={ciudadano.domicilio}
      /> }
    </Grid>
    <Grid item xs={12}>
      <TelefonoComponent
        telefono={telefono}
        setTelefono={setTelefono}
      />
    </Grid>
  </Grid>
)