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
  Chip,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Map as MapIcon,
  MyLocation,
  SatelliteAlt,
  Terrain,
  Refresh,
  FormatListBulleted,
  LocationOn,
  DirectionsCar,
  CheckCircle,
  Schedule,
  Speed,
  Route,
  NavigationOutlined,
} from "@mui/icons-material";
import AppLayout from "@/components/layout/AppLayout";
import StatusChip from "@/components/ui/StatusChip";
import { deliveriesAPI, vehiclesAPI } from "@/services/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = MAPBOX_TOKEN;

// ─── Kerala Places Database ───────────────────────────────────────────────────
// [lng, lat] format for Mapbox
const KERALA_PLACES: {
  label: string;
  coordinates: [number, number];
  district: string;
  type: string;
}[] = [
  // Markets
  {
    label: "Chalai Market",
    coordinates: [76.9366, 8.5074],
    district: "Thiruvananthapuram",
    type: "market",
  },
  {
    label: "Pazhavangadi Market",
    coordinates: [76.9525, 8.4855],
    district: "Thiruvananthapuram",
    type: "market",
  },
  {
    label: "Ernakulam Market",
    coordinates: [76.2673, 9.9816],
    district: "Ernakulam",
    type: "market",
  },
  {
    label: "Vytilla Market",
    coordinates: [76.3107, 9.964],
    district: "Ernakulam",
    type: "market",
  },
  {
    label: "Thrissur Round Market",
    coordinates: [76.2144, 10.5276],
    district: "Thrissur",
    type: "market",
  },
  {
    label: "Palakkad Market",
    coordinates: [76.6548, 10.7867],
    district: "Palakkad",
    type: "market",
  },
  {
    label: "Kozhikode Smrithi Market",
    coordinates: [75.7804, 11.2588],
    district: "Kozhikode",
    type: "market",
  },
  {
    label: "Kannur Market",
    coordinates: [75.3704, 11.8745],
    district: "Kannur",
    type: "market",
  },
  {
    label: "Kottayam Market",
    coordinates: [76.5222, 9.5916],
    district: "Kottayam",
    type: "market",
  },
  {
    label: "Alappuzha Market",
    coordinates: [76.3388, 9.4981],
    district: "Alappuzha",
    type: "market",
  },
  {
    label: "Kollam Market",
    coordinates: [76.6141, 8.8932],
    district: "Kollam",
    type: "market",
  },
  {
    label: "Manjeri Market",
    coordinates: [76.1197, 11.1187],
    district: "Malappuram",
    type: "market",
  },
  {
    label: "Thalassery Market",
    coordinates: [75.4957, 11.7509],
    district: "Kannur",
    type: "market",
  },
  {
    label: "Kayamkulam Market",
    coordinates: [76.5024, 9.1763],
    district: "Alappuzha",
    type: "market",
  },
  // Cities / Hubs
  {
    label: "Thiruvananthapuram Central",
    coordinates: [76.9366, 8.5074],
    district: "Thiruvananthapuram",
    type: "city",
  },
  {
    label: "Kochi (Cochin)",
    coordinates: [76.2673, 9.9816],
    district: "Ernakulam",
    type: "city",
  },
  {
    label: "Kozhikode (Calicut)",
    coordinates: [75.7804, 11.2588],
    district: "Kozhikode",
    type: "city",
  },
  {
    label: "Thrissur",
    coordinates: [76.2144, 10.5276],
    district: "Thrissur",
    type: "city",
  },
  {
    label: "Kollam",
    coordinates: [76.6141, 8.8932],
    district: "Kollam",
    type: "city",
  },
  {
    label: "Kottayam",
    coordinates: [76.5222, 9.5916],
    district: "Kottayam",
    type: "city",
  },
  {
    label: "Alappuzha (Alleppey)",
    coordinates: [76.3388, 9.4981],
    district: "Alappuzha",
    type: "city",
  },
  {
    label: "Palakkad",
    coordinates: [76.6548, 10.7867],
    district: "Palakkad",
    type: "city",
  },
  {
    label: "Malappuram",
    coordinates: [76.0744, 11.051],
    district: "Malappuram",
    type: "city",
  },
  {
    label: "Kannur",
    coordinates: [75.3704, 11.8745],
    district: "Kannur",
    type: "city",
  },
  {
    label: "Kasaragod",
    coordinates: [74.9896, 12.4996],
    district: "Kasaragod",
    type: "city",
  },
  {
    label: "Thodupuzha",
    coordinates: [76.7166, 9.898],
    district: "Idukki",
    type: "city",
  },
  {
    label: "Munnar",
    coordinates: [77.0595, 10.0889],
    district: "Idukki",
    type: "city",
  },
  {
    label: "Wayanad (Kalpetta)",
    coordinates: [76.0832, 11.6077],
    district: "Wayanad",
    type: "city",
  },
  {
    label: "Pathanamthitta",
    coordinates: [76.7871, 9.2648],
    district: "Pathanamthitta",
    type: "city",
  },
  {
    label: "Thrissur KSRTC Hub",
    coordinates: [76.2091, 10.5169],
    district: "Thrissur",
    type: "hub",
  },
  {
    label: "Kochi KSRTC Hub",
    coordinates: [76.2896, 9.9719],
    district: "Ernakulam",
    type: "hub",
  },
  {
    label: "Kozhikode KSRTC Hub",
    coordinates: [75.7896, 11.2672],
    district: "Kozhikode",
    type: "hub",
  },
];

