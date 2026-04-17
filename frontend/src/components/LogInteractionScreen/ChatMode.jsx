import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUserMessage, sendMessage, resetChat } from "../../store/slices/chatSlice";
import { saveInteraction, resetForm } from "../../store/slices/interactionSlice";
import styles from "./styles.module.css";

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
}

const WELCOME = 'Ready to log an interaction! Tell me who you met, when, and what was discussed — I\'ll fill in the form automatically.\n\nExample: "Met Dr. Arjun Sharma yesterday at Apollo, discussed Cardiomax efficacy, he was positive, shared clinical trial brochure."';

export default function ChatMode() {
  const dispatch = useDispatch();
  const { messages, loading, isComplete } = useSelector((s) => s.chat);
  const { formData, saving, saveSuccess } = useSelector((s) => s.interactions);
  const { user } = useSelector((s) => s.auth);
  const [input, setInput] = useState("");

  const textareaRef = useRef(null);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    const container = chatMessagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  function handleInputChange(e) {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    dispatch(addUserMessage(text));
    const allMessages = [...messages, { role: "user", content: text }];
    dispatch(sendMessage({ messages: allMessages, currentState: formData }));
  }

  function handleSave() {
    dispatch(
      saveInteraction({
        hcp_name: formData.hcp_name,
        interaction_type: formData.interaction_type,
        interaction_date: formData.interaction_date,
        interaction_time: formData.interaction_time || null,
        contact_detail: formData.contact_detail || null,
        attendees: formData.attendees || null,
        topics_discussed: formData.topics_discussed || null,
        materials_shared: formData.materials_shared?.length ? formData.materials_shared : null,
        samples_distributed: formData.samples_distributed?.length ? formData.samples_distributed : null,
        sentiment: formData.sentiment || "Neutral",
        outcomes: formData.outcomes || null,
        follow_up_actions: formData.follow_up_actions || null,
        ai_suggested_followups: formData.ai_suggested_followups?.length ? formData.ai_suggested_followups : null,
      })
    );
  }

  function handleNewChat() {
    dispatch(resetChat());
    dispatch(resetForm());
  }

  return (
    <div className={styles.chatCard}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div className={styles.chatAiAvatar}>🤖</div>
          <div className={styles.chatHeaderText}>
            <h3>AI Assistant</h3>
            <p>Log interaction via chat</p>
          </div>
        </div>
        <div className={styles.chatOnline}>
          <span className={styles.onlineDot} />
          Online
        </div>
      </div>

      {/* Messages */}
      <div className={styles.chatMessages} ref={chatMessagesRef}>
        {/* Welcome bubble */}
        <div className={styles.msgRow}>
          <div className={`${styles.msgAvatar} ${styles.msgAvatarAi}`}>AI</div>
          <div className={`${styles.bubble} ${styles.bubbleAi}`}>{WELCOME}</div>
        </div>

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : ""}`}
          >
            <div
              className={`${styles.msgAvatar} ${
                msg.role === "user" ? styles.msgAvatarUser : styles.msgAvatarAi
              }`}
            >
              {msg.role === "user" ? initials(user?.name) : "AI"}
            </div>
            <div className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAi}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className={styles.msgRow}>
            <div className={`${styles.msgAvatar} ${styles.msgAvatarAi}`}>AI</div>
            <div className={styles.typingBubble}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}

        {isComplete && !saveSuccess && (
          <div className={styles.completeBanner}>
            <div className={styles.completeTitle}>✅ All details collected!</div>
            <span>Review the form on the left or save directly.</span>
            <button
              className={styles.saveChatBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "💾 Save Interaction"}
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className={styles.savedBanner}>
            <span>✅ Interaction saved! Check the logs below.</span>
            <button className={styles.newChatLink} onClick={handleNewChat}>
              Start new
            </button>
          </div>
        )}

      </div>

      {/* Input */}
      <div className={styles.chatFooter}>
        <form className={styles.chatForm} onSubmit={handleSend}>
          <textarea
            ref={textareaRef}
            className={styles.chatInput}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={saveSuccess ? "Saved! Click 'Start new' to log another." : "Describe the interaction..."}
            disabled={loading || saveSuccess}
          />
          <button
            type="submit"
            className={styles.chatSendBtn}
            disabled={!input.trim() || loading || saveSuccess}
          >
            ⚡ Send
          </button>
        </form>
        <p className={styles.chatHint}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
