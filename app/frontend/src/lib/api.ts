export async function apiFetch(path: string, opts: RequestInit = {}) {
  const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const token = localStorage.getItem("sms_token");

  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) } as any;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...opts, headers } as RequestInit);
  if (!res.ok) {
    let errText = await res.text().catch(() => res.statusText || "");
    const e: any = new Error(errText || res.statusText || "API error");
    e.status = res.status;
    e.body = errText;
    throw e;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}
