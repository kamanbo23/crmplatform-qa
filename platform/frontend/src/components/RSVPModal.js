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
  Chip,
} from '@mui/material';
import { Email, Person, Event } from '@mui/icons-material';
import api from '../services/api';

export default function RSVPModal({ open, onClose, event, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/api/events/${event.id}/rsvp/public`, {
        email: email,
        rsvp_status: 'confirmed'
      });

      setSuccess(true);
      setIsRegisteredUser(response.data.is_member);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('RSVP error:', err);
      setError(err.response?.data?.detail || 'Failed to RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setLoading(false);
    setError('');
    setSuccess(false);
    setIsRegisteredUser(false);
    onClose();
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isEmailValid = email && validateEmail(email);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Event color="primary" />
          <Typography variant="h6">RSVP for Event</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!success ? (
          <>
            {/* Event Info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                {event?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event?.description}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={new Date(event?.start_date).toLocaleDateString()} 
                  size="small" 
                  variant="outlined" 
                />
                {event?.location && (
                  <Chip 
                    label={event.location} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Box>
            </Box>

            {/* Email Form */}
            <Typography variant="body1" gutterBottom>
              Please provide your email address to RSVP for this event:
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={loading}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                error={email && !isEmailValid}
                helperText={email && !isEmailValid ? 'Please enter a valid email address' : ''}
              />
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </>
        ) : (
          /* Success Message */
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                RSVP Confirmed! 🎉
              </Typography>
              <Typography variant="body2">
                You have successfully RSVP'd for "{event?.title}"
              </Typography>
            </Alert>
            
            {isRegisteredUser ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 2 }}>
                <Person color="primary" />
                <Typography variant="body2" color="primary">
                  Welcome back! Your RSVP has been added to your member account.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 2 }}>
                <Email color="primary" />
                <Typography variant="body2" color="primary">
                  Your RSVP has been recorded. Consider creating an account to track your events!
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" color="text.secondary">
              You will receive event updates and reminders at {email}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {!success ? (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!isEmailValid || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Event />}
            >
              {loading ? 'RSVPing...' : 'Confirm RSVP'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
