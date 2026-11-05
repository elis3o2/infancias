import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from '@/common/components/PrivateRoute';
import Layout from '@/common/layouts/Layout';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const BusquedaNinosPage = lazy(() => import('../pages/BusquedaNinosPage'));
const HistorialNinoPage = lazy(() => import('../pages/HistorialNinoPage'));
const ReportesPage = lazy(() => import('../pages/ReportesPage'));
const BuscarCiudadano = lazy(() => import('../pages/CreatePage/CreatePage'));
const ValidarSolicitud = lazy(() =>
  import('@/features/solicitud/components/Cargados/Solicitud').then((module) => ({
    default: module.ValidarSolicitud,
  })),
);
import { SolicitudPage } from '@/pages/SolicitudPage';


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
        <Route path="/" element={<Navigate to="/buscar" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/buscar" element={<BuscarCiudadano />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/historial" element={<BusquedaNinosPage />} />
          <Route path="/historial/:id" element={<HistorialNinoPage />} />
          <Route path="/solicitud" element={<SolicitudPage />} />
          <Route path="/validar/:id" element={<ValidarSolicitud />} />
        </Route>
        <Route path="*" element={<Navigate to="/buscar" replace />} />
      </Routes>
    </Suspense>
  );
};
