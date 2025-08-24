import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Snackbar, 
  Alert,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility, VisibilityOff, AdminPanelSettings, People } from '@mui/icons-material';
import api from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showPasswords, setShowPasswords] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpen = (user = null) => {
    setEditUser(user);
    setForm(user ? { ...user, password: '' } : { username: '', email: '', full_name: '', password: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if (editUser) {
        await api.put(`/api/users/${editUser.id}`, form);
        setSnackbar({ open: true, message: 'User updated', severity: 'success' });
      } else {
        await api.post('/api/users', form);
        setSnackbar({ open: true, message: 'User created', severity: 'success' });
      }
      fetchUsers();
      handleClose();
    } catch {
      setSnackbar({ open: true, message: 'Error saving user', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/users/${id}`);
      setSnackbar({ open: true, message: 'User deleted', severity: 'success' });
      fetchUsers();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting user', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Users</Typography>
      <Button variant="contained" onClick={() => handleOpen()}>Add User</Button>
      <Box sx={{ height: 600, mt: 2 }}>
        <DataGrid
          rows={users}
          columns={[
            { field: 'user_id', headerName: 'ID', width: 70 },
            { field: 'username', headerName: 'Username', width: 150 },
            { field: 'full_name', headerName: 'Full Name', width: 200 },
            { 
              field: 'role', 
              headerName: 'Role', 
              width: 120,
              renderCell: (params) => (
                <Chip
                  label={params.value}
                  size="small"
                  color={params.value === 'admin' ? 'secondary' : 'default'}
                  icon={params.value === 'admin' ? <AdminPanelSettings /> : <People />}
                />
              )
            },
            { field: 'logins', headerName: 'Logins', width: 100 },
            { field: 'rsvps', headerName: 'RSVPs', width: 100 },
            { field: 'mentor_requests', headerName: 'Mentor Requests', width: 150 },
            { 
              field: 'last_login', 
              headerName: 'Last Login', 
              width: 150,
              renderCell: (params) => (
                params.value ? new Date(params.value).toLocaleDateString() : 'Never'
              )
            },
            { 
              field: 'plain_password', 
              headerName: 'Password', 
              width: 120,
              renderCell: (params) => (
                <Tooltip title={showPasswords ? "Hide passwords" : "Show passwords"}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {showPasswords ? (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
                        {params.value || 'No password'}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        ••••••••
                      </Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Box>
                </Tooltip>
              )
            },
            { field: 'actions', headerName: 'Actions', width: 200, renderCell: (params) => (
              <>
                <Button size="small" onClick={() => handleOpen(params.row)}>Edit</Button>
                <Button size="small" color="error" onClick={() => handleDelete(params.row.user_id)}>Delete</Button>
              </>
            ) },
          ]}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField margin="normal" label="Username" name="username" value={form.username} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Password" name="password" value={form.password} onChange={handleChange} fullWidth type="password" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
} 