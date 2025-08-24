import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import { Email, Person, School } from '@mui/icons-material';
import api from '../services/api';

export default function MentorContactModal({ open, onClose, mentor }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    major: '',
    year: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send email to max.rothe@spartup.edu with mentor contact request
      const response = await api.post('/api/mentor-contact', {
        mentor: mentor,
        contactInfo: formData,
        recipientEmail: 'max.rothe@spartup.edu'
      });

      if (response.data.email_sent) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            name: '',
            email: '',
            major: '',
            year: '',
            reason: '',
          });
        }, 2000);
      } else {
        // Email failed but request was recorded
        setError(response.data.email_error || 'Email delivery failed, but your request has been recorded. Please try again later.');
      }
    } catch (err) {
      console.error('Error sending mentor contact request:', err);
      setError('Failed to send contact request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.reason;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6">Contact {mentor?.full_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {mentor?.organization} • {mentor?.expertise}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your contact request has been sent successfully!
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Max Rothe will review your request and get back to you soon.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Note: Email delivery requires proper SMTP configuration in the backend.
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please provide your information and reason for wanting to connect with this mentor. 
              Your request will be sent to Max Rothe (max.rothe@spartup.edu) for review.
            </Typography>

            <TextField
              fullWidth
              label="Your Full Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              margin="normal"
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Your Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              margin="normal"
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Your Major/Field of Study"
              value={formData.major}
              onChange={handleInputChange('major')}
              margin="normal"
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Year Level"
              placeholder="e.g., Junior, Senior, Graduate Student"
              value={formData.year}
              onChange={handleInputChange('year')}
              margin="normal"
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Why do you want to connect with this mentor?"
              multiline
              rows={4}
              value={formData.reason}
              onChange={handleInputChange('reason')}
              margin="normal"
              required
              disabled={loading}
              placeholder="Please describe your startup interests, business goals, and why this mentor would be a good fit for you..."
            />

            {/* Mentor Info Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Mentor Information:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={mentor?.full_name} 
                  size="small" 
                  icon={<Person />} 
                />
                <Chip 
                  label={mentor?.organization} 
                  size="small" 
                  icon={<School />} 
                />
                {mentor?.expertise && (
                  <Chip 
                    label={mentor.expertise} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Email />}
        >
          {loading ? 'Sending...' : 'Send Contact Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 