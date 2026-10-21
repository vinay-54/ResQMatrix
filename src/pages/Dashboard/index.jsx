import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion';
import {
  Activity, Bell, Droplets, Wifi, Radio, HardDrive,
  MessageSquare, TrendingUp, Battery, Sun, CheckCircle2,
  AlertTriangle, AlertCircle, XCircle, ChevronRight,
  RefreshCw, Plane, BarChart3, Clock
} from 'lucide-react';
import { MOCK_SYSTEM } from '../../data/mockData';
import useDataStore from '../../store/useDataStore';
import { ALERT_LEVELS, CONNECTIVITY_TIERS } from '../../constants/alertLevels';
import {
  formatTimeAgo,
  formatWaterLevel,
  formatBattery,
  formatNumber,
} from '../../utils/formatters';

const ICON_MAP = { Wifi, Radio, MessageSquare, HardDrive };

const ALERT_ICON_MAP = {
  SAFE:     CheckCircle2,
  WATCH:    AlertTriangle,
  WARNING:  AlertTriangle,
  DANGER:   XCircle,
  CRITICAL: XCircle,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const motion_config = useMotion();
  const nodes  = useDataStore(s => s.nodes);
  const alerts = useDataStore(s => s.alerts);
  const drones = useDataStore(s => s.drones);

  // Drone KPI derived values
  const drone       = drones[0];
  const droneActive = drones.filter(d => d.status === 'airborne').length;
  const droneBat    = drone?.telemetry?.batteryPct;
  const droneOnline = drone?.telemetry?.connectionStatus === 'connected';

  // Tick every 15 s so "last seen" values stay fresh
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;

  const connCounts = nodes.reduce((acc, n) => {
    acc[n.connectivity] = (acc[n.connectivity] || 0) + 1;
    return acc;
  }, {});

  const avgBattery = Math.round(
    nodes.reduce((s, n) => s + n.battery, 0) / nodes.length,
  );

  return (
    <motion.div
      {...motion_config.fadeSlideUp}
    >
      {/* ──────────────── SECTION 1 — Page Header ──────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Command Dashboard
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            SVCE Campus · {nodes.length} active nodes ·{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day:     'numeric',
              month:   'long',
              year:    'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation mode badge */}
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium
                       text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A]
                       px-2.5 py-1 rounded-full"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Demo Mode
          </span>

          {/* Refresh button */}
          <button
            className="flex items-center gap-1.5 text-[12px] font-medium
                       text-[#475569] bg-white border border-[#E2E8F0]
                       hover:bg-[#F8FAFC] hover:text-[#0F172A]
                       px-3 py-1.5 rounded-md transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ──────────────── SECTION 2 — KPI Cards ──────────────── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={motion_config.staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Card 1 — Active Nodes */}
        <motion.div variants={motion_config.staggerItem}>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide">
                Active Nodes
              </p>
              <p className="text-[28px] font-bold text-[#0F172A] leading-none mt-2 font-mono tabular-nums">
                {nodes.length}
                <span className="text-[14px] font-medium text-[#94A3B8] ml-1">
                  /{nodes.length}
                </span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <Activity size={17} className="text-[#2563EB]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-[#059669]" />
            <span className="text-[11px] text-[#059669] font-medium">
              All nodes operational
            </span>
          </div>
        </div>
        </motion.div>

        {/* Card 2 — Active Alerts */}
        <motion.div variants={motion_config.staggerItem}>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide">
                Active Alerts
              </p>
              <p className="text-[28px] font-bold text-[#0F172A] leading-none mt-2 font-mono tabular-nums">
                {activeAlerts}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#FFF7ED] flex items-center justify-center flex-shrink-0">
              <Bell size={17} className="text-[#EA580C]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-[#EA580C]" />
            <span className="text-[11px] text-[#EA580C] font-medium">
              1 warning · 1 watch active
            </span>
          </div>
        </div>
        </motion.div>

        {/* Card 3 — Connectivity Status */}
        <motion.div variants={motion_config.staggerItem}>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide">
                Connectivity
              </p>
              <p className="text-[28px] font-bold text-[#0F172A] leading-none mt-2 font-mono tabular-nums">
                {connCounts.FOUR_G || 0}
                <span className="text-[14px] font-medium text-[#94A3B8] ml-1">
                  / 4G
                </span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <Wifi size={17} className="text-[#059669]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <AlertCircle size={12} className="text-[#D97706]" />
            <span className="text-[11px] text-[#D97706] font-medium">
              {connCounts.TWO_G || 0} node on 2G fallback
            </span>
          </div>
        </div>
        </motion.div>

        {/* Card 4 — Water Purification */}
        <motion.div variants={motion_config.staggerItem}>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide">
                RO Output Today
              </p>
              <p className="text-[28px] font-bold text-[#0F172A] leading-none mt-2 font-mono tabular-nums">
                {MOCK_SYSTEM.roOutputToday}
                <span className="text-[14px] font-medium text-[#94A3B8] ml-1">
                  L
                </span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <Droplets size={17} className="text-[#2563EB]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-[#059669]" />
            <span className="text-[11px] text-[#059669] font-medium">
              TDS output: {MOCK_SYSTEM.tdsOutput} ppm · UV active
            </span>
          </div>
        </div>
        </motion.div>
      </motion.div>

      {/* ──────────────── SECTION 3 — Two-Column Grid ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 mb-4">
        {/* LEFT — Sensor Node Status Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-[#2563EB]" />
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Sensor Node Status
              </h2>
              <span
                className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9]
                           px-1.5 py-0.5 rounded-full"
              >
                {nodes.length} nodes
              </span>
            </div>
            <button
              onClick={() => navigate('/sensors')}
              className="flex items-center gap-1 text-[12px] text-[#2563EB]
                         hover:text-[#1D4ED8] font-medium transition-colors"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Node
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Water Level
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Link
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Battery
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Last Seen
                  </th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {nodes.map((node) => {
                  const level    = ALERT_LEVELS[node.alertLevel];
                  const connTier = CONNECTIVITY_TIERS[node.connectivity];
                  const ConnIcon = ICON_MAP[connTier?.icon] || Wifi;

                  return (
                    <tr
                      key={node.id}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                      onClick={() => navigate(`/sensors/${node.id}`)}
                    >
                      {/* Node name */}
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-medium text-[#0F172A]">
                          {node.name}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          {node.id}
                        </p>
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5
                                     text-[11px] font-semibold rounded-full"
                          style={{
                            color:           level.color,
                            backgroundColor: level.bg,
                          }}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              node.alertLevel === 'CRITICAL'
                                ? 'animate-pulse'
                                : ''
                            }`}
                            style={{ backgroundColor: level.color }}
                          />
                          {level.label}
                        </span>
                      </td>

                      {/* Water level — visual bar */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[13px] font-mono font-medium text-[#0F172A] tabular-nums w-14">
                            {formatWaterLevel(node.waterLevel)}
                          </span>
                          {/* Mini progress bar — longer = safer */}
                          <div className="w-20 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (node.waterLevel / 100) * 100,
                                )}%`,
                                backgroundColor: level.color,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Connectivity tier */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <ConnIcon
                            size={13}
                            style={{ color: connTier.color }}
                          />
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: connTier.color }}
                          >
                            {connTier.label}
                          </span>
                        </div>
                      </td>

                      {/* Battery */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Battery
                            size={13}
                            className={
                              node.battery > 30
                                ? 'text-[#94A3B8]'
                                : 'text-[#DC2626]'
                            }
                          />
                          <span className="text-[12px] font-mono text-[#475569] tabular-nums">
                            {formatBattery(node.battery)}
                          </span>
                        </div>
                      </td>

                      {/* Last seen */}
                      <td className="px-3 py-3.5">
                        <span className="text-[12px] text-[#94A3B8]">
                          {formatTimeAgo(node.lastSeen)}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td className="px-3 py-3.5">
                        <ChevronRight size={14} className="text-[#CBD5E1]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT — Alert Summary Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-[#EA580C]" />
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Recent Alerts
              </h2>
              <span
                className="text-[10px] font-semibold text-white bg-[#DC2626]
                           px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
              >
                {activeAlerts}
              </span>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="flex items-center gap-1 text-[12px] text-[#2563EB]
                         hover:text-[#1D4ED8] font-medium transition-colors"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          {/* Alert list */}
          <motion.div
            className="divide-y divide-[#F8FAFC]"
            variants={motion_config.staggerContainer}
            initial="initial"
            animate="animate"
          >
            {alerts.slice(0, 4).map((alert) => {
              const level = ALERT_LEVELS[alert.level];
              const AlertIcon = ALERT_ICON_MAP[alert.level] || AlertCircle;

              return (
                <motion.div
                  key={alert.id}
                  variants={motion_config.staggerItem}
                >
                <div
                  className={`px-5 py-3.5 transition-colors ${
                    alert.acknowledged
                      ? 'opacity-60'
                      : 'hover:bg-[#F8FAFC] cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: level.bg }}
                    >
                      <AlertIcon
                        size={14}
                        style={{ color: level.color }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold text-[#0F172A] truncate">
                          {alert.nodeName}
                        </p>
                        <span className="text-[10px] text-[#94A3B8] flex-shrink-0 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {/* Alert level badge */}
                        <span
                          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{
                            color:           level.color,
                            backgroundColor: level.bg,
                          }}
                        >
                          {level.label}
                        </span>
                        {/* Channels */}
                        {alert.channels.map((ch) => (
                          <span
                            key={ch}
                            className="text-[9px] font-medium text-[#94A3B8] bg-[#F1F5F9]
                                       px-1.5 py-0.5 rounded uppercase tracking-wide"
                          >
                            {ch}
                          </span>
                        ))}
                        {/* Acknowledged */}
                        {alert.acknowledged && (
                          <span className="text-[9px] text-[#94A3B8]">
                            · Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ──────────────── SECTION 4 — Bottom Three-Column Grid ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD A — Connectivity Chain Status */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={15} className="text-[#2563EB]" />
            <h2 className="text-[13px] font-semibold text-[#0F172A]">
              Connectivity Chain
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              {
                tier:   '4G LTE',
                icon:   Wifi,
                color:  '#059669',
                bg:     '#ECFDF5',
                border: '#A7F3D0',
                label:  'Primary',
                nodes:  connCounts.FOUR_G || 0,
                active: true,
              },
              {
                tier:   '2G SMS',
                icon:   MessageSquare,
                color:  '#D97706',
                bg:     '#FFFBEB',
                border: '#FDE68A',
                label:  'Fallback 1',
                nodes:  connCounts.TWO_G || 0,
                active: true,
              },
              {
                tier:   'LoRa 868MHz',
                icon:   Radio,
                color:  '#94A3B8',
                bg:     '#F8FAFC',
                border: '#E2E8F0',
                label:  'Fallback 2',
                nodes:  0,
                active: false,
              },
              {
                tier:   'SD Card Log',
                icon:   HardDrive,
                color:  '#94A3B8',
                bg:     '#F8FAFC',
                border: '#E2E8F0',
                label:  'Fallback 3',
                nodes:  0,
                active: false,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-md border transition-all"
                  style={{
                    borderColor:     item.active ? item.border : '#F1F5F9',
                    backgroundColor: item.active ? item.bg     : '#FAFAFA',
                    opacity:         item.active ? 1           : 0.55,
                  }}
                >
                  <Icon
                    size={14}
                    style={{ color: item.color }}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[12px] font-semibold"
                        style={{
                          color: item.active ? item.color : '#94A3B8',
                        }}
                      >
                        {item.tier}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {item.label}
                      </span>
                    </div>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{
                        color: item.active ? item.color : '#CBD5E1',
                      }}
                    >
                      {item.active
                        ? `${item.nodes} node${item.nodes !== 1 ? 's' : ''} active`
                        : 'Standby'}
                    </p>
                  </div>
                  {item.active && (
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-[#94A3B8] mt-3 text-center">
            Zero data loss across all failure modes
          </p>
        </div>

        {/* CARD B — System Health Metrics */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} className="text-[#2563EB]" />
            <h2 className="text-[13px] font-semibold text-[#0F172A]">
              System Health
            </h2>
          </div>

          <div className="space-y-4">
            {/* Average battery */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <Battery size={11} /> Avg. Battery
                </span>
                <span className="text-[12px] font-mono font-semibold text-[#0F172A]">
                  {avgBattery}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#059669]"
                  style={{ width: `${avgBattery}%` }}
                />
              </div>
            </div>

            {/* Solar status */}
            <div className="flex items-center justify-between py-2.5 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <Sun size={11} /> Solar Charging
              </span>
              <span className="text-[11px] font-medium text-[#059669] flex items-center gap-1">
                <CheckCircle2 size={11} /> {nodes.length} / {nodes.length} online
              </span>
            </div>

            {/* Data points */}
            <div className="flex items-center justify-between py-2.5 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <Activity size={11} /> Data Points
              </span>
              <span className="text-[12px] font-mono font-semibold text-[#0F172A]">
                {formatNumber(MOCK_SYSTEM.totalDataPoints)}
              </span>
            </div>

            {/* SMS alerts today */}
            <div className="flex items-center justify-between py-2.5 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <MessageSquare size={11} /> SMS Sent Today
              </span>
              <span className="text-[12px] font-mono font-semibold text-[#0F172A]">
                {MOCK_SYSTEM.smsAlertsSent}
              </span>
            </div>

            {/* FCM alerts today */}
            <div className="flex items-center justify-between py-2.5 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <Bell size={11} /> FCM Today
              </span>
              <span className="text-[12px] font-mono font-semibold text-[#0F172A]">
                {MOCK_SYSTEM.fcmSentToday}
              </span>
            </div>

            {/* System uptime */}
            <div className="flex items-center justify-between py-2.5 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <Clock size={11} /> Uptime
              </span>
              <span className="text-[12px] font-mono font-semibold text-[#059669]">
                {MOCK_SYSTEM.uptime}
              </span>
            </div>
          </div>
        </div>

        {/* CARD C — Quick Actions + Drone Status */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-4">
          {/* Drone status */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Plane size={15} className="text-[#2563EB]" />
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Drone Status
              </h2>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-[#0F172A]">
                  {drone?.model || 'No Drone'}
                </span>
                {(() => {
                  const status = droneActive > 0 ? 'airborne'
                    : drone?.status || 'offline';
                  const statusCfg = {
                    airborne: { label: `${droneActive} Airborne`, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                    standby:  { label: 'Standby',                 color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                    preflight:{ label: 'Preflight',               color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                    charging: { label: 'Charging',                color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
                    offline:  { label: 'Offline',                 color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                  };
                  const sc = statusCfg[status] || statusCfg.offline;
                  return (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5
                                 rounded-full uppercase border"
                      style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}
                    >
                      {sc.label}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                <Battery size={11} />
                <span>Battery: {droneBat != null ? `${droneBat}%` : 'No telemetry'}</span>
                <span className="text-[#E2E8F0]">·</span>
                <span className="flex items-center gap-1">
                  {droneOnline
                    ? <><CheckCircle2 size={10} className="text-[#059669]" /> Connected</>
                    : <><XCircle size={10} className="text-[#DC2626]" /> Offline</>
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2.5">
              Quick Actions
            </p>
            <div className="space-y-1.5">
              {[
                {
                  label: 'View Live Map',
                  path:  '/map',
                  icon:  Activity,
                },
                {
                  label: 'Manage Alert Rules',
                  path:  '/settings/alerts',
                  icon:  Bell,
                },
                {
                  label: 'Water Quality Report',
                  path:  '/purification',
                  icon:  Droplets,
                },
                {
                  label: 'Flood Prediction',
                  path:  '/prediction',
                  icon:  TrendingUp,
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md
                               text-[12px] text-[#475569] font-medium
                               hover:bg-[#EFF6FF] hover:text-[#2563EB]
                               border border-transparent hover:border-[#BFDBFE]
                               transition-all text-left group"
                  >
                    <Icon
                      size={13}
                      className="text-[#94A3B8] group-hover:text-[#2563EB] flex-shrink-0"
                    />
                    {action.label}
                    <ChevronRight
                      size={11}
                      className="ml-auto text-[#CBD5E1] group-hover:text-[#2563EB]"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
