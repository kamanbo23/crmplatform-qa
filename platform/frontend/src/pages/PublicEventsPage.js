import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Stack,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Event,
  LocationOn,
  CalendarToday,
  AccessTime,
  FilterList,
  Clear,
  Today,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import api from '../services/api';

export default function PublicEventsPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, locationFilter, selectedTab]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events');
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter(event =>
        event.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Filter by time (tab selection)
    const now = new Date();
    switch (selectedTab) {
      case 0: // All events
        break;
      case 1: // Upcoming events
        filtered = filtered.filter(event => new Date(event.start_date) > now);
        break;
      case 2: // Today
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate >= today && eventDate < tomorrow;
        });
        break;
      case 3: // This week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate >= weekStart && eventDate < weekEnd;
        });
        break;
      default:
        break;
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setSelectedTab(0);
  };

  const handleRSVP = (event) => {
    // In a real application, this would handle RSVP functionality
    alert(`RSVP functionality for "${event.title}" would be implemented here.`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isEventToday = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const isEventUpcoming = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    return eventDate > now;
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading events...
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
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Startup Events
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Discover conferences, workshops, hackathons, and tech talks happening in the SpartUp ecosystem
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search events..."
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
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                startIcon={<Clear />}
                sx={{ height: 56 }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Time Filter Tabs */}
        <Box sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab label="All Events" icon={<Event />} iconPosition="start" />
            <Tab label="Upcoming" icon={<Schedule />} iconPosition="start" />
            <Tab label="Today" icon={<Today />} iconPosition="start" />
            <Tab label="This Week" icon={<CalendarToday />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Results Count */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Showing {filteredEvents.length} of {events.length} events
          </Typography>
          {(searchTerm || locationFilter || selectedTab !== 0) && (
            <Chip
              label="Filters Applied"
              color="primary"
              variant="outlined"
              icon={<FilterList />}
            />
          )}
        </Box>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No events found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or filters
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filteredEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                    },
                    position: 'relative',
                  }}
                >
                  {/* Event Status Badge */}
                  {isEventToday(event.start_date) && (
                    <Chip
                      label="Today"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1,
                      }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Event Title */}
                    <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>
                      {event.title || 'Event Title'}
                    </Typography>

                    {/* Event Date and Time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.start_date)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccessTime sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(event.start_date)}
                        {event.end_date && ` - ${formatTime(event.end_date)}`}
                      </Typography>
                    </Box>

                    {/* Location */}
                    {event.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {event.location}
                        </Typography>
                      </Box>
                    )}

                    {/* Description */}
                    {event.description && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {event.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Event Status */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={isEventUpcoming(event.start_date) ? 'Upcoming' : 'Past Event'}
                        size="small"
                        color={isEventUpcoming(event.start_date) ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleRSVP(event)}
                      disabled={!isEventUpcoming(event.start_date)}
                      startIcon={isEventUpcoming(event.start_date) ? <CheckCircle /> : <Event />}
                    >
                      {isEventUpcoming(event.start_date) ? 'RSVP' : 'Event Ended'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Call to Action */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Paper sx={{ p: 4, backgroundColor: 'primary.main', color: 'white' }}>
            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
              Submit Your Event
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Submit your startup event to reach the SpartUp community
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              Submit Event
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
} 