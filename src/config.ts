const raw = import.meta.env.VITE_API_URL;
// Falls back to the deployed API so a hosted build with no VITE_API_URL
// still reaches the backend instead of a localhost that isn't there.
export const API_URL: string =
  raw?.replace(/\/+$/, "") || "https://jharna-aquarium-backend.onrender.com";

const storefrontRaw = import.meta.env.VITE_STOREFRONT_URL;
export const STOREFRONT_URL: string =
  storefrontRaw?.replace(/\/+$/, "") ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8080"
    : "https://jharna-aquarium-frontend.vercel.app");

export function resolveStorefrontAsset(src?: string | null): string {
  if (!src) return "";
  if (src.startsWith("/images/") || src.startsWith("/places/")) {
    return `${STOREFRONT_URL}${src}`;
  }
  return src;
}
