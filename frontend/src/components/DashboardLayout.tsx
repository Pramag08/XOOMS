import React, { useState } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import HomeIcon from '@mui/icons-material/Home'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import BusinessIcon from '@mui/icons-material/Business'
import PeopleIcon from '@mui/icons-material/People'

type User = { user_id: number; email: string; role: string }

export default function DashboardLayout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selected, setSelected] = useState<string>('overview')

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  const commonItems = [
    { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
    { id: 'profile', label: 'Profile', icon: <AccountCircleIcon /> },
  ]

  const roleItems = user.role === 'Admin'
    ? [{ id: 'users', label: 'Users', icon: <PeopleIcon /> }, { id: 'bookings', label: 'Bookings', icon: <HomeIcon /> }]
    : user.role === 'Owner'
    ? [{ id: 'properties', label: 'My Properties', icon: <BusinessIcon /> }, { id: 'bookings', label: 'Bookings', icon: <HomeIcon /> }]
    : [{ id: 'explore', label: 'Explore', icon: <HomeIcon /> }, { id: 'mybookings', label: 'My Bookings', icon: <HomeIcon /> }]

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">Dashboard</Typography>
      </Toolbar>
      <Divider />
      <List>
        {commonItems.map((it) => (
          <ListItem key={it.id} disablePadding>
            <ListItemButton selected={selected === it.id} onClick={() => setSelected(it.id)}>
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText primary={it.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {roleItems.map((it) => (
          <ListItem key={it.id} disablePadding>
            <ListItemButton selected={selected === it.id} onClick={() => setSelected(it.id)}>
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText primary={it.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <Button variant="outlined" color="inherit" fullWidth onClick={onLogout}>Logout</Button>
      </Box>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            StayMadeSimple — {user.role}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }} aria-label="mailbox folders">
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {selected === 'overview' && <Typography>Overview content for {user.email}</Typography>}
        {selected === 'profile' && <Typography>Profile: {JSON.stringify(user)}</Typography>}
        {selected === 'users' && <Typography>Admin: manage users</Typography>}
        {selected === 'bookings' && <Typography>Bookings list</Typography>}
        {selected === 'properties' && <Typography>Owner: properties list</Typography>}
        {selected === 'explore' && <Typography>Explore available properties</Typography>}
        {selected === 'mybookings' && <Typography>Your bookings</Typography>}
        {selected === 'users' && <Typography>Users management</Typography>}
      </Box>
    </Box>
  )
}
