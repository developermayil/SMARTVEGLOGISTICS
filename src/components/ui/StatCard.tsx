import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  loading?: boolean;
}

export default function StatCard({ title, value, subtitle, icon, color, loading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mb={1}>{title}</Typography>
            {loading ? (
              <Skeleton width={80} height={36} />
            ) : (
              <Typography variant="h4" fontWeight={700} color="text.primary">{value}</Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{subtitle}</Typography>
            )}
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            backgroundColor: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color, flexShrink: 0, ml: 2
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
