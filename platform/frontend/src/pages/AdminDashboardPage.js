import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  People,
  School,
  Event,
  Email,
  Assignment,
  AdminPanelSettings,
  Visibility,
  VisibilityOff,
  TrendingUp,
  Login,
  CalendarToday,
  Message,
  Refresh,
  Search,
} from '@mui/icons-material';
import api from '../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users_this_month: 0,
    total_logins: 0,
    total_rsvps: 0,
    total_mentor_requests: 0,
    top_mentors_by_requests: [],
    recent_activity: []
  });
  const [userEngagement, setUserEngagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, engagementRes] = await Promise.all([
        api.get('/api/engagement/stats'),
        api.get('/api/engagement/users')
      ]);
      setStats(statsRes.data);
      setUserEngagement(engagementRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserDetails = (user) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const filteredUsers = userEngagement.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading admin dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive overview of user engagement and system activity
        </Typography>
      </Box>

      {/* Engagement Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="success.main">
                {stats.active_users_this_month} active this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Login sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_logins}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Logins
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="info.main">
                Platform activity
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_rsvps}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Event RSVPs
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="success.main">
                Event engagement
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Message sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_mentor_requests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mentor Requests
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="warning.main">
                Mentor engagement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Mentors and Recent Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Mentors by Requests
              </Typography>
              {stats.top_mentors_by_requests.length > 0 ? (
                <Box>
                  {stats.top_mentors_by_requests.map((mentor, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Typography variant="body2">{mentor.name}</Typography>
                      <Chip label={mentor.requests} size="small" color="primary" />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No mentor requests yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {stats.recent_activity.length > 0 ? (
                <Box>
                  {stats.recent_activity.slice(0, 5).map((activity, index) => (
                    <Box key={index} sx={{ py: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {activity.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.time).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Engagement Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              User Engagement Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchDashboardData}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Logins</TableCell>
                  <TableCell>RSVPs</TableCell>
                  <TableCell>Mentor Requests</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Password</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'admin' ? 'secondary' : 'default'}
                        icon={user.role === 'admin' ? <AdminPanelSettings /> : <People />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Login sx={{ fontSize: 16, mr: 1 }} />
                        {user.logins}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 16, mr: 1 }} />
                        {user.rsvps}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Message sx={{ fontSize: 16, mr: 1 }} />
                        {user.mentor_requests}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <Typography variant="body2">
                          {new Date(user.last_login).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Never
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={showPasswords ? "Hide passwords" : "Show passwords"}>
                        <IconButton
                          size="small"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUserDetails(user)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onClose={() => setUserDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={selectedUser.username}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={selectedUser.full_name}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={selectedUser.role}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Created"
                    value={new Date(selectedUser.created_at).toLocaleDateString()}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Total Logins"
                    value={selectedUser.logins}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Event RSVPs"
                    value={selectedUser.rsvps}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Mentor Requests"
                    value={selectedUser.mentor_requests}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Last Login"
                    value={selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 