import "./AuthLayout.css";

function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <main className="auth-content">{children}</main>
    </div>
  );
}

export default AuthLayout;
