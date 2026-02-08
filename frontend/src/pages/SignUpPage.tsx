import React, { useState } from 'react'
import { Box, Paper, TextField, Button, Stack, Typography } from '@mui/material'
import { signup, me } from '../api'

export default function SignUpPage({ onSignup }: { onSignup: (user: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('User')
  const [error, setError] = useState<string | null>(null)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const data = await signup({ email, password, full_name: fullName, role })
      if (data?.access_token) {
        localStorage.setItem('token', data.access_token)
        const u = await me()
        onSignup(u)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || String(err))
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <Paper sx={{ width: 480, p: 4 }} elevation={3} component="form" onSubmit={handle}>
        <Stack spacing={2}>
          <Typography variant="h6">Create account</Typography>
          {error && <Typography color="error">{error}</Typography>}
          <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" fullWidth />
          <TextField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" fullWidth />
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained">Sign up</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
