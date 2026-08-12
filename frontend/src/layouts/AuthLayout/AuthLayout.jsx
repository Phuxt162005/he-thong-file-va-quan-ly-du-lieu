import "./AuthLayout.css";

function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <main className="auth-layout__container">{children}</main>
    </div>
  );
}

export default AuthLayout;
