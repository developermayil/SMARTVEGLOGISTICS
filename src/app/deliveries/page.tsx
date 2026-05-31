'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Chip
} from '@mui/material';
import { Add, Edit, Delete, LocalShipping, CheckCircle } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import StatusChip from '@/components/ui/StatusChip';
import { deliveriesAPI, vehiclesAPI } from '@/services/api';

const KERALA_MARKETS = ['Chalai Market, Thiruvananthapuram', 'Ernakulam Market', 'Koyambedu Market, Thrissur', 'Palakkad Market', 'Kozhikode Market', 'Kannur Market', 'Kottayam Market', 'Alappuzha Market'];
const emptyForm = { vehicle_id: '', destination: '', destination_market: '', scheduled_date: '', driver_notes: '' };

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [d, v] = await Promise.all([deliveriesAPI.getAll(), vehiclesAPI.getAvailable()]);
      setDeliveries(d.data.data);
      setVehicles(v.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setError(''); setDialogOpen(true); };

  const handleCreate = async () => {
    if (!form.vehicle_id || !form.destination) { setError('Vehicle and destination are required'); return; }
    setSaving(true); setError('');
    try { await deliveriesAPI.create(form); setDialogOpen(false); load(); }
    catch (e: any) { setError(e.response?.data?.message || 'Error creating delivery'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setSaving(true);
    try { await deliveriesAPI.updateStatus(statusDialog.id, { status: newStatus }); setStatusDialog(null); load(); }
    catch { alert('Status update failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this delivery?')) return;
    try { await deliveriesAPI.delete(id); load(); } catch { alert('Delete failed'); }
  };

  const total = deliveries.length;
  const completed = deliveries.filter(d => d.status === 'delivered').length;
  const revenue = deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + Number(d.total_value || 0), 0);

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalShipping sx={{ color: 'warning.main', fontSize: 30 }} />
          <Box>
            <Typography variant="h5">Delivery Management</Typography>
            <Typography variant="body2" color="text.secondary">
              {total} total · {completed} delivered · Revenue: ₹{revenue.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>New Delivery</Button>
      </Box>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Delivery No.</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : deliveries.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No deliveries yet.</TableCell></TableRow>
              ) : (
                deliveries.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: 13 }}>{d.delivery_number}</TableCell>
                    <TableCell>{d.vehicle_number || '—'}</TableCell>
                    <TableCell>{d.driver_name || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="body2" noWrap>{d.destination}</Typography>
                      {d.destination_market && <Typography variant="caption" color="text.secondary" noWrap display="block">{d.destination_market}</Typography>}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>₹{Number(d.total_value || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{d.scheduled_date ? new Date(d.scheduled_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                    <TableCell><StatusChip status={d.status} /></TableCell>
                    <TableCell align="center">
                      {d.status !== 'delivered' && d.status !== 'cancelled' && (
                        <Tooltip title="Update Status">
                          <IconButton size="small" onClick={() => { setStatusDialog(d); setNewStatus(d.status); }} color="primary"><CheckCircle fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(d.id)} color="error"><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* New Delivery Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Delivery</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField select label="Vehicle *" fullWidth value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
                <MenuItem value="">— Select Available Vehicle —</MenuItem>
                {vehicles.map((v: any) => <MenuItem key={v.id} value={v.id}>{v.vehicle_number} — {v.driver_name} ({v.capacity}kg)</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="Destination *" fullWidth value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Ernakulam, Kerala" /></Grid>
            <Grid item xs={12}>
              <TextField select label="Destination Market" fullWidth value={form.destination_market} onChange={e => setForm({ ...form, destination_market: e.target.value })}>
                <MenuItem value="">— Select Market —</MenuItem>
                {KERALA_MARKETS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="Scheduled Date" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Driver Notes" fullWidth multiline rows={2} value={form.driver_notes} onChange={e => setForm({ ...form, driver_notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Create Delivery'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Status — {statusDialog?.delivery_number}</DialogTitle>
        <DialogContent>
          <TextField select label="New Status" fullWidth value={newStatus} onChange={e => setNewStatus(e.target.value)} sx={{ mt: 1 }}>
            {['pending', 'in-transit', 'delivered', 'cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
