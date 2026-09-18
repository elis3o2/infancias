import { useContext } from "react"
import { AuthContext } from "../contex"

export const usePermissions = () => {
  const { authTokens } = useContext(AuthContext)

  return {
    isAuthenticated: Boolean(authTokens),
    isJerarquico: false,
  }
}
