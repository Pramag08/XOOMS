import React, { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Container, Box, Typography } from '@mui/material'
import SignInPage from './pages/SignInPage'
import Home from './pages/Home'
import SignUpPage from './pages/SignUpPage'
import { login, me } from './api'

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
})

export default function App() {
  const [user, setUser] = useState<any | null>(null)
  const [view, setView] = useState<'home' | 'login' | 'signup'>('home')

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
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!user ? (
        view === 'home' ? (
          <Home onNavigate={setView} />
        ) : view === 'login' ? (
          <SignInPage
            branding={BRANDING}
            signIn={signIn}
            providers={[]}
            slotProps={{ emailField: { autoFocus: false }, form: { noValidate: true } }}
          />
        ) : (
          <SignUpPage onSignup={setUser} />
        )
      ) : (
        <Container>
          <Container maxWidth="sm">
            <Box sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 1, p: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome,
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Account</Typography>
                <Typography>User ID: {user.user_id}</Typography>
                <Typography>Email: {user.email}</Typography>
                <Typography>Role: {user.role}</Typography>
              </Box>
            </Box>
          </Container>
        </Container>
      )}
    </ThemeProvider>
  )
}
