import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import {
  Activity, ArrowLeft, Battery, BatteryCharging,
  Bell, CheckCircle2, ChevronRight, Clock,
  CloudRain, Droplets, HardDrive, MapPin,
  MessageSquare, Radio, Sun, Thermometer,
  AlertTriangle, AlertCircle, XCircle, Wifi,
  Wind, CheckCheck, RefreshCw, Info
} from 'lucide-react';
import { MOCK_HISTORIES } from '../../data/mockData';
import useDataStore from '../../store/useDataStore';
import { ALERT_LEVELS, CONNECTIVITY_TIERS } from '../../constants/alertLevels';
import { formatTimeAgo, formatWaterLevel } from '../../utils/formatters';
import { WATER_THRESHOLDS, getBatteryColor, getLevelColor } from '../../utils/nodeUtils';
import StatusBadge from '../../components/ui/StatusBadge';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const color = getLevelColor(value);
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-raised px-3 py-2.5 text-left">
      <p className="text-[10px] text-[#94A3B8] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-[16px] font-bold font-mono tabular-nums" style={{ color }}>
          {value}
        </span>
        <span className="text-[11px] text-[#94A3B8]">cm</span>
      </div>
      <p className="text-[10px] mt-0.5" style={{ color }}>
        {value <= 8  ? 'CRITICAL'
         : value <= 15 ? 'DANGER'
         : value <= 25 ? 'WARNING'
         : value <= 40 ? 'WATCH'
         : 'SAFE'}
      </p>
    </div>
  );
};

const CONN_ICON_MAP = { Wifi, Radio, MessageSquare, HardDrive };

