import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { TitledCard } from './TitleCard';

interface ConditionalCardProps {
  titulo: string;
  condicion: boolean;
  componenteTrue: ReactNode;
  componenteFalse: ReactNode;
  sx?: SxProps<Theme>;
}

export function ConditionalCard({titulo, condicion, componenteTrue, componenteFalse, sx }: ConditionalCardProps) {
  return (
    <TitledCard
        titulo={titulo}
        componente={condicion ? componenteTrue : componenteFalse}
        sx={sx}
    />
  );
}