import React, { useEffect, useState } from 'react';
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
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Visibility, 
  Edit, 
  Delete,
  Print,
  Share,
  GetApp,
  Close,
  CalendarToday 
} from '@mui/icons-material';
import api from '../services/api';

function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }

export default function NewslettersPage() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/newsletters');
      setItems(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load newsletters', severity: 'error' });
    }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleOpen = (item=null) => {
    setEditItem(item);
    setForm(item ? { ...item } : { title: '', content: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/api/newsletters/${editItem.id}`, form);
        setSnackbar({ open: true, message: 'Newsletter updated', severity: 'success' });
      } else {
        await api.post('/api/newsletters', form);
        setSnackbar({ open: true, message: 'Newsletter created', severity: 'success' });
      }
      fetchItems();
      handleClose();
    } catch {
      setSnackbar({ open: true, message: 'Error saving newsletter', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this newsletter?')) return;
    try {
      await api.delete(`/api/newsletters/${id}`);
      setSnackbar({ open: true, message: 'Newsletter deleted', severity: 'success' });
      fetchItems();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting newsletter', severity: 'error' });
    }
  };

  const handleViewNewsletter = (newsletter) => {
    setSelectedNewsletter(newsletter);
    setViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedNewsletter(null);
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

  const handleShare = (newsletter) => {
    if (navigator.share) {
      navigator.share({
        title: newsletter.title,
        text: newsletter.content ? newsletter.content.substring(0, 200) + '...' : '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${newsletter.title} - ${window.location.href}`);
      alert('Newsletter link copied to clipboard!');
    }
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Newsletters</Typography>
      {isAdmin && <Button variant="contained" onClick={() => handleOpen()}>Add Newsletter</Button>}
      <Box sx={{ height: 400, mt:2 }}>
        <DataGrid 
          rows={items} 
          columns={[
            { field:'id', headerName:'ID', width:70 },
            { field:'title', headerName:'Title', width:200 },
            { 
              field:'content', 
              headerName:'Content', 
              width:300,
              renderCell: (params) => (
                <Typography variant="body2" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%'
                }}>
                  {params.value ? params.value.substring(0, 50) + '...' : 'No content'}
                </Typography>
              )
            },
            { 
              field: 'publish_date',
              headerName: 'Published',
              width: 150,
              renderCell: (params) => (
                <Chip
                  label={params.value ? 'Published' : 'Draft'}
                  color={params.value ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              )
            },
            { 
              field:'actions', 
              headerName:'Actions', 
              width:250, 
              renderCell:(params)=>(
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View Full Newsletter">
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={() => handleViewNewsletter(params.row)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  {isAdmin && (
                    <>
                      <Tooltip title="Edit Newsletter">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpen(params.row)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Newsletter">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(params.row.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Share Newsletter">
                    <IconButton 
                      size="small" 
                      onClick={() => handleShare(params.row)}
                    >
                      <Share />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download Newsletter">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDownload(params.row)}
                    >
                      <GetApp />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )
            }
          ]} 
          pageSize={5} 
          rowsPerPageOptions={[5, 10, 20]} 
          disableSelectionOnClick
          autoHeight
        />
      </Box>
      
      {/* Edit/Add Newsletter Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'Edit Newsletter':'Add Newsletter'}</DialogTitle>
        <DialogContent>
          <TextField margin="normal" label="Title" name="title" value={form.title} onChange={handleChange} fullWidth />
          <TextField margin="normal" label="Content" name="content" value={form.content} onChange={handleChange} fullWidth multiline rows={8} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {isAdmin && <Button onClick={handleSave} variant="contained">Save</Button>}
        </DialogActions>
      </Dialog>

      {/* View Newsletter Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={closeViewDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh',
          },
        }}
      >
        {selectedNewsletter && (
          <>
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
                    <IconButton onClick={closeViewDialog}>
                      <Close />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, overflow: 'auto' }}>
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
              <Paper sx={{ p: 3, backgroundColor: 'grey.50' }}>
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
                          backgroundColor: 'white',
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
              </Paper>

              {/* Newsletter Footer */}
              <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Thank you for reading! Stay connected with the SpartUp community for more updates.
                </Typography>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
              <Box>
                {isAdmin && (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => {
                      closeViewDialog();
                      handleOpen(selectedNewsletter);
                    }}
                    variant="outlined"
                  >
                    Edit Newsletter
                  </Button>
                )}
              </Box>
              <Box>
                <Button onClick={closeViewDialog} sx={{ mr: 1 }}>
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
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={()=>setSnackbar({...snackbar, open:false})}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
} 