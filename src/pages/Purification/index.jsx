import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Droplets, CheckCircle2, AlertTriangle, Zap,
  Activity, Sun, Battery, Gauge, Wind,
  ThumbsUp, RefreshCw, Info, ArrowDown, ArrowUp
} from 'lucide-react';
import {
  MOCK_PURIFICATION,
  MOCK_PURIFICATION_HISTORY
} from '../../data/mockData';
import { useMotion } from '../../hooks/useMotion';

/* ── Custom Tooltips ────────────────────────────────────────────────────── */

const VolumeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-raised px-3 py-2.5">
      <p className="text-[10px] text-[#94A3B8] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-[16px] font-bold font-mono text-[#2563EB]">
          {d.value}
        </span>
        <span className="text-[11px] text-[#94A3B8]">L</span>
      </div>
      <p className="text-[10px] text-[#64748B] mt-0.5">
        {d.payload?.solar ? '☀ Solar powered' : '🌙 Night / low solar'}
      </p>
    </div>
  );
};

const TdsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-raised px-3 py-2.5">
      <p className="text-[10px] text-[#94A3B8] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-[16px] font-bold font-mono text-[#059669]">{val}</span>
        <span className="text-[11px] text-[#94A3B8]">ppm</span>
      </div>
      <p className="text-[10px] font-medium mt-0.5 text-[#059669]">
        {val <= 30 ? 'Excellent quality' : val <= 50 ? 'Good quality' : 'Acceptable'}
      </p>
    </div>
  );
};

/* ── Filter Life Bar ────────────────────────────────────────────────────── */

const FilterLifeBar = ({ life }) => {
  const color = life > 60 ? '#059669' : life > 30 ? '#D97706' : '#DC2626';
  return (
    <div className="flex items-center gap-2.5 flex-1">
      <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${life}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-mono font-semibold w-8 text-right"
            style={{ color }}>
        {life}%
      </span>
    </div>
  );
};

/* ── Main Page Component ────────────────────────────────────────────────── */

