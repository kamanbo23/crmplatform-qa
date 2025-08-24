import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import {
  School,
  Event,
  People,
  Assignment,
  Email,
  TrendingUp,
  CheckCircle,
  ArrowForward,
  LocationOn,
  Work,
  Person,
  Group,
  Business,
  Lightbulb,
  Rocket,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import EnhancedButton from '../components/EnhancedButton';
import EnhancedCard from '../components/EnhancedCard';
import PublicChatbot from '../components/PublicChatbot';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Business sx={{ fontSize: 40 }} />,
      title: 'Startup Opportunities',
      description: 'Discover internships, accelerators, funding opportunities, and startup projects tailored to your entrepreneurial interests.',
      color: 'primary.main',
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: 'Mentor Network',
      description: 'Connect with experienced entrepreneurs, investors, and industry professionals for guidance and collaboration.',
      color: 'secondary.main',
    },
    {
      icon: <Event sx={{ fontSize: 40 }} />,
      title: 'Startup Events',
      description: 'Stay updated with pitch competitions, hackathons, networking events, and startup workshops in your field.',
      color: 'success.main',
    },
    {
      icon: <Assignment sx={{ fontSize: 40 }} />,
      title: 'Project Management',
      description: 'Efficiently manage and track collaborative startup projects and business development tasks.',
      color: 'warning.main',
    },
    {
      icon: <Email sx={{ fontSize: 40 }} />,
      title: 'Newsletter System',
      description: 'Receive curated content and updates about startup opportunities and community events.',
      color: 'info.main',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Analytics & Insights',
      description: 'Track your engagement and discover patterns in startup opportunities and collaborations.',
      color: 'error.main',
    },
  ];

  const stats = [
    { label: 'Startup Opportunities', value: '50+', icon: <Rocket /> },
    { label: 'Expert Mentors', value: '25+', icon: <Person /> },
    { label: 'Startup Events', value: '30+', icon: <Event /> },
    { label: 'Active Entrepreneurs', value: '500+', icon: <Group /> },
  ];

  const benefits = [
    'Centralized access to startup opportunities',
    'Direct connection with industry professionals',
    'Streamlined application process',
    'Real-time updates on events and opportunities',
    'Professional networking platform',
    'Entrepreneurial collaboration facilitation',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: 'white',
            py: { xs: 8, md: 12 },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3,
            },
          }}
        >
                  <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <motion.div variants={itemVariants}>
                  <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    SpartUp Ecosystem
                  </Typography>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 300,
                  mb: 4,
                  opacity: 0.9,
                }}
              >
                Connect, Collaborate, and Build the Future
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.1rem',
                  mb: 4,
                  opacity: 0.8,
                  lineHeight: 1.6,
                }}
              >
                Join the comprehensive SpartUp ecosystem where students, 
                entrepreneurs, and industry professionals come together to create meaningful startup 
                collaborations and business opportunities.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <EnhancedButton
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'grey.100',
                    },
                  }}
                >
                  Get Started
                </EnhancedButton>
                <EnhancedButton
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/mentors')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Explore Mentors
                </EnhancedButton>
              </Stack>
                </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    p: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 3,
                    maxWidth: 400,
                  }}
                >
                  <Typography variant="h6" color="primary" gutterBottom>
                    Platform Highlights
                  </Typography>
                  <List>
                    {benefits.slice(0, 4).map((benefit, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
        </motion.div>

      {/* Stats Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <Box sx={{ py: 6, backgroundColor: 'white' }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <motion.div variants={itemVariants}>
                    <EnhancedCard
                      title={stat.value}
                      subtitle={stat.label}
                      avatar={stat.icon}
                      avatarColor="primary.main"
                      sx={{
                        textAlign: 'center',
                        height: '100%',
                      }}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
          <Container maxWidth="lg">
            <motion.div variants={itemVariants}>
              <Box textAlign="center" mb={6}>
                <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                  Platform Features
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                  Everything you need to succeed in your entrepreneurial journey
                </Typography>
              </Box>
            </motion.div>

            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <motion.div variants={itemVariants}>
                    <EnhancedCard
                      title={feature.title}
                      subtitle={feature.description}
                      avatar={feature.icon}
                      avatarColor={feature.color}
                      onClick={() => navigate('/login')}
                      sx={{
                        textAlign: 'center',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </motion.div>

      {/* Call to Action Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <Box sx={{ 
          py: 8, 
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
          },
        }}>
          <Container maxWidth="md">
            <motion.div variants={itemVariants}>
              <Box textAlign="center">
                <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                  Ready to Start Your Entrepreneurial Journey?
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                  Join hundreds of entrepreneurs and professionals already using our platform
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <EnhancedButton
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      },
                    }}
                  >
                    Sign Up Now
                  </EnhancedButton>
                  <EnhancedButton
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/events')}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    View Events
                  </EnhancedButton>
                </Stack>
              </Box>
            </motion.div>
          </Container>
        </Box>
      </motion.div>

      {/* Footer */}
      <Box sx={{ py: 4, backgroundColor: 'grey.900', color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                SpartUp CRM - Ecosystem
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Connecting students, entrepreneurs, and industry professionals for meaningful startup collaborations.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  color="inherit"
                  onClick={() => navigate('/mentors')}
                  sx={{ textTransform: 'none' }}
                >
                  Mentors
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/events')}
                  sx={{ textTransform: 'none' }}
                >
                  Events
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                  sx={{ textTransform: 'none' }}
                >
                  Login
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3, borderColor: 'grey.700' }} />
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.6 }}>
            © 2024 SpartUp Ecosystem. All rights reserved.
          </Typography>
        </Container>
      </Box>

      {/* AI Chatbot */}
      <PublicChatbot />
    </Box>
  );
} 