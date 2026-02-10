import React from 'react'
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function Header({ onLogin, onSignup }: { onLogin?: () => void; onSignup?: () => void }) {
  const navigate = useNavigate()
  return (
    <AppBar position="sticky" color="transparent" elevation={1} sx={{ top: 0, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
      <Toolbar>
        <Typography variant="h6" sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>StayMadeSimple</Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2, alignItems: 'center' }}>
          <Button color="inherit" onClick={() => navigate('/search')}>Find a Stay</Button>
          <Button color="inherit" onClick={() => navigate('/list')}>List Your Property</Button>
          <Button color="inherit" onClick={() => navigate('/about')}>About Us</Button>
        </Box>
        <Box sx={{ ml: 2 }}>
          <Button variant="text" color="inherit" onClick={() => onLogin ? onLogin() : navigate('/login')}>Login</Button>
          <Button variant="outlined" color="inherit" sx={{ ml: 1 }} onClick={() => onSignup ? onSignup() : navigate('/signup')}>Sign up</Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
