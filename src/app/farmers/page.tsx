'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Alert, CircularProgress, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Chip
} from '@mui/material';
import { Add, Edit, Delete, People, Phone, LocationOn } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { farmersAPI } from '@/services/api';

const emptyForm = { name: '', village: '', district: 'Tamil Nadu', phone: '', alternate_phone: '', email: '', bank_account: '', ifsc_code: '' };

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const res = await farmersAPI.getAll(); setFarmers(res.data.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, village: item.village, district: item.district, phone: item.phone, alternate_phone: item.alternate_phone || '', email: item.email || '', bank_account: item.bank_account || '', ifsc_code: item.ifsc_code || '' });
    setError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.village || !form.phone) { setError('Name, village, and phone are required'); return; }
    setSaving(true); setError('');
    try {
      if (editItem) await farmersAPI.update(editItem.id, form);
      else await farmersAPI.create(form);
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this farmer?')) return;
    try { await farmersAPI.delete(id); load(); } catch { alert('Delete failed'); }
  };

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <People color="secondary" sx={{ fontSize: 30 }} />
          <Box>
            <Typography variant="h5">Farmer Management</Typography>
            <Typography variant="body2" color="text.secondary">{farmers.length} farmers registered</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Farmer</Button>
      </Box>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Farmer</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Supplies</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : farmers.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No farmers registered yet.</TableCell></TableRow>
              ) : (
                farmers.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.light', fontSize: 14, color: '#fff' }}>
                          {f.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{f.name}</Typography>
                          {f.email && <Typography variant="caption" color="text.secondary">{f.email}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">{f.village}, {f.district}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2">{f.phone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`${f.total_supplies} supplies`} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{Number(f.total_value || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(f)} color="primary"><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(f.id)} color="error"><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Farmer' : 'Register Farmer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Full Name *" fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Village *" fullWidth value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="District" fullWidth value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone *" fullWidth value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Alternate Phone" fullWidth value={form.alternate_phone} onChange={e => setForm({ ...form, alternate_phone: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Email" type="email" fullWidth value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Bank Account No." fullWidth value={form.bank_account} onChange={e => setForm({ ...form, bank_account: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="IFSC Code" fullWidth value={form.ifsc_code} onChange={e => setForm({ ...form, ifsc_code: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (editItem ? 'Update' : 'Register')}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
