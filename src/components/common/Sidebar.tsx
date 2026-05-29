import Link from "next/link";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: 220,
        minHeight: "100vh",
        borderRight: "1px solid #ddd",
      }}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/">
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} href="/stocks">
            <ListItemText primary="Stocks" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
