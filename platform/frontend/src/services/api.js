import axios from 'axios';

// Use environment variable for API URL or fallback to the local backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  // We store the JWT in localStorage and send it via the Authorization header,
  // so we don't need to send browser cookies across origins. Omitting
  // withCredentials avoids the CORS combination of "*" origin with credentials.
  // If you later move to cookie-based auth, set this to true and update the
  // backend CORS allow_origins list accordingly.
  // withCredentials is left undefined (defaults to false).
  // Increase timeout for slower connections
  timeout: 15000,
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Ensure Content-Type is properly set
    if (!config.headers['Content-Type'] && config.method !== 'get') {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log errors for debugging
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with an error status code
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        console.warn('Authentication expired or invalid');
        localStorage.removeItem('token');
        
        // Only redirect if we're not already on the login page
        if (!window.location.href.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      if (error.response.status === 403) {
        console.warn('Permission denied');
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network error - no response received');
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    try {
      // OAuth2 expects x-www-form-urlencoded format, not FormData
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      
      // Special handling for the token endpoint to ensure CORS works
      return await api.post('/api/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Invalid username or password');
        } else if (error.response.status === 429) {
          throw new Error('Too many login attempts. Please try again later.');
        } else {
          throw new Error(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },
  
  register: async (userData) => {
    try {
      return await api.post('/api/users', JSON.stringify(userData), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response && error.response.data) {
        // Format error message from backend
        const detail = error.response.data.detail;
        throw new Error(detail || 'Registration failed. Please try again.');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },
  
  getCurrentUser: async () => {
    try {
      return await api.get('/api/users/me');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      return await api.put('/users/me', profileData);
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.response && error.response.data) {
        throw new Error(error.response.data.detail || 'Profile update failed');
      } else {
        throw error;
      }
    }
  },
  
  saveEvent: async (eventId) => {
    try {
      return await api.post(`/users/me/save-event/${eventId}`);
    } catch (error) {
      console.error('Save event error:', error);
      throw error;
    }
  },
  
  saveOpportunity: async (opportunityId) => {
    try {
      return await api.post(`/users/me/save-opportunity/${opportunityId}`);
    } catch (error) {
      console.error('Save opportunity error:', error);
      throw error;
    }
  }
};

// Events services
export const eventService = {
  getEvents: async () => {
    return api.get('/api/events');
  },
  
  createEvent: async (eventData) => {
    try {
      console.log('Creating event with data:', JSON.stringify(eventData));
      // Make sure date formats are correct for API
      const formattedData = { ...eventData };
      
      // Ensure start_date and end_date are properly formatted
      if (formattedData.start_date && !formattedData.start_date.includes('T')) {
        formattedData.start_date = `${formattedData.start_date}T00:00:00Z`;
      }
      
      if (formattedData.end_date && !formattedData.end_date.includes('T')) {
        formattedData.end_date = `${formattedData.end_date}T00:00:00Z`;
      }
      
      // Ensure type is properly formatted (backend expects Case Formatted values)
      if (formattedData.type) {
        console.log(`Event type before formatting: ${formattedData.type}`);
        // The backend now handles different formats via the _missing_ method in EventType enum
      }
      
      const response = await api.post('/events/', formattedData);
      console.log('Event created successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating event:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateEvent: async (eventId, eventData) => {
    try {
      console.log(`Updating event ${eventId} with data:`, JSON.stringify(eventData));
      // Make sure date formats are correct for API
      const formattedData = { ...eventData };
      
      // Ensure start_date and end_date are properly formatted
      if (formattedData.start_date && !formattedData.start_date.includes('T')) {
        formattedData.start_date = `${formattedData.start_date}T00:00:00Z`;
      }
      
      if (formattedData.end_date && !formattedData.end_date.includes('T')) {
        formattedData.end_date = `${formattedData.end_date}T00:00:00Z`;
      }
      
      // Ensure type is properly formatted
      if (formattedData.type) {
        console.log(`Event type before formatting: ${formattedData.type}`);
        // The backend now handles different formats via the _missing_ method in EventType enum
      }
      
      const response = await api.put(`/events/${eventId}`, formattedData);
      console.log('Event updated successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating event:', error.response?.data || error.message);
      throw error;
    }
  },
  
  deleteEvent: async (eventId) => {
    return api.delete(`/events/${eventId}`);
  },

  rsvpForEvent: async (eventId) => {
    return api.post(`/api/events/${eventId}/rsvp`);
  }
};

// User services
export const userService = {
  getEngagementData: async () => {
    try {
      return await api.get('/api/users/engagement');
    } catch (error) {
      console.error('Error fetching user engagement data:', error);
      throw error; // Re-throw to be caught by the component
    }
  }
};

// Opportunities services
export const opportunityService = {
  getOpportunities: async () => {
    return api.get('/opportunities/');
  },
  
  createOpportunity: async (opportunityData) => {
    try {
      console.log('Creating opportunity with data:', JSON.stringify(opportunityData));
      
      // Format data for API
      const formattedData = { ...opportunityData };
      
      // Ensure deadline is properly formatted
      if (formattedData.deadline && !formattedData.deadline.includes('T')) {
        formattedData.deadline = `${formattedData.deadline}T00:00:00Z`;
      }
      
      // Clean the website URL
      if (formattedData.website) {
        formattedData.website = formattedData.website.trim().replace(/;$/, '');
      }
      
      // Ensure array fields are arrays
      ['requirements', 'fields', 'tags'].forEach(field => {
        if (!formattedData[field] || !Array.isArray(formattedData[field])) {
          formattedData[field] = formattedData[field] ? 
            (typeof formattedData[field] === 'string' ? 
              formattedData[field].split(',').map(item => item.trim()) : 
              [formattedData[field].toString()]) : 
            [];
        }
      });
      
      const response = await api.post('/opportunities/', formattedData);
      console.log('Opportunity created successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating opportunity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateOpportunity: async (opportunityId, opportunityData) => {
    try {
      console.log(`Updating opportunity ${opportunityId} with data:`, JSON.stringify(opportunityData));
      
      // Format data for API
      const formattedData = { ...opportunityData };
      
      // Ensure deadline is properly formatted
      if (formattedData.deadline && !formattedData.deadline.includes('T')) {
        formattedData.deadline = `${formattedData.deadline}T00:00:00Z`;
      }
      
      // Clean the website URL
      if (formattedData.website) {
        formattedData.website = formattedData.website.trim().replace(/;$/, '');
      }
      
      // Ensure array fields are arrays
      ['requirements', 'fields', 'tags'].forEach(field => {
        if (!formattedData[field] || !Array.isArray(formattedData[field])) {
          formattedData[field] = formattedData[field] ? 
            (typeof formattedData[field] === 'string' ? 
              formattedData[field].split(',').map(item => item.trim()) : 
              [formattedData[field].toString()]) : 
            [];
        }
      });
      
      const response = await api.put(`/opportunities/${opportunityId}`, formattedData);
      console.log('Opportunity updated successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating opportunity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  deleteOpportunity: async (opportunityId) => {
    return api.delete(`/opportunities/${opportunityId}`);
  },
  
  likeOpportunity: async (opportunityId) => {
    return api.post(`/opportunities/${opportunityId}/like`);
  },
  
  applyForOpportunity: async (opportunityId) => {
    return api.post(`/opportunities/${opportunityId}/apply`);
  }
};

// These services are already exported individually above, so this is not needed.
// export { authService, eventService, opportunityService };

// Default export of the axios instance
export default api; 