const PurificationPage = () => {
  const motion_config = useMotion();
  const { system, current, daily, filters } = MOCK_PURIFICATION;

  const systemStatusConfig = {
    operational: { label: 'Operational', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    degraded:    { label: 'Degraded',    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    offline:     { label: 'Offline',     color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  };
  const sysStatus = systemStatusConfig[system.status];

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Water Purification
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            5-stage RO + UV system · Solar powered · Real-time monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* System status badge */}
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       text-[12px] font-semibold border"
            style={{
              color:           sysStatus.color,
              backgroundColor: sysStatus.bg,
              borderColor:     sysStatus.border,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sysStatus.color }} />
            System {sysStatus.label}
          </span>
          <button className="flex items-center gap-1.5 text-[12px] font-medium
                             text-[#475569] bg-white border border-[#E2E8F0]
                             hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
        variants={motion_config.staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[
          {
            label:     'TDS Output',
            value:     `${current.tdsOutput}`,
            unit:      'ppm',
            icon:      Droplets,
            iconBg:    '#ECFDF5',
            iconColor: '#059669',
            sub:       'Excellent — WHO limit 500ppm',
            subColor:  '#059669',
          },
          {
            label:     'Daily Output',
            value:     `${daily.volumeProduced}`,
            unit:      'L',
            icon:      Activity,
            iconBg:    '#EFF6FF',
            iconColor: '#2563EB',
            sub:       `${Math.round((daily.volumeProduced / daily.volumeTarget) * 100)}% of ${daily.volumeTarget}L target`,
            subColor:  '#2563EB',
          },
          {
            label:     'TDS Removal',
            value:     `${current.removalRate}`,
            unit:      '%',
            icon:      Gauge,
            iconBg:    '#F0FDF4',
            iconColor: '#059669',
            sub:       'RO membrane efficiency',
            subColor:  '#64748B',
          },
          {
            label:     'Flow Rate',
            value:     `${current.flowRate}`,
            unit:      'L/min',
            icon:      Wind,
            iconBg:    '#EFF6FF',
            iconColor: '#2563EB',
            sub:       `Peak today: ${daily.peakFlowRate} L/min`,
            subColor:  '#64748B',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              variants={motion_config.staggerItem}
              className="bg-white border border-[#E2E8F0] rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
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
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] font-bold font-mono tabular-nums text-[#0F172A] leading-none">
                  {stat.value}
                </span>
                <span className="text-[12px] text-[#94A3B8] ml-0.5">{stat.unit}</span>
              </div>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: stat.subColor }}>
                {stat.sub}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Main Two-Column Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 mb-4">

        {/* LEFT — Charts column */}
        <div className="space-y-4">

          {/* ── Hourly Volume Chart ──────────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-[#2563EB]" />
                <h2 className="text-[13px] font-semibold text-[#0F172A]">
                  Hourly Water Production
                </h2>
                <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                  Last 24 hours
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sun size={12} className="text-[#D97706]" />
                <span className="text-[11px] text-[#64748B]">
                  Peaks during solar hours
                </span>
              </div>
            </div>
            <div className="px-4 pt-4 pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={MOCK_PURIFICATION_HISTORY}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                  barCategoryGap="30%"
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
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}L`}
                    width={32}
                  />
                  <Tooltip content={<VolumeTooltip />} />
                  <Bar
                    dataKey="volume"
                    fill="#2563EB"
                    fillOpacity={0.8}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── TDS Output Trend ─────────────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Gauge size={15} className="text-[#059669]" />
                <h2 className="text-[13px] font-semibold text-[#0F172A]">
                  Output TDS Trend
                </h2>
                <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                  Last 24 hours
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="text-[11px] text-[#059669] font-medium">
                  All readings within safe range
                </span>
              </div>
            </div>
            <div className="px-4 pt-4 pb-3">
              <ResponsiveContainer width="100%" height={150}>
                <LineChart
                  data={MOCK_PURIFICATION_HISTORY}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
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
                    interval={3}
                  />
                  <YAxis
                    domain={[0, 60]}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}`}
                    width={28}
                  />
                  <Tooltip content={<TdsTooltip />} />
                  {/* WHO drinking water limit */}
                  <ReferenceLine
                    y={500}
                    stroke="#DC2626"
                    strokeDasharray="4 3"
                    strokeOpacity={0.5}
                  />
                  {/* Our target */}
                  <ReferenceLine
                    y={30}
                    stroke="#059669"
                    strokeDasharray="4 3"
                    strokeOpacity={0.5}
                    label={{
                      value: 'Target 30ppm',
                      position: 'insideTopRight',
                      style: { fontSize: 9, fill: '#059669' }
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tdsOut"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-[#CBD5E1] text-right mt-1">
                WHO safe limit: 500 ppm · Our target: ≤ 30 ppm · Current: {current.tdsOutput} ppm
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT — Status column */}
        <div className="space-y-4">

          {/* ── Before / After Comparison ────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <Droplets size={14} className="text-[#2563EB]" />
              <h3 className="text-[13px] font-semibold text-[#0F172A]">
                Water Quality — Before vs After
              </h3>
            </div>
            <div className="p-5">

              {/* TDS comparison */}
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
                  Total Dissolved Solids (ppm)
                </p>
                <div className="flex items-center gap-3">
                  {/* Input */}
                  <div className="flex-1 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowDown size={10} className="text-[#DC2626]" />
                      <span className="text-[9px] font-semibold text-[#DC2626] uppercase">Input</span>
                    </div>
                    <p className="text-[22px] font-bold font-mono text-[#DC2626] leading-none">
                      {current.tdsInput}
                    </p>
                    <p className="text-[9px] text-[#DC2626] mt-0.5 opacity-70">Contaminated</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5]
                                    border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                      -{current.removalRate}%
                    </div>
                    <div className="text-[#CBD5E1] text-[16px]">→</div>
                  </div>

                  {/* Output */}
                  <div className="flex-1 p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowUp size={10} className="text-[#059669]" />
                      <span className="text-[9px] font-semibold text-[#059669] uppercase">Output</span>
                    </div>
                    <p className="text-[22px] font-bold font-mono text-[#059669] leading-none">
                      {current.tdsOutput}
                    </p>
                    <p className="text-[9px] text-[#059669] mt-0.5 opacity-70">Safe to drink</p>
                  </div>
                </div>
              </div>

              {/* Turbidity comparison */}
              <div className="pt-4 border-t border-[#F8FAFC]">
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
                  Turbidity (NTU)
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[9px] font-semibold text-[#D97706] uppercase">Input</span>
                    </div>
                    <p className="text-[22px] font-bold font-mono text-[#D97706] leading-none">
                      {current.turbidityInput}
                    </p>
                    <p className="text-[9px] text-[#D97706] mt-0.5 opacity-70">Cloudy / Sediment</p>
                  </div>

                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5]
                                    border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                      -{Math.round((1 - current.turbidityOutput / current.turbidityInput) * 100)}%
                    </div>
                    <div className="text-[#CBD5E1] text-[16px]">→</div>
                  </div>

                  <div className="flex-1 p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[9px] font-semibold text-[#059669] uppercase">Output</span>
                    </div>
                    <p className="text-[22px] font-bold font-mono text-[#059669] leading-none">
                      {current.turbidityOutput}
                    </p>
                    <p className="text-[9px] text-[#059669] mt-0.5 opacity-70">Crystal clear</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── System Components ────────────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <Info size={14} className="text-[#2563EB]" />
              <h3 className="text-[13px] font-semibold text-[#0F172A]">System Components</h3>
            </div>
            <div className="divide-y divide-[#F8FAFC]">
              {[
                {
                  label: 'RO Pump (12V DC)',
                  value: system.pumpActive ? 'Running' : 'Off',
                  color: system.pumpActive ? '#059669' : '#94A3B8',
                  icon:  Activity,
                  sub:   `${current.pressure} PSI operating pressure`,
                },
                {
                  label: 'UV-C Sterilizer',
                  value: system.uvActive ? `${current.uvIntensity}% intensity` : 'Off',
                  color: system.uvActive ? '#059669' : '#94A3B8',
                  icon:  Zap,
                  sub:   'Bacteria and virus elimination',
                },
                {
                  label: 'Solar Power',
                  value: system.solarPowered ? 'Active' : 'Grid / Battery',
                  color: system.solarPowered ? '#D97706' : '#94A3B8',
                  icon:  Sun,
                  sub:   'Running entirely off-grid',
                },
                {
                  label: 'Battery Backup',
                  value: `${system.batteryLevel}%`,
                  color: system.batteryLevel > 50 ? '#059669' : '#D97706',
                  icon:  Battery,
                  sub:   '18650 Li-ion pack · 4S BMS protected',
                },
              ].map((comp, idx) => {
                const Icon = comp.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-md bg-[#F8FAFC] border border-[#F1F5F9]
                                    flex items-center justify-center flex-shrink-0">
                      <Icon size={13} style={{ color: comp.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#94A3B8]">{comp.label}</p>
                      <p className="text-[12px] font-semibold text-[#0F172A] leading-tight">
                        {comp.value}
                      </p>
                      <p className="text-[10px] text-[#CBD5E1] mt-0.5">{comp.sub}</p>
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: comp.color }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-[#F8FAFC]">
              <p className="text-[10px] text-[#94A3B8]">
                System uptime: {system.uptime} ·
                Last serviced: {system.lastServiced}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Filter Stage Health ──────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <ThumbsUp size={15} className="text-[#059669]" />
            <h2 className="text-[13px] font-semibold text-[#0F172A]">
              Filter Stage Health
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-[#059669]" />
            <span className="text-[11px] font-medium text-[#059669]">
              All stages operational
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#F8FAFC]">
          {filters.map((f, idx) => {
            const lifeColor = f.life > 60 ? '#059669' : f.life > 30 ? '#D97706' : '#DC2626';
            const statusConfig = {
              good:    { label: 'Good',    color: '#059669', bg: '#ECFDF5' },
              replace: { label: 'Replace', color: '#DC2626', bg: '#FEF2F2' },
              watch:   { label: 'Watch',   color: '#D97706', bg: '#FFFBEB' },
            };
            const sc = statusConfig[f.status] || statusConfig.good;
            return (
              <div key={idx} className="px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wide">
                    Stage {f.stage}
                  </span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ color: sc.color, backgroundColor: sc.bg }}
                  >
                    {sc.label}
                  </span>
                </div>
                <p className="text-[12px] font-semibold text-[#0F172A] leading-tight">
                  {f.name}
                </p>
                <FilterLifeBar life={f.life} />
                <p className="text-[9px] text-[#CBD5E1]">
                  Replaced {f.replaced}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
};

export default PurificationPage;
