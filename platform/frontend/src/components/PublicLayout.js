import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  School,
  Event,
  Login,
  Person,
  Dashboard,
  Close,
  Email,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

const menuItems = [
  { text: 'Mentors', icon: <School />, path: '/mentors' },
  { text: 'Events', icon: <Event />, path: '/events' },
  { text: 'Newsletters', icon: <Email />, path: '/newsletters' },
];

export default function PublicLayout({ children }) {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    handleUserMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    handleUserMenuClose();
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" color="primary" sx={{ cursor: 'pointer' }} onClick={() => handleNavigation('/')}>
                      SpartUp CRM
        </Typography>
        <Typography variant="body2" color="text.secondary">
                      SpartUp Ecosystem
        </Typography>
      </Box>
      
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            button
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0 } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Logo */}
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                cursor: 'pointer',
                fontWeight: 'bold',
                color: 'primary.main'
              }}
              onClick={() => handleNavigation('/')}
            >
              SpartUp CRM
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.main',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            {/* User Menu / Login Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {user ? (
                <>
                  <Chip
                    label={user.role === 'admin' ? 'Admin' : 'Member'}
                    size="small"
                    color={user.role === 'admin' ? 'secondary' : 'default'}
                    icon={<Person />}
                  />
                  
                  <Button
                    color="inherit"
                    onClick={handleUserMenuOpen}
                    startIcon={<Person />}
                    sx={{ textTransform: 'none' }}
                  >
                    {user.username}
                  </Button>
                  
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={handleDashboard}>
                      <ListItemIcon>
                        <Dashboard fontSize="small" />
                      </ListItemIcon>
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <Login fontSize="small" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleLogin}
                  startIcon={<Login />}
                  sx={{ textTransform: 'none' }}
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : false}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
          },
          display: { xs: 'block', md: 'none' },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: 'grey.50',
        }}
      >
        {children}
      </Box>
    </Box>
  );
} 