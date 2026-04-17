import { useSelector } from "react-redux";
import styles from "./layout.module.css";

const PAGE_LABELS = {
  dashboard: "Dashboard",
  hcps: "Healthcare Professionals",
  log: "Log Interaction",
};

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
}

export default function Topbar({ activePage }) {
  const { user } = useSelector((s) => s.auth);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <span className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}>HCP Module</span>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{PAGE_LABELS[activePage] || "Dashboard"}</span>
        </span>
      </div>

      <div className={styles.topbarCenter}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input className={styles.searchInput} placeholder="Search HCPs, interactions..." />
          <span className={styles.searchShortcut}>⌘K</span>
        </div>
      </div>

      <div className={styles.topbarRight}>
        <span className={styles.topbarDate}>{dateStr}</span>
        <button className={styles.iconBtn} title="Notifications">
          🔔<span className={styles.notifDot} />
        </button>
        <button className={styles.iconBtn} title="Sync">📡</button>
        <div className={styles.topbarAvatar} title={user?.name || "Profile"}>
          {initials(user?.name)}
        </div>
      </div>
    </header>
  );
}
