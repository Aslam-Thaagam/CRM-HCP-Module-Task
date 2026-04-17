import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateField, saveInteraction, resetForm } from "../../store/slices/interactionSlice";
import { fetchHCPs } from "../../store/slices/hcpSlice";
import styles from "./styles.module.css";

const INTERACTION_TYPES = ["Meeting", "Call", "Email", "Conference", "Dinner Program", "Lunch & Learn", "Other"];
const SENTIMENTS = [
  { value: "Positive", emoji: "😊", selectedClass: "selectedPositive" },
  { value: "Neutral",  emoji: "😐", selectedClass: "selectedNeutral"  },
  { value: "Negative", emoji: "😞", selectedClass: "selectedNegative" },
];

function useHCPAutocomplete(hcps, value) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);

  const filtered = value.length >= 1
    ? hcps.filter((h) =>
        h.name.toLowerCase().includes(value.toLowerCase()) ||
        (h.specialty || "").toLowerCase().includes(value.toLowerCase())
      )
    : hcps;

  const isValid = hcps.length === 0 ||
    hcps.some((h) => h.name.toLowerCase() === value.toLowerCase());

  return { filtered, open, setOpen, touched, setTouched, isValid };
}

export default function FormMode() {
  const dispatch = useDispatch();
  const { formData, saving, saveSuccess, error } = useSelector((s) => s.interactions);
  const { list: hcps } = useSelector((s) => s.hcps);
  const [matInput, setMatInput] = useState("");
  const [sampleInput, setSampleInput] = useState("");
  const hcpRef = useRef(null);

  const hcpNames = hcps.map((h) => ({
    id: h.id,
    name: h.name || `${h.first_name} ${h.last_name}`,
    specialty: h.specialty,
  }));

  const { filtered, open, setOpen, touched, setTouched, isValid } =
    useHCPAutocomplete(hcpNames, formData.hcp_name);

  // Fetch HCPs if not loaded
  useEffect(() => {
    if (hcps.length === 0) dispatch(fetchHCPs());
  }, [dispatch, hcps.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e) {
      if (hcpRef.current && !hcpRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [setOpen]);

  function set(field, value) {
    dispatch(updateField({ field, value }));
  }

  function addTag(field, val, setter) {
    const v = val.trim();
    if (!v) return;
    const list = formData[field] || [];
    if (!list.includes(v)) dispatch(updateField({ field, value: [...list, v] }));
    setter("");
  }

  function removeTag(field, item) {
    dispatch(updateField({ field, value: (formData[field] || []).filter((t) => t !== item) }));
  }

  function applySuggestion(s) {
    const current = formData.follow_up_actions || "";
    set("follow_up_actions", current ? `${current}\n${s}` : s);
  }

  function selectHCP(name) {
    set("hcp_name", name);
    setOpen(false);
    setTouched(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid && hcpNames.length > 0) return;
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

  const showHCPWarning = touched && formData.hcp_name && !isValid && hcpNames.length > 0;

  return (
    <form onSubmit={handleSubmit}>
      {/* Interaction Details */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Interaction Details</div>

        <div className={styles.formRow}>
          {/* HCP Autocomplete */}
          <div className={styles.fieldGroup} ref={hcpRef} style={{ position: "relative" }}>
            <label className={styles.label}>HCP Name</label>
            <input
              className={`${styles.input} ${showHCPWarning ? styles.inputError : ""}`}
              placeholder={hcpNames.length === 0 ? "Loading HCPs..." : "Search registered HCPs..."}
              value={formData.hcp_name}
              onChange={(e) => { set("hcp_name", e.target.value); setOpen(true); setTouched(false); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              required
              autoComplete="off"
            />
            {showHCPWarning && (
              <div className={styles.fieldWarning}>
                ⚠️ "{formData.hcp_name}" is not a registered HCP
              </div>
            )}
            {open && (
              <div className={styles.hcpDropdown}>
                {filtered.length === 0 ? (
                  <div className={styles.hcpDropdownEmpty}>
                    No matching HCPs. <span>Go to HCPs page to add them.</span>
                  </div>
                ) : (
                  filtered.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className={styles.hcpDropdownItem}
                      onMouseDown={() => selectHCP(h.name)}
                    >
                      <span className={styles.hcpDropdownName}>{h.name}</span>
                      {h.specialty && (
                        <span className={styles.hcpDropdownSpec}>{h.specialty}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Interaction Type</label>
            <select
              className={styles.select}
              value={formData.interaction_type}
              onChange={(e) => set("interaction_type", e.target.value)}
            >
              {INTERACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Date</label>
            <input
              type="date"
              className={styles.input}
              value={formData.interaction_date}
              onChange={(e) => set("interaction_date", e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Time</label>
            <input
              type="time"
              className={styles.input}
              value={formData.interaction_time}
              onChange={(e) => set("interaction_time", e.target.value)}
            />
          </div>
        </div>

        {(formData.interaction_type === "Email" || formData.interaction_type === "Call") && (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {formData.interaction_type === "Email" ? "✉️ Email Address Used" : "📞 Phone Number Called"}
            </label>
            <input
              className={styles.input}
              type={formData.interaction_type === "Email" ? "email" : "tel"}
              placeholder={formData.interaction_type === "Email" ? "doctor@hospital.com" : "+91 98765 43210"}
              value={formData.contact_detail}
              onChange={(e) => set("contact_detail", e.target.value)}
            />
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Attendees</label>
          <input
            className={styles.input}
            placeholder="Enter names or search..."
            value={formData.attendees}
            onChange={(e) => set("attendees", e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Topics Discussed</label>
          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              placeholder="Enter key discussion points..."
              value={formData.topics_discussed}
              onChange={(e) => set("topics_discussed", e.target.value)}
              rows={4}
            />
            <button type="button" className={styles.micBtn}>🎤 Voice Note</button>
          </div>
        </div>
      </div>

      {/* Materials / Samples */}
      <div className={styles.section}>
        <div className={styles.subsectionRow}>
          <span className={styles.subsectionLabel}>Materials Shared</span>
          <button type="button" className={styles.addBtn}
            onClick={() => addTag("materials_shared", matInput || "Brochure", setMatInput)}>
            + Search / Add
          </button>
        </div>
        {formData.materials_shared?.length ? (
          <div className={styles.tagList}>
            {formData.materials_shared.map((m) => (
              <span key={m} className={styles.tag}>
                {m}<span className={styles.tagX} onClick={() => removeTag("materials_shared", m)}>×</span>
              </span>
            ))}
          </div>
        ) : <p className={styles.emptyNote}>No materials added.</p>}

        <div className={styles.subsectionDivider} />

        <div className={styles.subsectionRow}>
          <span className={styles.subsectionLabel}>Samples Distributed</span>
          <button type="button" className={styles.addBtn}
            onClick={() => addTag("samples_distributed", sampleInput || "Sample", setSampleInput)}>
            + Add Sample
          </button>
        </div>
        {formData.samples_distributed?.length ? (
          <div className={styles.tagList}>
            {formData.samples_distributed.map((s) => (
              <span key={s} className={styles.tag}>
                {s}<span className={styles.tagX} onClick={() => removeTag("samples_distributed", s)}>×</span>
              </span>
            ))}
          </div>
        ) : <p className={styles.emptyNote}>No samples added.</p>}
      </div>

      {/* Sentiment */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>HCP Sentiment</div>
        <div className={styles.sentimentRow}>
          {SENTIMENTS.map(({ value, emoji, selectedClass }) => (
            <label key={value}
              className={`${styles.sentimentOption} ${formData.sentiment === value ? styles[selectedClass] : ""}`}>
              <input type="radio" name="sentiment" value={value}
                checked={formData.sentiment === value} onChange={() => set("sentiment", value)} />
              <span className={styles.sentimentEmoji}>{emoji}</span>
              {value}
            </label>
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div className={styles.section}>
        <div className={styles.fieldGroup} style={{ marginBottom: 0 }}>
          <label className={styles.label}>Outcomes</label>
          <textarea className={styles.textarea} placeholder="Key outcomes or agreements..."
            value={formData.outcomes} onChange={(e) => set("outcomes", e.target.value)} rows={3} />
        </div>
      </div>

      {/* Follow-up Actions */}
      <div className={styles.section}>
        <div className={styles.fieldGroup}
          style={{ marginBottom: formData.ai_suggested_followups?.length ? "0.6rem" : 0 }}>
          <label className={styles.label}>Follow-up Actions</label>
          <textarea className={styles.textarea} placeholder="Enter next steps or tasks..."
            value={formData.follow_up_actions} onChange={(e) => set("follow_up_actions", e.target.value)} rows={3} />
        </div>
        {formData.ai_suggested_followups?.length > 0 && (
          <div className={styles.aiSuggestBox}>
            <div className={styles.aiSuggestHeader}>✨ AI Suggested Follow-ups</div>
            {formData.ai_suggested_followups.map((s, i) => (
              <div key={i} className={styles.aiSuggestItem} onClick={() => applySuggestion(s)}>
                <span className={styles.aiSuggestPlus}>+</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banners */}
      {error && <div className={styles.errorBanner}>{error}</div>}
      {saveSuccess && <div className={styles.successBanner}>Interaction logged successfully!</div>}

      {/* Footer */}
      <div className={styles.formFooter}>
        <div className={styles.formFooterLeft}>
          <span>💾</span><span>Auto-synced from AI chat</span>
        </div>
        <div className={styles.formFooterRight}>
          <button type="button" className={styles.btnGhost} onClick={() => dispatch(resetForm())}>
            Clear
          </button>
          <button type="submit" className={styles.btnPrimary}
            disabled={saving || !formData.hcp_name || (showHCPWarning)}>
            {saving ? "Saving..." : "💾 Log Interaction"}
          </button>
        </div>
      </div>
    </form>
  );
}
