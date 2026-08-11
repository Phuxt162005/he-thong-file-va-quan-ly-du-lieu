import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  // check Access Token
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
