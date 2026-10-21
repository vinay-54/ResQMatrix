import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer, TileLayer, CircleMarker, Polyline,
  Popup, ZoomControl, useMap, Circle
} from 'react-leaflet';
import {
  Activity, Layers, RefreshCw, Search, Battery, Clock,
  Navigation, MapPin, AlertTriangle, CheckCircle2, Loader2,
  X, Route, Users, Flag, XCircle, Wifi, Radio,
  MessageSquare, HardDrive, Crosshair
} from 'lucide-react';
import '../../utils/leafletIcons';
import useDataStore from '../../store/useDataStore';
import useGeolocation from '../../hooks/useGeolocation';
import { calculateRoute, ROUTE_STATUS, formatDistance, formatDuration } from '../../services/routingService';
import { ALERT_LEVELS, CONNECTIVITY_TIERS } from '../../constants/alertLevels';
import { formatTimeAgo } from '../../utils/formatters';
import { useMotion } from '../../hooks/useMotion';
import StatusBadge from '../../components/ui/StatusBadge';

const CAMPUS_CENTER = [13.6288, 79.4197];
const DEFAULT_ZOOM = 16;
const CONN_ICON_MAP = { Wifi, Radio, MessageSquare, HardDrive };

// ── Fly-to helper ─────────────────────────────────────────────────────────────
const FlyTo = ({ target, zoom = 17 }) => {
  const map = useMap();
  if (target) map.setView(target, zoom, { animate: true, duration: 1 });
  return null;
};

// ── Recenter button ───────────────────────────────────────────────────────────
const RecenterButton = ({ center, zoom }) => {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(center, zoom, { animate: true })}
      className="absolute bottom-[60px] right-3 z-[1000] bg-white border border-[#E2E8F0]
                 rounded-lg p-2.5 shadow-card hover:bg-[#F8FAFC] transition-colors"
      title="Reset view to campus"
    >
      <Layers size={14} className="text-[#475569]" />
    </button>
  );
};

// ── Node popup ────────────────────────────────────────────────────────────────
const NodePopupContent = ({ node, navigate }) => {
  const level = ALERT_LEVELS[node.alertLevel] || ALERT_LEVELS.SAFE;
  const conn = CONNECTIVITY_TIERS[node.connectivity];

  return (
    <div style={{ minWidth: '200px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>{node.name}</strong>
          <span style={{
            fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px',
            backgroundColor: level.bg, color: level.color
          }}>{level.label}</span>
        </div>
        <div style={{ fontSize: '10px', color: '#94A3B8' }}>{node.location}</div>
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '6px', backgroundColor: level.bg,
        marginBottom: '10px', border: `1px solid ${level.border}`
      }}>
        <div style={{
          fontSize: '9px', color: level.color, fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px'
        }}>
          Water Level Distance
        </div>
        <div style={{
          fontSize: '22px', fontWeight: '700', color: level.color,
          fontFamily: 'ui-monospace, monospace', lineHeight: '1'
        }}>
          {node.waterLevel}
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#94A3B8', marginLeft: '3px' }}>cm</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
        {[
          { label: 'Temperature', value: `${node.temperature}°C` },
          { label: 'Humidity', value: `${node.humidity}%` },
          { label: 'Battery', value: `${node.battery}%` },
          { label: 'Last seen', value: formatTimeAgo(node.lastSeen) },
        ].map(s => (
          <div key={s.label} style={{
            padding: '5px 8px', backgroundColor: '#F8FAFC',
            borderRadius: '5px', border: '1px solid #F1F5F9'
          }}>
            <div style={{ fontSize: '9px', color: '#94A3B8', marginBottom: '1px' }}>{s.label}</div>
            <div style={{
              fontSize: '12px', fontWeight: '600', color: '#0F172A',
              fontFamily: 'ui-monospace, monospace'
            }}>{s.value}</div>
          </div>
        ))}
      </div>
      {conn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '10px', fontSize: '11px'
        }}>
          <span style={{ color: '#94A3B8' }}>Link:</span>
          <span style={{ fontWeight: '600', color: conn.color }}>{conn.label}</span>
        </div>
      )}
      <button onClick={() => navigate(`/sensors/${node.id}`)}
        style={{
          width: '100%', padding: '7px', borderRadius: '6px', backgroundColor: '#0F172A',
          color: 'white', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
        }}>
        Open Node Detail →
      </button>
    </div>
  );
};

