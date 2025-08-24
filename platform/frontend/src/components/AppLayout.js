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
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Container,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Event,
  School,
  Assignment,
  Email,
  AccountCircle,
  Logout,
  AdminPanelSettings,
  Person,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', adminOnly: false },
  { text: 'Admin Dashboard', icon: <AdminPanelSettings />, path: '/admin/dashboard', adminOnly: true },
  { text: 'Contacts', icon: <People />, path: '/admin/contacts', adminOnly: false },
  { text: 'Mentors', icon: <School />, path: '/admin/mentors', adminOnly: true },
  { text: 'Events', icon: <Event />, path: '/admin/events', adminOnly: false },
  { text: 'Newsletters', icon: <Email />, path: '/admin/newsletters', adminOnly: true },
  { text: 'Tasks', icon: <Assignment />, path: '/admin/tasks', adminOnly: false },
];

export default function AppLayout({ children }) {
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
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  ).map(item => {
    // Show different text for contacts based on user role
    if (item.text === 'Contacts') {
      return {
        ...item,
        text: user?.role === 'admin' ? 'Contacts' : 'Community Directory'
      };
    }
    return item;
  });

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" color="primary">
          SpartUp CRM
        </Typography>
        <Typography variant="body2" color="text.secondary">
                      SpartUp Ecosystem
        </Typography>
      </Box>
      
      <List sx={{ pt: 1 }}>
        {filteredMenuItems.map((item) => (
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
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SpartUp CRM - Ecosystem
          </Typography>

          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={user?.role === 'admin' ? 'Admin' : 'Member'}
              size="small"
              color={user?.role === 'admin' ? 'secondary' : 'default'}
              icon={user?.role === 'admin' ? <AdminPanelSettings /> : <Person />}
            />
            
            <Button
              color="inherit"
              onClick={handleUserMenuOpen}
              startIcon={<AccountCircle />}
              sx={{ textTransform: 'none' }}
            >
              {user?.username || 'User'}
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
              <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            top: ['48px', '56px', '64px'],
            height: 'auto',
            bottom: 0,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 250px)` },
          ml: { md: '250px' },
          backgroundColor: 'grey.50',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
} 