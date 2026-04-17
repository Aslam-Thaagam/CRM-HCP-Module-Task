import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./layout.module.css";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("log");

  return (
    <div className={styles.shell}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
        activePage={activePage}
        onNavigate={setActivePage}
      />
      <div className={styles.main}>
        <Topbar activePage={activePage} />
        <div className={styles.pageContent}>
          {children(activePage)}
        </div>
      </div>
    </div>
  );
}
