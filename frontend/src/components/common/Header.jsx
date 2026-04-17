export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <span style={styles.logo}>⚕️</span>
        <span style={styles.brand}>Thaagam Field</span>
        <span style={styles.pill}>CRM</span>
      </div>
      <div style={styles.right}>
        <div style={styles.repInfo}>
          <span style={styles.repAvatar}>JS</span>
          <div>
            <p style={styles.repName}>Jane Smith</p>
            <p style={styles.repRole}>Field Representative · Oncology</p>
          </div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: 60,
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    fontFamily: "Inter, sans-serif",
  },
  left: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 22 },
  brand: { fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" },
  pill: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "2px 7px",
    borderRadius: 6,
  },
  right: { display: "flex", alignItems: "center", gap: 20 },
  repInfo: { display: "flex", alignItems: "center", gap: 10 },
  repAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  repName: { margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" },
  repRole: { margin: 0, fontSize: 11, color: "#94a3b8" },
};