// ── Rescue Camp popup ─────────────────────────────────────────────────────────
const CampPopupContent = ({ camp, onSelectRoute }) => {
  const STATUS_COLORS = { active: '#059669', full: '#D97706', closed: '#DC2626' };
  return (
    <div style={{ minWidth: '180px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong style={{ fontSize: '13px', color: '#0F172A' }}>{camp.name}</strong>
        <span style={{
          fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '9999px',
          backgroundColor: '#ECFDF5', color: STATUS_COLORS[camp.status] || '#059669'
        }}>
          {camp.status}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
        Capacity: {camp.capacity} persons
      </div>
      {camp.contact && (
        <div style={{ fontSize: '11px', color: '#475569', marginBottom: '10px' }}>
          Contact: {camp.contact}
        </div>
      )}
      <button onClick={() => onSelectRoute(camp)}
        style={{
          width: '100%', padding: '7px', borderRadius: '6px', backgroundColor: '#059669',
          color: 'white', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer'
        }}>
        📍 Get Route to This Camp
      </button>
    </div>
  );
};

// ── Main Map Page ─────────────────────────────────────────────────────────────
const MapPage = () => {
  const navigate = useNavigate();
  const motion_config = useMotion();
  const mapRef = useRef(null);

  // Store data
  const nodes = useDataStore(s => s.nodes);
  const rescueCamps = useDataStore(s => s.rescueCamps);
  const dangerZones = useDataStore(s => s.dangerZones);
  const teams = useDataStore(s => s.teams);
  const drones = useDataStore(s => s.drones);

  // Flight path history — last 50 GPS positions per drone
  const [flightPaths, setFlightPaths] = useState({});
    // Shape: { 'DR-001': [[lat,lng], [lat,lng], ...] }

  // Track drone positions into flight path history
  useEffect(() => {
    drones.forEach(drone => {
      const t = drone.telemetry;
      if (!t?.lat || !t?.lng || drone.status !== 'airborne') return;
      setFlightPaths(prev => {
        const existing = prev[drone.id] || [];
        const last     = existing[existing.length - 1];
        // Only add if position changed meaningfully (> ~5 metres)
        if (last && Math.abs(last[0] - t.lat) < 0.00005 && Math.abs(last[1] - t.lng) < 0.00005) {
          return prev;
        }
        return {
          ...prev,
          [drone.id]: [...existing, [t.lat, t.lng]].slice(-50),
        };
      });
    });
  }, [drones]);

  // Map state
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  // Geolocation
  const geo = useGeolocation();

  // Routing state
  const [routePanel, setRoutePanel] = useState(false);
  const [destCamp, setDestCamp] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeStatus, setRouteStatus] = useState(ROUTE_STATUS.IDLE);
  const [routeError, setRouteError] = useState('');

  // Layer toggles
  const [showCamps, setShowCamps] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showTeams, setShowTeams] = useState(true);

  const FILTER_OPTIONS = [
    { value: 'ALL', label: 'All Nodes' },
    { value: 'SAFE', label: 'Safe' },
    { value: 'WATCH', label: 'Watch' },
    { value: 'WARNING', label: 'Warning' },
  ];

  const filteredNodes = nodes.filter(n => {
    const matchFilter = filter === 'ALL' || n.alertLevel === filter;
    const matchSearch = !search || n.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const flyToNode = (node) => {
    setSelectedId(node.id);
    setFlyTarget([node.lat, node.lng]);
  };

  const handleLocate = () => {
    geo.requestOnce();
  };

  const flyToUserLocation = () => {
    if (geo.location) {
      setFlyTarget([geo.location.lat, geo.location.lng]);
    }
  };

  const handleSelectRoute = useCallback(async (camp) => {
    setDestCamp(camp);
    setRoutePanel(true);
    setRouteData(null);
    setRouteError('');

    if (!geo.location) {
      setRouteStatus(ROUTE_STATUS.NO_LOCATION);
      return;
    }

    setRouteStatus(ROUTE_STATUS.LOADING);

    const result = await calculateRoute(
      { lat: geo.location.lat, lng: geo.location.lng },
      { lat: camp.lat, lng: camp.lng }
    );

    if (result.status === ROUTE_STATUS.SUCCESS) {
      setRouteData(result);
      setRouteStatus(ROUTE_STATUS.SUCCESS);
      // Fit map to show both origin and destination
      if (mapRef.current) {
        const bounds = [
          [geo.location.lat, geo.location.lng],
          [camp.lat, camp.lng],
        ];
        mapRef.current.fitBounds(bounds, { padding: [60, 60] });
      }
    } else {
      setRouteError(result.error || 'Route calculation failed.');
      setRouteStatus(ROUTE_STATUS.ERROR);
    }
  }, [geo.location]);

  const clearRoute = () => {
    setRouteData(null);
    setDestCamp(null);
    setRouteStatus(ROUTE_STATUS.IDLE);
    setRoutePanel(false);
    setRouteError('');
  };

  return (
    <div className="flex flex-col h-full -mx-6 -my-6">

      {/* ── Map Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white
                      border-b border-[#E2E8F0] flex-shrink-0 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#2563EB]" />
            <span className="text-[13px] font-semibold text-[#0F172A]">Live Map</span>
          </div>
          {/* Node status pills */}
          <div className="hidden sm:flex items-center gap-2">
            {Object.entries(nodes.reduce((acc, n) => {
              acc[n.alertLevel] = (acc[n.alertLevel] || 0) + 1; return acc;
            }, {})).map(([level, count]) => {
              const cfg = ALERT_LEVELS[level];
              return cfg ? (
                <span key={level}
                  className="flex items-center gap-1 text-[10px] font-semibold
                             px-2 py-0.5 rounded-full border"
                  style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                    style={{ backgroundColor: cfg.color }} />
                  {count} {cfg.label}
                </span>
              ) : null;
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <div className="hidden md:flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0]
                          rounded-lg px-2 py-1">
            {[
              { label: 'Camps', state: showCamps, toggle: () => setShowCamps(v => !v) },
              { label: 'Zones', state: showZones, toggle: () => setShowZones(v => !v) },
              { label: 'Teams', state: showTeams, toggle: () => setShowTeams(v => !v) },
            ].map(l => (
              <button key={l.label} onClick={l.toggle}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors
                  ${l.state ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8]'}`}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Locate me button */}
          <button
            onClick={geo.location ? flyToUserLocation : handleLocate}
            disabled={geo.loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px]
                        font-medium transition-colors border
              ${geo.location
                ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] hover:bg-[#DBEAFE]'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              } ${geo.loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {geo.loading
              ? <Loader2 size={13} className="animate-spin" />
              : <Crosshair size={13} />
            }
            {geo.loading ? 'Locating...' : geo.location ? 'My Location' : 'Locate Me'}
          </button>

          {/* Route button */}
          <button
            onClick={() => setRoutePanel(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px]
                        font-medium transition-colors border
              ${routePanel
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
          >
            <Route size={13} />
            Route to Camp
          </button>

          <button className="flex items-center gap-1.5 text-[12px] font-medium
                             text-[#475569] bg-white border border-[#E2E8F0]
                             hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Geolocation error banner ─────────────────────── */}
      <AnimatePresence>
        {geo.error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center gap-2 px-6 py-2.5 bg-[#FEF2F2]
                            border-b border-[#FECACA]">
              <AlertTriangle size={13} className="text-[#DC2626] flex-shrink-0" />
              <span className="text-[12px] text-[#DC2626]">{geo.error}</span>
              <button onClick={() => { }} className="ml-auto text-[#DC2626] hover:text-[#991B1B]">
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map + Sidebar Grid ───────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Leaflet Map ──────────────────────────────── */}
        <div className="flex-1 relative">
          <MapContainer
            center={CAMPUS_CENTER}
            zoom={DEFAULT_ZOOM}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={20}
            />
            <ZoomControl position="bottomright" />
            <RecenterButton center={CAMPUS_CENTER} zoom={DEFAULT_ZOOM} />

            {/* Fly-to target */}
            {flyTarget && <FlyTo target={flyTarget} />}

            {/* ── Danger Zone circles ──────────────────── */}
            {showZones && dangerZones.map(zone => {
              const levelCfg = ALERT_LEVELS[zone.level] || ALERT_LEVELS.WARNING;
              return (
                <Circle
                  key={zone.id}
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius || 60}
                  pathOptions={{
                    color: levelCfg.color,
                    fillColor: levelCfg.color,
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '6 4',
                  }}
                >
                  <Popup minWidth={180} className="idms-popup">
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px' }}>⚠️</span>
                        <strong style={{ fontSize: '12px', color: levelCfg.color }}>{zone.name}</strong>
                      </div>
                      <p style={{ fontSize: '11px', color: '#475569' }}>{zone.reason}</p>
                      <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>
                        Radius: {zone.radius}m · Level: {zone.level}
                      </p>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            {/* ── Rescue Camp markers ──────────────────── */}
            {showCamps && rescueCamps.map(camp => (
              <CircleMarker
                key={camp.id}
                center={[camp.lat, camp.lng]}
                radius={14}
                pathOptions={{
                  color: '#059669',
                  weight: 2.5,
                  fillColor: '#059669',
                  fillOpacity: 0.2,
                }}
              >
                <Popup minWidth={200} maxWidth={260} className="idms-popup">
                  <CampPopupContent camp={camp} onSelectRoute={handleSelectRoute} />
                </Popup>
              </CircleMarker>
            ))}

            {/* ── Team location markers ────────────────── */}
            {showTeams && teams.filter(t => t.coords?.lat).map(team => {
              const isDeployed = team.status === 'deployed';
              return (
                <CircleMarker
                  key={team.id}
                  center={[team.coords.lat, team.coords.lng]}
                  radius={8}
                  pathOptions={{
                    color: isDeployed ? '#2563EB' : '#94A3B8',
                    weight: 2,
                    fillColor: isDeployed ? '#2563EB' : '#94A3B8',
                    fillOpacity: 0.6,
                  }}
                >
                  <Popup minWidth={160} className="idms-popup">
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '4px' }}>
                      <strong style={{ fontSize: '12px', color: '#0F172A' }}>{team.name}</strong>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0' }}>{team.lead}</p>
                      <p style={{ fontSize: '10px', color: '#94A3B8' }}>{team.zone || 'Zone not set'}</p>
                      <span style={{
                        fontSize: '10px', fontWeight: '600', color: isDeployed ? '#059669' : '#64748B',
                        backgroundColor: isDeployed ? '#ECFDF5' : '#F8FAFC',
                        padding: '2px 8px', borderRadius: '9999px', marginTop: '6px', display: 'inline-block'
                      }}>
                        {team.status}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* ── Drone markers ────────────────────────── */}
            {drones.map(drone => {
              const t  = drone.telemetry;
              if (!t?.lat || !t?.lng) return null;

              const isAirborne   = drone.status === 'airborne';
              const isOffline    = drone.status === 'offline' ||
                                   t.connectionStatus === 'disconnected';
              const batPct       = t.batteryPct ?? 0;
              const batColor     = batPct >= 60 ? '#059669' : batPct >= 30 ? '#D97706' : '#DC2626';
              const markerColor  = isOffline ? '#94A3B8' : isAirborne ? '#059669' : '#2563EB';

              return (
                <CircleMarker
                  key={drone.id}
                  center={[t.lat, t.lng]}
                  radius={isAirborne ? 14 : 11}
                  pathOptions={{
                    color:       'white',
                    weight:      3,
                    fillColor:   markerColor,
                    fillOpacity: isOffline ? 0.4 : 0.9,
                  }}
                >
                  <Popup minWidth={220} className="idms-popup">
                    <div style={{ fontFamily: 'Inter, system-ui', padding: '4px' }}>

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                            \uD83D\uDE81 {drone.model || drone.id}
                          </strong>
                          <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                            {drone.id}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                          borderRadius: '9999px', textTransform: 'capitalize',
                          backgroundColor: markerColor + '20', color: markerColor,
                        }}>
                          {drone.status}
                        </span>
                      </div>

                      {/* Telemetry grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                                    gap: '6px', marginBottom: '10px' }}>
                        {[
                          { label: 'Battery',   value: `${batPct}%`,           color: batColor     },
                          { label: 'Altitude',  value: isAirborne ? `${t.altitude}m` : '\u2014', color: '#2563EB' },
                          { label: 'Mode',      value: t.flightMode || '\u2014',    color: '#7C3AED'    },
                          { label: 'Speed',     value: isAirborne ? `${t.groundSpeed}m/s` : '\u2014', color: '#059669' },
                        ].map(tile => (
                          <div key={tile.label} style={{ padding: '5px 8px', backgroundColor: '#F8FAFC',
                                                        borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: '9px', color: '#94A3B8', marginBottom: '2px' }}>
                              {tile.label}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'monospace',
                                          color: tile.color }}>
                              {tile.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Battery bar */}
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ height: '4px', backgroundColor: '#F1F5F9',
                                      borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${batPct}%`,
                                        backgroundColor: batColor, borderRadius: '9999px' }} />
                        </div>
                      </div>

                      {/* Mission */}
                      {drone.missionStatus && drone.missionStatus !== 'idle' && (
                        <div style={{ padding: '6px 8px', backgroundColor: '#EFF6FF',
                                      borderRadius: '6px', marginBottom: '8px' }}>
                          <p style={{ fontSize: '10px', color: '#2563EB', fontWeight: '600' }}>
                            Mission: {drone.missionStatus}
                          </p>
                        </div>
                      )}

                      {/* Video note */}
                      <div style={{ padding: '5px 8px', backgroundColor: '#F8FAFC',
                                    borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                        <p style={{ fontSize: '9px', color: '#94A3B8' }}>
                          Live video \u2192 pilot's controller (5.8GHz FPV)
                        </p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* ── Drone flight path polylines ──────────────── */}
            {Object.entries(flightPaths).map(([droneId, path]) => (
              path.length > 1 && (
                <Polyline
                  key={`path-${droneId}`}
                  positions={path}
                  pathOptions={{
                    color:     '#059669',
                    weight:    2,
                    opacity:   0.5,
                    dashArray: '4 4',
                  }}
                />
              )
            ))}

            {/* ── Sensor Node markers ──────────────────── */}
            {nodes.map(node => {
              const level = ALERT_LEVELS[node.alertLevel] || ALERT_LEVELS.SAFE;
              const isSelected = selectedId === node.id;
              const inFilter = filter === 'ALL' || node.alertLevel === filter;
              return (
                <CircleMarker
                  key={node.id}
                  center={[node.lat, node.lng]}
                  radius={isSelected ? 16 : 11}
                  pathOptions={{
                    color: isSelected ? '#0F172A' : level.color,
                    weight: isSelected ? 3 : 2,
                    fillColor: level.color,
                    fillOpacity: inFilter ? 0.85 : 0.2,
                    opacity: inFilter ? 1 : 0.35,
                  }}
                  eventHandlers={{ click: () => setSelectedId(selectedId === node.id ? null : node.id) }}
                >
                  <Popup minWidth={220} maxWidth={280} className="idms-popup">
                    <NodePopupContent node={node} navigate={navigate} />
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* ── User location marker ─────────────────── */}
            {geo.location && (
              <>
                {/* Accuracy circle */}
                <Circle
                  center={[geo.location.lat, geo.location.lng]}
                  radius={Math.min(geo.location.accuracy || 20, 100)}
                  pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.08, weight: 1 }}
                />
                {/* Location dot */}
                <CircleMarker
                  center={[geo.location.lat, geo.location.lng]}
                  radius={8}
                  pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }}
                >
                  <Popup minWidth={160} className="idms-popup">
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '4px' }}>
                      <strong style={{ fontSize: '12px', color: '#0F172A' }}>Your Location</strong>
                      <p style={{ fontSize: '10px', color: '#94A3B8', margin: '4px 0' }}>
                        Accuracy: ±{Math.round(geo.location.accuracy || 0)}m
                      </p>
                      <p style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace', color: '#64748B' }}>
                        {geo.location.lat.toFixed(6)}, {geo.location.lng.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              </>
            )}

            {/* ── Destination marker (if routing) ─────────── */}
            {destCamp && (
              <CircleMarker
                center={[destCamp.lat, destCamp.lng]}
                radius={13}
                pathOptions={{ color: '#059669', weight: 3, fillColor: '#059669', fillOpacity: 0.9 }}
              />
            )}

            {/* ── Route polyline ───────────────────────── */}
            {routeData?.geometry && (
              <Polyline
                positions={routeData.geometry}
                pathOptions={{
                  color: '#2563EB',
                  weight: 5,
                  opacity: 0.75,
                  dashArray: '10 6',
                }}
              />
            )}

            {/* ── Map Legend ───────────────────────────── */}
            <div className="absolute top-3 left-3 z-[1000] bg-white border border-[#E2E8F0]
                            rounded-lg shadow-card px-3 py-2.5 max-w-[140px]">
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wide mb-2">
                Alert Level
              </p>
              {['SAFE', 'WATCH', 'WARNING', 'DANGER', 'CRITICAL'].map(lvl => {
                const cfg = ALERT_LEVELS[lvl];
                return (
                  <div key={lvl}
                    className="flex items-center gap-2 py-0.5 cursor-pointer group"
                    onClick={() => setFilter(filter === lvl ? 'ALL' : lvl)}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.color }} />
                    <span className="text-[10px] text-[#475569] font-medium group-hover:text-[#0F172A]">
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              <div className="border-t border-[#F1F5F9] mt-2 pt-2">
                <div className="flex items-center gap-2 py-0.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-[#059669]" />
                  <span className="text-[10px] text-[#475569]">Camp</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[#2563EB]" />
                  <span className="text-[10px] text-[#475569]">You / Team</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <div className="w-3 h-3 rounded-sm border-2 border-dashed border-[#EA580C]
                                  bg-[#EA580C] opacity-30" />
                  <span className="text-[10px] text-[#475569]">Danger Zone</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white bg-[#059669]" />
                  <span className="text-[10px] text-[#475569]">Drone (airborne)</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 border border-dashed border-[#059669]" />
                  <span className="text-[10px] text-[#475569]">Flight path</span>
                </div>
              </div>
            </div>
          </MapContainer>
        </div>

        {/* ── Right Sidebar ─────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 bg-white border-l border-[#E2E8F0]
                        flex flex-col overflow-hidden hidden md:flex">

          {/* ── Routing Panel ──────────────────────────── */}
          <AnimatePresence>
            {routePanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex-shrink-0"
              >
                <div className="border-b border-[#E2E8F0] bg-[#F8FAFC]">

                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <Route size={13} className="text-[#2563EB]" />
                      <span className="text-[12px] font-semibold text-[#0F172A]">Route to Rescue Camp</span>
                    </div>
                    <button onClick={clearRoute}
                      className="p-1 rounded text-[#94A3B8] hover:text-[#475569]">
                      <X size={13} />
                    </button>
                  </div>

                  <div className="px-4 py-3 space-y-3">

                    {/* Origin */}
                    <div>
                      <p className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                        From — Your Location
                      </p>
                      {!geo.location ? (
                        <button onClick={handleLocate} disabled={geo.loading}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-white
                                     border border-[#E2E8F0] rounded-md text-[12px]
                                     text-[#2563EB] font-medium hover:bg-[#EFF6FF] transition-colors">
                          {geo.loading
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Crosshair size={12} />
                          }
                          {geo.loading ? 'Getting location...' : 'Enable My Location'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#EFF6FF]
                                        border border-[#BFDBFE] rounded-md">
                          <div className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0" />
                          <span className="text-[11px] font-mono text-[#2563EB]">
                            {geo.location.lat.toFixed(5)}, {geo.location.lng.toFixed(5)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Destination */}
                    <div>
                      <p className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                        To — Select Rescue Camp
                      </p>
                      <div className="space-y-1.5">
                        {rescueCamps.map(camp => (
                          <button
                            key={camp.id}
                            onClick={() => handleSelectRoute(camp)}
                            disabled={!geo.location || routeStatus === ROUTE_STATUS.LOADING}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md
                                        border text-left transition-all text-[11px]
                              ${destCamp?.id === camp.id
                                ? 'border-[#059669] bg-[#ECFDF5] text-[#059669] font-semibold'
                                : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#059669] hover:bg-[#F0FDF4]'
                              } ${(!geo.location || routeStatus === ROUTE_STATUS.LOADING) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="w-2 h-2 rounded-full flex-shrink-0 border-2 border-[#059669]" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{camp.name}</p>
                              <p className="text-[9px] text-[#94A3B8]">Capacity: {camp.capacity}</p>
                            </div>
                            {destCamp?.id === camp.id && <CheckCircle2 size={11} className="text-[#059669]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Route status */}
                    {routeStatus === ROUTE_STATUS.LOADING && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#EFF6FF] rounded-md">
                        <Loader2 size={13} className="animate-spin text-[#2563EB]" />
                        <span className="text-[11px] text-[#2563EB] font-medium">
                          Calculating route...
                        </span>
                      </div>
                    )}

                    {routeStatus === ROUTE_STATUS.NO_LOCATION && (
                      <div className="px-3 py-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-md">
                        <p className="text-[11px] font-semibold text-[#EA580C] mb-0.5">
                          Location Required
                        </p>
                        <p className="text-[10px] text-[#92400E]">
                          Enable your location first to calculate a route.
                        </p>
                      </div>
                    )}

                    {routeStatus === ROUTE_STATUS.ERROR && (
                      <div className="px-3 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-md">
                        <p className="text-[11px] font-semibold text-[#DC2626] mb-0.5">
                          Route Not Available
                        </p>
                        <p className="text-[10px] text-[#991B1B]">{routeError}</p>
                      </div>
                    )}

                    {/* Route result */}
                    {routeStatus === ROUTE_STATUS.SUCCESS && routeData && (
                      <div className="space-y-2">
                        {/* Distance + time */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-md">
                            <p className="text-[9px] text-[#94A3B8] uppercase tracking-wide mb-0.5">
                              Distance
                            </p>
                            <p className="text-[15px] font-bold font-mono text-[#0F172A]">
                              {formatDistance(routeData.distanceKm)}
                            </p>
                          </div>
                          <div className="px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-md">
                            <p className="text-[9px] text-[#94A3B8] uppercase tracking-wide mb-0.5">
                              Est. Time
                            </p>
                            <p className="text-[15px] font-bold font-mono text-[#0F172A]">
                              {formatDuration(routeData.durationMin)}
                            </p>
                          </div>
                        </div>

                        {/* ⚠️ MANDATORY SAFETY WARNING — never remove */}
                        <div className="px-3 py-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={12} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-[#92400E] mb-0.5">
                                ROUTE UNVERIFIED — SAFETY NOT CONFIRMED
                              </p>
                              <p className="text-[9px] text-[#92400E] leading-relaxed">
                                This route uses standard road data only. It does not account for
                                flooded roads, blocked areas, or disaster conditions.
                                Confirm with field teams before proceeding.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Danger zone warning if any zones are nearby */}
                        {dangerZones.length > 0 && (
                          <div className="px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-md">
                            <div className="flex items-start gap-1.5">
                              <XCircle size={11} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
                              <p className="text-[9px] text-[#991B1B] font-medium">
                                {dangerZones.length} active danger zone(s) in this area.
                                Route may pass through flooded zones.
                              </p>
                            </div>
                          </div>
                        )}

                        <button onClick={clearRoute}
                          className="w-full py-2 border border-[#E2E8F0] rounded-md
                                     text-[11px] font-medium text-[#475569]
                                     hover:bg-[#F8FAFC] transition-colors">
                          Clear Route
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Node List ──────────────────────────────── */}
          <div className="px-4 py-3 border-b border-[#F1F5F9] flex-shrink-0">
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="w-full h-8 pl-8 pr-3 text-[12px] text-[#0F172A]
                           bg-[#F8FAFC] border border-[#E2E8F0] rounded-md
                           placeholder:text-[#94A3B8]
                           focus:outline-none focus:border-[#2563EB] transition-all"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {FILTER_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFilter(opt.value)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors
                    ${filter === opt.value ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Activity size={18} className="text-[#CBD5E1] mb-2" />
                <p className="text-[12px] font-medium text-[#475569]">No nodes match</p>
                <button onClick={() => { setFilter('ALL'); setSearch(''); }}
                  className="mt-2 text-[11px] text-[#2563EB] hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="divide-y divide-[#F8FAFC]">
                {filteredNodes.map(node => {
                  const level = ALERT_LEVELS[node.alertLevel] || ALERT_LEVELS.SAFE;
                  const conn = CONNECTIVITY_TIERS[node.connectivity];
                  const ConnIcon = CONN_ICON_MAP[conn?.icon] || Wifi;
                  const isSelected = selectedId === node.id;
                  return (
                    <button key={node.id} onClick={() => flyToNode(node)}
                      className={`w-full text-left px-4 py-3.5 transition-all
                        ${isSelected ? 'bg-[#EFF6FF] border-l-2 border-l-[#2563EB]' : 'hover:bg-[#F8FAFC]'}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: level.color }} />
                          <span className="text-[12px] font-semibold text-[#0F172A]">{node.name}</span>
                        </div>
                        <StatusBadge level={node.alertLevel} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-mono text-[#475569] w-14 flex-shrink-0">
                          {node.waterLevel} cm
                        </span>
                        <div className="flex-1 h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{ width: `${Math.min(100, node.waterLevel)}%`, backgroundColor: level.color }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <ConnIcon size={10} style={{ color: conn?.color }} />
                          <span style={{ color: conn?.color }}>{conn?.label}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#94A3B8]">
                          <Battery size={10} />
                          <span className="font-mono">{node.battery}%</span>
                          <span className="mx-1 text-[#E2E8F0]">·</span>
                          <Clock size={10} />
                          <span>{formatTimeAgo(node.lastSeen)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Camp list in sidebar */}
            {showCamps && rescueCamps.length > 0 && (
              <div className="border-t border-[#F1F5F9] px-4 py-3">
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
                  Rescue Camps ({rescueCamps.length})
                </p>
                <div className="space-y-1.5">
                  {rescueCamps.map(camp => (
                    <button
                      key={camp.id}
                      onClick={() => {
                        setFlyTarget([camp.lat, camp.lng]);
                        setRoutePanel(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md
                                 bg-[#F0FDF4] border border-[#BBF7D0] text-left hover:bg-[#DCFCE7] transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full border-2 border-[#059669] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#059669] truncate">{camp.name}</p>
                        <p className="text-[9px] text-[#94A3B8]">Cap: {camp.capacity} · {camp.status}</p>
                      </div>
                      <Route size={10} className="text-[#059669] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drone list in sidebar */}
            {drones.filter(d => d.status !== 'offline').length > 0 && (
              <div className="border-t border-[#F1F5F9] px-4 py-3">
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
                  Drones ({drones.filter(d => d.status !== 'offline').length})
                </p>
                <div className="space-y-1.5">
                  {drones.filter(d => d.status !== 'offline').map(drone => {
                    const t     = drone.telemetry;
                    const bat   = t?.batteryPct ?? 0;
                    const color = drone.status === 'airborne' ? '#059669' : '#2563EB';
                    return (
                      <button
                        key={drone.id}
                        onClick={() => t?.lat && setFlyTarget([t.lat, t.lng])}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md
                                   bg-[#F0FDF4] border border-[#BBF7D0] text-left
                                   hover:bg-[#DCFCE7] transition-colors"
                      >
                        <span className="text-[14px]">\uD83D\uDE81</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate"
                             style={{ color }}>
                            {drone.model || drone.id}
                          </p>
                          <p className="text-[9px] text-[#94A3B8]">
                            Bat: {bat}% · {drone.status}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="px-4 py-3 border-t border-[#F1F5F9] flex-shrink-0">
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
              <span>{filteredNodes.length}/{nodes.length} nodes</span>
              <span>OpenStreetMap · OSRM Routing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaflet popup styles */}
      <style>{`
        .idms-popup .leaflet-popup-content-wrapper {
          border-radius: 10px; border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(15,23,42,0.07); padding: 0;
        }
        .idms-popup .leaflet-popup-content { margin: 0; padding: 14px; }
        .idms-popup .leaflet-popup-tip-container { display: none; }
        .leaflet-container { font-family: 'Inter', system-ui, sans-serif; }
        .leaflet-control-zoom { border: 1px solid #E2E8F0 !important; border-radius: 8px !important;
          overflow: hidden; box-shadow: 0 1px 3px rgba(15,23,42,0.06) !important; }
        .leaflet-control-zoom a { background: white !important; color: #475569 !important;
          border-bottom: 1px solid #F1F5F9 !important; width: 30px !important;
          height: 30px !important; line-height: 30px !important; }
        .leaflet-control-zoom a:hover { background: #F8FAFC !important; color: #0F172A !important; }
      `}</style>
    </div>
  );
};

export default MapPage;
