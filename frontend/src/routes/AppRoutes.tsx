import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import PrivateRoute from '@/common/components/PrivateRoute';
import BuscarCiudadano from '../pages/CreatePage/CreatePage';
import { ValidarSolicitud } from '@/features/solicitud/components/Cargados/Solicitud';
import SolicitudListPage from '@/features/solicitud/components/Cargados/SolicitudPage';

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

      <Route
        path="/solicitud"
        element={
          <PrivateRoute>
            <SolicitudListPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};