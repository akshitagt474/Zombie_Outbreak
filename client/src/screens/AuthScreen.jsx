/**
 * AUTH SCREEN — Step 4B
 *
 * Login / Register screen using registration number + username.
 * Replaces the simple name input from Step 3's MenuScreen.
 *
 * Two modes:
 *   "login"    — existing player signs in with reg number + password
 *   "register" — new player creates account with reg + username + password
 */

import { useState } from "react";
import { C }        from "../constants.js";
import { validateRegNumber, validateUsername } from "../api/auth.js";

export default function AuthScreen({ onAuth, authError, authLoading }) {
  const [mode,     setMode]     = useState("login");
  const [reg,      setReg]      = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});

  const isLogin    = mode === "login";
  const isRegister = mode === "register";

  function validate() {
    const e = {};
    if (!validateRegNumber(reg))
      e.reg = "Enter a valid registration number (letters and numbers only)";
    if (isRegister && !validateUsername(username))
      e.username = "Username must be 2–24 characters (letters, numbers, @, _)";
    if (password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isLogin) {
      onAuth({ mode: "login", regNumber: reg.trim(), password });
    } else {
      onAuth({ mode: "register", regNumber: reg.trim(), username: username.trim(), password });
    }
  }

  return (
    <div style={S.page}>
      <GridBg />
      <div style={S.center}>

        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <div style={S.badge}>CDC CRISIS RESPONSE SYSTEM</div>
          <h1 style={S.title}>ZOMBIE<br />OUTBREAK</h1>
          <p style={S.sub}>BFS CONTAINMENT PROTOCOL</p>
        </div>

        {/* Auth card */}
        <div style={S.card}>

          {/* Mode toggle */}
          <div style={S.toggle}>
            <button
              onClick={() => { setMode("login"); setErrors({}); }}
              style={{ ...S.toggleBtn, ...(isLogin ? S.toggleActive : {}) }}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setMode("register"); setErrors({}); }}
              style={{ ...S.toggleBtn, ...(isRegister ? S.toggleActive : {}) }}
            >
              REGISTER
            </button>
          </div>

          {/* Registration number */}
          <Field
            label="REGISTRATION NUMBER"
            placeholder="e.g. 22CS1001"
            value={reg}
            onChange={v => { setReg(v.toUpperCase()); setErrors(e => ({ ...e, reg: null })); }}
            error={errors.reg}
            autoFocus
            onEnter={handleSubmit}
          />

          {/* Username — register only */}
          {isRegister && (
            <Field
              label="USERNAME"
              placeholder="Your display name on leaderboard"
              value={username}
              onChange={v => { setUsername(v); setErrors(e => ({ ...e, username: null })); }}
              error={errors.username}
              onEnter={handleSubmit}
            />
          )}

          {/* Password */}
          <Field
            label="PASSWORD"
            placeholder={isRegister ? "Create a password (min 6 chars)" : "Enter your password"}
            value={password}
            onChange={v => { setPassword(v); setErrors(e => ({ ...e, password: null })); }}
            error={errors.password}
            type={showPass ? "text" : "password"}
            onEnter={handleSubmit}
            suffix={
              <button
                onClick={() => setShowPass(s => !s)}
                style={S.showPass}
                type="button"
              >
                {showPass ? "HIDE" : "SHOW"}
              </button>
            }
          />

          {/* Firebase error */}
          {authError && (
            <div style={S.errorBox}>
              ⚠ {authError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={authLoading}
            style={{ ...S.submitBtn, opacity: authLoading ? 0.6 : 1 }}
          >
            {authLoading
              ? "⟳ CONNECTING..."
              : isLogin
              ? "▶ DEPLOY TO FIELD"
              : "▶ CREATE ACCOUNT"}
          </button>

          {/* Mode hint */}
          <div style={S.hint}>
            {isLogin
              ? "New operative? "
              : "Already registered? "}
            <button
              onClick={() => { setMode(isLogin ? "register" : "login"); setErrors({}); }}
              style={S.hintBtn}
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </div>

        </div>

        {/* Info */}
        <div style={S.info}>
          Your registration number identifies you on the global leaderboard.
        </div>
      </div>
    </div>
  );
}

// ─── FIELD COMPONENT ─────────────────────────────────────────────

function Field({ label, placeholder, value, onChange, error, type = "text", onEnter, autoFocus, suffix }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
      <label style={S.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          autoFocus={autoFocus}
          onKeyDown={e => e.key === "Enter" && onEnter?.()}
          style={{
            ...S.input,
            borderColor: error ? C.danger : C.panelBorder,
            paddingRight: suffix ? 70 : 14,
          }}
        />
        {suffix && <div style={S.suffix}>{suffix}</div>}
      </div>
      {error && <div style={S.fieldError}>{error}</div>}
    </div>
  );
}

// ─── BG ──────────────────────────────────────────────────────────

function GridBg() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: `linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),
                        linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)`,
      backgroundSize: "48px 48px",
    }} />
  );
}

