import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';

function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }

export default function EventsPage() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', location: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events');
      setEvents(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load events', severity: 'error' });
    }
  };
  useEffect(() => { fetchEvents(); }, []);

  const handleOpen = (event = null) => {
    setEditEvent(event);
    setForm(event ? { ...event } : { title: '', description: '', start_date: '', end_date: '', location: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (editEvent) {
        await api.put(`/api/events/${editEvent.id}`, payload);
        setSnackbar({ open: true, message: 'Event updated', severity: 'success' });
      } else {
        await api.post('/api/events', payload);
        setSnackbar({ open: true, message: 'Event created', severity: 'success' });
      }
      fetchEvents();
      handleClose();
    } catch {
      setSnackbar({ open: true, message: 'Error saving event', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/events/${id}`);
      setSnackbar({ open: true, message: 'Event deleted', severity: 'success' });
      fetchEvents();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting event', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Events</Typography>
      {isAdmin && <Button variant="contained" onClick={() => handleOpen()}>Add Event</Button>}
      <Box sx={{ height: 400, mt: 2 }}>
        <DataGrid rows={events} columns={[
          { field: 'id', headerName: 'ID', width: 70 },
          { field: 'title', headerName: 'Title', width: 180 },
          { field: 'start_date', headerName: 'Start', width: 150 },
          { field: 'end_date', headerName: 'End', width: 150 },
          { field: 'location', headerName: 'Location', width: 150 },
          isAdmin && { field: 'actions', headerName: 'Actions', width: 200, renderCell: (params) => (
            <>
              <Button size="small" onClick={() => handleOpen(params.row)}>Edit</Button>
              <Button size="small" color="error" onClick={() => handleDelete(params.row.id)}>Delete</Button>
            </>
          ) },
        ].filter(Boolean)} pageSize={5} rowsPerPageOptions={[5]} />
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
        <DialogContent>
          <TextField margin="normal" label="Title" name="title" value={form.title} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Description" name="description" value={form.description} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Start Date" name="start_date" value={form.start_date} onChange={handleChange} fullWidth type="datetime-local" InputLabelProps={{ shrink: true }} />
          <TextField margin="normal" label="End Date" name="end_date" value={form.end_date} onChange={handleChange} fullWidth type="datetime-local" InputLabelProps={{ shrink: true }} />
          <TextField margin="normal" label="Location" name="location" value={form.location} onChange={handleChange} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {isAdmin && <Button onClick={handleSave} variant="contained">Save</Button>}
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
} 