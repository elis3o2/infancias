import { createContext, useState, useRef, } from 'react'
import type {ReactNode } from 'react';
import type { AuthContextType, InitializeAuthData, AuthTokens } from './types';

const defaultContext: AuthContextType = {
    authTokens: null,
    initializeAuth: () => {},

    username: null,

    logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [authTokens, setAuthTokens] = useState<AuthTokens | null>(() => {
        const t = localStorage.getItem('tokens');
        return t ? JSON.parse(t) : null;
    });
    const tokensRef = useRef<AuthTokens | null>(authTokens);
    const [username, setUsername] = useState<string | null>(() =>
        localStorage.getItem('username') || null
    );



    const initializeAuth = (data: InitializeAuthData) => {
        const tokens: AuthTokens = { access: data.access, refresh: data.refresh };
        setAuthTokens(tokens);
        tokensRef.current = tokens;
        localStorage.setItem('tokens', JSON.stringify(tokens));

        if (data.username) {
            setUsername(data.username);
            localStorage.setItem('username', data.username);
        }

    };

    const logout = () => {
        setAuthTokens(null);
        tokensRef.current = null;
        setUsername(null);
        ['tokens','username'].forEach(k => localStorage.removeItem(k));
    };


    return (
        <AuthContext.Provider
            value={{
                authTokens,
                initializeAuth,
                username,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};