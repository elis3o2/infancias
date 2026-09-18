import { createContext } from 'react'
import type { AuthContextType } from './types';

const defaultContext: AuthContextType = {
    authTokens: null,
    initializeAuth: () => {},

    username: null,

    logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);
