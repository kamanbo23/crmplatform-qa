import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import PublicMentorsPage from './pages/PublicMentorsPage';
import PublicEventsPage from './pages/PublicEventsPage';
import PublicNewslettersPage from './pages/PublicNewslettersPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UsersPage from './pages/UsersPage';
import ContactsPage from './pages/ContactsPage';
import MentorsPage from './pages/MentorsPage';
import EventsPage from './pages/EventsPage';
import NewslettersPage from './pages/NewslettersPage';
import TasksPage from './pages/TasksPage';
import PrivateRoute from './components/PrivateRoute';
import PublicLayout from './components/PublicLayout';
import AppLayout from './components/AppLayout';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/mentors" element={<PublicLayout><PublicMentorsPage /></PublicLayout>} />
          <Route path="/events" element={<PublicLayout><PublicEventsPage /></PublicLayout>} />
          <Route path="/newsletters" element={<PublicLayout><PublicNewslettersPage /></PublicLayout>} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><AppLayout><DashboardPage /></AppLayout></PrivateRoute>} />
          <Route path="/admin/dashboard" element={<PrivateRoute adminOnly={true}><AppLayout><AdminDashboardPage /></AppLayout></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute adminOnly={true}><AppLayout><UsersPage /></AppLayout></PrivateRoute>} />
          <Route path="/admin/contacts" element={<PrivateRoute><AppLayout><ContactsPage /></AppLayout></PrivateRoute>} />
          <Route path="/contacts" element={<PrivateRoute><AppLayout><ContactsPage /></AppLayout></PrivateRoute>} />
          <Route path="/admin/mentors" element={<PrivateRoute adminOnly={true}><AppLayout><MentorsPage /></AppLayout></PrivateRoute>} />
          <Route path="/admin/events" element={<PrivateRoute><AppLayout><EventsPage /></AppLayout></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><AppLayout><EventsPage /></AppLayout></PrivateRoute>} />
          <Route path="/admin/newsletters" element={<PrivateRoute adminOnly={true}><AppLayout><NewslettersPage /></AppLayout></PrivateRoute>} />
          <Route path="/admin/tasks" element={<PrivateRoute><AppLayout><TasksPage /></AppLayout></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><AppLayout><TasksPage /></AppLayout></PrivateRoute>} />
          
          {/* Redirect authenticated users to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 