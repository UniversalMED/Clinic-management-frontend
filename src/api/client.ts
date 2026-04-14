import axios from 'axios'
import { supabase } from '@/lib/supabase'

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// ---------------------------------------------------------------------------
// Token cache — avoids an async getSession() call on every request.
// Supabase fires onAuthStateChange whenever the session changes or refreshes,
// so this cache is always current.
// ---------------------------------------------------------------------------

let _token: string | null = null
let _tokenExpiry: number = 0  // unix seconds

supabase.auth.onAuthStateChange((_event, session) => {
  _token = session?.access_token ?? null
  _tokenExpiry = session?.expires_at ?? 0
})

async function getToken(): Promise<string | null> {
  const nowSecs = Math.floor(Date.now() / 1000)
  // Use cache if token exists and is valid for at least 60 more seconds
  if (_token && nowSecs < _tokenExpiry - 60) return _token

  // Cache miss or near-expiry — ask Supabase (it will auto-refresh if needed)
  const { data } = await supabase.auth.getSession()
  _token = data.session?.access_token ?? null
  _tokenExpiry = data.session?.expires_at ?? 0
  return _token
}

client.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      _token = null
      _tokenExpiry = 0
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client
