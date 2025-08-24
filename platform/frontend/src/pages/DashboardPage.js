import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Stack,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  Event,
  School,
  Assignment,
  Email,
  TrendingUp,
  TrendingDown,
  Refresh,
  CalendarToday,
  LocationOn,
  Work,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export default function DashboardPage() {
  const user = getUser();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  
  const [stats, setStats] = useState({
    contacts: 0,
    mentors: 0,
    events: 0,
    tasks: 0,
    newsletters: 0,
  });
  
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch data based on user role
      let contactsRes, mentorsRes, eventsRes, tasksRes, newslettersRes;
      
      if (isAdmin) {
        // Admin can access all data
        [contactsRes, mentorsRes, eventsRes, tasksRes, newslettersRes] = await Promise.all([
          api.get('/api/contacts'),
          api.get('/api/mentors'),
          api.get('/api/events'),
          api.get('/api/tasks'),
          api.get('/api/newsletters'),
        ]);
      } else {
        // Regular members get personalized data
        [eventsRes, tasksRes, newslettersRes] = await Promise.all([
          api.get('/api/users/me/events'), // User's RSVP'd events
          api.get('/api/users/me/tasks'),  // User's assigned tasks
          api.get('/api/newsletters'),
        ]);
        
        // Set default values for admin-only data
        contactsRes = { data: [] };
        mentorsRes = { data: [] };
      }

      setStats({
        contacts: contactsRes.data.length,
        mentors: mentorsRes.data.length,
        events: eventsRes.data.length,
        tasks: tasksRes.data.length,
        newsletters: newslettersRes.data.length,
      });

      // Get recent tasks (last 5)
      const recentTasksData = tasksRes.data.slice(0, 5);
      setRecentTasks(recentTasksData);

      // Get upcoming events (next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingEventsData = eventsRes.data
        .filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate >= now && eventDate <= thirtyDaysFromNow;
        })
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 5);
      setUpcomingEvents(upcomingEventsData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, onClick, trend }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease-in-out',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}25`,
          border: `1px solid ${color}50`,
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ position: 'relative', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            color="textSecondary" 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.75rem'
            }}
          >
            {title}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {trend > 0 ? (
                <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              color: color,
              lineHeight: 1
            }}
          >
            {value}
          </Typography>
          <Avatar 
            sx={{ 
              bgcolor: color, 
              width: 60, 
              height: 60,
              boxShadow: `0 4px 14px ${color}40`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon, color, onClick }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        height: '100%',
        transition: 'all 0.3s ease-in-out',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 35px ${color}20`,
          border: `1px solid ${color}40`,
          '& .action-icon': {
            transform: 'scale(1.1)',
            bgcolor: color,
          },
          '& .action-title': {
            color: color,
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.3s ease-in-out',
        },
        '&:hover::before': {
          transform: 'scaleX(1)',
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
          <Avatar 
            className="action-icon"
            sx={{ 
              bgcolor: `${color}20`, 
              width: 56, 
              height: 56,
              transition: 'all 0.3s ease-in-out',
              color: color,
              border: `2px solid ${color}30`,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <Typography 
              variant="h6" 
              component="div"
              className="action-title"
              sx={{ 
                fontWeight: 600,
                mb: 1,
                transition: 'color 0.3s ease-in-out',
                lineHeight: 1.3
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ 
                lineHeight: 1.5,
                fontSize: '0.875rem'
              }}
            >
              {description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'white' }}>
              Welcome back, {user?.full_name || user?.username || 'User'}! 👋
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 400 }}>
              Here's what's happening in your SpartUp Ecosystem
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={user?.role === 'admin' ? 'Administrator' : 'Member'}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
              icon={<Person sx={{ color: 'white !important' }} />}
            />
            <Tooltip title="Refresh dashboard">
              <IconButton 
                onClick={fetchDashboardData}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          📊 {isAdmin ? 'Platform Overview' : 'Your Dashboard'}
        </Typography>
        <Grid container spacing={3}>
          {isAdmin && (
            <>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <StatCard
                  title="Contacts"
                  value={stats.contacts}
                  icon={<People />}
                  color="#1976d2"
                  trend={12}
                  onClick={() => navigate('/admin/contacts')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <StatCard
                  title="Mentors"
                  value={stats.mentors}
                  icon={<School />}
                  color="#9c27b0"
                  trend={8}
                  onClick={() => navigate('/admin/mentors')}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title={isAdmin ? "Events" : "My Events"}
              value={stats.events}
              icon={<Event />}
              color="#2e7d32"
              trend={15}
              onClick={() => navigate('/admin/events')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title={isAdmin ? "Tasks" : "My Tasks"}
              value={stats.tasks}
              icon={<Assignment />}
              color="#ed6c02"
              trend={-5}
              onClick={() => navigate('/admin/tasks')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatCard
              title="Newsletters"
              value={stats.newsletters}
              icon={<Email />}
              color="#0288d1"
              trend={20}
              onClick={() => navigate('/admin/newsletters')}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          ⚡ Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {isAdmin ? (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <QuickActionCard
                  title="Add Contact"
                  description="Create a new contact and user account in the system"
                  icon={<People />}
                  color="#1976d2"
                  onClick={() => navigate('/admin/contacts')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <QuickActionCard
                  title="Add Mentor"
                  description="Register a new startup mentor to the platform"
                  icon={<School />}
                  color="#9c27b0"
                  onClick={() => navigate('/admin/mentors')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <QuickActionCard
                  title="Create Event"
                  description="Schedule and organize a new startup event"
                  icon={<Event />}
                  color="#2e7d32"
                  onClick={() => navigate('/admin/events')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <QuickActionCard
                  title="Send Newsletter"
                  description="Compose and publish newsletter to community"
                  icon={<Email />}
                  color="#0288d1"
                  onClick={() => navigate('/admin/newsletters')}
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <QuickActionCard
                  title="Browse Events"
                  description="Discover and RSVP to upcoming startup events"
                  icon={<Event />}
                  color="#2e7d32"
                  onClick={() => navigate('/admin/events')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <QuickActionCard
                  title="My Tasks"
                  description="View and manage your assigned tasks"
                  icon={<Assignment />}
                  color="#ed6c02"
                  onClick={() => navigate('/admin/tasks')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <QuickActionCard
                  title="View Contacts"
                  description="Browse the community contacts directory"
                  icon={<People />}
                  color="#1976d2"
                  onClick={() => navigate('/admin/contacts')}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      {/* Recent Activity */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          📈 Recent Activity
        </Typography>
        <Grid container spacing={3}>
          {/* Recent Tasks */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment sx={{ color: '#ed6c02' }} />
                    <Typography variant="h6" fontWeight={600}>Recent Tasks</Typography>
                  </Box>
                }
                action={
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate('/tasks')}
                    sx={{ borderRadius: 2 }}
                  >
                    View All
                  </Button>
                }
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent sx={{ pt: 2 }}>
                {recentTasks.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {recentTasks.map((task, index) => (
                      <React.Fragment key={task.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: task.status === 'completed' ? '#2e7d32' : '#ed6c02',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <Assignment fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {task.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                  Assigned to: {task.assigned_to_user?.username || 'Unknown'}
                                </Typography>
                                <Chip
                                  label={task.status}
                                  size="small"
                                  color={task.status === 'completed' ? 'success' : 'warning'}
                                  variant="outlined"
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentTasks.length - 1 && <Divider sx={{ my: 1 }} />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      No recent tasks
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Events */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event sx={{ color: '#2e7d32' }} />
                    <Typography variant="h6" fontWeight={600}>Upcoming Events</Typography>
                  </Box>
                }
                action={
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate('/events')}
                    sx={{ borderRadius: 2 }}
                  >
                    View All
                  </Button>
                }
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent sx={{ pt: 2 }}>
                {upcomingEvents.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {upcomingEvents.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: '#2e7d32',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <Event fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {event.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography 
                                  variant="body2" 
                                  color="textSecondary" 
                                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
                                >
                                  <CalendarToday sx={{ fontSize: 14 }} />
                                  {new Date(event.start_date).toLocaleDateString()}
                                </Typography>
                                {event.location && (
                                  <Typography 
                                    variant="body2" 
                                    color="textSecondary" 
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                  >
                                    <LocationOn sx={{ fontSize: 14 }} />
                                    {event.location}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < upcomingEvents.length - 1 && <Divider sx={{ my: 1 }} />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      No upcoming events
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* System Status */}
      <Paper 
        sx={{ 
          p: 4, 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          🔧 System Status
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                bgcolor: 'success.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'success.light',
              }}
            >
              <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  API Status
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="success.main">
                  Healthy
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                bgcolor: 'primary.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.light',
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Work />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Database
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                  Connected
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                bgcolor: 'info.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'info.light',
              }}
            >
              <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                <Email />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Email Service
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="info.main">
                  Active
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                bgcolor: 'secondary.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'secondary.light',
              }}
            >
              <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Platform Health
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="secondary.main">
                  Excellent
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 