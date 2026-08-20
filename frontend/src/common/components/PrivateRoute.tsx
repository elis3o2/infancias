import {useContext } from 'react';
import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contex';

const PrivateRoute = ({ children }: { children: ReactElement }): ReactElement | null => {

    console.log("🚨 PRIVATE ROUTE EJECUTADO");

    const { authTokens } = useContext(AuthContext);

    console.log("authTokens:", authTokens);

    return authTokens ? children : <Navigate to="/login" />;
};
export default PrivateRoute;
