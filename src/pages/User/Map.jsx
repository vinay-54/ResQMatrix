import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer, TileLayer, CircleMarker,
  Circle, Polyline, Popup, ZoomControl, useMap
} from 'react-leaflet';
import {
  MapPin, Navigation, AlertTriangle, CheckCircle2,
  Loader2, ChevronUp, ChevronDown, X, Phone,
  Users, Droplets, RefreshCw, Crosshair, Route,
  Shield, AlertOctagon, Compass, Tent
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useDataStore   from '../../store/useDataStore';
import useGeolocation from '../../hooks/useGeolocation';
import {
  calculateRoute,
  ROUTE_STATUS,
  formatDistance,
  formatDuration
} from '../../services/routingService';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import '../../utils/leafletIcons';

const DEFAULT_CENTER = [13.6288, 79.4197];
const DEFAULT_ZOOM   = 15;

// Plain language zone names for citizens (translated)
const getDangerLabel = (level, t) => {
  return t(`map.dangerLabel.${level}`, t('map.dangerLabel.default'));
};

// Fly-to helper component
const FlyTo = ({ target, zoom = 16 }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, zoom, { animate: true, duration: 0.8 });
  }, [target]);
  return null;
};

const UserMap = () => {
  const { t }         = useTranslation();
  const mapRef        = useRef(null);
  const geo           = useGeolocation();
  const rescueCamps   = useDataStore(s => s.rescueCamps);
  const dangerZones   = useDataStore(s => s.dangerZones);

  // Map state
  const [flyTarget,    setFlyTarget]    = useState(null);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [sheetOpen,    setSheetOpen]    = useState(true);

  // Route state
  const [routeData,    setRouteData]    = useState(null);
  const [routeStatus,  setRouteStatus]  = useState(ROUTE_STATUS.IDLE);
  const [routeError,   setRouteError]   = useState('');

  const activeCamps = rescueCamps.filter(c => c.status === 'active');

  // ── Locate user on mount ──────────────────────────────
  useEffect(() => {
    geo.requestOnce();
  }, []);

  // ── Fly to user when location acquired ───────────────
  useEffect(() => {
    if (geo.location && !selectedCamp) {
      setFlyTarget([geo.location.lat, geo.location.lng]);
    }
  }, [geo.location]);

  // ── Route calculation ────────────────────────────────
  const handleGetRoute = useCallback(async (camp) => {
    setSelectedCamp(camp);
    setRouteData(null);
    setRouteError('');
    setSheetOpen(true);

    if (!geo.location) {
      setRouteStatus(ROUTE_STATUS.NO_LOCATION);
      return;
    }

    setRouteStatus(ROUTE_STATUS.LOADING);

    const result = await calculateRoute(
      { lat: geo.location.lat, lng: geo.location.lng },
      { lat: camp.lat,         lng: camp.lng         }
    );

    if (result.status === ROUTE_STATUS.SUCCESS) {
      setRouteData(result);
      setRouteStatus(ROUTE_STATUS.SUCCESS);
      // Fit map to show both points
      if (mapRef.current) {
        mapRef.current.fitBounds([
          [geo.location.lat, geo.location.lng],
          [camp.lat,         camp.lng         ],
        ], { padding: [80, 80] });
      }
    } else {
      setRouteStatus(ROUTE_STATUS.ERROR);
      setRouteError(result.error || 'Could not calculate route');
    }
  }, [geo.location]);

  const clearRoute = () => {
    setRouteData(null);
    setRouteStatus(ROUTE_STATUS.IDLE);
    setSelectedCamp(null);
    setRouteError('');
    if (geo.location) {
      setFlyTarget([geo.location.lat, geo.location.lng]);
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        height: 'calc(100vh - 52px - 64px)',
        position: 'relative',
      }}
    >

      {/* ── Map Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5
                      bg-white border-b border-[#E2E8F0] flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-[#059669]" />
          <span className="text-[13px] font-bold text-[#0F172A]">{t('map.safetyMap')}</span>
          <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9]
                           px-2 py-0.5 rounded-full">
            {t('map.safeZonesCount', { count: activeCamps.length })}
          </span>
        </div>
        <button
          onClick={() => {
            geo.requestOnce();
            if (geo.location) setFlyTarget([geo.location.lat, geo.location.lng]);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      text-[11px] font-semibold transition-all border
            ${geo.location
              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
              : 'bg-white text-[#475569] border-[#E2E8F0]'
            }`}
        >
          {geo.loading
            ? <Loader2 size={12} className="animate-spin" />
            : <Crosshair size={12} />
          }
          {geo.location ? t('map.myLocation') : t('map.locateMe')}
        </button>
      </div>

      {/* ── Map Area ────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={20}
          />
          <ZoomControl position="topright" />

          {/* Fly to handler */}
          {flyTarget && <FlyTo target={flyTarget} />}

          {/* ── Danger Zones ──────────────────────────── */}
          {dangerZones.map(zone => {
            const cfg = ALERT_LEVELS[zone.level] || ALERT_LEVELS.WARNING;
            return (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius || 80}
                pathOptions={{
                  color:       cfg.color,
                  fillColor:   cfg.color,
                  fillOpacity: 0.18,
                  weight:      2.5,
                  dashArray:   '8 5',
                }}
              >
                <Popup minWidth={180} className="idms-popup">
                  <div style={{ fontFamily: 'Inter, system-ui', padding: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: '6px', marginBottom: '6px' }}>
                      <AlertTriangle style={{ width: '16px', height: '16px', color: cfg.color }} />
                      <strong style={{ fontSize: '13px', color: cfg.color }}>
                        {getDangerLabel(zone.level, t)}
                      </strong>
                    </div>
                    <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>
                      {zone.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748B' }}>
                      {zone.reason}
                    </p>
                    <div style={{ marginTop: '8px', padding: '6px 8px',
                                  backgroundColor: '#FEF2F2', borderRadius: '6px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#DC2626' }}>
                        {t('map.stayAway')}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* ── Rescue Camp Markers ───────────────────── */}
          {rescueCamps.map(camp => {
            const isSelected = selectedCamp?.id === camp.id;
            const isActive   = camp.status === 'active';
            return (
              <CircleMarker
                key={camp.id}
                center={[camp.lat, camp.lng]}
                radius={isSelected ? 20 : 16}
                pathOptions={{
                  color:       isActive ? '#059669' : '#94A3B8',
                  weight:      isSelected ? 4 : 2.5,
                  fillColor:   isActive ? '#059669' : '#94A3B8',
                  fillOpacity: isSelected ? 0.9 : 0.3,
                }}
                eventHandlers={{ click: () => handleGetRoute(camp) }}
              >
                <Popup minWidth={200} className="idms-popup">
                  <div style={{ fontFamily: 'Inter, system-ui', padding: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                                  justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                        {camp.name}
                      </strong>
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: isActive ? '#ECFDF5' : '#F8FAFC',
                        color: isActive ? '#059669' : '#94A3B8',
                      }}>
                        {isActive ? t('map.open') : camp.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                      {t('map.capacity', { count: camp.capacity })}
                    </p>
                    {camp.contact && (
                      <p style={{ fontSize: '11px', color: '#475569', marginBottom: '10px' }}>
                        {camp.contact}
                      </p>
                    )}
                    <button
                      onClick={() => handleGetRoute(camp)}
                      style={{
                        width: '100%', padding: '8px', borderRadius: '8px',
                        backgroundColor: '#059669', color: 'white',
                        fontSize: '12px', fontWeight: '700', border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      🧭 Get Directions Here
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* ── User Location ─────────────────────────── */}
          {geo.location && (
            <>
              <Circle
                center={[geo.location.lat, geo.location.lng]}
                radius={Math.min(geo.location.accuracy || 20, 80)}
                pathOptions={{
                  color:       '#2563EB',
                  fillColor:   '#2563EB',
                  fillOpacity: 0.1,
                  weight:      1,
                }}
              />
              <CircleMarker
                center={[geo.location.lat, geo.location.lng]}
                radius={9}
                pathOptions={{
                  color:       '#FFFFFF',
                  weight:      3,
                  fillColor:   '#2563EB',
                  fillOpacity: 1,
                }}
              >
                <Popup minWidth={140} className="idms-popup">
                  <div style={{ fontFamily: 'Inter, system-ui', padding: '4px',
                                textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                      {t('map.youAreHere')}
                    </p>
                    <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                      {t('map.accuracy', { meters: Math.round(geo.location.accuracy || 0) })}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            </>
          )}

          {/* ── Route Polyline ────────────────────────── */}
          {routeData?.geometry && (
            <Polyline
              positions={routeData.geometry}
              pathOptions={{
                color:     '#2563EB',
                weight:    5,
                opacity:   0.8,
                dashArray: '12 6',
              }}
            />
          )}

          {/* ── Map Legend (top-left) ─────────────────── */}
          <div className="absolute top-3 left-3 z-[1000]
                          bg-white border border-[#E2E8F0] rounded-xl
                          shadow-card px-3 py-2.5 text-[10px]">
            <p className="font-bold text-[#0F172A] mb-1.5">{t('map.legend')}</p>
            {[
              { color: '#059669', label: t('map.legendSafe'),     fill: true  },
              { color: '#DC2626', label: t('map.legendDanger'),   fill: false },
              { color: '#2563EB', label: t('map.legendYou'),      fill: true  },
              { color: '#2563EB', label: t('map.legendRoute'),    dash: true  },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                {item.dash ? (
                  <div className="w-5 h-0.5 border-t-2 border-dashed border-[#2563EB]" />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                    style={{
                      borderColor:     item.color,
                      backgroundColor: item.fill ? item.color + '40' : 'transparent',
                    }}
                  />
                )}
                <span className="text-[#475569]">{item.label}</span>
              </div>
            ))}
          </div>
        </MapContainer>

        {/* ── Bottom Sheet ──────────────────────────────── */}
        <AnimatePresence>
          {(selectedCamp || activeCamps.length > 0) && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: sheetOpen ? 0 : 'calc(100% - 56px)' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="absolute bottom-0 left-0 right-0 z-[1000]
                         bg-white rounded-t-3xl shadow-raised
                         border-t border-[#E2E8F0]
                         max-h-[65%] flex flex-col"
            >
              {/* Sheet handle */}
              <button
                onClick={() => setSheetOpen(v => !v)}
                className="flex flex-col items-center pt-3 pb-2 flex-shrink-0"
              >
                <div className="w-10 h-1 rounded-full bg-[#E2E8F0] mb-1" />
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#94A3B8]">
                  {sheetOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                  {sheetOpen ? t('map.hidePanel') : t('map.showSafeZones')}
                </div>
              </button>

              <div className="flex-1 overflow-y-auto px-4 pb-4">

                {/* ROUTE RESULT — when camp selected */}
                {selectedCamp ? (
                  <div>
                    {/* Camp header */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#059669] flex items-center
                                        justify-center flex-shrink-0">
                          <MapPin size={18} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-[#0F172A]">
                            {selectedCamp.name}
                          </h3>
                          <p className="text-[12px] text-[#64748B]">
                            {t('map.capacity', { count: selectedCamp.capacity })}
                          </p>
                          {selectedCamp.contact && (
                            <a
                              href={`tel:${selectedCamp.contact}`}
                              className="flex items-center gap-1 text-[11px] font-medium
                                         text-[#2563EB] mt-0.5"
                            >
                              <Phone size={10} />
                              {selectedCamp.contact}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={clearRoute}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Route loading */}
                    {routeStatus === ROUTE_STATUS.LOADING && (
                      <div className="flex items-center gap-2.5 px-4 py-3
                                      bg-[#EFF6FF] rounded-xl border border-[#BFDBFE]">
                        <Loader2 size={16} className="animate-spin text-[#2563EB]" />
                        <p className="text-[13px] font-semibold text-[#2563EB]">
                          {t('map.findingRoute')}
                        </p>
                      </div>
                    )}

                    {/* No location */}
                    {routeStatus === ROUTE_STATUS.NO_LOCATION && (
                      <div className="px-4 py-3 bg-[#FFF7ED] border border-[#FED7AA]
                                      rounded-xl">
                        <p className="text-[13px] font-bold text-[#EA580C] mb-1">
                          {t('map.locationNeeded')}
                        </p>
                        <p className="text-[12px] text-[#92400E]">
                          {t('map.allowLocation')}
                        </p>
                        <button
                          onClick={geo.requestOnce}
                          className="mt-2.5 flex items-center gap-1.5 px-4 py-2
                                     bg-[#EA580C] text-white rounded-lg text-[12px]
                                     font-semibold"
                        >
                          <Crosshair size={13} />
                          {t('map.enableMyLocation')}
                        </button>
                      </div>
                    )}

                    {/* Route error */}
                    {routeStatus === ROUTE_STATUS.ERROR && (
                      <div className="px-4 py-3 bg-[#FEF2F2] border border-[#FECACA]
                                      rounded-xl">
                        <p className="text-[13px] font-bold text-[#DC2626] mb-1">
                          {t('map.couldNotFindRoute')}
                        </p>
                        <p className="text-[12px] text-[#991B1B]">{routeError}</p>
                        <button
                          onClick={() => handleGetRoute(selectedCamp)}
                          className="mt-2.5 text-[12px] font-medium text-[#DC2626]
                                     hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {/* Route success */}
                    {routeStatus === ROUTE_STATUS.SUCCESS && routeData && (
                      <div className="space-y-3">
                        {/* Distance + Time */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#EFF6FF] border border-[#BFDBFE]
                                          rounded-xl px-4 py-3 text-center">
                            <p className="text-[10px] font-bold text-[#2563EB] uppercase
                                          tracking-wide mb-1">
                              {t('map.distance')}
                            </p>
                            <p className="text-[22px] font-bold font-mono text-[#0F172A]
                                          leading-none">
                              {formatDistance(routeData.distanceKm)}
                            </p>
                          </div>
                          <div className="bg-[#F0FDF4] border border-[#BBF7D0]
                                          rounded-xl px-4 py-3 text-center">
                            <p className="text-[10px] font-bold text-[#059669] uppercase
                                          tracking-wide mb-1">
                              {t('map.estTime')}
                            </p>
                            <p className="text-[22px] font-bold font-mono text-[#0F172A]
                                          leading-none">
                              {formatDuration(routeData.durationMin)}
                            </p>
                          </div>
                        </div>

                        {/* MANDATORY safety warning — never remove */}
                        <div className="flex items-start gap-2.5 px-3 py-2.5
                                        bg-[#FFF7ED] border border-[#FDE68A] rounded-xl">
                          <AlertTriangle size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-[#92400E] leading-relaxed">
                            <strong>{t('map.routeWarningBold')}</strong>{' '}
                            {t('map.routeWarningSub')}
                          </p>
                        </div>

                        {/* Call camp */}
                        {selectedCamp.contact && (
                          <a
                            href={`tel:${selectedCamp.contact}`}
                            className="flex items-center justify-center gap-2 w-full
                                       py-3 bg-[#059669] text-white rounded-xl
                                       text-[13px] font-bold"
                          >
                            <Phone size={15} />
                            {t('map.callCamp')} — {selectedCamp.contact}
                          </a>
                        )}

                        {/* Clear route */}
                        <button
                          onClick={clearRoute}
                          className="w-full py-2.5 border-2 border-[#E2E8F0] rounded-xl
                                     text-[12px] font-semibold text-[#475569]
                                     hover:bg-[#F8FAFC] transition-colors"
                        >
                          Show all safe zones
                        </button>
                      </div>
                    )}
                  </div>

                ) : (
                  /* CAMP LIST — when no camp selected */
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A] mb-3">
                      Safe Zones Near You
                    </h3>
                    <div className="space-y-3">
                      {activeCamps.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-[13px] font-medium text-[#475569]">
                            {t('map.noCamps')}
                          </p>
                          <p className="text-[11px] text-[#94A3B8] mt-1">
                            Call 112 for emergency assistance
                          </p>
                        </div>
                      ) : (
                        activeCamps.map(camp => (
                          <button
                            key={camp.id}
                            onClick={() => handleGetRoute(camp)}
                            className="w-full flex items-start gap-3 p-4
                                       bg-[#F0FDF4] border-2 border-[#A7F3D0]
                                       rounded-2xl text-left hover:bg-[#DCFCE7]
                                       active:scale-[0.98] transition-all"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#059669]
                                            flex items-center justify-center flex-shrink-0">
                              <MapPin size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-[#059669]">
                                {camp.name}
                              </p>
                              <p className="text-[11px] text-[#065F46] mt-0.5">
                                {t('map.capacity', { count: camp.capacity })}
                              </p>
                              {camp.contact && (
                                <p className="text-[10px] font-mono text-[#059669] mt-0.5">
                                  {camp.contact}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span className="text-[9px] font-bold bg-[#059669]
                                               text-white px-2 py-0.5 rounded-full">
                                OPEN
                              </span>
                              <Route size={14} className="text-[#059669]" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Danger zones warning */}
                    {dangerZones.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-[13px] font-bold text-[#DC2626] mb-2">
                          {t('map.areasToAvoid')}
                        </h3>
                        <div className="space-y-2">
                          {dangerZones.map(zone => {
                            const cfg = ALERT_LEVELS[zone.level] || ALERT_LEVELS.WARNING;
                            return (
                              <div
                                key={zone.id}
                                className="flex items-start gap-2.5 px-3 py-2.5
                                           rounded-xl border"
                                style={{
                                  backgroundColor: cfg.bg,
                                  borderColor:     cfg.border,
                                }}
                              >
                                <AlertTriangle
                                  size={14}
                                  style={{ color: cfg.color }}
                                  className="flex-shrink-0 mt-0.5"
                                />
                                <div>
                                  <p className="text-[12px] font-bold"
                                     style={{ color: cfg.color }}>
                                    {getDangerLabel(zone.level, t)}
                                  </p>
                                  <p className="text-[11px] mt-0.5"
                                     style={{ color: cfg.color + 'BB' }}>
                                    {zone.name}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Emergency call always at bottom */}
                    <a
                      href="tel:112"
                      className="flex items-center justify-center gap-2 w-full
                                 mt-4 py-3.5 bg-[#DC2626] text-white rounded-2xl
                                 text-[14px] font-bold active:scale-[0.97]
                                 transition-all"
                    >
                      📞 Call 112 — Emergency Services
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaflet styles */}
      <style>{`
        .idms-popup .leaflet-popup-content-wrapper {
          border-radius: 12px; border: 1px solid #E2E8F0;
          box-shadow: 0 4px 12px rgba(15,23,42,0.10); padding: 0;
        }
        .idms-popup .leaflet-popup-content { margin: 0; padding: 14px; }
        .idms-popup .leaflet-popup-tip-container { display: none; }
        .leaflet-container { font-family: 'Inter', system-ui, sans-serif; }
        .leaflet-control-zoom {
          border: 1px solid #E2E8F0 !important;
          border-radius: 10px !important; overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: white !important; color: #475569 !important;
          width: 32px !important; height: 32px !important;
          line-height: 32px !important;
        }
      `}</style>
    </div>
  );
};

export default UserMap;
