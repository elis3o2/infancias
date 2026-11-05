import { Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faChevronLeft, faFileMedical, faHouse, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from './layoutConfig';

type Props = { open: boolean; toggleSidebar: (open: boolean) => void; mobile?: boolean };

const Sidebar = ({ open, toggleSidebar, mobile = false }: Props) => {
    const { pathname } = useLocation();
    const solicitudes = pathname.startsWith('/solicitud') || pathname.startsWith('/validar/');
    const historial = pathname === '/historial' || pathname.startsWith('/historial/');
    const cerrarAlNavegar = () => { if (mobile) toggleSidebar(false); };
    return (
        <Drawer
            anchor="left"
            open={open}
            variant={mobile ? 'temporary' : 'persistent'}
            onClose={() => toggleSidebar(false)}
            slotProps={{
                paper: {
                    sx: {
                        width: SIDEBAR_WIDTH,
                        maxWidth: '85vw',
                        top: mobile ? 0 : `${NAVBAR_HEIGHT}px`,
                        height: mobile ? '100%' : `calc(100% - ${NAVBAR_HEIGHT}px)`,
                        backgroundColor: (theme) => theme.palette.background.default,
                        color: (theme) => theme.palette.text.primary,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`, 
                        boxShadow: (theme) => theme.shadows[4]
                    }
                }
            }}
        >
            <Box component="nav" id="navegacion-principal" aria-label="Navegación principal">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <IconButton
                    aria-label="Cerrar menú"
                    onClick={() => toggleSidebar(false)}
                    sx={{ color: (theme) => theme.palette.text.primary }}
                >
                    <FontAwesomeIcon icon={faChevronLeft} size="1x" />
                </IconButton>
            </Box>

            <Divider />

            <List>
                <ListItemButton 
                    component={Link} 
                    to='/solicitud'
                    onClick={cerrarAlNavegar}
                    selected={solicitudes}
                    aria-current={solicitudes ? 'page' : undefined}
                    sx={{ 
                        color: (theme) => theme.palette.text.primary, 
                        mt: -1,
                        gap: 2
                    }}
                >
                    <FontAwesomeIcon icon={faHouse} size='1x' />
                    <ListItemText primary='Solicitudes' />
                </ListItemButton>

                <Divider variant="middle" />
                <ListItemButton component={Link} to="/historial" onClick={cerrarAlNavegar}
                    selected={historial} aria-current={historial ? 'page' : undefined} sx={{ gap: 2 }}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} size="1x" />
                    <ListItemText primary="Buscar niño / historial" />
                </ListItemButton>

                <Divider variant='middle' />

                <ListItemButton component={Link} to="/reportes" onClick={cerrarAlNavegar}
                    selected={pathname === '/reportes'} aria-current={pathname === '/reportes' ? 'page' : undefined} sx={{ gap: 2 }}>
                    <FontAwesomeIcon icon={faChartColumn} size="1x" />
                    <ListItemText primary="Reportes" />
                </ListItemButton>

                <Divider variant="middle" />

                <ListItemButton 
                    component={Link} 
                    to='/buscar'
                    onClick={cerrarAlNavegar}
                    sx={{ 
                        color: (theme) => theme.palette.text.primary, 
                        gap: 2
                    }}
                >
                    <FontAwesomeIcon icon={faFileMedical} size='1x' />
                    <ListItemText primary='Nueva solicitud' />
                </ListItemButton>
            </List>
            </Box>
        </Drawer>
    );
}

export default Sidebar;
