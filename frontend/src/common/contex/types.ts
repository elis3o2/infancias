export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface InitializeAuthData {
    access: string;
    refresh: string;
    username?: string;
}

export interface AuthContextType {
    authTokens: AuthTokens | null;
    initializeAuth: (data: InitializeAuthData) => void;

    username: string | null;

    logout: () => void;
}