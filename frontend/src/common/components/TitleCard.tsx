import type { Theme } from "@mui/material/styles";
import { Card, CardContent, CardHeader, Divider, type SxProps } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  componente: ReactNode;
  sx?: SxProps<Theme>;
};

export const TitledCard = ({ titulo, componente, sx }: Props) => {
  return (
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        borderRadius: 3,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
        },
        ...sx,
      }}
    >
      <CardHeader
        title={titulo}
        slotProps={{ title: { variant: 'h6', sx: { fontWeight: 600, letterSpacing: '-0.01em' } } }}
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
          pb: 1.5,
        }}
      />
      <Divider />
      <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
        {componente}
      </CardContent>
    </Card>
  );
};