const NodeDetail = () => {
  const { nodeId } = useParams();
  const navigate   = useNavigate();
  const nodes  = useDataStore(s => s.nodes);
  const alerts = useDataStore(s => s.alerts);

  const node = nodes.find(n => n.id === nodeId);
  const motion_config = useMotion();

  // ── 404 state ──────────────────────────────────────────
  if (!node) {
    return (
      <motion.div
        {...motion_config.fadeIn}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] flex items-center justify-center">
          <AlertCircle size={22} className="text-[#DC2626]" />
        </div>
        <h2 className="text-[18px] font-semibold text-[#0F172A]">Node not found</h2>
        <p className="text-[13px] text-[#64748B]">
          No sensor node with ID <code className="font-mono">{nodeId}</code>
        </p>
        <button
          onClick={() => navigate('/sensors')}
          className="mt-2 flex items-center gap-2 text-[13px] font-medium text-[#2563EB]
                     hover:text-[#1D4ED8] transition-colors"
        >
          <ArrowLeft size={14} /> Back to all nodes
        </button>
      </motion.div>
    );
  }

  const level      = ALERT_LEVELS[node.alertLevel];
  const conn       = CONNECTIVITY_TIERS[node.connectivity];
  const ConnIcon   = CONN_ICON_MAP[conn?.icon] || Wifi;
  const batColor   = getBatteryColor(node.battery);
  const history    = MOCK_HISTORIES[node.id] || [];
  const nodeAlerts = MOCK_ALERTS.filter(a => a.nodeId === node.id);

  // Sample every 4 hours for chart readability (12 points over 48h)
  const chartData = history.filter((_, idx) => idx % 4 === 0 || idx === history.length - 1);

  // Format chart labels: show time for today, "Yesterday" prefix otherwise
  const formattedChart = chartData.map(d => ({
    ...d,
    label: d.dateLabel === new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      ? d.timeLabel
      : `${d.dateLabel} ${d.timeLabel}`,
  }));

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Breadcrumb ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8] mb-4">
        <button
          onClick={() => navigate('/sensors')}
          className="hover:text-[#2563EB] transition-colors font-medium"
        >
          Sensor Nodes
        </button>
        <ChevronRight size={12} />
        <span className="text-[#475569] font-medium">{node.name}</span>
        <span className="text-[#CBD5E1]">·</span>
        <span className="font-mono text-[11px]">{node.id}</span>
      </div>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/sensors')}
            className="mt-0.5 p-1.5 rounded-md text-[#94A3B8] hover:bg-[#F1F5F9]
                       hover:text-[#475569] transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
                {node.name}
              </h1>
              <StatusBadge level={node.alertLevel} size="lg" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#64748B]">
              <MapPin size={11} />
              <span>{node.location}</span>
              <span className="text-[#CBD5E1]">·</span>
              <Clock size={11} />
              <span>Last seen {formatTimeAgo(node.lastSeen)}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>Uptime {node.uptime}</span>
            </div>
          </div>
        </div>
        <button
          className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium
                     text-[#475569] bg-white border border-[#E2E8F0]
                     hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Quick Stat Strip ────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        variants={motion_config.staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[
          {
            label:    'Water Level',
            value:    `${node.waterLevel}`,
            unit:     'cm',
            icon:     Droplets,
            iconBg:   level.bg,
            iconColor: level.color,
            sub:      level.label + ' zone',
            subColor: level.color,
          },
          {
            label:    'Temperature',
            value:    `${node.temperature}`,
            unit:     '°C',
            icon:     Thermometer,
            iconBg:   '#FFF7ED',
            iconColor:'#EA580C',
            sub:      node.humidity + '% humidity',
            subColor: '#64748B',
          },
          {
            label:    'Battery',
            value:    `${node.battery}`,
            unit:     '%',
            icon:     node.solar ? BatteryCharging : Battery,
            iconBg:   '#ECFDF5',
            iconColor: batColor,
            sub:      node.solar ? 'Solar charging' : 'On battery',
            subColor: node.solar ? '#059669' : '#D97706',
          },
          {
            label:    'Pressure',
            value:    `${node.pressure}`,
            unit:     'hPa',
            icon:     Wind,
            iconBg:   '#F5F3FF',
            iconColor:'#7C3AED',
            sub:      node.rain ? 'Active rainfall' : 'No rainfall',
            subColor: node.rain ? '#2563EB' : '#64748B',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={idx} variants={motion_config.staggerItem}
              className="bg-white border border-[#E2E8F0] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                  {stat.label}
                </span>
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stat.iconBg }}
                >
                  <Icon size={13} style={{ color: stat.iconColor }} />
                </div>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span
                  className="text-[24px] font-bold font-mono tabular-nums leading-none"
                  style={{ color: stat.iconColor }}
                >
                  {stat.value}
                </span>
                <span className="text-[12px] text-[#94A3B8] ml-1">{stat.unit}</span>
              </div>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: stat.subColor }}>
                {stat.sub}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Main Two-Column Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* ── Water Level History Chart ───────────────── */}
          <motion.div
            {...motion_config.fadeIn}
            transition={{ ...motion_config.fadeIn.transition, delay: 0.12 }}
            className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-[#2563EB]" />
                <h2 className="text-[13px] font-semibold text-[#0F172A]">
                  Water Level History
                </h2>
                <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9]
                                 px-2 py-0.5 rounded-full">
                  Last 48 hours
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color }} />
                <span className="text-[11px] text-[#64748B]">
                  Current: <strong className="font-mono">{node.waterLevel} cm</strong>
                </span>
              </div>
            </div>

            <div className="px-4 pt-4 pb-2">
              {/* Legend for reference lines */}
              <div className="flex items-center gap-4 flex-wrap mb-3">
                {WATER_THRESHOLDS.map(t => (
                  <div key={t.label} className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-px"
                      style={{ backgroundColor: t.color, borderTop: `2px dashed ${t.color}` }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: t.color }}>
                      {t.label} ({t.value}cm)
                    </span>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={formattedChart}
                  margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 120]}
                    tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter, ui-monospace' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}cm`}
                    width={42}
                  />
                  <Tooltip content={<ChartTooltip />} />

                  {/* Alert threshold reference lines */}
                  {WATER_THRESHOLDS.map(t => (
                    <ReferenceLine
                      key={t.label}
                      y={t.value}
                      stroke={t.color}
                      strokeDasharray="4 3"
                      strokeWidth={1}
                      strokeOpacity={0.7}
                    />
                  ))}

                  <Line
                    type="monotone"
                    dataKey="waterLevel"
                    stroke={level.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r:           4,
                      fill:        level.color,
                      stroke:      '#fff',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Chart note */}
              <p className="text-[10px] text-[#CBD5E1] text-right mt-1 pb-1">
                Higher value = greater sensor-to-water distance = safer
              </p>
            </div>
          </motion.div>

          {/* ── Environment Readings Panel ──────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <Thermometer size={15} className="text-[#EA580C]" />
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Environment Readings
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0
                            sm:divide-x divide-[#F8FAFC]">
              {[
                {
                  label:    'Temperature',
                  value:    `${node.temperature}°C`,
                  sub:      'Ambient air temp',
                  icon:     Thermometer,
                  color:    '#EA580C',
                  bg:       '#FFF7ED',
                },
                {
                  label:    'Humidity',
                  value:    `${node.humidity}%`,
                  sub:      'Relative humidity',
                  icon:     Droplets,
                  color:    '#2563EB',
                  bg:       '#EFF6FF',
                },
                {
                  label:    'Pressure',
                  value:    `${node.pressure} hPa`,
                  sub:      'Atmospheric',
                  icon:     Wind,
                  color:    '#7C3AED',
                  bg:       '#F5F3FF',
                },
              ].map((r, idx) => {
                const Icon = r.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 px-5 py-4">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: r.bg }}
                    >
                      <Icon size={14} style={{ color: r.color }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#94A3B8] font-medium">{r.label}</p>
                      <p className="text-[16px] font-bold font-mono text-[#0F172A] leading-tight mt-0.5">
                        {r.value}
                      </p>
                      <p className="text-[10px] text-[#CBD5E1] mt-0.5">{r.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rain row */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-t border-[#F8FAFC]">
              {node.rain ? (
                <CloudRain size={14} className="text-[#2563EB]" />
              ) : (
                <Sun size={14} className="text-[#D97706]" />
              )}
              <span className="text-[12px] font-medium text-[#0F172A]">
                {node.rain ? 'Active rainfall detected' : 'No rainfall — clear conditions'}
              </span>
              {node.rain && (
                <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF]
                                 border border-[#BFDBFE] px-2 py-0.5 rounded-full font-medium">
                  Rain sensor active
                </span>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* ── Node Information Card ───────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <Info size={14} className="text-[#2563EB]" />
              <h3 className="text-[13px] font-semibold text-[#0F172A]">Node Information</h3>
            </div>
            <div className="divide-y divide-[#F8FAFC]">
              {[
                { label: 'Node ID',    value: node.id,                  mono: true  },
                { label: 'Name',       value: node.name,                 mono: false },
                { label: 'Location',   value: node.location,             mono: false },
                { label: 'GPS',        value: `${node.lat}, ${node.lng}`,mono: true  },
                { label: 'Uptime',     value: node.uptime,               mono: true  },
                { label: 'Last Seen',  value: formatTimeAgo(node.lastSeen), mono: false },
              ].map(item => (
                <div key={item.label}
                     className="flex items-start justify-between px-5 py-2.5 gap-3">
                  <span className="text-[11px] text-[#94A3B8] flex-shrink-0 pt-px">
                    {item.label}
                  </span>
                  <span className={`text-[12px] text-[#0F172A] text-right
                    ${item.mono ? 'font-mono' : 'font-medium'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Connectivity Status Card ─────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <ConnIcon size={14} style={{ color: conn?.color }} />
              <h3 className="text-[13px] font-semibold text-[#0F172A]">Connectivity</h3>
            </div>
            <div className="p-5 space-y-3">

              {/* Active tier highlight */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{ borderColor: conn?.color + '40', backgroundColor: conn?.color + '0D' }}
              >
                <ConnIcon size={16} style={{ color: conn?.color }} />
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: conn?.color }}>
                    {conn?.label}
                  </p>
                  <p className="text-[10px] text-[#94A3B8]">Active tier</p>
                </div>
                <div
                  className="ml-auto w-2 h-2 rounded-full"
                  style={{ backgroundColor: conn?.color }}
                />
              </div>

              {/* All tiers */}
              <div className="space-y-1.5">
                {[
                  { key: 'FOUR_G',  tier: CONNECTIVITY_TIERS.FOUR_G,  order: 0 },
                  { key: 'TWO_G',   tier: CONNECTIVITY_TIERS.TWO_G,   order: 1 },
                  { key: 'LORA',    tier: CONNECTIVITY_TIERS.LORA,    order: 2 },
                  { key: 'SD_CARD', tier: CONNECTIVITY_TIERS.SD_CARD, order: 3 },
                ].map(({ key, tier }) => {
                  const TierIcon   = CONN_ICON_MAP[tier.icon] || Wifi;
                  const isActive   = node.connectivity === key;
                  const isAchieved = ['FOUR_G','TWO_G','LORA','SD_CARD'].indexOf(key) >=
                                     ['FOUR_G','TWO_G','LORA','SD_CARD'].indexOf(node.connectivity);
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2.5 py-1.5"
                      style={{ opacity: !isAchieved ? 0.35 : 1 }}
                    >
                      <TierIcon size={12} style={{ color: isActive ? tier.color : '#94A3B8' }} />
                      <span className={`text-[11px] flex-1
                        ${isActive ? 'font-semibold' : 'text-[#94A3B8]'}`}
                        style={{ color: isActive ? tier.color : undefined }}
                      >
                        {tier.label}
                      </span>
                      {isActive ? (
                        <span className="text-[9px] font-semibold uppercase tracking-wide"
                              style={{ color: tier.color }}>
                          Active
                        </span>
                      ) : isAchieved ? (
                        <CheckCheck size={10} className="text-[#CBD5E1]" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* SD Card info */}
              <div className="pt-2 border-t border-[#F8FAFC]">
                <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                  <HardDrive size={10} />
                  <span>SD Card logging active · 32GB SanDisk Ultra</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Node Alert History Card ──────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#EA580C]" />
                <h3 className="text-[13px] font-semibold text-[#0F172A]">Alert History</h3>
              </div>
              {nodeAlerts.length > 0 && (
                <span className="text-[10px] text-[#64748B] bg-[#F1F5F9]
                                 px-1.5 py-0.5 rounded-full">
                  {nodeAlerts.length} events
                </span>
              )}
            </div>

            {nodeAlerts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center px-5">
                <CheckCircle2 size={20} className="text-[#059669] mb-2" />
                <p className="text-[12px] font-medium text-[#475569]">No alerts for this node</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">All readings within safe thresholds</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F8FAFC]">
                {nodeAlerts.map(alert => {
                  const aLevel = ALERT_LEVELS[alert.level];
                  const AIcon  = {
                    SAFE: CheckCircle2, WATCH: AlertTriangle,
                    WARNING: AlertTriangle, DANGER: XCircle, CRITICAL: XCircle,
                  }[alert.level] || AlertCircle;

                  return (
                    <div key={alert.id}
                         className={`px-5 py-3 ${alert.acknowledged ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: aLevel.bg }}
                        >
                          <AIcon size={12} style={{ color: aLevel.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-[#0F172A] leading-tight">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                style={{ color: aLevel.color, backgroundColor: aLevel.bg }}
                              >
                                {aLevel.label}
                              </span>
                              {alert.channels.map(ch => (
                                <span key={ch}
                                  className="text-[9px] text-[#94A3B8] bg-[#F1F5F9]
                                             px-1.5 py-0.5 rounded uppercase font-medium">
                                  {ch}
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] text-[#94A3B8] flex-shrink-0 ml-2">
                              {formatTimeAgo(alert.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-5 py-3 border-t border-[#F8FAFC]">
              <button
                onClick={() => navigate('/alerts')}
                className="text-[11px] text-[#2563EB] font-medium hover:text-[#1D4ED8]
                           transition-colors flex items-center gap-1"
              >
                View full alert center <ChevronRight size={11} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default NodeDetail;
