/**
 * Super-admin fingerprint / Face ID / passkey sign-in — server-backed.
 *
 * The WebAuthn ceremony is verified by the backend (py_webauthn) and credentials
 * live server-side against the super-admin's account, so a passkey added on one
 * device works on the owner's other synced devices too, and usernameless
 * (discoverable) login needs no email or password.
 *
 * Only the owner / super admin can register or sign in this way — the backend
 * refuses to mint a token for any account that isn't role "admin" + is_super.
 *
 * Flow:
 *   register():      signed in with the password, ask the server for options,
 *                    run the platform authenticator, send the result back.
 *   authenticate():  usernameless — ask the server for options, run the
 *                    authenticator, send the assertion; the server verifies it
 *                    and returns a fresh admin token + the user object.
 */
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { api } from "./api";
import { API_URL } from "./config";

export function isSupported(): boolean {
  return typeof window !== "undefined" && browserSupportsWebAuthn();
}

export async function isPlatformAvailable(): Promise<boolean> {
  if (!isSupported()) return false;
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

/** A readable default name for the device the passkey is being added on. */
export function deviceLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android phone";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  return "This device";
}

export type Credential = {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string;
};

/** Register a new passkey for the signed-in super admin (password session). */
export async function register(label?: string): Promise<void> {
  if (!isSupported()) throw new Error("This browser does not support passkeys.");
  const optionsJSON = await api.post<any>("/admin/webauthn/register/options");
  const regResp = await startRegistration({ optionsJSON });
  // The credential goes under `response` so the backend's body.response read
  // sees the top-level `id`, not the inner attestation `response`.
  await api.post("/admin/webauthn/register/verify", { response: regResp, label: label || deviceLabel() });
}

/** Usernameless fingerprint login → returns a fresh admin token + user. */
export async function authenticate(): Promise<{ access_token: string; user: any }> {
  if (!isSupported()) throw new Error("This browser does not support passkeys.");

  // Direct fetch (not the shared api helper): these endpoints take no token,
  // and the helper's 401 handler would force a logout redirect on a failed
  // passkey attempt instead of surfacing the error here.
  const optRes = await fetch(`${API_URL}/admin/webauthn/login/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const opt = await optRes.json().catch(() => null);
  if (!optRes.ok) throw new Error(opt?.detail ? String(opt.detail) : "Could not start passkey sign-in.");

  const authResp = await startAuthentication({ optionsJSON: opt.options });

  const verRes = await fetch(`${API_URL}/admin/webauthn/login/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: opt.challenge_id, response: authResp }),
  });
  const ver = await verRes.json().catch(() => null);
  if (!verRes.ok) throw new Error(ver?.detail ? String(ver.detail) : "Passkey sign-in failed.");
  return ver;
}

/** List the super admin's registered passkeys (password session required). */
export async function listCredentials(): Promise<Credential[]> {
  const res = await api.get<{ credentials: Credential[]; count: number }>("/admin/webauthn/credentials");
  return res.credentials;
}

/** Remove one registered passkey (password session required). */
export async function removeCredential(id: string): Promise<void> {
  await api.del(`/admin/webauthn/credentials/${encodeURIComponent(id)}`);
}
