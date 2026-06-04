'use client';
import { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Button, Card, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip,
  ImageList, ImageListItem, FormControlLabel, Switch,
  Autocomplete
} from '@mui/material';
import { Add, Edit, Delete, ShoppingCart, CloudUpload, Image } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { ordersAPI, customersAPI } from '@/services/api';

// Using Tesseract.js for OCR (free, works offline)
import Tesseract from 'tesseract.js';

const emptyForm = { 
  customer_id: '', 
  items: [{ product_name: '', quantity: '', price: '' }],
  total_amount: '',
  status: 'pending',
  notes: '',
  created_date: new Date().toISOString().split('T')[0]
};

const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractingText, setExtractingText] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [o, c] = await Promise.all([ordersAPI.getAll(), customersAPI.getAll()]);
      setOrders(o.data.data);
      setCustomers(c.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { 
    setEditItem(null); 
    setForm({ ...emptyForm, created_date: new Date().toISOString().split('T')[0] }); 
    setError(''); 
    setDialogOpen(true); 
  };
  
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ 
      customer_id: item.customer_id || '', 
      items: item.items || [{ product_name: '', quantity: '', price: '' }],
      total_amount: item.total_amount || '',
      status: item.status || 'pending',
      notes: item.notes || '',
      created_date: item.created_date?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    setError('');
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { product_name: '', quantity: '', price: '' }] });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
    calculateTotal(newItems);
  };

  const handleItemChange = (index: any, field: any, value: any) => {
    const newItems :any = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
    calculateTotal(newItems);
  };

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (qty * price);
    }, 0);
    setForm({ ...form, total_amount: total.toString() });
  };

  const handleSave = async () => {
    if (!form.customer_id) { setError('Please select a customer'); return; }
    if (form.items.length === 0 || !form.items[0].product_name) { setError('Please add at least one product'); return; }
    
    setSaving(true); setError('');
    try {
      if (editItem) await ordersAPI.update(editItem.id, form);
      else await ordersAPI.create(form);
      setDialogOpen(false);
      load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Delete this order?')) return;
    try { await ordersAPI.delete(id); load(); } catch (e) { alert('Delete failed'); }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  // Image to Text extraction using Tesseract.js
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractTextFromImage = async () => {
    if (!selectedImage) return;
    
    setExtractingText(true);
    setExtractedData(null);
    
    try {
      // Use Tesseract.js for OCR (free, no API key needed)
      const { data: { text } } = await Tesseract.recognize(
        selectedImage,
        'eng',
        {
          logger: (m) => console.log(m),
        }
      );
      
      // Parse extracted text to extract order information
      const parsedData = parseOrderFromText(text);
      setExtractedData(parsedData);
      
      // Auto-fill the order form with extracted data
      if (parsedData.items && parsedData.items.length > 0) {
        setForm(prev => ({
          ...prev,
          items: parsedData.items,
          total_amount: parsedData.total_amount || prev.total_amount,
          notes: parsedData.notes || prev.notes
        }));
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      setError('Failed to extract text from image. Please try again.');
    } finally {
      setExtractingText(false);
    }
  };

  const parseOrderFromText = (text: string) => {
    // Simple parsing logic - you can enhance this based on your needs
    const lines = text.split('\n');
    const items: any[] = [];
    let total_amount = '';
    
    // Look for patterns like "Product Name: Quantity @ Price"
    // or "Product Name - Quantity x Price"
    const itemPattern = /([A-Za-z\s]+)[:\s-]+(\d+(?:\.\d+)?)[\sx*]+(\d+(?:\.\d+)?)/i;
    const totalPattern = /total[:\s]*₹?(\d+(?:\.\d+)?)/i;
    
    for (const line of lines) {
      const itemMatch = line.match(itemPattern);
      if (itemMatch) {
        items.push({
          product_name: itemMatch[1].trim(),
          quantity: itemMatch[2],
          price: itemMatch[3]
        });
      }
      
      const totalMatch = line.match(totalPattern);
      if (totalMatch && !total_amount) {
        total_amount = totalMatch[1];
      }
    }
    
    return {
      items: items.length > 0 ? items : [{ product_name: 'Extracted Product', quantity: '1', price: '0' }],
      total_amount: total_amount || '',
      notes: `Extracted from image: ${text.substring(0, 200)}...`
    };
  };

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCart color="primary" sx={{ fontSize: 30 }} />
          <Box>
            <Typography variant="h5">Order Management</Typography>
            <Typography variant="body2" color="text.secondary">
              {orders.length} orders · Total Revenue: ₹{totalRevenue.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Order</Button>
      </Box>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No orders found. Add your first order!</TableCell></TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{order.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{order.customer_phone}</Typography>
                    </TableCell>
                    <TableCell>
                      {order.items && order.items.slice(0, 2).map((item: any, idx: number) => (
                        <Chip 
                          key={idx} 
                          label={`${item.product_name} (${item.quantity})`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {order.items && order.items.length > 2 && (
                        <Chip label={`+${order.items.length - 2} more`} size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        size="small" 
                        color={getStatusColor(order.status)} 
                      />
                    </TableCell>
                    <TableCell>{new Date(order.created_date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(order)} color="primary"><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(order.id)} color="error"><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Order Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {editItem ? 'Edit Order' : 'Create New Order'}
            <Button 
              size="small" 
              startIcon={<Image />} 
              onClick={() => fileInputRef.current?.click()}
              variant="outlined"
            >
              Extract from Image
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleImageUpload}
          />
          
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>


<Autocomplete
  options={customers || []}
  value={customers.find((c) => c._id === form.customer_id) ?? null}
  onChange={(_, newValue) => {
    setForm((prev) => ({
      ...prev,
      customer_id: newValue?._id ?? null,
    }));
  }}
  isOptionEqualToValue={(option, value) =>
    option._id === value._id
  }
  getOptionLabel={(option) =>
    option
      ? `${option.name} (${option.phone}) - ${option.address}`
      : ""
  }
  renderInput={(params) => (
    <TextField {...params} label="Customer" />
  )}
/>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Created Date" 
                type="date" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={form.created_date} 
                onChange={e => setForm({ ...form, created_date: e.target.value })} 
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Order Items</Typography>
              {form.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={5}>
                    <TextField 
                      label="Product Name" 
                      fullWidth 
                      size="small"
                      value={item.product_name} 
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField 
                      label="Quantity" 
                      type="number" 
                      fullWidth 
                      size="small"
                      value={item.quantity} 
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField 
                      label="Price (₹)" 
                      type="number" 
                      fullWidth 
                      size="small"
                      value={item.price} 
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button size="small" onClick={handleAddItem} sx={{ mt: 1 }}>
                + Add Item
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                select 
                label="Status" 
                fullWidth 
                value={form.status} 
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                {ORDER_STATUSES.map(s => (
                  <MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Total Amount (₹)" 
                type="number" 
                fullWidth 
                value={form.total_amount} 
                InputProps={{ readOnly: true }}
                helperText="Auto-calculated from items"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                label="Notes" 
                fullWidth 
                multiline 
                rows={2} 
                value={form.notes} 
                onChange={e => setForm({ ...form, notes: e.target.value })} 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (editItem ? 'Update' : 'Create Order')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Extraction Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Extract Order from Image</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box sx={{ mb: 2 }}>
              <img src={selectedImage} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
            </Box>
          )}
          
          <Button 
            variant="contained" 
            onClick={extractTextFromImage} 
            disabled={extractingText}
            fullWidth
            sx={{ mb: 2 }}
          >
            {extractingText ? <CircularProgress size={24} /> : 'Extract Text from Image'}
          </Button>
          
          {extractedData && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Extracted Information:</Typography>
              <Typography variant="body2">Items: {extractedData.items.length}</Typography>
              <Typography variant="body2">Total: ₹{extractedData.total_amount || 'Not found'}</Typography>
              <Button size="small" onClick={() => setImageDialogOpen(false)} sx={{ mt: 1 }}>
                Apply to Order
              </Button>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}