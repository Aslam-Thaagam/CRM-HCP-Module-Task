import { useDispatch, useSelector } from "react-redux";
import { prefillFormFromChat } from "../../store/slices/interactionSlice";
import StructuredForm from "./StructuredForm";
import ChatInterface from "./ChatInterface";

export default function LogInteractionScreen() {
  const dispatch = useDispatch();
  const { extractedData } = useSelector((s) => s.chat);

  const handleFillForm = () => {
    if (Object.keys(extractedData).length > 0) {
      dispatch(prefillFormFromChat(extractedData));
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Page header ── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Log HCP Interaction</h1>
          <p style={styles.pageSubtitle}>
            Fill in the structured form on the left, or describe your interaction to the AI assistant on the right.
          </p>
        </div>
        <div style={styles.headerBadges}>
          <span style={styles.badge}>
            <span style={styles.badgeDot} />
            LangGraph Agent
          </span>
          <span style={{ ...styles.badge, ...styles.badgeGreen }}>
            <span style={{ ...styles.badgeDot, background: "#22c55e" }} />
            gemma2-9b-it · Groq
          </span>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div style={styles.splitLayout}>
        {/* ── LEFT: Structured Form ── */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelHeaderLeft}>
              <div style={styles.panelIconWrap}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
              </div>
              <div>
                <h2 style={styles.panelTitle}>Interaction Details</h2>
                <p style={styles.panelSubtitle}>Complete the structured form below</p>
              </div>
            </div>
          </div>
          <div style={styles.panelBody}>
            <StructuredForm />
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerLabel}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* ── RIGHT: AI Chat ── */}
        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelHeaderLeft}>
              <div style={{ ...styles.panelIconWrap, background: "#f5f3ff", border: "1.5px solid #ddd6fe" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h2 style={styles.panelTitle}>
                  AI Assistant
                  <span style={styles.aiModelBadge}>gemma2-9b-it · Groq</span>
                </h2>
                <p style={styles.panelSubtitle}>Log interaction via chat</p>
              </div>
            </div>
            {Object.keys(extractedData).length > 0 && (
              <button style={styles.fillFormBtn} onClick={handleFillForm} title="Copy AI-extracted data into the form">
                ← Fill Form
              </button>
            )}
          </div>

          {/* Example prompt hints */}
          <div style={styles.chatHints}>
            <p style={styles.hintsLabel}>Try saying:</p>
            <div style={styles.hintsRow}>
              {[
                '"Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure"',
                '"Phone call with Dr. Patel about Jardiance reimbursement"',
                '"Virtual meeting with Dr. Lee, open to prescribing Dupixent"',
              ].map((h, i) => (
                <span key={i} style={styles.hintChip}>{h}</span>
              ))}
            </div>
          </div>

          <div style={styles.chatBody}>
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px 32px",
    maxWidth: 1440,
    margin: "0 auto",
    fontFamily: "Inter, sans-serif",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 4px",
    letterSpacing: "-0.02em",
  },
  pageSubtitle: { fontSize: 14, color: "#64748b", margin: 0 },
  headerBadges: { display: "flex", gap: 8, alignItems: "center" },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 12px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 20,
    color: "#1d4ed8",
  },
  badgeGreen: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" },

  splitLayout: {
    display: "flex",
    gap: 0,
    alignItems: "stretch",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    minHeight: "calc(100vh - 160px)",
  },

  leftPanel: {
    flex: "0 0 55%",
    display: "flex",
    flexDirection: "column",
    borderRight: "1.5px solid #f1f5f9",
    overflow: "hidden",
  },
  rightPanel: {
    flex: "0 0 45%",
    display: "flex",
    flexDirection: "column",
    background: "#fafbff",
    overflow: "hidden",
  },

  divider: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 0,
    position: "relative",
    zIndex: 1,
  },
  dividerLine: {
    width: 1,
    flex: 1,
    background: "#e2e8f0",
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    background: "#fff",
    padding: "4px 0",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    left: -10,
    width: 20,
    textAlign: "center",
    zIndex: 2,
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff",
    flexShrink: 0,
  },
  panelHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  panelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#eff6ff",
    border: "1.5px solid #bfdbfe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 2px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  panelSubtitle: { fontSize: 12, color: "#94a3b8", margin: 0 },
  aiModelBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 6,
  },
  fillFormBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 12px",
    background: "#eff6ff",
    border: "1.5px solid #bfdbfe",
    borderRadius: 8,
    color: "#1d4ed8",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  panelBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px 24px",
  },

  chatHints: {
    padding: "10px 20px 6px",
    borderBottom: "1px solid #f1f5f9",
    flexShrink: 0,
    background: "#fff",
  },
  hintsLabel: { fontSize: 11, color: "#9ca3af", fontWeight: 600, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" },
  hintsRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  hintChip: {
    fontSize: 11,
    color: "#4b5563",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: "3px 8px",
    fontStyle: "italic",
    lineHeight: 1.4,
  },

  chatBody: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: "12px 16px 16px",
  },
};
