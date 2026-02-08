import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function login(email: string, password: string) {
  const res = await client.post('/login', { email, password })
  return res.data
}

export async function me() {
  const res = await client.get('/me')
  return res.data
}

export async function signup(payload: { email: string; password: string; full_name: string; role: string }) {
  const res = await client.post('/signup', payload)
  return res.data
}

export default client
