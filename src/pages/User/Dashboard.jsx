import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, MapPin, Droplets,
  Phone, Navigation, Bell, Info, ChevronRight,
  CloudRain, Wind, Thermometer, Clock, Users,
  ShieldCheck, AlertOctagon, Radio
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useDataStore  from '../../store/useDataStore';
import useAuthStore  from '../../store/useAuthStore';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import { formatTimeAgo } from '../../utils/formatters';
import { useMotion } from '../../hooks/useMotion';

// Visual config per level (colors/icons stay constant, text comes from i18n)
const CITIZEN_STATUS_CONFIG = {
  SAFE:     { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: ShieldCheck, pulse: false },
  WATCH:    { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: Bell,         pulse: false },
  WARNING:  { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: AlertTriangle, pulse: true },
  DANGER:   { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: AlertOctagon,  pulse: true },
  CRITICAL: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: AlertOctagon,  pulse: true },
  OFFLINE:  { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', icon: Radio,         pulse: false },
};

// Convert water level cm to translation key
const getWaterLevelKey = (cm) => {
  if (cm === null || cm === undefined) return 'unknown';
  if (cm <= 8)  return 'critical';
  if (cm <= 15) return 'danger';
  if (cm <= 25) return 'warning';
  if (cm <= 40) return 'watch';
  return 'safe';
};

// Get most critical node across all nodes
const getHighestAlertLevel = (nodes) => {
  const order = ['CRITICAL', 'DANGER', 'WARNING', 'WATCH', 'SAFE'];
  return order.find(l => nodes.some(n => n.alertLevel === l)) || 'SAFE';
};

