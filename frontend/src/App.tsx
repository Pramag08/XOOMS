import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import SignInPage from './pages/SignInPage'
import Home from './pages/Home'
import SearchPage from './pages/SearchPage'
import SignUpPage from './pages/SignUpPage'
import { login, me } from './api'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6EE7B7',
      contrastText: '#03111A',
    },
    secondary: {
      main: '#60A5FA',
    },
    background: {
      default: '#081216',
      paper: '#0E1A1E',
    },
    text: {
      primary: '#E6F6F0',
      secondary: 'rgba(230,246,240,0.7)',
    },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { padding: 12 },
        elevation6: { boxShadow: '0 8px 30px rgba(2,6,23,0.6)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
        containedPrimary: { boxShadow: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, overflow: 'hidden' },
      },
    },
  },
})

export default function App() {
  const [user, setUser] = useState<any | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  const BRANDING = {
    logo: (
      <img src="/home.svg" alt="Home logo" style={{ height: 28 }} />
    ),
    title: 'StayMadeSimple',
  }

  const signIn = async ({ email, password, provider }: { email?: string; password?: string; provider?: string }) => {
    if (provider && provider !== 'credentials') {
      throw new Error('External providers not implemented')
    }
    if (!email || !password) throw new Error('Email and password required')
    const data = await login(email, password)
    if (data?.access_token) {
      localStorage.setItem('token', data.access_token)
      const u = await me()
      setUser(u)
      // redirect to search after login
      setShowSearch(true)
      localStorage.setItem('showSearch', '1')
      // navigate to search
      window.location.href = '/search'
    }
  }

  // restore session on load
  useEffect(() => {
    const token = localStorage.getItem('token')
    const flagged = localStorage.getItem('showSearch') === '1'
    if (token && flagged) {
      // attempt to fetch current user
      ;(async () => {
        try {
          const u = await me()
          setUser(u)
          setShowSearch(true)
        } catch (e) {
          // ignore — user will need to login
        }
      })()
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home onNavigate={(viewOrPath: any, opts?: any) => {
            // allow previous contract: Home may call onNavigate('login'|'signup') or onNavigate('search', params)
            if (viewOrPath === 'login') return window.location.href = '/login'
            if (viewOrPath === 'signup') return window.location.href = '/signup'
            if (viewOrPath === 'search') {
              const sp = new URLSearchParams(opts || {})
              window.location.href = '/search' + (sp.toString() ? `?${sp.toString()}` : '')
            }
          }} />} />
          <Route path="/login" element={<SignInPage branding={BRANDING} signIn={signIn} providers={[]} slotProps={{ emailField: { autoFocus: false }, form: { noValidate: true } }} />} />
          <Route path="/signup" element={<SignUpPage onSignup={setUser} />} />
          <Route path="/search" element={<SearchPage user={user} onBack={() => { window.history.back() }} onLogout={() => { localStorage.removeItem('token'); setUser(null); localStorage.removeItem('showSearch'); window.location.href = '/' }} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
