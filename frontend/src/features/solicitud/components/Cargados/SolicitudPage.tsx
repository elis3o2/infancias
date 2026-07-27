import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Stack,
} from "@mui/material";
import { getPrioridades } from "../../api";
import { getSolicitudes } from "../../api";
import type { Solicitud } from "../../types";

const COLOR_POR_ID = {
  1: { border: "#E24B4A", chip: "error"   },
  2: { border: "#EF9F27", chip: "warning" },
  3: { border: "#639922", chip: "success" },
};

function formatFecha(str) {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day:      "numeric",
      month:    "short",
      year:     "numeric",
      hour:     "2-digit",
      minute:   "2-digit",
      hour12:   false,
    }).replace(",", " ·");
  } catch {
    return str;
  }
}


export function SolicitudesPage({ loading = false }) {
  const navigate      = useNavigate();
  const [prioridades, setPrioridades] = useState([]);
  const [filtroId,    setFiltroId]    = useState("todas");
    const [solicitudes, setSolicitudes] =useState<Solicitud[]>([])

  useEffect(() => {
    getPrioridades().then(setPrioridades)
    getSolicitudes().then(setSolicitudes)
  }, []);

  const lista = useMemo(() => {
    const base = filtroId === "todas"
      ? solicitudes
      : solicitudes.filter(s => s.prioridad?.id === filtroId);
    return [...base].sort((a, b) => (a.prioridad?.id ?? 99) - (b.prioridad?.id ?? 99));
  }, [solicitudes, filtroId]);

  return (
    <Box sx={{ maxWidth: 680, mx: "auto", px: 3, py: 4 }}>

      <Typography variant="h5" fontWeight={500} gutterBottom>
        Solicitudes
      </Typography>

      {/* Filtro */}
      {prioridades.length > 0 && (
        <ToggleButtonGroup
          value={filtroId}
          exclusive
          onChange={(_, v) => v !== null && setFiltroId(v)}
          size="small"
          sx={{ mb: 3 }}
        >
          <ToggleButton value="todas">Todas</ToggleButton>
          {prioridades.map(p => (
            <ToggleButton key={p.id} value={p.id}>{p.nombre}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      {/* Contenido */}
      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={28} />
        </Stack>
      ) : lista.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          {filtroId === "todas"
            ? "No hay solicitudes registradas."
            : "No hay solicitudes con esa prioridad."}
        </Typography>
      ) : (
        <List disablePadding>
          {lista.map((sol, idx) => {
            const c = COLOR_POR_ID[sol.prioridad?.id] ?? { border: "grey.300", chip: "default" };
            return (
              <ListItemButton
                key={sol.id}
                onClick={() => navigate(`/solicitudes/${sol.id}`)}
                divider={idx < lista.length - 1}
                sx={{ borderLeft: `3px solid ${c.border}`, pl: 2, py: 1.5 }}
              >
                <ListItemText
                  primary={sol.motivo?.nombre ?? "—"}
                  secondary={formatFecha(sol.fecha_hora_creacion)}
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
                <Chip
                  label={sol.prioridad?.nombre ?? "—"}
                  color={c.chip}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 2 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}

    </Box>
  );
}