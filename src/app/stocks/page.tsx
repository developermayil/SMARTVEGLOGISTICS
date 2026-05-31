'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Inventory2 } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { stocksAPI, farmersAPI } from '@/services/api';

const VEGETABLES = ['Tomato', 'Onion', 'Potato', 'Carrot', 'Cabbage', 'Cauliflower', 'Brinjal', 'Beans', 'Spinach', 'Okra', 'Bitter Gourd', 'Drum Stick', 'Pumpkin', 'Cucumber', 'Chilli', 'Other'];

const emptyForm = { vegetable: '', quantity: '', unit: 'kg', price_per_unit: '', farmer_id: '', purchase_date: '', notes: '' };

export default function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [s, f] = await Promise.all([stocksAPI.getAll(), farmersAPI.getAll()]);
      setStocks(s.data.data);
      setFarmers(f.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ vegetable: item.vegetable, quantity: item.quantity, unit: item.unit, price_per_unit: item.price_per_unit, farmer_id: item.farmer_id || '', purchase_date: item.purchase_date?.split('T')[0] || '', notes: item.notes || '' });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.vegetable || !form.quantity || !form.price_per_unit) { setError('Please fill required fields'); return; }
    setSaving(true); setError('');
    try {
      if (editItem) await stocksAPI.update(editItem.id, form);
      else await stocksAPI.create(form);
      setDialogOpen(false);
      load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this stock entry?')) return;
    try { await stocksAPI.delete(id); load(); } catch (e) { alert('Delete failed'); }
  };

  const totalValue = stocks.reduce((sum, s) => sum + (s.quantity * s.price_per_unit), 0);

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Inventory2 color="primary" sx={{ fontSize: 30 }} />
          <Box>
            <Typography variant="h5">Stock Management</Typography>
            <Typography variant="body2" color="text.secondary">
              {stocks.length} items · Total Value: ₹{totalValue.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Stock</Button>
      </Box>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Vegetable</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price/Unit</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell>Farmer</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : stocks.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No stock entries. Add your first stock!</TableCell></TableRow>
              ) : (
                stocks.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Chip label={s.vegetable} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{s.quantity} {s.unit}</TableCell>
                    <TableCell align="right">₹{Number(s.price_per_unit).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{(s.quantity * s.price_per_unit).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{s.farmer_name || <span style={{ color: '#999' }}>—</span>}</TableCell>
                    <TableCell>{s.purchase_date ? new Date(s.purchase_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(s)} color="primary"><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(s.id)} color="error"><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Stock' : 'Add Stock'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField select label="Vegetable *" fullWidth value={form.vegetable} onChange={e => setForm({ ...form, vegetable: e.target.value })}>
                {VEGETABLES.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Quantity *" type="number" fullWidth value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select label="Unit" fullWidth value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {['kg', 'ton', 'box', 'crate'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Price per Unit (₹) *" type="number" fullWidth value={form.price_per_unit} onChange={e => setForm({ ...form, price_per_unit: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Farmer" fullWidth value={form.farmer_id} onChange={e => setForm({ ...form, farmer_id: e.target.value })}>
                <MenuItem value="">— None —</MenuItem>
                {farmers.map((f: any) => <MenuItem key={f.id} value={f.id}>{f.name} ({f.village})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (editItem ? 'Update' : 'Add Stock')}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
