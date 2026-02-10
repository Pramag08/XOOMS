import React from 'react'
import { AppBar, Toolbar, IconButton, Typography, Box, InputBase, Menu, MenuItem, Avatar } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import FilterListIcon from '@mui/icons-material/FilterList'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchIcon from '@mui/icons-material/Search'

export default function TopNav({ title, onBack, onProfile, onToggleFilters, onLogout, onProfileNavigate }: { title?: string; onBack?: () => void; onProfile?: (e: any) => void; onToggleFilters?: () => void; onLogout?: () => void; onProfileNavigate?: (a: string) => void }) {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [query, setQuery] = React.useState('')
  const handleProfileClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }
  const handleClose = () => setAnchorEl(null)

  return (
    <AppBar position="sticky" color="transparent" elevation={1} sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, top: 0, zIndex: (t) => t.zIndex.appBar }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flex: '0 0 auto', mr: 2 }}>{title ?? 'Search'}</Typography>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', px: 1, py: 0.5, borderRadius: 1 }}>
          <SearchIcon color="action" sx={{ mr: 1 }} />
          <InputBase fullWidth placeholder="Search properties, city, or features" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`) } }} />
        </Box>

        <IconButton sx={{ ml: 2, display: { xs: 'inline-flex', md: 'none' } }} onClick={onToggleFilters} aria-label="Toggle filters">
          <FilterListIcon />
        </IconButton>

        <IconButton sx={{ ml: 2 }} onClick={handleProfileClick}>
          <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
        </IconButton>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem onClick={() => { handleClose(); navigate('/profile') }}>Profile</MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/mybookings') }}>My Bookings</MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/properties') }}>My Properties</MenuItem>
          <MenuItem onClick={() => { handleClose(); onLogout && onLogout() }}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