const UserDashboard = () => {
  const { t }           = useTranslation();
  const navigate        = useNavigate();
  const motion_config   = useMotion();
  const user            = useAuthStore(s => s.user);
  const nodes           = useDataStore(s => s.nodes);
  const alerts          = useDataStore(s => s.alerts);
  const rescueCamps     = useDataStore(s => s.rescueCamps);
  const dangerZones     = useDataStore(s => s.dangerZones);
  const teams           = useDataStore(s => s.teams);

  const highestLevel    = getHighestAlertLevel(nodes);
  const status          = CITIZEN_STATUS_CONFIG[highestLevel] || CITIZEN_STATUS_CONFIG.SAFE;
  const StatusIcon      = status.icon;

  const activeAlerts    = alerts.filter(a => !a.acknowledged);
  const warningNodes    = nodes.filter(n =>
    ['WARNING','DANGER','CRITICAL'].includes(n.alertLevel)
  );
  const deployed = teams.filter(t => t.status === 'deployed');

  // Nearest rescue camp (simplified — show first active one)
  const nearestCamp = rescueCamps.find(c => c.status === 'active');

  // Most critical node for display
  const criticalNode = warningNodes[0] || nodes[0];

  // Weather from most critical node
  const weather = criticalNode ? {
    temp:     criticalNode.temperature,
    humidity: criticalNode.humidity,
    rain:     criticalNode.rain,
    pressure: criticalNode.pressure,
  } : null;

  return (
    <motion.div
      {...motion_config.fadeSlideUp}
      className="px-4 pt-4 pb-6 space-y-4"
    >

      {/* ── 1. MAIN STATUS CARD ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl border-2 overflow-hidden"
        style={{
          backgroundColor: status.bg,
          borderColor:     status.border,
        }}
      >
        {/* Pulsing top strip for active danger */}
        {status.pulse && (
          <div
            className="h-2 w-full animate-pulse"
            style={{ backgroundColor: status.color }}
          />
        )}

        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: status.color + '20' }}
            >
              <StatusIcon
                size={28}
                style={{ color: status.color }}
                className={status.pulse ? 'animate-pulse' : ''}
              />
            </div>
            <div className="flex-1">
              <h1
                className="text-[20px] font-bold leading-tight"
                style={{ color: status.color }}
              >
                {t(`home.status.${highestLevel}.headline`)}
              </h1>
              <p className="text-[13px] mt-1 leading-relaxed"
                 style={{ color: status.color + 'CC' }}>
                {t(`home.status.${highestLevel}.subtext`)}
              </p>
            </div>
          </div>

          {/* Sub-info strip */}
          <div className="flex items-center gap-4 pt-3 border-t"
               style={{ borderColor: status.border }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full"
                   style={{ backgroundColor: status.color }} />
              <span className="text-[12px] font-semibold"
                    style={{ color: status.color }}>
                {t('home.sensorsActive', { count: nodes.length })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]"
                 style={{ color: status.color + '99' }}>
              <Clock size={11} />
              {t('home.updated', { time: formatTimeAgo(nodes[0]?.lastSeen || Date.now()) })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. ACTIVE ALERTS BANNER ──────────────────────── */}
      {activeAlerts.length > 0 && (
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/user/alerts')}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                     bg-[#FEF2F2] border border-[#FECACA] text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#DC2626] flex items-center
                          justify-center flex-shrink-0">
            <Bell size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#DC2626]">
              {activeAlerts.length > 1
                ? t('home.activeAlertsPlural', { count: activeAlerts.length })
                : t('home.activeAlerts', { count: activeAlerts.length })}
            </p>
            <p className="text-[12px] text-[#991B1B] truncate">
              {activeAlerts[0]?.message || t('home.tapToSeeDetails')}
            </p>
          </div>
          <ChevronRight size={18} className="text-[#DC2626] flex-shrink-0" />
        </motion.button>
      )}

      {/* ── 3. QUICK ACTION GRID ───────────────────────── */}
      <div>
        <h2 className="text-[13px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">
          {t('home.whatDoYouNeed')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label:   t('home.sendSOS'),
              sub:     t('home.alertRescueTeams'),
              icon:    AlertOctagon,
              color:   '#DC2626',
              bg:      '#FEF2F2',
              border:  '#FECACA',
              path:    '/user/sos',
            },
            {
              label:   t('home.findSafeZone'),
              sub:     t('home.nearestRescueCamp'),
              icon:    MapPin,
              color:   '#059669',
              bg:      '#ECFDF5',
              border:  '#A7F3D0',
              path:    '/user/map',
            },
            {
              label:   t('home.getCleanWater'),
              sub:     t('home.waterStationsNearby'),
              icon:    Droplets,
              color:   '#2563EB',
              bg:      '#EFF6FF',
              border:  '#BFDBFE',
              path:    '/user/water',
            },
            {
              label:   t('home.callForHelp'),
              sub:     t('home.emergencyContacts'),
              icon:    Phone,
              color:   '#D97706',
              bg:      '#FFFBEB',
              border:  '#FDE68A',
              path:    '/user/contacts',
            },
            {
              label:   t('home.evacuateSafely'),
              sub:     t('home.stepByStepGuide'),
              icon:    Navigation,
              color:   '#7C3AED',
              bg:      '#F5F3FF',
              border:  '#DDD6FE',
              path:    '/user/evacuation',
            },
            {
              label:   t('home.floodAlerts'),
              sub:     t('home.activeNow', { count: activeAlerts.length }),
              icon:    Bell,
              color:   '#0F172A',
              bg:      '#F8FAFC',
              border:  '#E2E8F0',
              path:    '/user/alerts',
            },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-start p-4 rounded-2xl border-2
                           text-left transition-all"
                style={{
                  backgroundColor: action.bg,
                  borderColor:     action.border,
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: action.color + '20' }}
                >
                  <Icon size={22} style={{ color: action.color }} />
                </div>
                <p className="text-[14px] font-bold text-[#0F172A] leading-tight">
                  {action.label}
                </p>
                <p className="text-[11px] mt-0.5"
                   style={{ color: action.color }}>
                  {action.sub}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 4. CURRENT CONDITIONS ──────────────────────── */}
      {weather && (
        <div>
          <h2 className="text-[13px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">
            {t('home.currentConditions')}
          </h2>
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Thermometer, value: `${weather.temp}°C`,        label: t('home.temp'),     color: '#EA580C' },
                { icon: Droplets,    value: `${weather.humidity}%`,      label: t('home.humidity'), color: '#2563EB' },
                { icon: Wind,        value: `${weather.pressure} hPa`,  label: t('home.pressure'), color: '#7C3AED' },
                { icon: CloudRain,   value: weather.rain ? t('home.yes') : t('home.no'), label: t('home.rainfall'), color: weather.rain ? '#2563EB' : '#059669' },
              ].map((c, idx) => {
                const Icon = c.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: c.color + '15' }}
                    >
                      <Icon size={18} style={{ color: c.color }} />
                    </div>
                    <span className="text-[13px] font-bold text-[#0F172A] text-center font-mono">
                      {c.value}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] text-center">
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rainfall warning */}
            {weather.rain && (
              <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center gap-2">
                <CloudRain size={14} className="text-[#2563EB] flex-shrink-0" />
                <p className="text-[12px] font-semibold text-[#2563EB]">
                  {t('home.rainfallDetected')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. WATER LEVEL STATUS ──────────────────────── */}
      {nodes.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">
            {t('home.waterLevelStatus')}
          </h2>
          <div className="space-y-2.5">
            {nodes.slice(0, 3).map(node => {
              const level = ALERT_LEVELS[node.alertLevel] || ALERT_LEVELS.SAFE;
              return (
                <div
                  key={node.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5
                             flex items-center gap-3"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: level.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                      {node.name}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: level.color }}>
                      {t(`home.waterLevel.${getWaterLevelKey(node.waterLevel)}`)}
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ color: level.color, backgroundColor: level.bg }}
                  >
                    {level.label}
                  </span>
                </div>
              );
            })}
            {nodes.length > 3 && (
              <button
                onClick={() => navigate('/user/map')}
                className="w-full text-center text-[12px] font-medium text-[#2563EB]
                           py-2 hover:underline"
              >
                {t('home.viewAllPoints', { count: nodes.length })}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 6. NEAREST RESCUE CAMP ─────────────────────── */}
      {nearestCamp && (
        <div>
          <h2 className="text-[13px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">
            {t('home.nearestRescueCampTitle')}
          </h2>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/user/map')}
            className="w-full bg-[#ECFDF5] border-2 border-[#A7F3D0] rounded-2xl
                       p-4 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#059669] flex items-center
                              justify-center flex-shrink-0">
                <MapPin size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[#059669]">
                  {nearestCamp.name}
                </p>
                <p className="text-[12px] text-[#065F46] mt-0.5">
                  {t('home.capacityPeople', { count: nearestCamp.capacity })}
                </p>
                {nearestCamp.contact && (
                  <p className="text-[11px] text-[#065F46] mt-1 font-mono flex items-center gap-1">
                    <Phone size={10} className="inline" /> {nearestCamp.contact}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-bold bg-[#059669] text-white
                                 px-2 py-0.5 rounded-full uppercase">
                  {t('home.open')}
                </span>
                <ChevronRight size={16} className="text-[#059669]" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#A7F3D0] flex items-center gap-2">
              <Navigation size={13} className="text-[#059669]" />
              <span className="text-[12px] font-semibold text-[#059669]">
                {t('home.tapToGetDirections')}
              </span>
            </div>
          </motion.button>
        </div>
      )}

      {/* ── 7. DANGER ZONES WARNING ────────────────────── */}
      {dangerZones.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">
            {t('home.areasToAvoid')}
          </h2>
          <div className="space-y-2">
            {dangerZones.map(zone => {
              const level = ALERT_LEVELS[zone.level] || ALERT_LEVELS.WARNING;
              return (
                <div
                  key={zone.id}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                  style={{ backgroundColor: level.bg, borderColor: level.border }}
                >
                  <AlertTriangle
                    size={18}
                    style={{ color: level.color }}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[13px] font-bold"
                       style={{ color: level.color }}>
                      {zone.name}
                    </p>
                    <p className="text-[11px] mt-0.5"
                       style={{ color: level.color + 'CC' }}>
                      {zone.reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 8. IMPORTANT INFORMATION CARD ─────────────── */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-[#2563EB]" />
          <h2 className="text-[13px] font-bold text-[#0F172A]">
            {t('home.importantInformation')}
          </h2>
        </div>
        <div className="space-y-2.5">
          {[
            t('home.tip1'),
            t('home.tip2'),
            t('home.tip3'),
            t('home.tip4'),
            t('home.tip5'),
          ].map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center
                              justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-white">{idx + 1}</span>
              </div>
              <p className="text-[12px] text-[#475569] leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 9. ACTIVE RESCUE TEAMS COUNT ───────────────── */}
      {deployed.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4
                        flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center
                          justify-center flex-shrink-0">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#2563EB]">
              {deployed.length > 1
                ? t('home.rescueTeamsActivePlural', { count: deployed.length })
                : t('home.rescueTeamsActive', { count: deployed.length })}
            </p>
            <p className="text-[12px] text-[#1D4ED8] mt-0.5">
              {t('home.teamsDeployed')}
            </p>
          </div>
        </div>
      )}

      {/* ── 10. FOOTER ─────────────────────────────────── */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-[#CBD5E1]">
          {t('home.footer1')}
        </p>
        <p className="text-[10px] text-[#CBD5E1] mt-0.5">
          {t('home.footer2')}
        </p>
      </div>

    </motion.div>
  );
};

export default UserDashboard;
