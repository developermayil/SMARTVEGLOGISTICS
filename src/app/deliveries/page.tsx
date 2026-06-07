"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  LocalShipping,
  CheckCircle,
  Map as MapIcon,
  MyLocation,
  SatelliteAlt,
  Terrain,
  Timeline,
  Speed,
  LocationOn,
  Refresh,
  DirectionsCar,
  Warning,
  FormatListBulleted,
} from "@mui/icons-material";
import AppLayout from "@/components/layout/AppLayout";
import StatusChip from "@/components/ui/StatusChip";
import { deliveriesAPI, vehiclesAPI } from "@/services/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Initialize Mapbox
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = MAPBOX_TOKEN;

const KERALA_MARKETS = [
  "Chalai Market, Thiruvananthapuram",
  "Ernakulam Market",
  "Koyambedu Market, Thrissur",
  "Palakkad Market",
  "Kozhikode Market",
  "Kannur Market",
  "Kottayam Market",
  "Alappuzha Market",
];

const emptyForm = {
  vehicle_id: "",
  destination: "",
  destination_market: "",
  scheduled_date: "",
  driver_notes: "",
  route_coordinates: [] as [number, number][],
};

// Kerala map bounds for initial view
const KERALA_BOUNDS = {
  sw: [74.5, 8.0] as [number, number],
  ne: [77.5, 12.5] as [number, number],
};

// Sample waypoints for demonstration
const getMockRoute = (
  start: [number, number],
  end: [number, number],
): [number, number][] => {
  const steps = 50;
  const route: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    // Add slight curve to look realistic
    const offset = Math.sin(t * Math.PI) * 0.02;
    route.push([lng + offset, lat]);
  }
  return route;
};

interface VehicleLocation {
  vehicle_id: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: Date;
  route_progress: number;
}

