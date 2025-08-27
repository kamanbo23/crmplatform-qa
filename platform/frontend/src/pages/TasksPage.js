import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';

function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }

export default function TasksPage() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', assigned_to_id:'', status:'pending' });
  const [snackbar, setSnackbar] = useState({ open:false, message:'', severity:'success' });

  const fetchTasks = async () => {
    try {
      const res = isAdmin ? await api.get('/api/tasks') : await api.get('/api/users/me/tasks');
      setTasks(res.data);
    } catch (error) { 
      console.error('Error fetching tasks:', error);
      setSnackbar({ open:true, message:'Failed to load tasks', severity:'error'}); 
    }
  };
  const fetchUsers = async () => { if(!isAdmin) return; try { const res = await api.get('/api/users'); setUsers(res.data); } catch {} };
  useEffect(()=>{ fetchTasks(); fetchUsers(); }, []);

  const handleOpen = (task=null) => { setEditTask(task); setForm(task? {...task} : { title:'', description:'', assigned_to_id:'', status:'pending' }); setOpen(true);} ;
  const handleClose = ()=> setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if(editTask){ await api.put(`/api/tasks/${editTask.id}`, form); setSnackbar({ open:true, message:'Task updated', severity:'success'}); }
      else { await api.post('/api/tasks', form); setSnackbar({ open:true, message:'Task created', severity:'success'});} fetchTasks(); handleClose();
    } catch { setSnackbar({ open:true, message:'Error saving task', severity:'error'});} };

  const handleDelete = async (id)=>{ try{ await api.delete(`/api/tasks/${id}`); setSnackbar({ open:true, message:'Task deleted', severity:'success'}); fetchTasks(); }catch{ setSnackbar({ open:true, message:'Error deleting task', severity:'error'});} };

  const handleStatusUpdate = async (id, newStatus)=>{ try{ await api.patch(`/api/tasks/${id}/status`, { status:newStatus }); fetchTasks(); }catch{} };

  return (<Box sx={{ p:4 }}>
    <Typography variant="h5" gutterBottom>Tasks</Typography>
    {isAdmin && <Button variant="contained" onClick={()=>handleOpen()}>Add Task</Button>}
    <Box sx={{ height:400, mt:2 }}>
      <DataGrid rows={tasks} columns={[{ field:'id', headerName:'ID', width:70 },{ field:'title', headerName:'Title', width:180 },{ field:'status', headerName:'Status', width:120 },{ field:'assigned_to_id', headerName:'Assignee', width:120 }, isAdmin && { field:'actions', headerName:'Actions', width:220, renderCell:(params)=>(<><Button size="small" onClick={()=>handleOpen(params.row)}>Edit</Button><Button size="small" color="error" onClick={()=>handleDelete(params.row.id)}>Delete</Button></>)}, !isAdmin && { field:'update', headerName:'Update', width:180, renderCell:(params)=>(<><Button size="small" onClick={()=>handleStatusUpdate(params.row.id, params.row.status==='pending'?'completed':'pending')}>{params.row.status==='pending'?'Mark Completed':'Mark Pending'}</Button></>)} ].filter(Boolean)} pageSize={5} rowsPerPageOptions={[5]} />
    </Box>
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{editTask?'Edit Task':'Add Task'}</DialogTitle>
      <DialogContent>
        <TextField margin="normal" label="Title" name="title" value={form.title} onChange={handleChange} fullWidth />
        <TextField margin="normal" label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={3} />
        {isAdmin && <TextField select margin="normal" label="Assign To (user_id)" name="assigned_to_id" value={form.assigned_to_id} onChange={handleChange} fullWidth >
            {users.map(u=>(<MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>))}
        </TextField>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {isAdmin && <Button onClick={handleSave} variant="contained">Save</Button>}
      </DialogActions>
    </Dialog>
    <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={()=>setSnackbar({...snackbar, open:false})}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
  </Box>);
} 