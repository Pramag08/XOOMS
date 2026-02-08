import React, { useState } from 'react'
import {
  Box,
  Paper,
  Avatar,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

type Provider = { id: string; name: string }

type Props = {
  branding?: { logo?: React.ReactNode; title?: string }
  signIn: (payload: { email?: string; password?: string; provider?: string }) => Promise<any>
  providers?: Provider[]
  slotProps?: any
}

export default function SignInPage({ branding, signIn, providers = [], slotProps }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    try {
      await signIn({ email, password, provider: 'credentials' })
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || String(err))
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/bgimage.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        sx={{ width: 420, p: 4, bgcolor: 'rgba(0,0,0,0.6)', color: 'common.white' }}
        elevation={6}
        component="form"
        onSubmit={handleSubmit}
        {...(slotProps?.form || {})}
      >
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Login
          </Typography>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="filled"
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.8)' } }}
            sx={{ input: { color: 'common.white' } }}
            {...(slotProps?.emailField || {})}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="filled"
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.8)' } }}
            sx={{ input: { color: 'common.white' } }}
          />

          <Button type="submit" fullWidth variant="contained">
            Sign in
          </Button>

          <Divider sx={{ width: '100%' }} />

          {providers.length > 0 && (
            <Stack spacing={1} sx={{ width: '100%' }}>
              {providers.map((p) => (
                <Button key={p.id} variant="outlined" onClick={() => signIn({ provider: p.id })}>
                  Sign in with {p.name}
                </Button>
              ))}
            </Stack>
          )}

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
