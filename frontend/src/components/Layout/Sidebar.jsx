import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", id: "dashboard" },
  { icon: "👥", label: "HCPs",      id: "hcps" },
  { icon: "📋", label: "Log Interaction", id: "log" },
];

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
}

export default function Sidebar({ collapsed, onToggle, activePage, onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>F</div>
        {!collapsed && <span className={styles.logoText}>FieldCRM</span>}
      </div>

      {/* Toggle button */}
      <button className={styles.collapseBtn} onClick={onToggle} title="Toggle sidebar">
        {collapsed ? "›" : "‹"}
      </button>

      {/* Nav */}
      {!collapsed && <span className={styles.navGroup}>MAIN MENU</span>}
      <nav className={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activePage === item.id ? styles.navItemActive : ""}`}
            title={collapsed ? item.label : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            {activePage === item.id && !collapsed && <span className={styles.navBadge} />}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className={styles.sidebarBottom}>
        <button
          className={styles.navItem}
          title={collapsed ? "Sign out" : undefined}
          onClick={() => dispatch(logout())}
        >
          <span className={styles.navIcon}>🚪</span>
          {!collapsed && <span className={styles.navLabel}>Sign out</span>}
        </button>

        {/* User */}
        <div className={`${styles.sidebarUser} ${collapsed ? styles.sidebarUserCollapsed : ""}`}>
          <div className={styles.userAvatar}>{initials(user?.name)}</div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || "User"}</span>
              <span className={styles.userRole}>{user?.role || "Field Representative"}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
