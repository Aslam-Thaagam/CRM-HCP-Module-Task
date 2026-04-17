import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHCPs, createHCP, clearHCPError, clearSaveSuccess } from "../../store/slices/hcpSlice";
import styles from "./hcps.module.css";

const SPECIALTIES = [
  "Cardiology", "Oncology", "Neurology", "Endocrinology", "Psychiatry",
  "Dermatology", "Gastroenterology", "Pulmonology", "Rheumatology", "General Practice", "Other",
];

const SPECIALTY_COLORS = {
  Cardiology: { bg: "#fef3c7", color: "#92400e" },
  Oncology: { bg: "#fce7f3", color: "#9d174d" },
  Neurology: { bg: "#ede9fe", color: "#5b21b6" },
  Endocrinology: { bg: "#dcfce7", color: "#166534" },
  Psychiatry: { bg: "#e0f2fe", color: "#075985" },
  Dermatology: { bg: "#fff1f2", color: "#9f1239" },
  Gastroenterology: { bg: "#fef9c3", color: "#713f12" },
  Pulmonology: { bg: "#dbeafe", color: "#1e3a8a" },
  Rheumatology: { bg: "#f0fdf4", color: "#14532d" },
  "General Practice": { bg: "#f1f5f9", color: "#334155" },
};

const EMPTY_FORM = {
  first_name: "", last_name: "", specialty: "", institution: "",
  email: "", phone: "",
};

function initials(firstName = "", lastName = "") {
  return ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "?";
}

export default function HCPsPage() {
  const dispatch = useDispatch();
  const { list, loading, saving, saveSuccess, error } = useSelector((s) => s.hcps);
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchHCPs());
  }, [dispatch]);

  useEffect(() => {
    if (saveSuccess) {
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      setFormError("");
      dispatch(clearSaveSuccess());
    }
  }, [saveSuccess, dispatch]);

  function setField(f, v) {
    dispatch(clearHCPError());
    setFormError("");
    setForm((prev) => ({ ...prev, [f]: v }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError("First name and last name are required.");
      return;
    }
    dispatch(createHCP({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      specialty: form.specialty || null,
      institution: form.institution || null,
      email: form.email || null,
      phone: form.phone || null,
    }));
  }

  const allSpecialties = ["All", ...new Set(list.map((h) => h.specialty).filter(Boolean))];

  const filtered = list.filter((h) => {
    const name = `${h.first_name} ${h.last_name}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) ||
      (h.institution || "").toLowerCase().includes(search.toLowerCase()) ||
      (h.specialty || "").toLowerCase().includes(search.toLowerCase());
    const matchSpec = filterSpecialty === "All" || h.specialty === filterSpecialty;
    return matchSearch && matchSpec;
  });

  const sc = SPECIALTY_COLORS;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>Healthcare Professionals</h1>
          <p>Manage your HCP contacts and engagement history</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setShowForm(true); dispatch(clearHCPError()); }}>
          + Add HCP
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{list.length}</div>
          <div className={styles.statLabel}>Total HCPs</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {new Set(list.map((h) => h.specialty).filter(Boolean)).size}
          </div>
          <div className={styles.statLabel}>Specialties</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {new Set(list.map((h) => h.institution).filter(Boolean)).size}
          </div>
          <div className={styles.statLabel}>Institutions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{list.filter((h) => h.is_active !== 0).length}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search by name, specialty, or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch("")}>×</button>
          )}
        </div>
        <div className={styles.specFilters}>
          {allSpecialties.map((s) => (
            <button
              key={s}
              className={`${styles.specChip} ${filterSpecialty === s ? styles.specChipActive : ""}`}
              onClick={() => setFilterSpecialty(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading && <p className={styles.emptyState}>Loading HCPs...</p>}
      {!loading && filtered.length === 0 && (
        <div className={styles.emptyState}>
          {list.length === 0
            ? "No HCPs added yet. Click \"+ Add HCP\" to get started."
            : "No HCPs match your search."}
        </div>
      )}

      {filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((hcp) => {
            const clr = sc[hcp.specialty] || { bg: "#f1f5f9", color: "#334155" };
            return (
              <div key={hcp.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.avatar}>{initials(hcp.first_name, hcp.last_name)}</div>
                  <div className={styles.nameBlock}>
                    <div className={styles.hcpName}>
                      Dr. {hcp.first_name} {hcp.last_name}
                    </div>
                    {hcp.institution && (
                      <div className={styles.institution}>🏥 {hcp.institution}</div>
                    )}
                  </div>
                </div>

                {hcp.specialty && (
                  <span
                    className={styles.specialtyBadge}
                    style={{ background: clr.bg, color: clr.color }}
                  >
                    {hcp.specialty}
                  </span>
                )}

                <div className={styles.contactRow}>
                  {hcp.email && (
                    <a className={styles.contactItem} href={`mailto:${hcp.email}`}>
                      ✉️ {hcp.email}
                    </a>
                  )}
                  {hcp.phone && (
                    <a className={styles.contactItem} href={`tel:${hcp.phone}`}>
                      📞 {hcp.phone}
                    </a>
                  )}
                  {!hcp.email && !hcp.phone && (
                    <span className={styles.noContact}>No contact info</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add HCP modal */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New HCP</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>×</button>
            </div>

            {(formError || error) && (
              <div className={styles.errorBox}>{formError || error}</div>
            )}

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>First name *</label>
                  <input className={styles.input} value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)} placeholder="Arjun" />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Last name *</label>
                  <input className={styles.input} value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)} placeholder="Sharma" />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Specialty</label>
                  <select className={styles.select} value={form.specialty}
                    onChange={(e) => setField("specialty", e.target.value)}>
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Institution</label>
                  <input className={styles.input} value={form.institution}
                    onChange={(e) => setField("institution", e.target.value)} placeholder="Apollo Hospital" />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email</label>
                  <input type="email" className={styles.input} value={form.email}
                    onChange={(e) => setField("email", e.target.value)} placeholder="doctor@hospital.com" />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Phone</label>
                  <input className={styles.input} value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnGhost} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? "Saving..." : "Add HCP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
