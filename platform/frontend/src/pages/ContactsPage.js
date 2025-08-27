import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Autocomplete,
  Stack,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Badge,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Menu,
  MenuList,
  ListItemIcon,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import TableViewIcon from '@mui/icons-material/TableView';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import api from '../services/api';

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export default function ContactsPage() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [editContact, setEditContact] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    recipients: []
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    tags: [],
    role: 'member'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/contacts');
      const rows = res.data.map((c) => ({
        ...c,
        tagsDisplay: c.tags?.map((t) => t.name).join(', ') ?? '',
        role: c.user?.role || 'No Account',
        id: c.id,
      }));
      setContacts(rows);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to load contacts', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get('/api/tags');
      setAvailableTags(res.data.map(tag => tag.name));
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  const openDialog = (contact = null) => {
    // Non-admin users can only view contacts, not edit them
    if (!isAdmin && contact) {
      // For non-admin users, just show the contact details in read-only mode
      setEditContact(contact);
      setForm({
        id: contact.id,
        full_name: contact.full_name,
        email: contact.email,
        tags: contact.tags?.map((t) => t.name) ?? [],
        role: contact.user?.role || 'member',
      });
      setDialogOpen(true);
      return;
    }
    
    // Admin users can edit and create contacts
    setEditContact(contact);
    if (contact) {
      setForm({
        id: contact.id,
        full_name: contact.full_name,
        email: contact.email,
        tags: contact.tags?.map((t) => t.name) ?? [],
        role: contact.user?.role || 'member',
      });
    } else {
      setForm({ full_name: '', email: '', tags: [], role: 'member' });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    // Only reset credentials if we're not showing the credentials dialog
    if (!credentialsDialogOpen) {
      setGeneratedCredentials(null);
    }
  };

  const closeCredentialsDialog = () => {
    setCredentialsDialogOpen(false);
    setGeneratedCredentials(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTagsChange = (event, value) => {
    // Ensure we're storing tag names (strings) not tag objects
    const tagNames = value.map(tag => typeof tag === 'string' ? tag : tag.name || tag);
    setForm({ ...form, tags: tagNames });
  };

  const generateUsername = (fullName, email) => {
    const emailUsername = email.split('@')[0];
    const nameUsername = fullName.toLowerCase().replace(/\s+/g, '.');
    return emailUsername || nameUsername;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSave = async () => {
      const payload = {
        email: form.email,
        full_name: form.full_name,
        tags: form.tags,
        role: form.role,
        create_user_account: true,
      };
      
      console.log('Sending payload:', payload);
    
    try {

      if (editContact) {
        await api.put(`/api/contacts/${editContact.id}`, payload);
        setSnackbar({ open: true, message: 'Contact updated', severity: 'success' });
        closeDialog();
      } else {
        const response = await api.post('/api/contacts', payload);
        console.log('Contact creation response:', response.data);
        
        if (response.data.user_credentials) {
          console.log('Setting generated credentials:', response.data.user_credentials);
          setGeneratedCredentials(response.data.user_credentials);
          setCredentialsDialogOpen(true);
        } else {
          console.warn('No user_credentials in response:', response.data);
          closeDialog();
        }
        
        setSnackbar({ open: true, message: 'Contact created successfully', severity: 'success' });
      }
      fetchContacts();
    } catch (error) {
      console.error('Contact creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Request payload:', payload);
      setSnackbar({ open: true, message: `Error saving contact: ${error.response?.data?.detail || error.message}`, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/contacts/${id}`);
      setSnackbar({ open: true, message: 'Contact deleted', severity: 'success' });
      fetchContacts();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error deleting contact', severity: 'error' });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'mentor':
        return <SchoolIcon />;
      case 'admin':
        return <PersonIcon />;
      default:
        return <GroupIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'mentor':
        return 'secondary';
      case 'admin':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Enhanced filtering logic
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.tagsDisplay.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tag filtering
    if (selectedTags.length > 0) {
      filtered = filtered.filter(contact =>
        selectedTags.some(tag => contact.tagsDisplay.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    // Role filtering
    if (selectedRoles.length > 0) {
      filtered = filtered.filter(contact =>
        selectedRoles.includes(contact.role)
      );
    }

    return filtered;
  }, [contacts, searchTerm, selectedTags, selectedRoles]);

  // Get unique roles from contacts
  const uniqueRoles = useMemo(() => {
    const roles = contacts.map(c => c.role).filter(Boolean);
    return [...new Set(roles)];
  }, [contacts]);

  // Handle email sending
  const handleSendEmail = async () => {
    try {
      const recipientIds = emailForm.recipients.map(r => r.id);
      
      const response = await api.post('/api/contacts/send-email', {
        subject: emailForm.subject,
        message: emailForm.message,
        recipient_ids: recipientIds
      });
      
      setSnackbar({ 
        open: true, 
        message: response.data.message, 
        severity: 'success' 
      });
      setEmailDialogOpen(false);
      setEmailForm({ subject: '', message: '', recipients: [] });
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error sending email', severity: 'error' });
    }
  };

  // Export filtered contacts
  const exportContacts = (format = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const tagFilter = selectedTags.length > 0 ? `_${selectedTags.join('_')}` : '';
    const filename = `contacts${tagFilter}_${timestamp}`;

    if (format === 'emails_only') {
      // Export just email addresses for easy copy-paste
      const emailList = filteredContacts.map(contact => contact.email).join('\n');
      const blob = new Blob([emailList], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_emails.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'emails_semicolon') {
      // Export emails separated by semicolons for email clients
      const emailList = filteredContacts.map(contact => contact.email).join('; ');
      const blob = new Blob([emailList], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_emails_semicolon.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'emails_comma') {
      // Export emails separated by commas for email clients
      const emailList = filteredContacts.map(contact => contact.email).join(', ');
      const blob = new Blob([emailList], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_emails_comma.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Default CSV export
      const csvContent = [
        ['Name', 'Email', 'Role', 'Tags'].join(','),
        ...filteredContacts.map(contact => [
          `"${contact.full_name}"`,
          contact.email,
          contact.role,
          `"${contact.tagsDisplay}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Select all filtered contacts
  const selectAllFiltered = () => {
    setSelectedContacts(filteredContacts.map(c => c.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedContacts([]);
  };

  // Handle export menu
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportFormat = (format) => {
    exportContacts(format);
    handleExportClose();
    setSnackbar({ 
      open: true, 
      message: `Exported ${filteredContacts.length} contacts in ${format} format`, 
      severity: 'success' 
    });
  };

  // Copy emails to clipboard
  const copyEmailsToClipboard = (format = 'comma') => {
    const separator = format === 'semicolon' ? '; ' : format === 'newline' ? '\n' : ', ';
    const emailList = filteredContacts.map(contact => contact.email).join(separator);
    
    navigator.clipboard.writeText(emailList).then(() => {
      setSnackbar({ 
        open: true, 
        message: `Copied ${filteredContacts.length} email addresses to clipboard`, 
        severity: 'success' 
      });
    }).catch(() => {
      setSnackbar({ 
        open: true, 
        message: 'Failed to copy to clipboard', 
        severity: 'error' 
      });
    });
  };

  // Columns for DataGrid
  const columns = useMemo(
    () => [
      {
        field: 'selection',
        headerName: '',
        width: 50,
        sortable: false,
        renderCell: (params) => (
          <Checkbox
            checked={selectedContacts.includes(params.row.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedContacts([...selectedContacts, params.row.id]);
              } else {
                setSelectedContacts(selectedContacts.filter(id => id !== params.row.id));
              }
            }}
          />
        ),
      },
      { field: 'id', headerName: 'ID', width: 70 },
      { 
        field: 'full_name', 
        headerName: 'Full Name', 
        flex: 1, 
        minWidth: 150,
        renderCell: (params) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>{params.value}</Typography>
            {params.row.user && (
              <Tooltip title={`User Account: ${params.row.role}`}>
                <Badge color={getRoleColor(params.row.role)}>
                  {getRoleIcon(params.row.role)}
                </Badge>
              </Tooltip>
            )}
          </Stack>
        )
      },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
      {
        field: 'role',
        headerName: 'Role',
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={getRoleColor(params.value)}
            size="small"
            icon={getRoleIcon(params.value)}
          />
        ),
      },
      {
        field: 'tagsDisplay',
        headerName: 'Tags',
        flex: 1,
        minWidth: 200,
        sortable: false,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {params.value.split(', ').map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        width: 150,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="View Details">
              <IconButton size="small" color="info" onClick={() => openDialog(params.row)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <>
                <Tooltip title="Edit Contact">
            <IconButton size="small" color="primary" onClick={() => openDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
                </Tooltip>
                <Tooltip title="Delete Contact">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        ),
      },
    ],
    [selectedContacts]
  );

  return (
    <Box sx={{ p: 2 }}>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h5">{isAdmin ? 'Contacts Management' : 'Community Directory'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin ? 'Manage contacts, create user accounts, and send targeted emails' : 'Browse the community contacts directory'}
          </Typography>
        </Grid>
        {isAdmin && (
        <Grid item>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => {
                  setEmailForm({
                    subject: '',
                    message: '',
                    recipients: filteredContacts.filter(c => selectedContacts.includes(c.id))
                  });
                  setEmailDialogOpen(true);
                }}
                disabled={selectedContacts.length === 0}
              >
                Email Selected ({selectedContacts.length})
              </Button>
              <Button variant="contained" onClick={() => openDialog()}>
                Add Contact
              </Button>
            </Stack>
          </Grid>
        )}
      </Grid>

      {/* Search and Action Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search contacts by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                color={selectedTags.length > 0 || selectedRoles.length > 0 ? "primary" : "inherit"}
              >
                Filters {(selectedTags.length + selectedRoles.length > 0) && `(${selectedTags.length + selectedRoles.length})`}
              </Button>
              {isAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  endIcon={<ArrowDropDownIcon />}
                  onClick={handleExportClick}
                  disabled={filteredContacts.length === 0}
                >
                  Export ({filteredContacts.length})
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTags([]);
                  setSelectedRoles([]);
                }}
                disabled={searchTerm === '' && selectedTags.length === 0 && selectedRoles.length === 0}
              >
                Clear All
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Advanced Filter Panel */}
        {filterPanelOpen && (
          <Accordion expanded={filterPanelOpen} sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Advanced Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Filter Controls */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>🏷️ Filter by Tags</Typography>
                  <Autocomplete
                    multiple
                    options={availableTags}
                    value={selectedTags}
                    onChange={(event, newValue) => setSelectedTags(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select tags to filter by..."
                        variant="outlined"
                        size="small"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>👤 Filter by Role</Typography>
                  <Autocomplete
                    multiple
                    options={uniqueRoles}
                    value={selectedRoles}
                    onChange={(event, newValue) => setSelectedRoles(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select roles to filter by..."
                        variant="outlined"
                        size="small"
                      />
                    )}
                  />
                </Grid>
                
                {/* Quick Filter Buttons */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>⚡ Quick Filters</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                         <Button
                       size="small"
                       variant="outlined"
                       onClick={() => setSelectedTags(['Startup'])}
                     >
                       🚀 Startup Contacts
                     </Button>
                     <Button
                       size="small"
                       variant="outlined"
                       onClick={() => setSelectedRoles(['mentor'])}
                     >
                       👩‍🏫 Mentors Only
                     </Button>
                     <Button
                       size="small"
                       variant="outlined"
                       onClick={() => setSelectedRoles(['admin'])}
                     >
                       🔧 Admins Only
                     </Button>
                     <Button
                       size="small"
                       variant="outlined"
                       onClick={() => setSelectedTags(['AI', 'Machine Learning'])}
                     >
                       🤖 AI/ML Contacts
                     </Button>
                     <Button
                       size="small"
                       variant="outlined"
                       onClick={() => setSelectedTags(['Technology'])}
                     >
                       💻 Technology
                     </Button>
                     <Button
                       size="small"
                       variant="outlined"
                       onClick={() => setSelectedTags(['Business'])}
                     >
                       💼 Business
                     </Button>
                  </Stack>
      </Grid>

                {/* Selection Actions */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>🎯 Selection Actions</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SelectAllIcon />}
                      onClick={selectAllFiltered}
                    >
                      Select All ({filteredContacts.length})
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearSelection}
                    >
                      Clear Selection
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>

      {/* Results Summary */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.lighter', border: '1px solid', borderColor: 'primary.light' }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                📊 {filteredContacts.length} of {contacts.length} contacts
              </Typography>
              {selectedTags.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Filtered by tags:</Typography>
                  {selectedTags.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      onDelete={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    />
                  ))}
                </Box>
              )}
              {selectedRoles.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Filtered by roles:</Typography>
                  {selectedRoles.map((role, index) => (
                    <Chip 
                      key={index} 
                      label={role} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                      onDelete={() => setSelectedRoles(selectedRoles.filter(r => r !== role))}
                    />
                  ))}
                </Box>
              )}
              {selectedContacts.length > 0 && (
                <Chip 
                  label={`${selectedContacts.length} selected`} 
                  color="info" 
                  size="small"
                />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 1, md: 0 } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              {selectedContacts.length > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={() => {
                    setEmailForm({
                      subject: '',
                      message: '',
                      recipients: filteredContacts.filter(c => selectedContacts.includes(c.id))
                    });
                    setEmailDialogOpen(true);
                  }}
                >
                  Email {selectedContacts.length}
                </Button>
              )}
              {(selectedTags.length > 0 || selectedRoles.length > 0) && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => copyEmailsToClipboard('comma')}
                >
                  Copy All Emails
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ height: 600 }}>
        <DataGrid
          rows={filteredContacts}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          disableSelectionOnClick
          autoHeight
          checkboxSelection={false}
        />
      </Box>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Email to Selected Contacts</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Recipients ({emailForm.recipients.length} contacts):
              </Typography>
              <Box sx={{ maxHeight: 100, overflow: 'auto', border: 1, borderColor: 'grey.300', p: 1, borderRadius: 1 }}>
                {emailForm.recipients.map((recipient, index) => (
                  <Chip
                    key={index}
                    label={`${recipient.full_name} (${recipient.email})`}
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={6}
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSendEmail}
            disabled={!emailForm.subject || !emailForm.message}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for add/edit */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {!isAdmin && editContact ? 'Contact Details' : editContact ? 'Edit Contact' : 'Add New Contact'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
          <TextField
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={handleFormChange}
            margin="normal"
            fullWidth
            required
            disabled={!isAdmin}
          />
            </Grid>
            <Grid item xs={12} md={6}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleFormChange}
            margin="normal"
            fullWidth
            required
            disabled={!isAdmin}
          />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  label="Role"
                  disabled={!isAdmin}
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="mentor">Mentor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={form.tags}
            onChange={handleTagsChange}
            disabled={!isAdmin}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Tags"
                placeholder="Add tags (press Enter to add new)"
                margin="normal"
                disabled={!isAdmin}
              />
            )}
          />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>
            {!isAdmin && editContact ? 'Close' : 'Cancel'}
          </Button>
          {isAdmin && (
            <Button variant="contained" onClick={handleSave}>
              {editContact ? 'Update' : 'Create Contact & User Account'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={credentialsDialogOpen} onClose={closeCredentialsDialog} maxWidth="sm" fullWidth>
        {console.log('Credentials dialog - generatedCredentials:', generatedCredentials)}
        <DialogTitle>User Account Created Successfully!</DialogTitle>
        <DialogContent dividers>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Credentials
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Username:</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {generatedCredentials?.username}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Password:</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {generatedCredentials?.password}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Role:</Typography>
                  <Chip
                    label={generatedCredentials?.role}
                    color={getRoleColor(generatedCredentials?.role)}
                    icon={getRoleIcon(generatedCredentials?.role)}
                  />
                </Box>
              </Stack>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please save these credentials securely. The password cannot be retrieved later.
              </Alert>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCredentialsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{
          sx: { minWidth: 280 }
        }}
      >
        <MenuList dense>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
            📧 Email Lists (Copy to Clipboard)
          </Typography>
          <MenuItem onClick={() => copyEmailsToClipboard('comma')}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Copy Emails (Comma Separated)"
              secondary="email1@example.com, email2@example.com"
            />
          </MenuItem>
          <MenuItem onClick={() => copyEmailsToClipboard('semicolon')}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Copy Emails (Semicolon Separated)"
              secondary="email1@example.com; email2@example.com"
            />
          </MenuItem>
          <MenuItem onClick={() => copyEmailsToClipboard('newline')}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Copy Emails (One Per Line)"
              secondary="Perfect for bulk email tools"
            />
          </MenuItem>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
            📥 Download Files
          </Typography>
          <MenuItem onClick={() => handleExportFormat('emails_only')}>
            <ListItemIcon>
              <TextFormatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Download Email List (.txt)"
              secondary="Plain text file with one email per line"
            />
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat('emails_comma')}>
            <ListItemIcon>
              <TextFormatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Download Comma-Separated Emails (.txt)"
              secondary="For email client import"
            />
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat('emails_semicolon')}>
            <ListItemIcon>
              <TextFormatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Download Semicolon-Separated Emails (.txt)"
              secondary="For Outlook and other email clients"
            />
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat('csv')}>
            <ListItemIcon>
              <TableViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Download Full Data (.csv)"
              secondary="Complete contact information"
            />
          </MenuItem>
        </MenuList>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 