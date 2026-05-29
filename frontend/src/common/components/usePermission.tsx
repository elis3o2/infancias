export const usePermissions = () => {
  const user = getUser(); // de contexto o storage

  return {
    isJerarquico: user?.is_jerarquico,
  };
};