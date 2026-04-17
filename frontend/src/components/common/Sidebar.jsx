import { useLocation, Link } from "react-router-dom";

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", path: "/" },
  { icon: "✍️", label: "Log Interaction", path: "/log" },
  { icon: "📋", label: "Activity Log", path: "/activities" },
  { icon: "👥", label: "My HCPs", path: "/hcps" },
  { icon: "📊", label: "Insights", path: "/insights" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={styles.link}>
              <div style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={{ ...styles.navLabel, ...(active ? styles.navLabelActive : {}) }}>
                  {item.label}
                </span>
                {active && <div style={styles.activePill} />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={styles.bottomSection}>
        <div style={styles.quota}>
          <p style={styles.quotaLabel}>Interactions this week</p>
          <div style={styles.quotaBar}>
            <div style={{ ...styles.quotaFill, width: "60%" }} />
          </div>
          <p style={styles.quotaCount}>6 / 10 target</p>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: "#fff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "16px 12px",
    height: "100%",
    fontFamily: "Inter, sans-serif",
  },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  link: { textDecoration: "none" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 10,
    cursor: "pointer",
    position: "relative",
    transition: "background 0.12s",
  },
  navItemActive: { background: "#eff6ff" },
  navIcon: { fontSize: 17, width: 22, textAlign: "center" },
  navLabel: { fontSize: 14, fontWeight: 500, color: "#64748b" },
  navLabelActive: { color: "#1d4ed8", fontWeight: 600 },
  activePill: {
    position: "absolute",
    right: 10,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#2563eb",
  },
  bottomSection: { padding: "0 4px 8px" },
  quota: { background: "#f8fafc", borderRadius: 10, padding: "12px 14px" },
  quotaLabel: { fontSize: 11, color: "#94a3b8", margin: "0 0 8px", fontWeight: 500 },
  quotaBar: {
    height: 4,
    background: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  quotaFill: { height: "100%", background: "#2563eb", borderRadius: 4 },
  quotaCount: { fontSize: 12, color: "#374151", fontWeight: 600, margin: 0 },
};
