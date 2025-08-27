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
} from '@mui/material';
import {
  Search,
  School,
  LocationOn,
  Work,
  Email,
  Person,
  FilterList,
  Clear,
} from '@mui/icons-material';
import api from '../services/api';
import MentorContactModal from '../components/MentorContactModal';

export default function PublicMentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    filterMentors();
  }, [mentors, searchTerm, locationFilter, expertiseFilter]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/opportunities'); // Using opportunities endpoint for mentors
      setMentors(response.data);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError('Failed to load mentors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterMentors = () => {
    let filtered = mentors;

    // Search by name, organization, or expertise
    if (searchTerm) {
      filtered = filtered.filter(mentor =>
        mentor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter(mentor =>
        mentor.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Filter by expertise
    if (expertiseFilter) {
      filtered = filtered.filter(mentor =>
        mentor.expertise?.toLowerCase().includes(expertiseFilter.toLowerCase())
      );
    }

    setFilteredMentors(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setExpertiseFilter('');
  };

  const handleContactMentor = (mentor) => {
    setSelectedMentor(mentor);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setSelectedMentor(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading mentors...
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
    <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Startup Mentors
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Connect with experienced entrepreneurs and industry professionals who can guide your startup journey
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search mentors..."
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
            <Grid item xs={12} md={3}>
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
              <TextField
                fullWidth
                placeholder="Filter by expertise..."
                value={expertiseFilter}
                onChange={(e) => setExpertiseFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Work />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                startIcon={<Clear />}
                sx={{ height: 56 }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Results Count */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Showing {filteredMentors.length} of {mentors.length} mentors
          </Typography>
          {(searchTerm || locationFilter || expertiseFilter) && (
            <Chip
              label="Filters Applied"
              color="primary"
              variant="outlined"
              icon={<FilterList />}
            />
          )}
        </Box>

        {/* Mentors Grid */}
        {filteredMentors.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No mentors found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or filters
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filteredMentors.map((mentor) => (
              <Grid item xs={12} sm={6} md={4} key={mentor.id}>
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
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Mentor Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          mr: 2,
                          backgroundColor: 'primary.main',
                        }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h3" fontWeight="600">
                          {mentor.full_name || 'Mentor Name'}
                        </Typography>
                        <Chip
                          label={mentor.mentor_type || 'Startup Mentor'}
                          color="primary"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    </Box>

                    {/* Organization */}
                    {mentor.organization && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Work sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {mentor.organization}
                        </Typography>
                      </Box>
                    )}

                    {/* Location */}
                    {mentor.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {mentor.location}
                        </Typography>
                      </Box>
                    )}

                    {/* Virtual/In-person */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={mentor.is_virtual ? 'Virtual Sessions' : 'In-Person Available'}
                        size="small"
                        color={mentor.is_virtual ? 'secondary' : 'primary'}
                        variant="outlined"
                      />
                    </Box>

                    {/* Expertise */}
                    {mentor.expertise && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="600" gutterBottom>
                          Expertise:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {mentor.expertise}
                        </Typography>
                      </Box>
                    )}

                    {/* Bio */}
                    {mentor.bio && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="600" gutterBottom>
                          About:
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {mentor.bio}
                        </Typography>
                      </Box>
                    )}

                    {/* Tags */}
                    {mentor.tags && (
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {mentor.tags.split(',').map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag.trim()}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 1 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleContactMentor(mentor)}
                      startIcon={<Email />}
                    >
                      Contact Mentor
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
              Become a Mentor
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Share your expertise and help guide the next generation of entrepreneurs
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                const subject = encodeURIComponent('Mentor Application - SpartUp CRM Platform');
                const body = encodeURIComponent(`Dear Max Rothe,

I am interested in becoming a mentor for the SpartUp CRM platform.

Please find my information below:

**Personal Information:**
- Name: [Your Full Name]
- Email: [Your Email Address]
- Phone: [Your Phone Number]

**Professional Background:**
- Current Position: [Your Current Role/Title]
- Organization: [Your Company/Organization]
- Years of Experience: [Number of years in your field]

**Specialties & Expertise:**
Please describe your areas of expertise and specialties:
[Describe your technical skills, industry knowledge, business experience, etc.]

**Mentoring Interests:**
What areas would you like to mentor in?
- Startup Strategy & Business Development
- Technical Skills & Development
- Marketing & Sales
- Finance & Fundraising
- Product Management
- Legal & Compliance
- Other: [Please specify]

**Mentoring Preferences:**
- Preferred mentoring format: [Virtual/In-person/Both]
- Availability: [Days/times you're available]
- Commitment level: [Hours per month you can dedicate]

**Why you want to be a mentor:**
[Share your motivation and what you hope to contribute to the startup ecosystem]

**Relevant Experience:**
[Describe any previous mentoring, teaching, or leadership experience]

I look forward to contributing to the SpartUp community and helping guide the next generation of entrepreneurs.

Best regards,
[Your Name]`);

                const mailtoLink = `mailto:max.rothe@sjsu.edu?subject=${subject}&body=${body}`;
                window.open(mailtoLink, '_blank');
              }}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              Apply to be a Mentor
            </Button>
          </Paper>
        </Box>
      </Container>

      {/* Mentor Contact Modal */}
      <MentorContactModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        mentor={selectedMentor}
      />
    </Box>
  );
} 