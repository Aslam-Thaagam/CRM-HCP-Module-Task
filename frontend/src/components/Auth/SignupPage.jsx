import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signup, clearAuthError } from "../../store/slices/authSlice";
import styles from "./auth.module.css";

export default function SignupPage({ onSwitch }) {
  const dispatch = useDispatch();
  const { error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState("");

  function set(field, val) {
    dispatch(clearAuthError());
    setLocalError("");
    setForm((f) => ({ ...f, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setLocalError("Passwords don't match.");
      return;
    }
    dispatch(signup({ name: form.name, email: form.email, password: form.password }));
  }

  const displayError = localError || error;

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.logoBox}>T</div>
          <span className={styles.logoName}>Thaagam Field</span>
        </div>
        <h1 className={styles.brandHeading}>
          Built for <span>field reps</span> who move fast
        </h1>
        <p className={styles.brandSub}>
          Stop spending 20 minutes filling in visit reports. Just tell the AI what happened — it does the rest.
        </p>
        <div className={styles.featureList}>
          {[
            "Natural language interaction logging",
            "AI extracts HCP name, date, topics, sentiment",
            "Relative dates — 'yesterday', 'last Tuesday'",
            "One-click save from chat to database",
          ].map((f) => (
            <div key={f} className={styles.featureItem}>
              <span className={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Create your account</h2>
          <p className={styles.cardSub}>Free to use — takes 30 seconds</p>

          {displayError && <div className={styles.errorBox}>{displayError}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Full name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Thaagam Rep"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Work email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Confirm password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              Create account →
            </button>
          </form>

          <div className={styles.divider} />

          <p className={styles.switchRow}>
            Already have an account?{" "}
            <button className={styles.switchLink} onClick={onSwitch}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
