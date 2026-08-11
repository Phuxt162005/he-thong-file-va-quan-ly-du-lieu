import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

import "./MainLayout.css";

function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Header />

      <div className="main-body">
        <Sidebar />

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
