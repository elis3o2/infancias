import {
  List, CardActions, Button
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import PersonIcon from "@mui/icons-material/Person"
import CakeIcon from "@mui/icons-material/Cake"
import SchoolIcon from "@mui/icons-material/School";
import WcIcon from "@mui/icons-material/Wc"
import LocationIcon from "@mui/icons-material/LocationOn"
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import { DatoItem } from "@/common/components/DatoItem"
import NotesIcon from "@mui/icons-material/Notes";

type Props = {
    nombre?: string
    apellido?: string
    dni?: string
    sexo?: "M" | "F"
    escolarizado?: boolean | null
    fecha_nacimiento?: string
    vinculo?: string
    domicilio?: string
    domicilio_observaciones?: string
    institucion_nombre?: string
    institucion_tipo?: string
    institucion_domicilio?: string
    telefono?: string
    correo?: string
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

export const ListData = ({ nombre, apellido, dni, sexo, escolarizado, fecha_nacimiento, vinculo,
             domicilio, domicilio_observaciones, institucion_nombre, institucion_tipo, institucion_domicilio, telefono, correo, onEditar}: Props) => {
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
            { nombre && <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={nombre} />}
            { apellido && <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={apellido} /> }
            { dni && <DatoItem icon={<BadgeIcon fontSize="small" />} label="DNI" valor={dni} /> }
            { sexo && <DatoItem icon={<WcIcon fontSize="small" />} label="Sexo" valor={sexoLabel} /> }
            { fecha_nacimiento && <DatoItem
                icon={<CakeIcon fontSize="small" />}
                label="Fecha de nacimiento"
                valor={formatFecha(fecha_nacimiento)}
            />}
            {escolarizado !== undefined && <DatoItem
                icon={<SchoolIcon fontSize="small" />}
                label={"Escolarizado"}
                valor={escolarizado == null ? "Desconsido" : escolarizado? "Si" : "No"}
            />}
            {vinculo && <DatoItem icon={<BadgeIcon fontSize="small" />} label="Vínculo" valor={vinculo}/> }
            {domicilio && <DatoItem icon={<LocationIcon fontSize="small" /> } label="Domicilio" valor={domicilio} /> }
            {domicilio_observaciones && (<DatoItem icon={<NotesIcon fontSize="small"/>} label="Observaciones" valor={domicilio_observaciones}/>)}            {institucion_nombre && <DatoItem icon={<BusinessIcon fontSize="small" />} label="Nombre" valor={institucion_nombre} />}
            {institucion_tipo && <DatoItem icon={<CategoryIcon fontSize="small" />} label="Tipo institución" valor={institucion_tipo} />}
            {institucion_domicilio && <DatoItem icon={<LocationOnIcon fontSize="small" />} label="Direccion" valor={institucion_domicilio} />}
            {telefono &&  <DatoItem icon={<PhoneIcon fontSize="small" />} label="Telefono" valor={telefono} />}
            {correo &&  <DatoItem icon={<EmailIcon fontSize="small" />} label="Correo" valor={correo}/>}

        </List>
    {onEditar && 
      <CardActions>
        <Button onClick={onEditar}>Editar</Button>
      </CardActions>}
    </>)
}