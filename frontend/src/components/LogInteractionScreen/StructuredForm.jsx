import { useDispatch, useSelector } from "react-redux";
import { updateFormField, createInteraction, resetForm, clearMessages } from "../../store/slices/interactionSlice";
import { fetchHcps } from "../../store/slices/hcpSlice";
import { useEffect, useState } from "react";

const INTERACTION_TYPES = [
  "In-Person Visit", "Virtual Meeting", "Phone Call",
  "Email", "Conference/Congress", "Dinner Program", "Lunch & Learn", "Other",
];
const SENTIMENTS = ["Very Positive", "Positive", "Neutral", "Negative", "Very Negative"];
const PRODUCTS = [
  "Keytruda", "Opdivo", "Tecentriq", "Imfinzi", "Libtayo",
  "Humira", "Enbrel", "Dupixent", "Jardiance", "Ozempic",
  "Wegovy", "Entresto", "Farxiga", "Trulicity", "Mounjaro",
];

export default function StructuredForm() {
  const dispatch = useDispatch();
  const { formData, saving, error, successMessage } = useSelector((s) => s.interactions);
  const { list: hcps, loading: hcpsLoading } = useSelector((s) => s.hcps);
  const [productInput, setProductInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchHcps({ limit: 200 }));
  }, [dispatch]);

  const set = (field, value) => dispatch(updateFormField({ field, value }));

  const toggleProduct = (p) => {
    const current = formData.products_discussed || [];
    set(
      "products_discussed",
      current.includes(p) ? current.filter((x) => x !== p) : [...current, p]
    );
  };

  const addCustomProduct = () => {
    const trimmed = productInput.trim();
    if (trimmed && !formData.products_discussed.includes(trimmed)) {
      set("products_discussed", [...formData.products_discussed, trimmed]);
    }
    setProductInput("");
  };

  const validate = () => {
    const e = {};
    if (!formData.hcp_id) e.hcp_id = "Select an HCP";
    if (!formData.interaction_type) e.interaction_type = "Select interaction type";
    if (!formData.interaction_date) e.interaction_date = "Select a date";
    if (!formData.key_points?.trim()) e.key_points = "Add key discussion points";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(clearMessages());

    // Strip empty strings to null so Pydantic doesn't reject optional fields
    const clean = (v) => (v === "" || v === undefined ? null : v);

    dispatch(
      createInteraction({
        hcp_id: formData.hcp_id,
        interaction_type: formData.interaction_type,
        interaction_date: formData.interaction_date,
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
        location: clean(formData.location),
        products_discussed: formData.products_discussed || [],
        key_points: clean(formData.key_points),
        next_steps: clean(formData.next_steps),
        follow_up_date: clean(formData.follow_up_date),
        sentiment: clean(formData.sentiment),
        samples_provided: formData.samples_provided || {},
        objections: clean(formData.objections),
        source: "form",
      })
    ).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        dispatch(resetForm());
        setErrors({});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* ── HCP Search ── */}
      <div style={styles.group}>
        <label style={styles.label}>Healthcare Professional *</label>
        <select
          style={{ ...styles.input, ...(errors.hcp_id ? styles.inputError : {}) }}
          value={formData.hcp_id}
          onChange={(e) => set("hcp_id", e.target.value)}
        >
          <option value="">
            {hcpsLoading ? "Loading HCPs…" : "Search & select HCP"}
          </option>
          {hcps.map((h) => (
            <option key={h.id} value={h.id}>
              Dr. {h.first_name} {h.last_name} — {h.specialty} · {h.institution || "Independent"}
            </option>
          ))}
        </select>
        {errors.hcp_id && <span style={styles.errorText}>{errors.hcp_id}</span>}
      </div>

      {/* ── Two-column row ── */}
      <div style={styles.row}>
        <div style={{ ...styles.group, flex: 1 }}>
          <label style={styles.label}>Interaction Type *</label>
          <select
            style={{ ...styles.input, ...(errors.interaction_type ? styles.inputError : {}) }}
            value={formData.interaction_type}
            onChange={(e) => set("interaction_type", e.target.value)}
          >
            <option value="">Select type</option>
            {INTERACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          {errors.interaction_type && <span style={styles.errorText}>{errors.interaction_type}</span>}
        </div>

        <div style={{ ...styles.group, flex: 1 }}>
          <label style={styles.label}>Date & Time *</label>
          <input
            type="datetime-local"
            style={{ ...styles.input, ...(errors.interaction_date ? styles.inputError : {}) }}
            value={formData.interaction_date}
            onChange={(e) => set("interaction_date", e.target.value)}
          />
          {errors.interaction_date && <span style={styles.errorText}>{errors.interaction_date}</span>}
        </div>
      </div>

      {/* ── Two-column row ── */}
      <div style={styles.row}>
        <div style={{ ...styles.group, flex: 1 }}>
          <label style={styles.label}>Duration (minutes)</label>
          <input
            type="number"
            min="1"
            max="480"
            placeholder="e.g. 30"
            style={styles.input}
            value={formData.duration_minutes}
            onChange={(e) => set("duration_minutes", e.target.value)}
          />
        </div>
        <div style={{ ...styles.group, flex: 1 }}>
          <label style={styles.label}>Location / Institution</label>
          <input
            type="text"
            placeholder="e.g. Mass General Hospital"
            style={styles.input}
            value={formData.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </div>
      </div>

      {/* ── Products ── */}
      <div style={styles.group}>
        <label style={styles.label}>Products Discussed</label>
        <div style={styles.tagGrid}>
          {PRODUCTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleProduct(p)}
              style={{
                ...styles.tag,
                ...(formData.products_discussed?.includes(p) ? styles.tagActive : {}),
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={styles.row}>
          <input
            type="text"
            placeholder="Add custom product…"
            style={{ ...styles.input, flex: 1 }}
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomProduct())}
          />
          <button type="button" onClick={addCustomProduct} style={styles.addBtn}>
            Add
          </button>
        </div>
        {formData.products_discussed?.length > 0 && (
          <div style={styles.selectedTags}>
            {formData.products_discussed.map((p) => (
              <span key={p} style={styles.selectedTag}>
                {p}
                <button type="button" onClick={() => toggleProduct(p)} style={styles.removeTag}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Key Points ── */}
      <div style={styles.group}>
        <label style={styles.label}>Key Discussion Points *</label>
        <textarea
          rows={4}
          placeholder="What were the main topics discussed? Any notable reactions from the HCP?"
          style={{ ...styles.input, resize: "vertical", ...(errors.key_points ? styles.inputError : {}) }}
          value={formData.key_points}
          onChange={(e) => set("key_points", e.target.value)}
        />
        {errors.key_points && <span style={styles.errorText}>{errors.key_points}</span>}
      </div>

      {/* ── Next Steps & Follow-up ── */}
      <div style={styles.row}>
        <div style={{ ...styles.group, flex: 2 }}>
          <label style={styles.label}>Next Steps / Action Items</label>
          <textarea
            rows={3}
            placeholder="e.g. Send clinical trial data, schedule follow-up call…"
            style={{ ...styles.input, resize: "vertical" }}
            value={formData.next_steps}
            onChange={(e) => set("next_steps", e.target.value)}
          />
        </div>
        <div style={{ ...styles.group, flex: 1 }}>
          <label style={styles.label}>Follow-up Date</label>
          <input
            type="date"
            style={styles.input}
            value={formData.follow_up_date}
            onChange={(e) => set("follow_up_date", e.target.value)}
          />
        </div>
      </div>

      {/* ── Sentiment & Objections ── */}
      <div style={styles.row}>
        <div style={{ ...styles.group, flex: 1 }}>
          <label style={styles.label}>Interaction Sentiment</label>
          <div style={styles.sentimentRow}>
            {SENTIMENTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("sentiment", s)}
                style={{
                  ...styles.sentimentBtn,
                  ...(formData.sentiment === s ? styles.sentimentActive : {}),
                  ...(s.includes("Positive") ? { "--accent": "#22c55e" } : {}),
                  ...(s.includes("Negative") ? { "--accent": "#ef4444" } : {}),
                  ...(s === "Neutral" ? { "--accent": "#f59e0b" } : {}),
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>HCP Objections / Concerns</label>
        <textarea
          rows={2}
          placeholder="e.g. Concerned about reimbursement, prefers competitor product…"
          style={{ ...styles.input, resize: "vertical" }}
          value={formData.objections}
          onChange={(e) => set("objections", e.target.value)}
        />
      </div>

      {/* ── Feedback ── */}
      {error && <div style={styles.errorBanner}>{error}</div>}
      {successMessage && <div style={styles.successBanner}>{successMessage}</div>}

      {/* ── Submit ── */}
      <div style={styles.actions}>
        <button
          type="button"
          onClick={() => { dispatch(resetForm()); setErrors({}); dispatch(clearMessages()); }}
          style={styles.cancelBtn}
        >
          Clear
        </button>
        <button type="submit" disabled={saving} style={styles.submitBtn}>
          {saving ? "Saving…" : "Log Interaction"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: { display: "flex", flexDirection: "column", gap: 20 },
  group: { display: "flex", flexDirection: "column", gap: 6 },
  row: { display: "flex", gap: 16, alignItems: "flex-start" },
  label: { fontSize: 13, fontWeight: 600, color: "#374151", letterSpacing: "0.01em" },
  input: {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    padding: "9px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    outline: "none",
    background: "#fff",
    color: "#111827",
    transition: "border-color 0.15s",
    width: "100%",
    boxSizing: "border-box",
  },
  inputError: { borderColor: "#ef4444" },
  errorText: { fontSize: 12, color: "#ef4444" },
  tagGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tag: {
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 20,
    background: "#f9fafb",
    color: "#6b7280",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tagActive: {
    background: "#eff6ff",
    borderColor: "#3b82f6",
    color: "#1d4ed8",
  },
  selectedTags: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
  selectedTag: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: 20,
  },
  removeTag: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#3b82f6",
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
    fontFamily: "Inter, sans-serif",
  },
  addBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    padding: "9px 16px",
    background: "#f3f4f6",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    color: "#374151",
    whiteSpace: "nowrap",
  },
  sentimentRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  sentimentBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fontWeight: 500,
    padding: "6px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 20,
    background: "#f9fafb",
    color: "#6b7280",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  sentimentActive: {
    background: "#f0fdf4",
    borderColor: "#22c55e",
    color: "#15803d",
  },
  errorBanner: {
    padding: "10px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    color: "#dc2626",
    fontSize: 13,
  },
  successBanner: {
    padding: "10px 14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    color: "#15803d",
    fontSize: 13,
    fontWeight: 500,
  },
  actions: { display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 4 },
  cancelBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    fontWeight: 500,
    padding: "10px 20px",
    background: "#f9fafb",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    color: "#6b7280",
  },
  submitBtn: {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: "10px 24px",
    background: "#2563eb",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    color: "#fff",
    transition: "background 0.15s",
  },
};
