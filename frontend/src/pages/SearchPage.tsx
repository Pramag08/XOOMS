import React, { useEffect, useState, useRef } from 'react'
import { Box, Container, Grid, Paper, Typography, Button, Divider, useMediaQuery } from '@mui/material'
import TopNav from '../components/TopNav'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import FiltersSidebar from '../components/FiltersSidebar'
import PropertyCard from '../components/PropertyCard'
import { searchProperties } from '../api'

export default function SearchPage({ user, onBack, onLogout }: { user: any; onBack?: () => void; onLogout?: () => void }) {
  const [results, setResults] = useState<any[] | null>(null)
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isMdUp = useMediaQuery((theme: any) => theme.breakpoints.up('md'))
  const asideRef = useRef<HTMLDivElement | null>(null)
  const [asideLeft, setAsideLeft] = useState<number | null>(null)
  const [asideWidth, setAsideWidth] = useState<number | null>(240)

  // detect a hard reload and clear search params on reload so URL becomes clean
  useEffect(() => {
    try {
      const navEntries = (performance && (performance.getEntriesByType ? performance.getEntriesByType('navigation') : [])) as PerformanceNavigationTiming[]
      const navType = navEntries && navEntries.length > 0 ? navEntries[0].type : (performance as any).navigation?.type === 1 ? 'reload' : null
      if (navType === 'reload') {
        // replace current entry with same path but no search to avoid extra history entry
        navigate(location.pathname, { replace: true })
      }
    } catch (e) {
      // ignore if Performance API not available
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // read search params and run search; use sessionStorage cache keyed by params
  useEffect(() => {
    let mounted = true
    const params: Record<string, any> = {}
    searchParams.forEach((v, k) => {
      if (k === 'min_price' || k === 'max_price' || k === 'min_rating') params[k] = Number(v)
      else if (k === 'available') params[k] = v === 'true'
      else params[k] = v
    })

    const key = `search:${decodeURIComponent(searchParams.toString())}`
    const cached = sessionStorage.getItem(key)
    if (cached) {
      try { setResults(JSON.parse(cached)) } catch (e) { /* ignore */ }
    }

    ;(async () => {
      try {
        const res = await searchProperties(params)
        if (mounted) {
          setResults(Array.isArray(res) ? res : [])
          try { sessionStorage.setItem(key, JSON.stringify(res)) } catch (e) { /* ignore */ }
        }
      } catch (e) {
        if (mounted) setResults([])
      }
    })()

    return () => { mounted = false }
  }, [searchParams])

  // measure aside position/width for fixed positioning on md+ screens
  useEffect(() => {
    function measure() {
      if (!asideRef.current) return
      const r = asideRef.current.getBoundingClientRect()
      setAsideLeft(r.left)
      setAsideWidth(r.width)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isMdUp, filtersOpen])

  const onFiltersChange = async (params: Record<string, any>) => {
    // merge incoming params with existing search params so filters compose
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') {
        sp.delete(k)
      } else {
        sp.set(k, String(v))
      }
    })
    setSearchParams(sp)
  }

  return (
    <Box>
      <TopNav title="Search properties" onBack={onBack} onToggleFilters={() => setFiltersOpen((s) => !s)} onLogout={onLogout} onProfileNavigate={(a) => { /* could open profile modal */ }} onSearch={(q) => onFiltersChange({ ...(q ? { q } : {}) })} />
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, px: { xs: 2, md: 4 }, py: 3, height: { xs: 'auto', md: 'calc(100vh - 72px)' } }}>
        {/* Left sidebar column (measured) */}
        <Box component="aside" ref={asideRef} sx={{ width: { xs: '100%', md: filtersOpen ? 240 : 0 }, flexShrink: 0, display: { xs: filtersOpen ? 'block' : 'none', md: 'block' } }}>
          {/* Reserve layout space; on md+ we'll render the actual panel fixed using measured left/width */}
          {!isMdUp && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Filters</Typography>
              <Divider sx={{ my: 1 }} />
              <FiltersSidebar onChange={onFiltersChange} />
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" fullWidth onClick={() => setSearchParams(new URLSearchParams())}>Reset</Button>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Render fixed-position sidebar for md+ screens so it doesn't participate in result scrolling */}
        {isMdUp && filtersOpen && asideLeft !== null && (
          <Box sx={{ position: 'fixed', top: 72, left: asideLeft, width: asideWidth, zIndex: 1200, maxHeight: 'calc(100vh - 84px)', overflow: 'hidden' }}>
            <Paper sx={{ p: 2, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h6">Filters</Typography>
                <Divider sx={{ my: 1 }} />
              </Box>
              <Box sx={{ overflowY: 'auto', pr: 1 }}>
                <FiltersSidebar onChange={onFiltersChange} />
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" fullWidth onClick={() => setSearchParams(new URLSearchParams())}>Reset</Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Main results area */}
        <Box component="main" sx={{ flex: 1, overflowY: { xs: 'visible', md: 'auto' }, maxHeight: { xs: 'none', md: 'calc(100vh - 72px)' }, pr: { xs: 0, md: 2 } }}>
          <Grid container spacing={2}>
            {(results ?? []).map((p) => (
              <Grid item xs={12} md={6} key={p.property_id ?? p.id}>
                <PropertyCard property={p} />
              </Grid>
            ))}
            {results && results.length === 0 && (
              <Grid item xs={12}><Typography color="text.secondary">No properties found.</Typography></Grid>
            )}
          </Grid>
        </Box>

        {/* Mobile Drawer: show when filtersOpen and small screen */}
        {/* MUI Drawer would be better, but we conditionally render the aside above for xs; Toggle is provided in TopNav */}
      </Box>
    </Box>
  )
}
