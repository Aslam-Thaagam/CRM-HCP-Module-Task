import { useSelector } from "react-redux";
import styles from "./dashboard.module.css";

const SENTIMENT_ICON = { Positive: "😊", Neutral: "😐", Negative: "😞" };

const TYPE_COLORS = {
  Meeting: "#dbeafe", Call: "#dcfce7", Email: "#fef9c3",
  Conference: "#f3e8ff", "Dinner Program": "#ffe4e6",
  "Lunch & Learn": "#ffedd5", Other: "#f1f5f9",
};

export default function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const { list } = useSelector((s) => s.interactions);
  const { list: hcps } = useSelector((s) => s.hcps);

  const now = new Date();
  const thisMonth = list.filter((i) => {
    const d = new Date(i.interaction_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const sentimentCount = list.reduce((acc, i) => {
    acc[i.sentiment] = (acc[i.sentiment] || 0) + 1;
    return acc;
  }, {});

  const typeCount = list.reduce((acc, i) => {
    acc[i.interaction_type] = (acc[i.interaction_type] || 0) + 1;
    return acc;
  }, {});

  const recent = [...list].slice(0, 5);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <div>
          <h1>{greeting}, {user?.name?.split(" ")[0] || "there"} 👋</h1>
          <p>Here's a snapshot of your field activity.</p>
        </div>
        <span className={styles.date}>
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#eff6ff" }}>📋</div>
          <div className={styles.statBody}>
            <div className={styles.statValue}>{list.length}</div>
            <div className={styles.statLabel}>Total Interactions</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#f0fdf4" }}>📅</div>
          <div className={styles.statBody}>
            <div className={styles.statValue}>{thisMonth.length}</div>
            <div className={styles.statLabel}>This Month</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#fdf4ff" }}>👥</div>
          <div className={styles.statBody}>
            <div className={styles.statValue}>{hcps.length}</div>
            <div className={styles.statLabel}>HCPs in Network</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#fffbeb" }}>😊</div>
          <div className={styles.statBody}>
            <div className={styles.statValue}>{sentimentCount["Positive"] || 0}</div>
            <div className={styles.statLabel}>Positive Visits</div>
          </div>
        </div>
      </div>

      <div className={styles.twoCol}>
        {/* Recent interactions */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recent Interactions</span>
            <span className={styles.panelMeta}>{list.length} total</span>
          </div>
          {recent.length === 0 ? (
            <p className={styles.empty}>No interactions logged yet. Go to Log Interaction to get started.</p>
          ) : (
            <div className={styles.recentList}>
              {recent.map((item) => (
                <div key={item.id} className={styles.recentRow}>
                  <div className={styles.recentLeft}>
                    <div className={styles.recentName}>{item.hcp_name}</div>
                    <div className={styles.recentMeta}>
                      {item.interaction_date}
                      {item.topics_discussed && ` · ${item.topics_discussed.slice(0, 50)}...`}
                    </div>
                  </div>
                  <div className={styles.recentRight}>
                    <span
                      className={styles.typeBadge}
                      style={{ background: TYPE_COLORS[item.interaction_type] || "#f1f5f9" }}
                    >
                      {item.interaction_type}
                    </span>
                    {item.sentiment && (
                      <span className={styles.sentimentIcon}>{SENTIMENT_ICON[item.sentiment]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>By Interaction Type</span>
          </div>
          {Object.keys(typeCount).length === 0 ? (
            <p className={styles.empty}>No data yet.</p>
          ) : (
            <div className={styles.breakdownList}>
              {Object.entries(typeCount)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className={styles.breakdownRow}>
                    <div className={styles.breakdownLabel}>
                      <span
                        className={styles.breakdownDot}
                        style={{ background: TYPE_COLORS[type] ? "#2563eb" : "#9ca3af" }}
                      />
                      {type}
                    </div>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${Math.round((count / list.length) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.breakdownCount}>{count}</span>
                  </div>
                ))}
            </div>
          )}

          <div className={styles.panelDivider} />

          <div className={styles.panelHeader} style={{ marginTop: "0.25rem" }}>
            <span className={styles.panelTitle}>Sentiment Split</span>
          </div>
          <div className={styles.sentimentRow}>
            {["Positive", "Neutral", "Negative"].map((s) => (
              <div key={s} className={styles.sentimentStat}>
                <span className={styles.sentimentBig}>{SENTIMENT_ICON[s]}</span>
                <span className={styles.sentimentNum}>{sentimentCount[s] || 0}</span>
                <span className={styles.sentimentLbl}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
