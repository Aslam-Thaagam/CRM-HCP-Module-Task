import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, clearAuthError } from "../../store/slices/authSlice";
import styles from "./auth.module.css";

export default function LoginPage({ onSwitch }) {
  const dispatch = useDispatch();
  const { error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  function set(field, val) {
    dispatch(clearAuthError());
    setForm((f) => ({ ...f, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(login(form));
  }

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.logoBox}>T</div>
          <span className={styles.logoName}>CRM HCP Field</span>
        </div>
        <h1 className={styles.brandHeading}>
          Your <span>AI-powered</span> field rep companion
        </h1>
        <p className={styles.brandSub}>
          Log HCP interactions, track follow-ups, and let the AI handle the paperwork — so you can focus on the visit.
        </p>
        <div className={styles.featureList}>
          {[
            "Chat with AI to log visits in seconds",
            "Auto-fills forms from natural language",
            "Understands dates like 'yesterday' or 'last Monday'",
            "Suggests follow-ups based on discussion",
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
          <h2 className={styles.cardTitle}>Welcome back</h2>
          <p className={styles.cardSub}>Sign in to your account to continue</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email address</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              Sign in →
            </button>
          </form>

          <p className={styles.demoHint}>
            No account? Sign up — it only takes a few seconds.
          </p>

          <div className={styles.divider} />

          <p className={styles.switchRow}>
            New here?{" "}
            <button className={styles.switchLink} onClick={onSwitch}>
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
