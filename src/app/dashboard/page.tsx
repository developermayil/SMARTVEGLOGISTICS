'use client';
import { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton
} from '@mui/material';
import {
  Inventory2, People, DirectionsTruck, LocalShipping,
  TrendingUp, Eco
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import { dashboardAPI } from '@/services/api';

const COLORS = ['#2E7D32', '#43A047', '#66BB6A', '#A5D6A7', '#FF6F00', '#FFA000', '#388E3C', '#1B5E20'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  return (
    <AppLayout>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Eco sx={{ color: 'primary.main', fontSize: 30 }} />
        <Box>
          <Typography variant="h5">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Smart Veg Logistics Overview</Typography>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Stock Value"
            value={loading ? '...' : formatCurrency(stats?.stocks?.total_stock_value)}
            subtitle={`${stats?.stocks?.total_items || 0} items · ${stats?.stocks?.unique_vegetables || 0} vegetables`}
            icon={<Inventory2 />} color="#2E7D32" loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Registered Farmers"
            value={loading ? '...' : stats?.farmers?.total_farmers || 0}
            subtitle="Tamil Nadu suppliers"
            icon={<People />} color="#FF6F00" loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Fleet Size"
            value={loading ? '...' : stats?.vehicles?.total_vehicles || 0}
            subtitle={`${stats?.vehicles?.available || 0} available · ${stats?.vehicles?.in_transit || 0} in transit`}
            icon={<DirectionsTruck />} color="#039BE5" loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={loading ? '...' : formatCurrency(stats?.deliveries?.revenue)}
            subtitle={`${stats?.deliveries?.completed || 0} deliveries completed`}
            icon={<TrendingUp />} color="#43A047" loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Stock by Vegetable Chart */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Stock by Vegetable</Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={240} />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats?.stock_by_vegetable || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="vegetable" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => [`${v} kg`, 'Quantity']} />
                    <Bar dataKey="total_quantity" radius={[4, 4, 0, 0]}>
                      {(stats?.stock_by_vegetable || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Deliveries */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Recent Deliveries</Typography>
              {loading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Delivery #</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Destination</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(stats?.recent_deliveries || []).map((d: any) => (
                        <TableRow key={d.delivery_number}>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600, color: 'primary.main' }}>{d.delivery_number}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{d.destination}</TableCell>
                          <TableCell><StatusChip status={d.status} /></TableCell>
                        </TableRow>
                      ))}
                      {!stats?.recent_deliveries?.length && (
                        <TableRow><TableCell colSpan={3} sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>No deliveries yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppLayout>
  );
}
