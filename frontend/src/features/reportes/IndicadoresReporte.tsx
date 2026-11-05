import { Box, Paper, Typography } from '@mui/material'

export function IndicadoresReporte({ indicadores }: { indicadores: { titulo: string; valor: number; detalle?: string }[] }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${indicadores.length}, 1fr)` }, gap: 2 }}>
    {indicadores.map((indicador) => <Paper key={indicador.titulo} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="body2" color="text.secondary">{indicador.titulo}</Typography>
      <Typography component="p" variant="h4" sx={{ fontWeight: 700, my: 1 }}>{indicador.valor.toLocaleString('es-AR')}</Typography>
      {indicador.detalle && <Typography variant="caption" color="text.secondary">{indicador.detalle}</Typography>}
    </Paper>)}
  </Box>
}
