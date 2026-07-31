import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { PrivateRoute } from '../common/components';
import BuscarCiudadano from '../pages/CreatePage/CreatePage';
import { ValidarSolicitud } from '@/features/solicitud/components/Cargados/ValidarSolicitud';
import type Layout from '@/common/layouts/Layout';

export const AppRoutes = () => {
  return (
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
    </Routes>
  );
};