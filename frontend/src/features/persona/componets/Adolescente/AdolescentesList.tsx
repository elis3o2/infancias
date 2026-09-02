import type { AdolescenteCreate, AdolescenteCrud } from "../../types";
import { Box, Divider, Stack } from "@mui/material";
import { ListData } from "@/common/components/ListData";

type Adolescente = AdolescenteCreate | AdolescenteCrud;

type Props = {
  adolescentes: Adolescente[];
  onEditar?: (index: number) => void;
};

export const AdolescentesList = ({ adolescentes, onEditar }: Props) => {
  return (
    <Stack spacing={2}>
      {adolescentes.map((adolescente, index) => (
        <Box key={index}>
          <ListData
            nombre={adolescente.nombre}
            apellido={adolescente.apellido}
            sexo={adolescente.sexo? adolescente.sexo : null}
            dni={adolescente.dni}
            fecha_nacimiento={adolescente.fecha_nacimiento}
            domicilio={adolescente.domicilio?.nombre}
            domicilio_observaciones={
              adolescente.domicilio?.observaciones ?? undefined
            }
            onEditar={
              onEditar
                ? () => onEditar(index)
                : undefined
            }
            texto="Editar"
          />

          {index < adolescentes.length - 1 && (
            <Divider sx={{ mt: 2 }} />
          )}
        </Box>
      ))}
    </Stack>
  );
};