// ─── STYLES ──────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh", background: C.bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24, position: "relative",
    fontFamily: "'Rajdhani', sans-serif", color: C.text,
  },
  center: {
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: 440,
    display: "flex", flexDirection: "column", gap: 20,
  },
  badge: {
    fontSize: 10, letterSpacing: 6, color: C.accent,
    fontFamily: "'Share Tech Mono',monospace", marginBottom: 10,
    textAlign: "center",
  },
  title: {
    fontSize: "clamp(2.8rem,9vw,4.5rem)", fontWeight: 700,
    lineHeight: 0.88, letterSpacing: -3, color: C.text,
    textShadow: `0 0 40px ${C.danger}33`,
    margin: "0 0 10px", textAlign: "center",
  },
  sub: {
    fontSize: 11, letterSpacing: 5, color: C.dim,
    fontFamily: "'Share Tech Mono',monospace",
    margin: 0, textAlign: "center",
  },
  card: {
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 14, padding: "22px 24px",
    display: "flex", flexDirection: "column", gap: 14,
  },
  toggle: {
    display: "flex", gap: 0,
    background: "#070d14", borderRadius: 8,
    border: `1px solid ${C.panelBorder}`,
    overflow: "hidden", marginBottom: 4,
  },
  toggleBtn: {
    flex: 1, padding: "10px", border: "none", background: "transparent",
    color: C.dim, cursor: "pointer",
    fontFamily: "'Share Tech Mono',monospace",
    fontSize: 12, letterSpacing: 2,
    transition: "all 0.15s",
  },
  toggleActive: {
    background: `${C.accent}22`,
    color: C.accent,
    borderBottom: `2px solid ${C.accent}`,
  },
  label: {
    fontSize: 9, letterSpacing: 4, color: C.dim,
    fontFamily: "'Share Tech Mono',monospace",
  },
  input: {
    width: "100%", padding: "11px 14px",
    borderRadius: 8, border: "1px solid",
    background: "#070d14", color: C.text,
    fontSize: 15, fontFamily: "'Rajdhani',sans-serif",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  suffix: {
    position: "absolute", right: 10,
    top: "50%", transform: "translateY(-50%)",
  },
  showPass: {
    background: "transparent", border: "none",
    color: C.dim, cursor: "pointer",
    fontFamily: "'Share Tech Mono',monospace",
    fontSize: 10, letterSpacing: 1, padding: 4,
  },
  fieldError: {
    fontSize: 11, color: C.danger, lineHeight: 1.4,
  },
  errorBox: {
    background: `${C.danger}11`, border: `1px solid ${C.danger}44`,
    borderRadius: 8, padding: "10px 12px",
    fontSize: 12, color: C.danger, lineHeight: 1.5,
  },
  submitBtn: {
    width: "100%", padding: "13px",
    borderRadius: 10, border: `1px solid ${C.accent}`,
    background: `${C.accent}22`, color: C.accent,
    fontSize: 16, fontWeight: 700, letterSpacing: 3,
    fontFamily: "'Rajdhani',sans-serif",
    cursor: "pointer", transition: "all 0.15s",
    marginTop: 4,
  },
  hint: {
    fontSize: 12, color: C.dim, textAlign: "center",
    fontFamily: "'Rajdhani',sans-serif",
  },
  hintBtn: {
    background: "none", border: "none",
    color: C.accent, cursor: "pointer",
    fontSize: 12, fontFamily: "'Rajdhani',sans-serif",
    textDecoration: "underline", padding: 0,
  },
  info: {
    fontSize: 11, color: C.textMuted,
    fontFamily: "'Share Tech Mono',monospace",
    letterSpacing: 1, textAlign: "center",
  },
};