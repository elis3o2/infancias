import type { Theme } from "@emotion/react";
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
        width: '80%',
        borderRadius: 3,
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
        ...sx,
      }}
    >
      <CardHeader
        title={titulo}
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
        sx={{
          px: 3,
          pt: 2.5,
          pb: 1.5,
        }}
      />
      <Divider />
      <CardContent sx={{ px: 3, py: 3 }}>
        {componente}
      </CardContent>
    </Card>
  );
};