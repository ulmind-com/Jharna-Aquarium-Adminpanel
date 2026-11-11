import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { setAuth } from "../auth";
import * as passkey from "../passkey";
import "./Login.css";

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5c2.4 3.4 5.4 5 9 5s6.6-1.6 9-5" />
      <path d="m6.5 14-1.5 2.5" />
      <path d="M12 15.5V18" />
      <path d="m17.5 14 1.5 2.5" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function FingerprintIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 11a2 2 0 0 1 2 2c0 2.5-.6 4.8-1.5 6.8" />
      <path d="M8.5 11.5A3.8 3.8 0 0 1 12 9a3.8 3.8 0 0 1 3.8 3.8c0 2.7-.5 5-1.4 7" />
      <path d="M6.2 14.5A6.5 6.5 0 0 1 12 6.2a6.5 6.5 0 0 1 6.5 6.5c0 2.2-.3 4.2-1 6" />
      <path d="M4.5 11.8A8.8 8.8 0 0 1 12 3.5a8.8 8.8 0 0 1 8.5 6.5" />
      <path d="M9.7 15.2a8 8 0 0 1-1.2 4.3" />
    </svg>
  );
}

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotHint, setForgotHint] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [pkLoading, setPkLoading] = useState(false);
  const canPasskey = passkey.isSupported();

  const passkeyLogin = async () => {
    setErr("");
    setPkLoading(true);
    try {
      const res = await passkey.authenticate();
      if (res.user?.role !== "admin") throw new Error("Not an admin account");
      setAuth(res.access_token, res.user);
      nav("/");
    } catch (e: any) {
      // The user cancelling the OS prompt throws NotAllowedError — stay quiet.
      if (e?.name !== "NotAllowedError" && e?.name !== "AbortError") {
        setErr(e?.message || "Fingerprint sign-in failed.");
      }
    } finally {
      setPkLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setForgotHint(false);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.user.role !== "admin") throw new Error("Not an admin account");
      setAuth(res.access_token, res.user);
      nav("/");
    } catch (e: any) {
      setErr(e.message || "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-scrim" aria-hidden="true" />

      <div className="login-shell">
        <div className="login-left">
          <div className="login-wordmark">Jharna Aquarium</div>

          <div className="login-hero">
            <h1>
              Every big thing
              <br />
              starts small
            </h1>
            <p>Log in and continue growing.</p>
          </div>
        </div>

        <div className="login-card">
          <h2 className="login-title">Log in to your account</h2>

          <form className="login-form" onSubmit={submit}>
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-email">
                Email address
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <MailIcon />
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-field-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>

              <div className="login-forgot-row">
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() => setForgotHint((prev) => !prev)}
                >
                  Forgot your password?
                </button>
              </div>

              {forgotHint && (
                <p className="login-forgot-hint">
                  Contact the store owner to reset your admin password.
                </p>
              )}
            </div>

            {err && <div className="login-err">{err}</div>}

            <button type="submit" className="login-btn" disabled={loading || pkLoading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          {canPasskey && (
            <>
              <div className="login-or">
                <span>or</span>
              </div>
              <button
                type="button"
                className="login-passkey-btn"
                onClick={passkeyLogin}
                disabled={pkLoading || loading}
              >
                <span className="login-passkey-icon">
                  <FingerprintIcon />
                </span>
                <span>{pkLoading ? "Waiting for fingerprint..." : "Sign in with fingerprint"}</span>
              </button>
            </>
          )}

          <div className="login-footer">
            Need admin access? <span className="login-footer-accent">Contact owner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
