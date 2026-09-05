import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "../utils/authStorage";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
