import React from 'react'
import { Box, Button, Container, Typography, Stack } from '@mui/material'

export default function Home({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <Container sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          StayMadeSimple
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Find and manage stays simply.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Button variant="contained" onClick={() => onNavigate('login')}>Login</Button>
          <Button variant="outlined" onClick={() => onNavigate('signup')}>Sign up</Button>
        </Stack>
      </Box>
    </Container>
  )
}
