const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  display_name?: string;
  welcome?: string;
}

// Use sessionStorage instead of localStorage for privacy
// Session storage is automatically cleared when the browser tab/window is closed
export function storeAuth(res: AuthResponse) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("access_token", res.access_token);
  if (res.display_name) {
    sessionStorage.setItem("display_name", res.display_name);
  }
  if (res.welcome) {
    sessionStorage.setItem("welcome", res.welcome);
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("display_name");
  sessionStorage.removeItem("welcome");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("access_token");
}

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("display_name");
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error || "Registration failed");
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error || "Login failed");
  }
  return res.json();
}

