import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { sendChatMessage, addUserMessage, resetChat } from "../../store/slices/chatSlice";
import { prefillFormFromChat, setFormMode } from "../../store/slices/interactionSlice";

const BOT_AVATAR = "🤖";
const USER_AVATAR = "👤";

function TypingIndicator() {
  return (
    <div style={styles.msgRow}>
      <span style={styles.avatar}>{BOT_AVATAR}</span>
      <div style={{ ...styles.bubble, ...styles.bubbleBot }}>
        <span style={styles.typing}>
          <span /><span /><span />
        </span>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";

  // Render summary JSON nicely if present
  const summaryMatch = msg.content.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/);
  let bodyText = msg.content.replace(/<SUMMARY>[\s\S]*?<\/SUMMARY>/, "").trim();
  let summaryJson = null;
  if (summaryMatch) {
    try { summaryJson = JSON.parse(summaryMatch[1].trim()); } catch (_) {}
  }

  return (
    <div style={{ ...styles.msgRow, ...(isUser ? styles.msgRowUser : {}) }}>
      {!isUser && <span style={styles.avatar}>{BOT_AVATAR}</span>}
      <div style={{ maxWidth: "72%" }}>
        {bodyText && (
          <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleBot) }}>
            <p style={styles.msgText}>{bodyText}</p>
          </div>
        )}
        {summaryJson && (
          <div style={styles.summaryCard}>
            <p style={styles.summaryTitle}>📋 Captured Interaction</p>
            <table style={styles.summaryTable}>
              <tbody>
                {Object.entries(summaryJson).map(([k, v]) => {
                  if (!v || (Array.isArray(v) && v.length === 0)) return null;
                  const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  const val = Array.isArray(v)
                    ? v.join(", ")
                    : typeof v === "object"
                    ? Object.entries(v).map(([pk, pv]) => `${pk}: ${pv}`).join(", ")
                    : String(v);
                  return (
                    <tr key={k}>
                      <td style={styles.summaryKey}>{label}</td>
                      <td style={styles.summaryVal}>{val}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isUser && <span style={styles.avatar}>{USER_AVATAR}</span>}
    </div>
  );
}

export default function ChatInterface() {
  const dispatch = useDispatch();
  const { messages, typing, stage, extractedData, interactionSaved, error } = useSelector(
    (s) => s.chat
  );
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const initSent = useRef(false);

  // Greet on mount — guard against React StrictMode double-fire
  useEffect(() => {
    if (messages.length === 0 && !initSent.current) {
      initSent.current = true;
      dispatch(sendChatMessage({ message: "__init__", repId: "rep-001" }));
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text || typing) return;
    dispatch(addUserMessage(text));
    setInput("");
    dispatch(sendChatMessage({ message: text, repId: "rep-001" }));
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleSwitchToForm = () => {
    if (Object.keys(extractedData).length > 0) {
      dispatch(prefillFormFromChat(extractedData));
    }
    dispatch(setFormMode("form"));
  };

  const handleNewSession = () => {
    dispatch(resetChat());
    setTimeout(() => {
      dispatch(sendChatMessage({ message: "__init__", repId: "rep-001" }));
    }, 100);
  };

  const suggestions = [
    "Just visited Dr. Smith at Mass General — discussed Keytruda for NSCLC",
    "Had a phone call with Dr. Patel about Jardiance reimbursement concerns",
    "Virtual meeting with Dr. Lee, she's open to prescribing Dupixent",
  ];

  return (
    <div style={styles.container}>
      {/* Chat window */}
      <div style={styles.chatWindow}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyTitle}>Start logging with AI</p>
            <p style={styles.emptySubtitle}>
              Describe your interaction naturally — the AI will extract and structure everything for you.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {typing && <TypingIndicator />}

        {/* Saved confirmation */}
        {interactionSaved && (
          <div style={styles.savedBanner}>
            ✅ Interaction saved successfully! Start a new conversation or switch to form view.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions (only when empty) */}
      {messages.length <= 2 && !typing && (
        <div style={styles.suggestions}>
          <p style={styles.suggestionsLabel}>Quick examples:</p>
          <div style={styles.suggestionsRow}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                style={styles.suggestionBtn}
                onClick={() => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extracted data preview */}
      {Object.keys(extractedData).length > 0 && stage !== "saved" && (
        <div style={styles.extractedPreview}>
          <span style={styles.extractedLabel}>AI captured: </span>
          {extractedData.hcp_name && <span style={styles.extractedChip}>👤 {extractedData.hcp_name}</span>}
          {extractedData.interaction_type && <span style={styles.extractedChip}>📋 {extractedData.interaction_type}</span>}
          {extractedData.products_discussed?.length > 0 && (
            <span style={styles.extractedChip}>💊 {extractedData.products_discussed.join(", ")}</span>
          )}
          <button style={styles.switchBtn} onClick={handleSwitchToForm}>
            Edit in Form →
          </button>
        </div>
      )}

      {/* Input area */}
      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            stage === "confirming"
              ? "Type 'yes' to confirm, or describe any changes…"
              : "Describe your interaction… (e.g. 'Just visited Dr. Chen at MGH, discussed Keytruda')"
          }
          disabled={typing || interactionSaved}
          style={{
            ...styles.textArea,
            ...(interactionSaved ? { opacity: 0.5 } : {}),
          }}
        />
        <div style={styles.inputActions}>
          {interactionSaved ? (
            <button onClick={handleNewSession} style={styles.newSessionBtn}>
              + New Interaction
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!input.trim() || typing}
              style={{
                ...styles.sendBtn,
                ...(!input.trim() || typing ? styles.sendBtnDisabled : {}),
              }}
            >
              {typing ? "…" : "Send ↵"}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 520,
    gap: 0,
  },
  chatWindow: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "#f8fafc",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    marginBottom: 12,
    minHeight: 320,
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  msgRowUser: { flexDirection: "row-reverse" },
  avatar: { fontSize: 22, flexShrink: 0, marginTop: 2 },
  bubble: {
    maxWidth: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    lineHeight: 1.5,
  },
  bubbleBot: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "4px 12px 12px 12px",
  },
  bubbleUser: {
    background: "#2563eb",
    color: "#fff",
    borderRadius: "12px 4px 12px 12px",
  },
  msgText: { margin: 0, fontSize: 14, whiteSpace: "pre-wrap" },
  typing: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    height: 18,
  },
  summaryCard: {
    marginTop: 8,
    background: "#fff",
    border: "1.5px solid #bfdbfe",
    borderRadius: 10,
    padding: "12px 16px",
  },
  summaryTitle: {
    margin: "0 0 8px",
    fontSize: 13,
    fontWeight: 700,
    color: "#1d4ed8",
  },
  summaryTable: { width: "100%", borderCollapse: "collapse" },
  summaryKey: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    padding: "3px 8px 3px 0",
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },
  summaryVal: {
    fontSize: 13,
    color: "#111827",
    padding: "3px 0",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 },
  emptySubtitle: { fontSize: 14, color: "#64748b", textAlign: "center", maxWidth: 340, margin: 0 },
  savedBanner: {
    padding: "12px 16px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    color: "#15803d",
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center",
  },
  suggestions: { marginBottom: 8 },
  suggestionsLabel: { fontSize: 12, color: "#9ca3af", margin: "0 0 6px", fontWeight: 500 },
  suggestionsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  suggestionBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    padding: "6px 12px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 20,
    color: "#1d4ed8",
    cursor: "pointer",
    maxWidth: 260,
    textAlign: "left",
    lineHeight: 1.4,
  },
  extractedPreview: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    padding: "8px 12px",
    background: "#eff6ff",
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 12,
  },
  extractedLabel: { color: "#6b7280", fontWeight: 600 },
  extractedChip: {
    padding: "3px 10px",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: 20,
    fontWeight: 500,
  },
  switchBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    marginLeft: "auto",
  },
  inputArea: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
  },
  textArea: {
    fontFamily: "Inter, sans-serif",
    flex: 1,
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: 14,
    color: "#111827",
    background: "transparent",
    lineHeight: 1.5,
  },
  inputActions: { display: "flex", flexDirection: "column", justifyContent: "flex-end" },
  sendBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 16px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  sendBtnDisabled: { background: "#93c5fd", cursor: "not-allowed" },
  newSessionBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 14px",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1.5px solid #bbf7d0",
    borderRadius: 8,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  errorBanner: {
    marginTop: 8,
    padding: "8px 12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    color: "#dc2626",
    fontSize: 13,
  },
};
