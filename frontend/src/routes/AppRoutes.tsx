import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from '@/common/components/PrivateRoute';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const BuscarCiudadano = lazy(() => import('../pages/CreatePage/CreatePage'));
const ValidarSolicitud = lazy(() =>
  import('@/features/solicitud/components/Cargados/Solicitud').then((module) => ({
    default: module.ValidarSolicitud,
  })),
);
const SolicitudListPage = lazy(() =>
  import('@/features/solicitud/components/Cargados/SolicitudPage'),
);

const PantallaDeCarga = () => (
  <Box
    role="status"
    aria-label="Cargando pantalla"
    sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}
  >
    <CircularProgress />
  </Box>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PantallaDeCarga />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/buscar" element={<BuscarCiudadano />} />

        <Route
          path="/validar/:id"
          element={
            <PrivateRoute>
              <ValidarSolicitud />
            </PrivateRoute>
          }
        />

        <Route
          path="/solicitud"
          element={
            <PrivateRoute>
              <SolicitudListPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/solicitud" replace />} />
      </Routes>
    </Suspense>
  );
};
