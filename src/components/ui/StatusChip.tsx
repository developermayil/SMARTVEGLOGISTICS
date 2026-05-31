import { Chip } from '@mui/material';

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  available: { label: 'Available', color: 'success' },
  'in-transit': { label: 'In Transit', color: 'warning' },
  maintenance: { label: 'Maintenance', color: 'error' },
  pending: { label: 'Pending', color: 'info' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

export default function StatusChip({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}
