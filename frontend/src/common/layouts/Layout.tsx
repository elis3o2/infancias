import { Suspense, useState } from 'react';
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Footer } from './Footer';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from './layoutConfig';

const Layout = () => {
  const theme = useTheme();
  const escritorio = useMediaQuery(theme.breakpoints.up('md'), { defaultMatches: true, noSsr: true });
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const open = escritorio ? desktopOpen : mobileOpen;
  const setOpen = escritorio ? setDesktopOpen : setMobileOpen;

  return (
    <Box sx={{ minHeight: '100dvh', pt: `${NAVBAR_HEIGHT}px` }}>
      <Navbar backTo={pathname.startsWith('/validar/') ? '/solicitud' : undefined}
        sidebarOpen={open} onToggleSidebar={() => setOpen(!open)} />
      <Sidebar open={open} toggleSidebar={setOpen} mobile={!escritorio} />
      <Box sx={{
        ml: escritorio && open ? `${SIDEBAR_WIDTH}px` : 0,
        minWidth: 0, minHeight: `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
        display: 'flex', flexDirection: 'column',
        transition: theme.transitions.create('margin-left'),
      }}>
        <Box component="main" id="contenido-principal" sx={{ flex: 1, minWidth: 0 }}>
          <Suspense fallback={<Box role="status" aria-label="Cargando pantalla"
            sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
            <Outlet />
          </Suspense>
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
