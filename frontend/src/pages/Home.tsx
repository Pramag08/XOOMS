import React, { useState } from 'react'
import { Box, Button, Container, Typography, Stack, Grid, Paper, TextField, MenuItem } from '@mui/material'
import Header from '../components/Header'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'

const CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Chennai']
const TYPES = ['Guest House', 'Boys PG', 'Girls PG', 'Serviced Apartment']

export default function Home({ onNavigate }: { onNavigate: (view: string, opts?: any) => void }) {
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const doSearch = () => {
    const params: any = {}
    if (city) params.city = city
    if (type) params.property_type = type
    if (from) params.available_from = from
    if (to) params.available_to = to
    onNavigate && onNavigate('search', params)
  }

  return (
    <Box>
      <Header onLogin={() => onNavigate('login')} onSignup={() => onNavigate('signup')} />
      <Box
        sx={{
          minHeight: { xs: '72vh', md: '80vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `linear-gradient(180deg, rgba(3,6,10,0.5), rgba(3,6,10,0.45)), url('/bgimage.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'common.white',
          position: 'relative'
        }}
      >
        <Container sx={{ position: 'relative', zIndex: 2 }}>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Paper sx={{ bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)', p: { xs: 2, md: 3 }, borderRadius: 3, width: '100%', maxWidth: 900 }} elevation={6}>
              <Typography variant="h3" component="h1" sx={{ textAlign: 'center', fontWeight: 700, mb: 1 }}>Find Your Perfect Stay</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>Discover verified guest houses, PGs, and serviced apartments across India.</Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField select size="small" fullWidth value={city} onChange={(e) => setCity(e.target.value)} placeholder="City">
                    <MenuItem value="">Any city</MenuItem>
                    {CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select size="small" fullWidth value={type} onChange={(e) => setType(e.target.value)} placeholder="Property type">
                    <MenuItem value="">Any type</MenuItem>
                    {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField size="small" fullWidth type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" fullWidth type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Button variant="contained" size="large" startIcon={<SearchIcon />} onClick={doSearch}>Search</Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Simple features below hero */}
      <Container sx={{ py: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Why users love StayMadeSimple
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6">Easily discover</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Powerful search and filters help you find properties that match your needs.</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6">Verified listings</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Each property is verified and rated so you can book with confidence.</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6">Simple management</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Manage bookings, communicate with hosts, and leave reviews — all in one place.</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