const getMockRoute = (
  start: [number, number],
  end: [number, number],
): [number, number][] => {
  const steps = 60;
  const route: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    const offset = Math.sin(t * Math.PI) * 0.025;
    route.push([lng + offset, lat]);
  }
  return route;
};

const distanceKm = (a: [number, number], b: [number, number]): number => {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) *
      Math.cos((b[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
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
  origin_coords?: [number, number];
  dest_coords?: [number, number];
  distance_km?: number;
  eta_hours?: number;
}

const emptyForm = {
  vehicle_id: "",
  destination: "",
  destination_market: "",
  scheduled_date: "",
  driver_notes: "",
  route_coordinates: [] as [number, number][],
};

const ORIGIN_COORDS: [number, number] = [76.5, 10.0]; // Default depot (central Kerala)

const KERALA_ORIGIN_LOCS: [number, number][] = [
  [76.9366, 8.5074],
  [76.2673, 9.9816],
  [76.2144, 10.5276],
  [75.7804, 11.2588],
  [75.3704, 11.8745],
  [76.5222, 9.5916],
  [76.3388, 9.4981],
];

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
  const [mapView, setMapView] = useState<"tracking" | "satellite" | "terrain">(
    "tracking",
  );
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Destination search state
  const [destInputValue, setDestInputValue] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<
    (typeof KERALA_PLACES)[0] | null
  >(null);

  // Dialog preview map
  const dialogMapContainer = useRef<HTMLDivElement>(null);
  const dialogMap = useRef<mapboxgl.Map | null>(null);
  const dialogMapReady = useRef(false);
  const previewMarkers = useRef<mapboxgl.Marker[]>([]);

  // Main map
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapReady = useRef(false);
  const markers = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const popups = useRef<Map<number, mapboxgl.Popup>>(new Map());
  const routeSources = useRef<Set<string>>(new Set());
  const deliveriesRef = useRef<DeliveryWithTracking[]>([]);
  const selectedVehicleRef = useRef<number | null>(null);

  useEffect(() => {
    deliveriesRef.current = deliveries;
  }, [deliveries]);
  useEffect(() => {
    selectedVehicleRef.current = selectedVehicle;
  }, [selectedVehicle]);

  // ─── Load Data ─────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      const [d, v] = await Promise.all([
        deliveriesAPI.getAll(),
        vehiclesAPI.getAvailable(),
      ]);

      const enhanced: DeliveryWithTracking[] = d.data.data.map(
        (delivery: any, index: number) => {
          const originCoords =
            KERALA_ORIGIN_LOCS[index % KERALA_ORIGIN_LOCS.length];
          // Try to find destination coords from known places
          const knownPlace = KERALA_PLACES.find(
            (p) =>
              delivery.destination
                ?.toLowerCase()
                .includes(p.label.toLowerCase()) ||
              p.label
                .toLowerCase()
                .includes(delivery.destination?.toLowerCase()),
          );
          const destCoords: [number, number] = knownPlace
            ? knownPlace.coordinates
            : KERALA_ORIGIN_LOCS[(index + 1) % KERALA_ORIGIN_LOCS.length];

          const dist = distanceKm(originCoords, destCoords);
          const progress = Math.random() * 0.7;
          const route = getMockRoute(originCoords, destCoords);
          const pointIdx = Math.min(
            Math.floor(progress * route.length),
            route.length - 1,
          );
          const currentPt = route[pointIdx];

          return {
            ...delivery,
            route,
            origin_coords: originCoords,
            dest_coords: destCoords,
            distance_km: dist,
            eta_hours: (dist / 60) * (1 - progress),
            current_location: {
              vehicle_id: delivery.vehicle_id,
              lat: currentPt[1],
              lng: currentPt[0],
              speed: 40 + Math.random() * 30,
              heading: 90,
              timestamp: new Date(),
              route_progress: progress,
            },
          };
        },
      );

      setDeliveries(enhanced);
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

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getPointAtProgress = (
    route: [number, number][],
    progress: number,
  ): [number, number] | null => {
    if (!route.length) return null;
    return route[
      Math.min(Math.floor(progress * route.length), route.length - 1)
    ];
  };

  const calcHeading = (route: [number, number][], progress: number): number => {
    const ci = Math.min(Math.floor(progress * route.length), route.length - 1);
    const ni = Math.min(ci + 1, route.length - 1);
    return (
      (Math.atan2(route[ni][1] - route[ci][1], route[ni][0] - route[ci][0]) *
        180) /
      Math.PI
    );
  };

  const buildPopupHTML = (d: DeliveryWithTracking) => `
    <div style="padding:10px;min-width:180px;font-family:sans-serif">
      <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:4px">${d.vehicle_number}</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:2px">🧑‍✈️ ${d.driver_name}</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:2px">⚡ ${d.current_location?.speed.toFixed(0) ?? "—"} km/h</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:4px">📦 ${d.status}</div>
      <div style="font-size:11px;color:#3b82f6;font-weight:600">📍 ${d.destination}</div>
      ${d.eta_hours ? `<div style="font-size:11px;color:#10b981;margin-top:2px">ETA ~${d.eta_hours.toFixed(1)}h</div>` : ""}
      ${d.distance_km ? `<div style="font-size:10px;color:#94a3b8">${d.distance_km.toFixed(0)} km route</div>` : ""}
    </div>`;

  // ─── Dialog Map ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dialogOpen) {
      dialogMap.current?.remove();
      dialogMap.current = null;
      dialogMapReady.current = false;
      previewMarkers.current = [];
      return;
    }

    const tid = setTimeout(() => {
      if (!dialogMapContainer.current || dialogMap.current || !MAPBOX_TOKEN)
        return;

      const m = new mapboxgl.Map({
        container: dialogMapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [76.5, 10.0],
        zoom: 6.5,
        interactive: false,
      });

      m.on("load", () => {
        dialogMapReady.current = true;
        dialogMap.current = m;
        // Show origin depot marker
        new mapboxgl.Marker({ color: "#10b981" })
          .setLngLat(ORIGIN_COORDS)
          .addTo(m);
      });
    }, 150);

    return () => clearTimeout(tid);
  }, [dialogOpen]);

  // Update dialog map preview when destination changes
  useEffect(() => {
    const m = dialogMap.current;
    if (!m || !dialogMapReady.current) return;

    // Remove old preview markers (keep index 0 = depot marker)
    previewMarkers.current.forEach((mk) => mk.remove());
    previewMarkers.current = [];

    // Remove old preview route
    ["preview-glow", "preview-line"].forEach((l) => {
      if (m.getLayer(l)) m.removeLayer(l);
    });
    if (m.getSource("preview-route")) m.removeSource("preview-route");

    if (!selectedPlace) {
      m.flyTo({ center: [76.5, 10.0], zoom: 6.5, duration: 800 });
      return;
    }

    const destCoords = selectedPlace.coordinates;
    const route = getMockRoute(ORIGIN_COORDS, destCoords);
    const dist = distanceKm(ORIGIN_COORDS, destCoords);

    // Destination marker
    const destEl = document.createElement("div");
    destEl.innerHTML = `<div style="width:32px;height:32px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`;
    const destMarker = new mapboxgl.Marker(destEl)
      .setLngLat(destCoords)
      .addTo(m);
    previewMarkers.current.push(destMarker);

    // Route
    m.addSource("preview-route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: { type: "LineString", coordinates: route },
        properties: {},
      },
    });
    m.addLayer({
      id: "preview-glow",
      type: "line",
      source: "preview-route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#60a5fa",
        "line-width": 8,
        "line-opacity": 0.3,
        "line-blur": 4,
      },
    });
    m.addLayer({
      id: "preview-line",
      type: "line",
      source: "preview-route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#3b82f6", "line-width": 3, "line-opacity": 0.9 },
    });

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend(ORIGIN_COORDS);
    bounds.extend(destCoords);
    m.fitBounds(bounds, { padding: 40, duration: 900 });

    setForm((prev) => ({
      ...prev,
      destination: selectedPlace.label + ", " + selectedPlace.district,
      destination_market:
        selectedPlace.type === "market"
          ? selectedPlace.label + ", " + selectedPlace.district
          : prev.destination_market,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlace]);

  // ─── Main Map Layer Helpers ────────────────────────────────────────────────
  const removeDeliveryLayers = (deliveryId: number) => {
    const m = map.current;
    if (!m) return;
    const src = `route-${deliveryId}`;
    [`${src}-line`, `${src}-glow`, `${src}-progress`].forEach((l) => {
      if (m.getLayer(l)) m.removeLayer(l);
    });
    if (m.getSource(src)) m.removeSource(src);
    routeSources.current.delete(src);
  };

  const addRoute = useCallback((delivery: DeliveryWithTracking) => {
    const m = map.current;
    if (!m || !delivery.route || !mapReady.current) return;
    const src = `route-${delivery.id}`;
    removeDeliveryLayers(delivery.id);

    const isSelected = selectedVehicleRef.current === delivery.id;
    const progress = delivery.current_location?.route_progress ?? 0;
    const splitIdx = Math.floor(progress * delivery.route.length);
    const travelledCoords = delivery.route.slice(0, splitIdx + 1);
    const remainingCoords = delivery.route.slice(splitIdx);

    m.addSource(src, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates: delivery.route },
            properties: { part: "full" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates:
                travelledCoords.length > 1
                  ? travelledCoords
                  : delivery.route.slice(0, 2),
            },
            properties: { part: "travelled" },
          },
        ],
      },
    });

    // Full route (dim)
    m.addLayer({
      id: `${src}-glow`,
      type: "line",
      source: src,
      filter: ["==", ["get", "part"], "full"],
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": isSelected ? "#fbbf24" : "#93c5fd",
        "line-width": 6,
        "line-opacity": 0.18,
        "line-blur": 3,
      },
    });

    m.addLayer({
      id: `${src}-line`,
      type: "line",
      source: src,
      filter: ["==", ["get", "part"], "full"],
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": isSelected ? "#f59e0b" : "#bfdbfe",
        "line-width": 3,
        "line-opacity": 0.5,
        "line-dasharray": [4, 3],
      },
    });

    // Travelled (bright)
    m.addLayer({
      id: `${src}-progress`,
      type: "line",
      source: src,
      filter: ["==", ["get", "part"], "travelled"],
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": isSelected ? "#f59e0b" : "#3b82f6",
        "line-width": 4,
        "line-opacity": 0.9,
      },
    });

    routeSources.current.add(src);

    // Destination pin
    if (delivery.dest_coords) {
      const el = document.createElement("div");
      el.style.cssText = `width:24px;height:24px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)`;
      new mapboxgl.Marker(el).setLngLat(delivery.dest_coords).addTo(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMarker = useCallback((delivery: DeliveryWithTracking) => {
    const m = map.current;
    if (!m || !delivery.current_location) return;
    markers.current.get(delivery.id)?.remove();
    popups.current.get(delivery.id)?.remove();

    const el = document.createElement("div");
    el.className = "vehicle-marker";
    const color = delivery.status === "in-transit" ? "#3b82f6" : "#f59e0b";
    Object.assign(el.style, {
      width: "42px",
      height: "42px",
      position: "relative",
      background: color,
      borderRadius: "50%",
      border: "3px solid white",
      boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    el.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
      <div style="position:absolute;bottom:-4px;right:-4px;width:12px;height:12px;border-radius:50%;
        background:${delivery.status === "in-transit" ? "#10b981" : "#f59e0b"};border:2px solid white"></div>`;

    const popup = new mapboxgl.Popup({
      offset: 28,
      closeButton: false,
    }).setHTML(buildPopupHTML(delivery));
    const marker = new mapboxgl.Marker(el)
      .setLngLat([delivery.current_location.lng, delivery.current_location.lat])
      .setPopup(popup)
      .addTo(m);

    el.addEventListener("click", () => {
      setSelectedVehicle(delivery.id);
      popup.addTo(m);
    });
    markers.current.set(delivery.id, marker);
    popups.current.set(delivery.id, popup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initMapOverlays = useCallback(() => {
    if (!mapReady.current) return;
    deliveriesRef.current.forEach((d) => {
      if (d.status !== "delivered") {
        addMarker(d);
        addRoute(d);
      }
    });
  }, [addMarker, addRoute]);

  // ─── Main Map Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "map") return;
    if (map.current) return;

    const init = () => {
      if (!mapContainer.current || !MAPBOX_TOKEN) return;
      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [76.5, 10.0],
        zoom: 7,
      });
      m.addControl(new mapboxgl.NavigationControl(), "top-right");
      m.addControl(new mapboxgl.FullscreenControl(), "top-right");
      m.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right",
      );
      m.on("load", () => {
        m.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        m.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
        mapReady.current = true;
        map.current = m;
        initMapOverlays();
      });
    };
    const tid = setTimeout(init, 50);
    return () => clearTimeout(tid);
  }, [viewMode, initMapOverlays]);

  useEffect(() => {
    if (mapReady.current && deliveries.length > 0) initMapOverlays();
  }, [deliveries, initMapOverlays]);

  useEffect(
    () => () => {
      map.current?.remove();
      map.current = null;
      mapReady.current = false;
    },
    [],
  );

  // ─── GPS Simulation ────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveries((prev) =>
        prev.map((delivery) => {
          if (
            delivery.status !== "in-transit" ||
            !delivery.route ||
            !delivery.current_location
          )
            return delivery;
          const progress = Math.min(
            delivery.current_location.route_progress + 0.006,
            1,
          );
          const point = getPointAtProgress(delivery.route, progress);
          if (!point) return delivery;
          const dist = delivery.distance_km ?? 0;
          const remainingKm = dist * (1 - progress);
          const newLoc: VehicleLocation = {
            ...delivery.current_location,
            lat: point[1],
            lng: point[0],
            route_progress: progress,
            speed: 45 + Math.random() * 20,
            heading: calcHeading(delivery.route, progress),
            timestamp: new Date(),
          };
          markers.current.get(delivery.id)?.setLngLat([newLoc.lng, newLoc.lat]);
          popups.current
            .get(delivery.id)
            ?.setHTML(
              buildPopupHTML({ ...delivery, current_location: newLoc }),
            );

          // Update progress line on map
          if (mapReady.current && map.current && delivery.route) {
            const src = `route-${delivery.id}`;
            const source = map.current.getSource(src) as
              | mapboxgl.GeoJSONSource
              | undefined;
            if (source) {
              const splitIdx = Math.floor(progress * delivery.route.length);
              const travelledCoords = delivery.route.slice(0, splitIdx + 1);
              source.setData({
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: delivery.route,
                    },
                    properties: { part: "full" },
                  },
                  {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates:
                        travelledCoords.length > 1
                          ? travelledCoords
                          : delivery.route.slice(0, 2),
                    },
                    properties: { part: "travelled" },
                  },
                ],
              } as any);
            }
          }

          return {
            ...delivery,
            current_location: newLoc,
            eta_hours: remainingKm / 60,
          };
        }),
      );
    }, 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Map Style Change ──────────────────────────────────────────────────────
  const handleMapStyleChange = (
    style: "tracking" | "satellite" | "terrain",
  ) => {
    if (!map.current) return;
    setMapView(style);
    map.current.setStyle(
      {
        tracking: "mapbox://styles/mapbox/streets-v12",
        satellite: "mapbox://styles/mapbox/satellite-streets-v12",
        terrain: "mapbox://styles/mapbox/outdoors-v12",
      }[style],
    );
    map.current.once("style.load", () => {
      mapReady.current = true;
      markers.current.clear();
      popups.current.clear();
      routeSources.current.clear();
      initMapOverlays();
    });
  };

  // ─── Centre on Vehicle ─────────────────────────────────────────────────────
  const doFly = (deliveryId: number) => {
    const d = deliveriesRef.current.find((x) => x.id === deliveryId);
    if (!d?.current_location || !map.current) return;
    setSelectedVehicle(deliveryId);
    deliveriesRef.current.forEach((x) => {
      const src = `route-${x.id}`;
      if (map.current!.getLayer(`${src}-progress`)) {
        const isSel = x.id === deliveryId;
        map.current!.setPaintProperty(
          `${src}-progress`,
          "line-color",
          isSel ? "#f59e0b" : "#3b82f6",
        );
        map.current!.setPaintProperty(
          `${src}-line`,
          "line-color",
          isSel ? "#f59e0b" : "#bfdbfe",
        );
      }
    });
    map.current.flyTo({
      center: [d.current_location.lng, d.current_location.lat],
      zoom: 13,
      duration: 1500,
      essential: true,
    });
    popups.current.get(deliveryId)?.addTo(map.current);
  };

  const centerOnVehicle = useCallback(
    (deliveryId: number, switchToMap = true) => {
      if (switchToMap && viewMode === "list") {
        setViewMode("map");
        const poll = setInterval(() => {
          if (map.current && mapReady.current) {
            clearInterval(poll);
            doFly(deliveryId);
          }
        }, 100);
        return;
      }
      doFly(deliveryId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [viewMode],
  );

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const total = deliveries.length;
  const completed = deliveries.filter((d) => d.status === "delivered").length;
  const inTransit = deliveries.filter((d) => d.status === "in-transit").length;
  const revenue = deliveries
    .filter((d) => d.status === "delivered")
    .reduce((s, d) => s + Number(d.total_value || 0), 0);

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.vehicle_id || !selectedPlace) {
      setError("Vehicle and destination are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await deliveriesAPI.create({
        ...form,
        destination: selectedPlace.label + ", " + selectedPlace.district,
        route_coordinates: [ORIGIN_COORDS, selectedPlace.coordinates],
      });
      setDialogOpen(false);
      setForm(emptyForm);
      setSelectedPlace(null);
      setDestInputValue("");
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

  const selectedDelivery = deliveries.find((d) => d.id === selectedVehicle);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 100px)" }}>
        {/* ══ LIST VIEW ══ */}
        {viewMode === "list" && (
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
                <Typography variant="h5" fontWeight={700}>
                  Delivery Management
                </Typography>
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

            <Card sx={{ overflow: "auto", maxHeight: "calc(100vh - 185px)" }}>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow
                      sx={{ "& th": { bgcolor: "grey.50", fontWeight: 700 } }}
                    >
                      <TableCell>Delivery No.</TableCell>
                      <TableCell>Vehicle / Driver</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : deliveries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
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
                                ? "primary.50"
                                : "inherit",
                          }}
                          onClick={() => centerOnVehicle(d.id, true)}
                        >
                          <TableCell
                            sx={{ fontWeight: 700, color: "primary.main" }}
                          >
                            {d.delivery_number}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
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
                            {d.distance_km && (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                              >
                                {d.distance_km.toFixed(0)} km
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
                          <TableCell sx={{ minWidth: 120 }}>
                            {d.status === "in-transit" &&
                              d.current_location && (
                                <Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={
                                      d.current_location.route_progress * 100
                                    }
                                    sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {(
                                      d.current_location.route_progress * 100
                                    ).toFixed(0)}
                                    % · ETA {d.eta_hours?.toFixed(1)}h
                                  </Typography>
                                </Box>
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
        )}

        {/* ══ MAP VIEW ══ */}
        {viewMode === "map" && (
          <Box sx={{ flex: 1, display: "flex", gap: 1.5 }}>
            {/* Sidebar */}
            <Box
              sx={{
                width: 280,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                overflowY: "auto",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Live Tracking
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FormatListBulleted />}
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </Button>
                  <IconButton size="small" onClick={load}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Style toggle */}
              <ToggleButtonGroup
                value={mapView}
                exclusive
                onChange={(_, v) => v && handleMapStyleChange(v)}
                size="small"
                fullWidth
              >
                <ToggleButton value="tracking" sx={{ fontSize: 11 }}>
                  <MapIcon sx={{ mr: 0.4, fontSize: 14 }} />
                  Streets
                </ToggleButton>
                <ToggleButton value="satellite" sx={{ fontSize: 11 }}>
                  <SatelliteAlt sx={{ mr: 0.4, fontSize: 14 }} />
                  Sat
                </ToggleButton>
                <ToggleButton value="terrain" sx={{ fontSize: 11 }}>
                  <Terrain sx={{ mr: 0.4, fontSize: 14 }} />
                  3D
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Delivery cards */}
              {deliveries
                .filter((d) => d.status !== "delivered")
                .map((d) => (
                  <Card
                    key={d.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      borderColor:
                        selectedVehicle === d.id ? "primary.main" : "divider",
                      bgcolor:
                        selectedVehicle === d.id
                          ? "primary.50"
                          : "background.paper",
                      transition: "all 0.2s",
                    }}
                    onClick={() => doFly(d.id)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="primary.main"
                      >
                        {d.vehicle_number}
                      </Typography>
                      <StatusChip status={d.status} />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      🧑‍✈️ {d.driver_name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      📍 {d.destination?.split(",")[0]}
                    </Typography>
                    {d.status === "in-transit" && d.current_location && (
                      <Box sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            ⚡ {d.current_location.speed.toFixed(0)} km/h
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            ETA {d.eta_hours?.toFixed(1)}h
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={d.current_location.route_progress * 100}
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {(d.current_location.route_progress * 100).toFixed(0)}
                          % of {d.distance_km?.toFixed(0)} km
                        </Typography>
                      </Box>
                    )}
                  </Card>
                ))}

              <Button
                variant="contained"
                startIcon={<Add />}
                size="small"
                onClick={() => setDialogOpen(true)}
              >
                New Delivery
              </Button>
            </Box>

            {/* Map */}
            <Card sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
              {!MAPBOX_TOKEN && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "grey.100",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6" color="error">
                    Mapbox token missing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> in your .env
                  </Typography>
                </Box>
              )}
              <div
                ref={mapContainer}
                style={{ width: "100%", height: "100%", minHeight: 500 }}
              />

              {/* Selected vehicle HUD */}
              {selectedDelivery && (
                <Paper
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    p: 1.5,
                    bgcolor: "rgba(0,0,0,0.82)",
                    color: "white",
                    borderRadius: 2,
                    backdropFilter: "blur(8px)",
                    zIndex: 2,
                    minWidth: 200,
                  }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    {selectedDelivery.vehicle_number}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ opacity: 0.75 }}
                  >
                    {selectedDelivery.driver_name}
                  </Typography>
                  <Divider
                    sx={{ borderColor: "rgba(255,255,255,0.15)", my: 0.75 }}
                  />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        Speed
                      </Typography>
                      <Typography variant="body2">
                        {selectedDelivery.current_location?.speed.toFixed(0)}{" "}
                        km/h
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        ETA
                      </Typography>
                      <Typography variant="body2">
                        {selectedDelivery.eta_hours?.toFixed(1)}h
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        Route
                      </Typography>
                      <Typography variant="body2">
                        {selectedDelivery.distance_km?.toFixed(0)} km
                      </Typography>
                    </Box>
                  </Box>
                  {selectedDelivery.current_location && (
                    <LinearProgress
                      variant="determinate"
                      value={
                        selectedDelivery.current_location.route_progress * 100
                      }
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.2)",
                        "& .MuiLinearProgress-bar": { bgcolor: "#f59e0b" },
                      }}
                    />
                  )}
                </Paper>
              )}

              {/* Bottom stats bar */}
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
                {[
                  { label: "Active", value: inTransit },
                  { label: "Total", value: total },
                  { label: "Done", value: completed },
                  {
                    label: "Revenue",
                    value: `₹${(revenue / 1000).toFixed(0)}k`,
                  },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ textAlign: "center" }}>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ opacity: 0.6 }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Card>
          </Box>
        )}
      </Box>

      {/* ══ CREATE DELIVERY DIALOG ══ */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setForm(emptyForm);
          setSelectedPlace(null);
          setDestInputValue("");
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Create New Delivery
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search a Kerala destination and the route previews instantly
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Left: Form */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

                {/* Kerala Place Search */}
                <Autocomplete
                  options={KERALA_PLACES}
                  getOptionLabel={(opt) => `${opt.label}, ${opt.district}`}
                  groupBy={(opt) => opt.district}
                  inputValue={destInputValue}
                  value={selectedPlace}
                  onInputChange={(_, val) => setDestInputValue(val)}
                  onChange={(_, val) => setSelectedPlace(val)}
                  filterOptions={(options, { inputValue }) =>
                    options.filter(
                      (o) =>
                        o.label
                          .toLowerCase()
                          .includes(inputValue.toLowerCase()) ||
                        o.district
                          .toLowerCase()
                          .includes(inputValue.toLowerCase()),
                    )
                  }
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start !important",
                        py: "6px !important",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <LocationOn
                          sx={{
                            fontSize: 14,
                            color:
                              option.type === "market" ? "#ef4444" : "#3b82f6",
                          }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {option.label}
                        </Typography>
                        <Chip
                          label={option.type}
                          size="small"
                          sx={{
                            fontSize: 9,
                            height: 16,
                            ml: 0.5,
                            bgcolor:
                              option.type === "market" ? "#fee2e2" : "#dbeafe",
                            color:
                              option.type === "market" ? "#dc2626" : "#1d4ed8",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 2.5 }}
                      >
                        {option.district} District
                      </Typography>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Destination in Kerala *"
                      placeholder="Search city, market, or district..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <LocationOn
                            sx={{
                              color: "text.secondary",
                              mr: 0.5,
                              fontSize: 18,
                            }}
                          />
                        ),
                      }}
                    />
                  )}
                />

                {/* Route summary chip */}
                {selectedPlace && (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      icon={<Route sx={{ fontSize: 14 }} />}
                      label={`${distanceKm(ORIGIN_COORDS, selectedPlace.coordinates).toFixed(0)} km`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Schedule sx={{ fontSize: 14 }} />}
                      label={`~${(distanceKm(ORIGIN_COORDS, selectedPlace.coordinates) / 60).toFixed(1)}h ETA`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<LocationOn sx={{ fontSize: 14 }} />}
                      label={selectedPlace.district}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                )}

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

                <TextField
                  label="Driver Notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={form.driver_notes}
                  onChange={(e) =>
                    setForm({ ...form, driver_notes: e.target.value })
                  }
                  placeholder="Special instructions, contact, load details..."
                />
              </Box>
            </Grid>

            {/* Right: Map Preview */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  height: "100%",
                  minHeight: 380,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  position: "relative",
                }}
              >
                {!MAPBOX_TOKEN ? (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "grey.50",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Map preview requires Mapbox token
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <div
                      ref={dialogMapContainer}
                      style={{ width: "100%", height: "100%" }}
                    />
                    {/* Legend */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        bgcolor: "rgba(255,255,255,0.92)",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.75,
                        backdropFilter: "blur(4px)",
                        boxShadow: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        display="block"
                      >
                        Route Preview
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: "#10b981",
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Depot (Origin)
                        </Typography>
                      </Box>
                      {selectedPlace && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: "#ef4444",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {selectedPlace.label}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {!selectedPlace && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <Paper
                          sx={{
                            p: 2,
                            textAlign: "center",
                            bgcolor: "rgba(255,255,255,0.9)",
                            borderRadius: 2,
                          }}
                        >
                          <NavigationOutlined
                            sx={{ fontSize: 32, color: "text.disabled", mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Search a destination to preview the route
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setForm(emptyForm);
              setSelectedPlace(null);
              setDestInputValue("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || !form.vehicle_id || !selectedPlace}
            startIcon={
              saving ? <CircularProgress size={16} /> : <DirectionsCar />
            }
          >
            {saving ? "Creating…" : "Create Delivery"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ STATUS DIALOG ══ */}
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
            transform: scale(1.12);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .mapboxgl-popup {
          max-width: 240px;
        }
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }
        .mapboxgl-popup-close-button {
          display: none;
        }
      `}</style>
    </AppLayout>
  );
}
