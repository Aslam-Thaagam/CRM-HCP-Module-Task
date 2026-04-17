import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInteractions } from "../../store/slices/interactionSlice";
import FormMode from "./FormMode";
import ChatMode from "./ChatMode";
import styles from "./styles.module.css";

const TYPE_COLORS = {
  Meeting: "#dbeafe",
  Call: "#dcfce7",
  Email: "#fef9c3",
  Conference: "#f3e8ff",
  "Dinner Program": "#ffe4e6",
  "Lunch & Learn": "#ffedd5",
  Other: "#f1f5f9",
};

const SENTIMENT_ICON = { Positive: "😊", Neutral: "😐", Negative: "😞" };

export default function LogInteractionScreen() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.interactions);

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  return (
    <div>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>Log HCP Interaction</h1>
          <p>Record field visits, calls, and engagement details</p>
        </div>
        <div className={styles.pageHeaderRight}>
          <span className={styles.statusPill}>
            <span className={styles.statusDot} />
            AI Active
          </span>
        </div>
      </div>

      {/* Main layout: form + chat */}
      <div className={styles.layout}>
        {/* Form card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <div className={styles.cardIcon}>📋</div>
              <h2>Interaction Form</h2>
            </div>
            <span className={styles.cardHeaderMeta}>Fields auto-filled by AI</span>
          </div>
          <FormMode />
        </div>

        {/* Chat */}
        <ChatMode />
      </div>

      {/* Interaction Logs */}
      <div className={styles.logsSection}>
        <div className={styles.logsHeader}>
          <div className={styles.logsHeaderLeft}>
            <span className={styles.logsTitle}>Interaction Logs</span>
            <span className={styles.logsCount}>{list.length} record{list.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {loading && <p className={styles.logsEmpty}>Loading...</p>}
        {!loading && list.length === 0 && (
          <p className={styles.logsEmpty}>No interactions logged yet. Use the form or chat above to log your first one.</p>
        )}

        {list.length > 0 && (
          <div className={styles.logsGrid}>
            {list.map((item) => (
              <div key={item.id} className={styles.logCard}>
                <div className={styles.logCardTop}>
                  <div className={styles.logHcp}>{item.hcp_name}</div>
                  <span
                    className={styles.logTypeBadge}
                    style={{ background: TYPE_COLORS[item.interaction_type] || "#f1f5f9" }}
                  >
                    {item.interaction_type}
                  </span>
                </div>

                <div className={styles.logMeta}>
                  <span>📅 {item.interaction_date}{item.interaction_time ? ` · ${item.interaction_time}` : ""}</span>
                  {item.sentiment && (
                    <span>{SENTIMENT_ICON[item.sentiment] || ""} {item.sentiment}</span>
                  )}
                </div>

                {item.topics_discussed && (
                  <p className={styles.logNotes}>{item.topics_discussed}</p>
                )}

                {(item.materials_shared?.length || item.samples_distributed?.length) && (
                  <div className={styles.logTags}>
                    {item.materials_shared?.map((m) => (
                      <span key={m} className={styles.logTag} style={{ background: "#eff6ff", color: "#1d4ed8" }}>📄 {m}</span>
                    ))}
                    {item.samples_distributed?.map((s) => (
                      <span key={s} className={styles.logTag} style={{ background: "#f0fdf4", color: "#15803d" }}>💊 {s}</span>
                    ))}
                  </div>
                )}

                {item.follow_up_actions && (
                  <div className={styles.logFollowup}>
                    <span className={styles.logFollowupLabel}>Follow-up:</span> {item.follow_up_actions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
