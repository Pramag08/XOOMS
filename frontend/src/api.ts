const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api'

type ReqOpts = {
  method?: string
  headers?: Record<string, string>
  body?: any
}

async function request(path: string, opts: ReqOpts = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const headers: Record<string, string> = Object.assign({'Content-Type': 'application/json'}, opts.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  const text = await res.text()
  let body: any = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }

  if (!res.ok) {
    const err: any = new Error(body?.detail || `Request failed: ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }
  return body
}

export const api = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body?: any) => request(path, { method: 'POST', body }),
  put: (path: string, body?: any) => request(path, { method: 'PUT', body }),
  del: (path: string) => request(path, { method: 'DELETE' }),
  me: () => request('/me'),
}

export default api
