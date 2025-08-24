import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Email } from '@mui/icons-material';
import api from '../services/api';
import MentorContactModal from '../components/MentorContactModal';

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMentor, setEditMentor] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', organization: '', expertise: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  const fetchMentors = async () => {
    try {
      const res = await api.get('/api/mentors');
      setMentors(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load mentors', severity: 'error' });
    }
  };

  useEffect(() => { fetchMentors(); }, []);

  const handleOpen = (mentor = null) => {
    setEditMentor(mentor);
    setForm(mentor ? { ...mentor } : { full_name: '', email: '', organization: '', expertise: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if (editMentor) {
        await api.put(`/api/mentors/${editMentor.id}`, form);
        setSnackbar({ open: true, message: 'Mentor updated', severity: 'success' });
      } else {
        await api.post('/api/mentors', form);
        setSnackbar({ open: true, message: 'Mentor created', severity: 'success' });
      }
      fetchMentors();
      handleClose();
    } catch {
      setSnackbar({ open: true, message: 'Error saving mentor', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/mentors/${id}`);
      setSnackbar({ open: true, message: 'Mentor deleted', severity: 'success' });
      fetchMentors();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting mentor', severity: 'error' });
    }
  };

  const handleContactMentor = (mentor) => {
    setSelectedMentor(mentor);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setSelectedMentor(null);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Mentors</Typography>
      <Button variant="contained" onClick={() => handleOpen()}>Add Mentor</Button>
      <Box sx={{ height: 400, mt: 2 }}>
        <DataGrid
          rows={mentors}
          columns={[
            { field: 'id', headerName: 'ID', width: 70 },
            { field: 'full_name', headerName: 'Full Name', width: 150 },
            { field: 'email', headerName: 'Email', width: 200 },
            { field: 'organization', headerName: 'Organization', width: 150 },
            { field: 'expertise', headerName: 'Expertise', width: 150 },
            { field: 'actions', headerName: 'Actions', width: 280, renderCell: (params) => (
              <>
                <Button size="small" onClick={() => handleOpen(params.row)}>Edit</Button>
                <Button 
                  size="small" 
                  startIcon={<Email />}
                  onClick={() => handleContactMentor(params.row)}
                  sx={{ mr: 1 }}
                >
                  Contact
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(params.row.id)}>Delete</Button>
              </>
            ) },
          ]}
          pageSize={5}
          rowsPerPageOptions={[5]}
        />
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMentor ? 'Edit Mentor' : 'Add Mentor'}</DialogTitle>
        <DialogContent>
          <TextField margin="normal" label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Organization" name="organization" value={form.organization} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Expertise" name="expertise" value={form.expertise} onChange={handleChange} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Mentor Contact Modal */}
      <MentorContactModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        mentor={selectedMentor}
      />
    </Box>
  );
} 