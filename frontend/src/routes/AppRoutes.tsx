import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { PrivateRoute } from '../common/components';
import BuscarCiudadano from '../pages/CreatePage/CreatePage';


export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/buscar"
        element={
          <PrivateRoute>
            <BuscarCiudadano />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};