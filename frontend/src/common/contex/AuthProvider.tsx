import { useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "./AuthContext"
import type { AuthTokens, InitializeAuthData } from "./types"

function readStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem("tokens")

  if (!stored) return null

  try {
    const parsed = JSON.parse(stored) as Partial<AuthTokens>
    return typeof parsed.access === "string" && typeof parsed.refresh === "string"
      ? { access: parsed.access, refresh: parsed.refresh }
      : null
  } catch {
    localStorage.removeItem("tokens")
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(readStoredTokens)
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"))

  const initializeAuth = (data: InitializeAuthData) => {
    const tokens: AuthTokens = { access: data.access, refresh: data.refresh }
    setAuthTokens(tokens)
    localStorage.setItem("tokens", JSON.stringify(tokens))

    if (data.username) {
      setUsername(data.username)
      localStorage.setItem("username", data.username)
    }
  }

  const logout = () => {
    setAuthTokens(null)
    setUsername(null)
    localStorage.removeItem("tokens")
    localStorage.removeItem("username")
  }

  return (
    <AuthContext.Provider value={{ authTokens, initializeAuth, username, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
