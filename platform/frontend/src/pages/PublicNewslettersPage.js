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
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  Slide,
  useMediaQuery,
  useTheme,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  Search,
  Email,
  CalendarToday,
  FilterList,
  Clear,
  Visibility,
  Share,
  Bookmark,
  Close,
  Print,
  GetApp,
  Forward,
} from '@mui/icons-material';
import api from '../services/api';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PublicNewslettersPage() {
  const [newsletters, setNewsletters] = useState([]);
  const [filteredNewsletters, setFilteredNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [newsletterDialogOpen, setNewsletterDialogOpen] = useState(false);
  
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchNewsletters();
  }, []);

  useEffect(() => {
    filterNewsletters();
  }, [newsletters, searchTerm]);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/newsletters');
      setNewsletters(response.data);
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError('Failed to load newsletters. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterNewsletters = () => {
    let filtered = newsletters;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(newsletter =>
        newsletter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        newsletter.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by publish date (most recent first)
    filtered.sort((a, b) => {
      if (!a.publish_date && !b.publish_date) return 0;
      if (!a.publish_date) return 1;
      if (!b.publish_date) return -1;
      return new Date(b.publish_date) - new Date(a.publish_date);
    });

    setFilteredNewsletters(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateContent = (content, maxLength = 200) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const openNewsletterDialog = (newsletter) => {
    setSelectedNewsletter(newsletter);
    setNewsletterDialogOpen(true);
  };

  const closeNewsletterDialog = () => {
    setNewsletterDialogOpen(false);
    setSelectedNewsletter(null);
  };

  const handleShare = (newsletter) => {
    if (navigator.share) {
      navigator.share({
        title: newsletter.title,
        text: newsletter.content ? newsletter.content.substring(0, 200) + '...' : '',
        url: window.location.href,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${newsletter.title} - ${window.location.href}`);
      alert('Newsletter link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (newsletter) => {
    const element = document.createElement('a');
    const file = new Blob([`${newsletter.title}\n\n${newsletter.content || ''}`], { 
      type: 'text/plain' 
    });
    element.href = URL.createObjectURL(file);
    element.download = `${newsletter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading newsletters...
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
            Startup Newsletters
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Stay updated with the latest opportunities, events, and insights from the SpartUp community
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search newsletters..."
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

        {/* Results Count */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Showing {filteredNewsletters.length} of {newsletters.length} newsletters
          </Typography>
          {searchTerm && (
            <Chip
              label="Filters Applied"
              color="primary"
              variant="outlined"
              icon={<FilterList />}
            />
          )}
        </Box>

        {/* Newsletters Grid */}
        {filteredNewsletters.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Email sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No newsletters found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filteredNewsletters.map((newsletter) => (
              <Grid item xs={12} md={6} lg={4} key={newsletter.id}>
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
                  {/* Newsletter Image */}
                  {newsletter.image && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={newsletter.image}
                      alt={newsletter.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Newsletter Title */}
                    <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>
                      {newsletter.title || 'Newsletter Title'}
                    </Typography>

                    {/* Publish Date */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(newsletter.publish_date)}
                      </Typography>
                    </Box>

                    {/* Content Preview */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
                        mb: 2,
                      }}
                    >
                      {truncateContent(newsletter.content)}
                    </Typography>

                    {/* Status Badge */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={newsletter.publish_date ? 'Published' : 'Draft'}
                        size="small"
                        color={newsletter.publish_date ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <Button
                        flex={1}
                        variant="contained"
                        startIcon={<Visibility />}
                        onClick={() => openNewsletterDialog(newsletter)}
                        sx={{ flex: 1 }}
                      >
                        Read Full
                      </Button>
                      <Tooltip title="Share Newsletter">
                        <IconButton
                          onClick={() => handleShare(newsletter)}
                          color="primary"
                          size="small"
                        >
                          <Share />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Newsletter">
                        <IconButton
                          onClick={() => handleDownload(newsletter)}
                          color="primary"
                          size="small"
                        >
                          <GetApp />
                        </IconButton>
                      </Tooltip>
                    </Stack>
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
              Stay Updated
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Get the latest startup opportunities and community updates delivered to your inbox
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
              Subscribe Now
            </Button>
          </Paper>
        </Box>

        {/* Full Newsletter Dialog */}
        <Dialog
          fullScreen={fullScreen}
          open={newsletterDialogOpen}
          onClose={closeNewsletterDialog}
          TransitionComponent={Transition}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              minHeight: fullScreen ? '100vh' : '80vh',
              maxHeight: fullScreen ? '100vh' : '90vh',
            },
          }}
        >
          {selectedNewsletter && (
            <>
              {fullScreen ? (
                <AppBar sx={{ position: 'relative' }}>
                  <Toolbar>
                    <IconButton
                      edge="start"
                      color="inherit"
                      onClick={closeNewsletterDialog}
                      aria-label="close"
                    >
                      <Close />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                      {selectedNewsletter.title}
                    </Typography>
                    <IconButton color="inherit" onClick={handlePrint}>
                      <Print />
                    </IconButton>
                    <IconButton color="inherit" onClick={() => handleShare(selectedNewsletter)}>
                      <Share />
                    </IconButton>
                    <IconButton color="inherit" onClick={() => handleDownload(selectedNewsletter)}>
                      <GetApp />
                    </IconButton>
                  </Toolbar>
                </AppBar>
              ) : (
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" component="div" sx={{ flex: 1 }}>
                      {selectedNewsletter.title}
                    </Typography>
                    <Box>
                      <Tooltip title="Print">
                        <IconButton onClick={handlePrint}>
                          <Print />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share">
                        <IconButton onClick={() => handleShare(selectedNewsletter)}>
                          <Share />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton onClick={() => handleDownload(selectedNewsletter)}>
                          <GetApp />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Close">
                        <IconButton onClick={closeNewsletterDialog}>
                          <Close />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </DialogTitle>
              )}

              <DialogContent
                sx={{
                  p: 3,
                  overflow: 'auto',
                  ...(fullScreen && { pt: 2 }),
                }}
              >
                {/* Newsletter Image */}
                {selectedNewsletter.image && (
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <img
                      src={selectedNewsletter.image}
                      alt={selectedNewsletter.title}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </Box>
                )}

                {/* Newsletter Metadata */}
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Chip
                        icon={<CalendarToday />}
                        label={formatDate(selectedNewsletter.publish_date)}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item>
                      <Chip
                        label={selectedNewsletter.publish_date ? 'Published' : 'Draft'}
                        color={selectedNewsletter.publish_date ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Newsletter Content */}
                <Box sx={{ lineHeight: 1.7 }}>
                  {selectedNewsletter.content ? (
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontSize: '1.1rem',
                        '& p': { mb: 2 },
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                          mt: 3,
                          mb: 2,
                          fontWeight: 'bold',
                        },
                        '& ul, & ol': {
                          ml: 3,
                          mb: 2,
                        },
                        '& li': {
                          mb: 1,
                        },
                        '& blockquote': {
                          borderLeft: '4px solid',
                          borderColor: 'primary.main',
                          pl: 2,
                          ml: 2,
                          fontStyle: 'italic',
                          backgroundColor: 'grey.50',
                          p: 2,
                          borderRadius: 1,
                        },
                      }}
                    >
                      {selectedNewsletter.content}
                    </Typography>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No content available for this newsletter.
                    </Typography>
                  )}
                </Box>

                {/* Newsletter Footer */}
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Thank you for reading! Stay connected with the SpartUp community for more updates.
                  </Typography>
                </Box>
              </DialogContent>

              {!fullScreen && (
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                  <Box>
                    <Button
                      startIcon={<Forward />}
                      onClick={() => handleShare(selectedNewsletter)}
                      variant="outlined"
                    >
                      Share Newsletter
                    </Button>
                  </Box>
                  <Box>
                    <Button onClick={closeNewsletterDialog} sx={{ mr: 1 }}>
                      Close
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleDownload(selectedNewsletter)}
                      startIcon={<GetApp />}
                    >
                      Download
                    </Button>
                  </Box>
                </DialogActions>
              )}
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
} 