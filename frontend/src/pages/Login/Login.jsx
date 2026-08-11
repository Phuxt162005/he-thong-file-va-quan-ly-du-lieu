import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import { login } from "../../../../backend/src/services/authService";

import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(username, password);
      navigate("/file");
    } catch (error) {
      setError(error.message);
    }
  };
  return (
    <AuthLayout>
      <div className="login-name">
        <h1>Đăng nhập</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            placeholder="Email or Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn" type="submit">
            Đăng nhập
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
