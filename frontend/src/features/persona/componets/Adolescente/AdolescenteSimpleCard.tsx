import {
  List, CardActions, Button
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import PersonIcon from "@mui/icons-material/Person"
import CakeIcon from "@mui/icons-material/Cake"
import SchoolIcon from "@mui/icons-material/School";
import WcIcon from "@mui/icons-material/Wc"
import LocationIcon from "@mui/icons-material/LocationOn"
import { DatoItem } from "@/common/components/DatoItem"


type Props = {
    nombre?: string
    apellido?: string
    dni?: string
    sexo?: "M" | "F"
    escolarizado?: boolean
    fecha_nacimiento?: string
    domicilio?: string
    onEditar?: () => void
}


function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—";

  const d = new Date(fecha);

  if (isNaN(d.getTime())) return fecha;

  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const anio = d.getUTCFullYear();

  return `${dia}-${mes}-${anio}`;
}

export const AdolescenteSimpleCard = ({ nombre, apellido, dni, sexo,
                     escolarizado, fecha_nacimiento, domicilio, onEditar}: Props) => {
  const sexoLabel = sexo === "M" ? "Masculino" : (sexo ==="F" ? "Femenino" : "-")

  return (<>
        <List
            sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 3,
            rowGap: 0,
            bgcolor: "action.hover",
            borderRadius: 2,
            px: 2,
            py: 1,
            }}
        >
            {nombre && <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={nombre} />}
            { apellido && <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={apellido} /> }
            { dni && <DatoItem icon={<BadgeIcon fontSize="small" />} label="DNI" valor={dni} /> }
            { sexo && <DatoItem icon={<WcIcon fontSize="small" />} label="Sexo" valor={sexoLabel} /> }
            { fecha_nacimiento && <DatoItem
                icon={<CakeIcon fontSize="small" />}
                label="Fecha de nacimiento"
                valor={formatFecha(fecha_nacimiento)}
            />}
            {escolarizado != null && <DatoItem
                icon={<SchoolIcon fontSize="small" />}
                label={"Escolarizado"}
                valor={escolarizado? "Si" : "No"}
            />}
            {domicilio && <DatoItem icon={<LocationIcon fontSize="small" /> } label="Domicilio" valor={domicilio} /> }
        </List>
    {onEditar && 
      <CardActions>
        <Button onClick={onEditar}>Editar</Button>
      </CardActions>}
    </>)
}