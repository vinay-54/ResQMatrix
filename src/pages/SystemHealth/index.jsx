import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle,
  Wifi, WifiOff, Database, Server, Radio, Plane,
  RefreshCw, Clock, Droplets, Bell
} from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { useMotion } from '../../hooks/useMotion';
import { formatTimeAgo } from '../../utils/formatters';

// Status levels
const STATUS = {
  online:  { label: 'Online',  color: '#059669', bg: '#ECFDF5', icon: CheckCircle2  },
  offline: { label: 'Offline', color: '#DC2626', bg: '#FEF2F2', icon: XCircle       },
  warning: { label: 'Warning', color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
  unknown: { label: 'Unknown', color: '#94A3B8', bg: '#F8FAFC', icon: AlertTriangle },
};

const HealthStatusBadge = ({ status }) => {
  const cfg  = STATUS[status] || STATUS.unknown;
  const Icon = cfg.icon;
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold
                     px-2.5 py-1 rounded-full"
          style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const HealthRow = ({ icon: Icon, label, status, detail, iconColor }) => (
  <div className="flex items-center gap-3 px-5 py-3.5 border-b
                  border-[#F8FAFC] last:border-0">
    <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] flex items-center
                    justify-center flex-shrink-0">
      <Icon size={17} style={{ color: iconColor || '#475569' }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-[#0F172A]">{label}</p>
      {detail && (
        <p className="text-[10px] text-[#94A3B8] mt-0.5 truncate">{detail}</p>
      )}
    </div>
    <HealthStatusBadge status={status} />
  </div>
);

const SystemHealth = () => {
  const motion_config = useMotion();
  const nodes   = useDataStore(s => s.nodes);
  const drones  = useDataStore(s => s.drones);
  const alerts  = useDataStore(s => s.alerts);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Derive statuses from store data (prototype)
  const nodesOnline  = nodes.filter(n => n.alertLevel !== 'OFFLINE').length;
  const nodesOffline = nodes.length - nodesOnline;

  const drone        = drones[0];
  const droneStatus  = drone?.telemetry?.connectionStatus === 'connected'
    ? 'online'
    : drone?.status === 'offline' ? 'offline' : 'warning';
  const droneBat     = drone?.telemetry?.batteryPct;
  const droneLastSeen = drone?.telemetry?.lastSeen;

  const unackAlerts  = alerts.filter(a => !a.acknowledged).length;

  const SECTIONS = [
    {
      title: 'Field Hardware',
      items: [
        {
          icon:       Activity,
          iconColor:  '#2563EB',
          label:      'Sensor Network (DSN)',
          status:     nodesOffline === 0 ? 'online' : nodesOffline < nodes.length ? 'warning' : 'offline',
          detail:     `${nodesOnline}/${nodes.length} nodes online`,
        },
        {
          icon:       Plane,
          iconColor:  '#059669',
          label:      'DR-1 Drone — RoboMonk 450mm',
          status:     droneStatus,
          detail:     droneLastSeen
            ? `Last telemetry ${formatTimeAgo(droneLastSeen)} · Battery: ${droneBat ?? '—'}%`
            : 'No telemetry received yet',
        },
        {
          icon:       Droplets,
          iconColor:  '#0891B2',
          label:      'FWPU-X Purification Unit',
          status:     'online',
          detail:     'Operating · TDS: 22 ppm · Flow: 2.8 L/min',
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          icon:       Radio,
          iconColor:  '#7C3AED',
          label:      'MQTT Broker (HiveMQ Cloud)',
          status:     'online',   // Will be real in B6
          detail:     'idms/sensors/+/data · idms/drones/+/telemetry',
        },
        {
          icon:       Wifi,
          iconColor:  '#059669',
          label:      '4G Network — Sensor Nodes',
          status:     nodesOnline > 0 ? 'online' : 'offline',
          detail:     `Primary channel for ${nodesOnline} node(s)`,
        },
        {
          icon:       Bell,
          iconColor:  '#D97706',
          label:      'Notification Service (FCM)',
          status:     'online',   // Will be real in B9
          detail:     `${unackAlerts} unacknowledged alert(s) pending`,
        },
      ],
    },
    {
      title: 'Backend Services',
      items: [
        {
          icon:       Server,
          iconColor:  '#0F172A',
          label:      'IDMS Backend API (Node.js)',
          status:     'online',   // Will be real in B8
          detail:     'http://localhost:5000 · v1.0.0',
        },
        {
          icon:       Database,
          iconColor:  '#059669',
          label:      'MongoDB Atlas',
          status:     'online',
          detail:     'Primary data store · Connected',
        },
        {
          icon:       Database,
          iconColor:  '#EA580C',
          label:      'Firebase Realtime DB',
          status:     'online',
          detail:     'Live sensor values · Real-time listeners active',
        },
      ],
    },
  ];

  // Overall system health
  const allItems     = SECTIONS.flatMap(s => s.items);
  const offlineCount = allItems.filter(i => i.status === 'offline').length;
  const warningCount = allItems.filter(i => i.status === 'warning').length;
  const overallStatus = offlineCount > 0 ? 'offline'
    : warningCount > 0 ? 'warning' : 'online';

  const OVERALL = {
    online:  { label: 'All Systems Operational', color: '#059669', bg: '#ECFDF5' },
    warning: { label: 'Degraded Performance',    color: '#D97706', bg: '#FFFBEB' },
    offline: { label: 'System Issues Detected',  color: '#DC2626', bg: '#FEF2F2' },
  };
  const overall = OVERALL[overallStatus];

  return (
    <motion.div {...motion_config.fadeSlideUp}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            System Health
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Real-time status of all IDMS components
          </p>
        </div>
        <button
          onClick={() => setLastRefresh(Date.now())}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border
                     border-[#E2E8F0] rounded-md text-[12px] font-medium
                     text-[#475569] hover:bg-[#F8FAFC] transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-lg border-2 mb-5"
           style={{ backgroundColor: overall.bg, borderColor: overall.color + '40' }}>
        <div className="w-3 h-3 rounded-full animate-pulse flex-shrink-0"
             style={{ backgroundColor: overall.color }} />
        <p className="text-[15px] font-bold" style={{ color: overall.color }}>
          {overall.label}
        </p>
        <div className="ml-auto flex items-center gap-1.5 text-[11px]"
             style={{ color: overall.color + '99' }}>
          <Clock size={11} />
          Last checked {formatTimeAgo(lastRefresh)}
        </div>
      </div>

      {/* Section cards */}
      <div className="space-y-4">
        {SECTIONS.map(section => (
          <div key={section.title}
               className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F1F5F9]">
              <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                {section.title}
              </h3>
            </div>
            {section.items.map(item => (
              <HealthRow key={item.label} {...item} />
            ))}
          </div>
        ))}
      </div>

      {/* Prototype note */}
      <div className="mt-4 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0]
                      rounded-lg">
        <p className="text-[11px] text-[#94A3B8]">
          <span className="font-semibold text-[#475569]">Prototype mode:</span>{' '}
          Statuses derived from Zustand store data.
          In production, this page polls <code className="font-mono">/api/health/detailed</code> every 30 seconds
          for live backend, MQTT, and database status.
        </p>
      </div>
    </motion.div>
  );
};

export default SystemHealth;
