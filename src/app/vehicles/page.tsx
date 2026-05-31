'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, IconButton, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AppLayout from '@/components/layout/AppLayout';
import StatusChip from '@/components/ui/StatusChip';
import { vehiclesAPI } from '@/services/api';

const VEHICLE_TYPES = ['Truck', 'Mini Truck', 'Tempo', 'Pick-up Van', 'Container Truck'];
const emptyForm = { vehicle_number: '', vehicle_type: 'Truck', driver_name: '', driver_phone: '', driver_license: '', capacity: '', status: 'available' };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const res = await vehiclesAPI.getAll(); setVehicles(res.data.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ vehicle_number: item.vehicle_number, vehicle_type: item.vehicle_type, driver_name: item.driver_name, driver_phone: item.driver_phone, driver_license: item.driver_license || '', capacity: item.capacity, status: item.status });
    setError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.vehicle_number || !form.driver_name || !form.driver_phone || !form.capacity) { setError('Please fill all required fields'); return; }
    setSaving(true); setError('');
    try {
      if (editItem) await vehiclesAPI.update(editItem.id, form);
      else await vehiclesAPI.create(form);
      setDialogOpen(false); load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this vehicle?')) return;
    try { await vehiclesAPI.delete(id); load(); } catch { alert('Delete failed'); }
  };

  const available = vehicles.filter(v => v.status === 'available').length;

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalShippingIcon sx={{ color: 'info.main', fontSize: 30 }} />
          <Box>
            <Typography variant="h5">Vehicle Management</Typography>
            <Typography variant="body2" color="text.secondary">{vehicles.length} vehicles · {available} available</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Vehicle</Button>
      </Box>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Vehicle No.</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Capacity (kg)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Trips</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No vehicles added yet.</TableCell></TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{v.vehicle_number}</TableCell>
                    <TableCell>{v.vehicle_type}</TableCell>
                    <TableCell>{v.driver_name}</TableCell>
                    <TableCell>{v.driver_phone}</TableCell>
                    <TableCell align="right">{Number(v.capacity).toLocaleString()}</TableCell>
                    <TableCell><StatusChip status={v.status} /></TableCell>
                    <TableCell align="right">{v.completed_deliveries || 0}/{v.total_deliveries || 0}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(v)} color="primary"><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(v.id)} color="error"><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField label="Vehicle Number *" fullWidth value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="TN01AB1234" /></Grid>
            <Grid item xs={12} sm={6}><TextField select label="Vehicle Type" fullWidth value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}>{VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField label="Driver Name *" fullWidth value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Driver Phone *" fullWidth value={form.driver_phone} onChange={e => setForm({ ...form, driver_phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Driver License No." fullWidth value={form.driver_license} onChange={e => setForm({ ...form, driver_license: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Capacity (kg) *" type="number" fullWidth value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></Grid>
            {editItem && (
              <Grid item xs={12}><TextField select label="Status" fullWidth value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['available', 'in-transit', 'maintenance'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField></Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (editItem ? 'Update' : 'Add Vehicle')}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