interface DeliveryWithTracking {
  id: number;
  delivery_number: string;
  vehicle_id: number;
  vehicle_number: string;
  driver_name: string;
  destination: string;
  destination_market: string;
  total_value: number;
  scheduled_date: string;
  status: string;
  current_location?: VehicleLocation;
  route?: [number, number][];
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryWithTracking[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Map states
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const popups = useRef<Map<number, mapboxgl.Popup>>(new Map());
  const routeLayers = useRef<Map<number, string>>(new Map());

  const [mapView, setMapView] = useState<"tracking" | "satellite" | "terrain">(
    "tracking",
  );
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");

  const load = async () => {
    try {
      const [d, v] = await Promise.all([
        deliveriesAPI.getAll(),
        vehiclesAPI.getAvailable(),
      ]);

      // Create sample coordinates for Kerala
      const keralaLocations = [
        [76.5, 8.5], // Thiruvananthapuram
        [76.3, 9.98], // Kochi
        [76.2, 10.52], // Thrissur
        [75.78, 11.25], // Kozhikode
        [75.37, 11.87], // Kannur
        [76.65, 9.59], // Kottayam
        [76.35, 9.49], // Alappuzha
      ];

      const enhancedDeliveries = d.data.data.map(
        (delivery: any, index: number) => {
          const start = keralaLocations[index % keralaLocations.length];
          const end = keralaLocations[(index + 1) % keralaLocations.length];
          return {
            ...delivery,
            route: getMockRoute(
              start as [number, number],
              end as [number, number],
            ),
            current_location: {
              vehicle_id: delivery.vehicle_id,
              lat: start[1],
              lng: start[0],
              speed: 40 + Math.random() * 30,
              heading: 90,
              timestamp: new Date(),
              route_progress: Math.random() * 0.5,
            },
          };
        },
      );

      setDeliveries(enhancedDeliveries);
      setVehicles(v.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token is missing!");
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [76.5, 10.0],
      zoom: 7,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    );

    map.current.on("load", () => {
      setMapLoaded(true);

      // Add 3D terrain
      map.current!.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.current!.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      // Initialize all vehicle markers
      setTimeout(() => {
        initializeMarkers();
      }, 500);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const initializeMarkers = () => {
    if (!map.current) return;

    deliveries.forEach((delivery) => {
      if (delivery.current_location && delivery.status !== "delivered") {
        addVehicleMarker(delivery);
        drawRoute(delivery);
      }
    });
  };

  const addVehicleMarker = (delivery: DeliveryWithTracking) => {
    if (!map.current || !delivery.current_location) return;

    // Remove existing marker
    if (markers.current.has(delivery.id)) {
      markers.current.get(delivery.id)?.remove();
    }

    // Create custom HTML element for marker
    const el = document.createElement("div");
    el.className = "vehicle-marker";
    el.style.cssText = `
      width: 40px;
      height: 40px;
      background: ${delivery.status === "in-transit" ? "#3b82f6" : "#f59e0b"};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const icon = document.createElement("div");
    icon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>`;
    el.appendChild(icon);

    // Add status indicator
    const statusIndicator = document.createElement("div");
    statusIndicator.style.cssText = `
      position: absolute;
      bottom: -4px;
      right: -4px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: ${delivery.status === "in-transit" ? "#10b981" : "#f59e0b"};
      border: 2px solid white;
    `;
    el.appendChild(statusIndicator);

    // Create popup
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <strong style="font-size: 14px;">${delivery.vehicle_number}</strong><br/>
          <span style="font-size: 12px; color: #666;">Driver: ${delivery.driver_name}</span><br/>
          <span style="font-size: 12px; color: #666;">Speed: ${delivery.current_location?.speed.toFixed(1)} km/h</span><br/>
          <span style="font-size: 12px; color: #666;">Status: ${delivery.status}</span><br/>
          <span style="font-size: 12px; color: #3b82f6;">${delivery.destination}</span>
        </div>
      `);

    const marker = new mapboxgl.Marker(el)
      .setLngLat([delivery.current_location.lng, delivery.current_location.lat])
      .setPopup(popup)
      .addTo(map.current);

    marker.getElement().addEventListener("click", () => {
      centerOnVehicle(delivery.id);
    });

    markers.current.set(delivery.id, marker);
    popups.current.set(delivery.id, popup);
  };

  const drawRoute = (delivery: DeliveryWithTracking) => {
    if (!map.current || !delivery.route) return;

    const routeGeoJSON = {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: delivery.route,
      },
      properties: {
        delivery_id: delivery.id,
        vehicle: delivery.vehicle_number,
      },
    };

    const sourceId = `route-${delivery.id}`;

    // Remove existing source if any
    if (map.current.getSource(sourceId)) {
      if (map.current.getLayer(`${sourceId}-line`))
        map.current.removeLayer(`${sourceId}-line`);
      if (map.current.getLayer(`${sourceId}-glow`))
        map.current.removeLayer(`${sourceId}-glow`);
      map.current.removeSource(sourceId);
    }

    map.current.addSource(sourceId, {
      type: "geojson",
      data: routeGeoJSON,
    });

    map.current.addLayer({
      id: `${sourceId}-line`,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": selectedVehicle === delivery.id ? "#f59e0b" : "#3b82f6",
        "line-width": 4,
        "line-opacity": 0.8,
      },
    });

    map.current.addLayer({
      id: `${sourceId}-glow`,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": selectedVehicle === delivery.id ? "#fbbf24" : "#60a5fa",
        "line-width": 8,
        "line-opacity": 0.3,
        "line-blur": 4,
      },
    });

    routeLayers.current.set(delivery.id, sourceId);
  };

  const updateVehicleLocation = (
    deliveryId: number,
    newLocation: VehicleLocation,
  ) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery || !map.current) return;

    // Update delivery data
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId ? { ...d, current_location: newLocation } : d,
      ),
    );

    // Update marker position
    const marker = markers.current.get(deliveryId);
    if (marker) {
      marker.setLngLat([newLocation.lng, newLocation.lat]);

      // Update popup content
      const popup = popups.current.get(deliveryId);
      if (popup) {
        popup.setHTML(`
          <div style="padding: 8px; min-width: 150px;">
            <strong style="font-size: 14px;">${delivery.vehicle_number}</strong><br/>
            <span style="font-size: 12px; color: #666;">Driver: ${delivery.driver_name}</span><br/>
            <span style="font-size: 12px; color: #666;">Speed: ${newLocation.speed.toFixed(1)} km/h</span><br/>
            <span style="font-size: 12px; color: #666;">Status: ${delivery.status}</span><br/>
            <span style="font-size: 12px; color: #3b82f6;">ETA: ~${Math.round((1 - newLocation.route_progress) * 2)} hours</span>
          </div>
        `);
      }
    }
  };

  // Simulate real-time GPS updates
  useEffect(() => {
    if (!mapLoaded || deliveries.length === 0) return;

    const interval = setInterval(() => {
      deliveries.forEach((delivery) => {
        if (
          delivery.status === "in-transit" &&
          delivery.route &&
          delivery.current_location
        ) {
          // Simulate movement along route
          let progress = delivery.current_location.route_progress + 0.01;
          if (progress >= 1) {
            progress = 1;
          }

          const routePoint = getPointAtProgress(delivery.route, progress);
          if (routePoint) {
            const newLocation: VehicleLocation = {
              ...delivery.current_location,
              lat: routePoint[1],
              lng: routePoint[0],
              route_progress: progress,
              speed: 40 + Math.random() * 20,
              heading: calculateHeading(delivery.route, progress),
              timestamp: new Date(),
            };
            updateVehicleLocation(delivery.id, newLocation);
          }
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [deliveries, mapLoaded]);

  const getPointAtProgress = (
    route: [number, number][],
    progress: number,
  ): [number, number] | null => {
    if (!route.length) return null;
    const index = Math.min(
      Math.floor(progress * route.length),
      route.length - 1,
    );
    return route[index];
  };

  const calculateHeading = (
    route: [number, number][],
    progress: number,
  ): number => {
    const currentIndex = Math.min(
      Math.floor(progress * route.length),
      route.length - 1,
    );
    const nextIndex = Math.min(currentIndex + 1, route.length - 1);
    const current = route[currentIndex];
    const next = route[nextIndex];

    const angle = Math.atan2(next[1] - current[1], next[0] - current[0]);
    return (angle * 180) / Math.PI;
  };

  const handleMapStyleChange = (
    style: "tracking" | "satellite" | "terrain",
  ) => {
    if (!map.current) return;

    const styleMap = {
      tracking: "mapbox://styles/mapbox/streets-v12",
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
      terrain: "mapbox://styles/mapbox/outdoors-v12",
    };

    map.current.setStyle(styleMap[style]);
    setMapView(style);

    // Re-add custom layers after style change
    map.current.once("style.load", () => {
      deliveries.forEach((delivery) => {
        if (delivery.current_location && delivery.status !== "delivered") {
          addVehicleMarker(delivery);
          drawRoute(delivery);
        }
      });
    });
  };

  const centerOnVehicle = useCallback(
    (vehicleId: number, autoSwitchView: boolean = true) => {
      const delivery = deliveries.find((d) => d.id === vehicleId);
      if (!delivery?.current_location) {
        console.warn("Vehicle not found or no location data");
        return;
      }

      // Auto-switch to map view if in list view
      if (autoSwitchView && viewMode === "list") {
        setViewMode("map");
      }

      setSelectedVehicle(vehicleId);

      // Update route colors
      routeLayers.current.forEach((sourceId, id) => {
        if (map.current && map.current.getLayer(`${sourceId}-line`)) {
          const color = id === vehicleId ? "#f59e0b" : "#3b82f6";
          const glowColor = id === vehicleId ? "#fbbf24" : "#60a5fa";
          map.current.setPaintProperty(`${sourceId}-line`, "line-color", color);
          map.current.setPaintProperty(
            `${sourceId}-glow`,
            "line-color",
            glowColor,
          );
        }
      });

      // Focus on vehicle
      const focusOnVehicle = () => {
        if (map.current && delivery.current_location) {
          map.current.flyTo({
            center: [
              delivery.current_location!.lng,
              delivery.current_location!.lat,
            ],
            zoom: 14,
            duration: 1500,
            essential: true,
          });

          // Open popup
          const popup = popups.current.get(vehicleId);
          if (popup) {
            popup.addTo(map.current!);
          }
        }
      };

      if (autoSwitchView && viewMode === "list") {
        setTimeout(focusOnVehicle, 300);
      } else {
        focusOnVehicle();
      }
    },
    [deliveries, viewMode, map.current],
  );

  const total = deliveries.length;
  const completed = deliveries.filter((d) => d.status === "delivered").length;
  const inTransit = deliveries.filter((d) => d.status === "in-transit").length;
  const revenue = deliveries
    .filter((d) => d.status === "delivered")
    .reduce((s, d) => s + Number(d.total_value || 0), 0);

  const handleCreate = async () => {
    if (!form.vehicle_id || !form.destination) {
      setError("Vehicle and destination are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await deliveriesAPI.create(form);
      setDialogOpen(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || "Error creating delivery");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await deliveriesAPI.updateStatus(statusDialog.id, { status: newStatus });
      setStatusDialog(null);
      load();
    } catch {
      alert("Status update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this delivery?")) return;
    try {
      await deliveriesAPI.delete(id);
      load();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <AppLayout>
      <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 100px)" }}>
        {viewMode === "list" ? (
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h5">Delivery Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  {total} total · {inTransit} in transit · {completed} delivered
                </Typography>
                <Typography
                  variant="body2"
                  color="success.main"
                  fontWeight={600}
                >
                  Revenue: ₹{revenue.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={() => setViewMode("map")}
                >
                  Map View
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setDialogOpen(true)}
                >
                  New Delivery
                </Button>
              </Box>
            </Box>

            <Card sx={{ overflow: "auto", maxHeight: "calc(100vh - 180px)" }}>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow
                      sx={{ "& th": { bgcolor: "grey.50", fontWeight: 700 } }}
                    >
                      <TableCell>Delivery No.</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : deliveries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 4, color: "text.secondary" }}
                        >
                          No deliveries yet. Click "New Delivery" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deliveries.map((d) => (
                        <TableRow
                          key={d.id}
                          hover
                          sx={{
                            cursor: "pointer",
                            bgcolor:
                              selectedVehicle === d.id
                                ? "action.selected"
                                : "inherit",
                          }}
                          onClick={() => centerOnVehicle(d.id, true)}
                        >
                          <TableCell
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            {d.delivery_number}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {d.vehicle_number}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {d.driver_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {d.destination}
                            </Typography>
                            {d.destination_market && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {d.destination_market}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={d.status} />
                            {d.current_location &&
                              d.status === "in-transit" && (
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                >
                                  {d.current_location.speed.toFixed(0)} km/h
                                </Typography>
                              )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(d.scheduled_date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Track on map">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  centerOnVehicle(d.id, true);
                                }}
                              >
                                <MyLocation fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Update status">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusDialog(d);
                                  setNewStatus(d.status);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(d.id);
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        ) : (
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
          >
            {/* Map Controls */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ToggleButtonGroup
                value={mapView}
                exclusive
                onChange={(_, val) => val && handleMapStyleChange(val)}
                size="small"
              >
                <ToggleButton value="tracking">
                  <MapIcon sx={{ mr: 0.5 }} /> Streets
                </ToggleButton>
                <ToggleButton value="satellite">
                  <SatelliteAlt sx={{ mr: 0.5 }} /> Satellite
                </ToggleButton>
                <ToggleButton value="terrain">
                  <Terrain sx={{ mr: 0.5 }} /> Terrain
                </ToggleButton>
              </ToggleButtonGroup>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FormatListBulleted />}
                  onClick={() => setViewMode("list")}
                >
                  List View
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={load}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {/* Map Container */}
            <Card sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <div
                ref={mapContainer}
                style={{ width: "100%", height: "100%", minHeight: "500px" }}
              />

              {/* Map Overlay Stats */}
              <Paper
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  right: 16,
                  p: 1.5,
                  bgcolor: "rgba(0,0,0,0.8)",
                  color: "white",
                  backdropFilter: "blur(8px)",
                  borderRadius: 2,
                  display: "flex",
                  justifyContent: "space-around",
                  zIndex: 1,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" display="block">
                    Active Vehicles
                  </Typography>
                  <Typography variant="h6">{inTransit}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" display="block">
                    Total Deliveries
                  </Typography>
                  <Typography variant="h6">{total}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" display="block">
                    Completed
                  </Typography>
                  <Typography variant="h6">{completed}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" display="block">
                    Tracking Status
                  </Typography>
                  <Badge
                    color={wsConnected ? "success" : "warning"}
                    variant="dot"
                  >
                    <Typography variant="body2">
                      {wsConnected ? "Live" : "Demo"}
                    </Typography>
                  </Badge>
                </Box>
              </Paper>
            </Card>
          </Box>
        )}
      </Box>

      {/* Create Delivery Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Delivery</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                label="Select Vehicle *"
                fullWidth
                value={form.vehicle_id}
                onChange={(e) =>
                  setForm({ ...form, vehicle_id: e.target.value })
                }
              >
                <MenuItem value="">— Select Available Vehicle —</MenuItem>
                {vehicles.map((v: any) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.vehicle_number} — {v.driver_name} ({v.capacity}kg)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Destination *"
                fullWidth
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                placeholder="Enter delivery address"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Destination Market"
                fullWidth
                value={form.destination_market}
                onChange={(e) =>
                  setForm({ ...form, destination_market: e.target.value })
                }
              >
                <MenuItem value="">— Select Market —</MenuItem>
                {KERALA_MARKETS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Scheduled Date & Time"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.scheduled_date}
                onChange={(e) =>
                  setForm({ ...form, scheduled_date: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Driver Notes"
                fullWidth
                multiline
                rows={3}
                value={form.driver_notes}
                onChange={(e) =>
                  setForm({ ...form, driver_notes: e.target.value })
                }
                placeholder="Any special instructions for the driver..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Create Delivery"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={!!statusDialog}
        onClose={() => setStatusDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Update Status — {statusDialog?.delivery_number}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            label="New Status"
            fullWidth
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mt: 1 }}
          >
            {["pending", "in-transit", "delivered", "cancelled"].map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Styles */}
      <style jsx global>{`
        .vehicle-marker {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .mapboxgl-popup {
          max-width: 220px;
        }

        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mapboxgl-popup-close-button {
          display: none;
        }
      `}</style>
    </AppLayout>
  );
}
