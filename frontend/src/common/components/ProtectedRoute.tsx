import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  canAccess: boolean;
};

export default function ProtectedRoute({ children, canAccess }: Props) {
  if (!canAccess) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}