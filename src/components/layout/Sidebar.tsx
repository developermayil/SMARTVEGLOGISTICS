'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Tooltip
} from '@mui/material';
import {
  Dashboard, Inventory2, People, LocalShipping,
  Logout
} from '@mui/icons-material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpaIcon from '@mui/icons-material/Spa'
import { useAuth } from '@/hooks/useAuth';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, href: '/dashboard' },
  { label: 'Stock', icon: <Inventory2 />, href: '/stocks' },
  { label: 'Farmers', icon: <People />, href: '/farmers' },
  { label: 'Vehicles', icon: <LocalShippingIcon />, href: '/vehicles' },
  { label: 'Deliveries', icon: <LocalShippingIcon />, href: '/deliveries' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Drawer variant="permanent" sx={{
      width: DRAWER_WIDTH,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH,
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 100%)',
        color: '#fff',
        border: 'none',
      },
    }}>
      {/* Brand */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SpaIcon sx={{ fontSize: 30, color: '#A5D6A7' }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Smart Veg</Typography>
          <Typography variant="caption" sx={{ color: '#A5D6A7' }}>Logistics</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 2 }} />

      {/* Nav */}
      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => router.push(item.href)}
                sx={{
                  borderRadius: 2,
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 2 }} />

      {/* User */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: '#FF6F00', fontSize: 14 }}>
          {user?.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box flex={1} overflow="hidden">
          <Typography variant="body2" fontWeight={600} noWrap>{user?.username}</Typography>
          <Typography variant="caption" sx={{ color: '#A5D6A7' }}>{user?.role}</Typography>
        </Box>
        <Tooltip title="Logout">
          <ListItemButton onClick={logout} sx={{ p: 0.5, borderRadius: 1, color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <Logout fontSize="small" />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
