import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  BarChart3, Download, RefreshCw, Search,
  Filter, Clock, CheckCircle2, AlertTriangle,
  Info, Calendar, Droplets, Activity
} from 'lucide-react';
import {
  MOCK_DAILY_SUMMARY,
  MOCK_ALERT_FREQUENCY,
  MOCK_PURIFICATION_DAILY,
} from '../../data/mockData';
import useDataStore from '../../store/useDataStore';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import { exportToCSV } from '../../utils/csvExport';
import { useMotion } from '../../hooks/useMotion';

/* ── Period Badge ────────────────────────────────────────────────────────── */
const PeriodBadge = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors
      ${active
        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
        : 'text-[#64748B] hover:bg-[#F8FAFC] border border-transparent'
      }`}
  >
    {label}
  </button>
);

/* ── Reports Page ────────────────────────────────────────────────────────── */
const ReportsPage = () => {
  const motion_config = useMotion();
  const nodes = useDataStore(s => s.nodes);
  const [search,      setSearch]   = useState('');
  const [levelFilter, setLevel]    = useState('ALL');
  const [period,      setPeriod]   = useState('7D');

  // Node line colors for the trend chart
  const NODE_COLORS = {
    'Main Gate':     '#059669',
    'Canteen Block': '#D97706',
    'Parking Area':  '#EA580C',
    'Sports Ground': '#2563EB',
    'Lab Terrace':   '#7C3AED',
  };

  const NODE_NAMES = Object.keys(NODE_COLORS);

  const storeAlerts = useDataStore(s => s.alerts);

  // Derive event log from store alerts
  const derivedEventLog = useMemo(() => storeAlerts.map(a => ({
    timestamp: new Date(a.timestamp).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }),
    node:    a.nodeId   || 'system',
    event:   a.message  || 'System event',
    level:   a.level    || 'INFO',
    value:   '—',
    channel: (a.channels || []).join(', ') || '—',
  })), [storeAlerts]);

  // Filtered event log
  const filteredLog = useMemo(() => {
    return derivedEventLog.filter(e => {
      const matchLevel  = levelFilter === 'ALL' || e.level === levelFilter;
      const matchSearch = !search ||
        e.event.toLowerCase().includes(search.toLowerCase()) ||
        e.node.toLowerCase().includes(search.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [derivedEventLog, search, levelFilter]);

  // Summary stats
  const totalAlerts = MOCK_ALERT_FREQUENCY.reduce(
    (s, d) => s + d.Watch + d.Warning, 0
  );
  const avgTdsOutput = Math.round(
    MOCK_PURIFICATION_DAILY.reduce((s, d) => s + d.tds, 0) /
    MOCK_PURIFICATION_DAILY.length
  );
  const totalPurified = MOCK_PURIFICATION_DAILY
    .reduce((s, d) => s + d.volume, 0)
    .toFixed(1);

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Reports
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            System analytics · 7-day summary · CSV export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-[#E2E8F0]
                          rounded-lg px-1.5 py-1">
            {['7D', '14D', '30D'].map(p => (
              <PeriodBadge
                key={p}
                label={p}
                active={period === p}
                onClick={() => setPeriod(p)}
              />
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-[12px] font-medium
                             text-[#475569] bg-white border border-[#E2E8F0]
                             hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary KPI Cards ───────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        variants={motion_config.staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[
          {
            label:     'Days Monitored',
            value:     '7',
            unit:      'days',
            icon:      Calendar,
            iconBg:    '#EFF6FF',
            iconColor: '#2563EB',
            sub:       '10 Sep – 16 Sep 2026',
            subColor:  '#64748B',
          },
          {
            label:     'Alerts Generated',
            value:     String(totalAlerts),
            unit:      '',
            icon:      AlertTriangle,
            iconBg:    '#FFF7ED',
            iconColor: '#EA580C',
            sub:       'Watch + Warning level',
            subColor:  '#64748B',
          },
          {
            label:     'Water Purified',
            value:     totalPurified,
            unit:      'L',
            icon:      Droplets,
            iconBg:    '#ECFDF5',
            iconColor: '#059669',
            sub:       `Avg TDS output: ${avgTdsOutput} ppm`,
            subColor:  '#059669',
          },
          {
            label:     'System Uptime',
            value:     '99.2',
            unit:      '%',
            icon:      Activity,
            iconBg:    '#ECFDF5',
            iconColor: '#059669',
            sub:       'All nodes operational',
            subColor:  '#059669',
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
                {stat.unit && (
                  <span className="text-[12px] text-[#94A3B8] ml-0.5">{stat.unit}</span>
                )}
              </div>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: stat.subColor }}>
                {stat.sub}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* ── Water Level Trend — All Nodes ────────────── */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#2563EB]" />
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Water Level Trend
              </h2>
              <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9]
                               px-2 py-0.5 rounded-full">
                All 5 nodes · 7 days
              </span>
            </div>
            <button
              onClick={() => exportToCSV(MOCK_DAILY_SUMMARY, 'water-level-trend-7d')}
              className="flex items-center gap-1 text-[11px] text-[#2563EB]
                         hover:text-[#1D4ED8] font-medium transition-colors"
            >
              <Download size={11} />
              CSV
            </button>
          </div>
          <div className="px-4 pt-4 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={MOCK_DAILY_SUMMARY}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}`}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border:          '1px solid #E2E8F0',
                    borderRadius:    '8px',
                    fontSize:        '11px',
                    fontFamily:      'Inter, system-ui',
                  }}
                  formatter={(value, name) => [`${value} cm`, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                />
                {NODE_NAMES.map(name => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={NODE_COLORS[name]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-[#CBD5E1] text-right mt-1">
              Higher = greater sensor-to-water distance = safer
            </p>
          </div>
        </div>

        {/* ── Alert Frequency ───────────────────────────── */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#EA580C]" />
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Alert Frequency
              </h2>
              <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9]
                               px-2 py-0.5 rounded-full">
                By level · 7 days
              </span>
            </div>
            <button
              onClick={() => exportToCSV(MOCK_ALERT_FREQUENCY, 'alert-frequency-7d')}
              className="flex items-center gap-1 text-[11px] text-[#2563EB]
                         hover:text-[#1D4ED8] font-medium transition-colors"
            >
              <Download size={11} />
              CSV
            </button>
          </div>
          <div className="px-4 pt-4 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={MOCK_ALERT_FREQUENCY}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="30%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border:          '1px solid #E2E8F0',
                    borderRadius:    '8px',
                    fontSize:        '11px',
                    fontFamily:      'Inter, system-ui',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                />
                <Bar dataKey="Safe"    fill="#059669" fillOpacity={0.7} radius={[2,2,0,0]} />
                <Bar dataKey="Watch"   fill="#D97706" fillOpacity={0.8} radius={[2,2,0,0]} />
                <Bar dataKey="Warning" fill="#EA580C" fillOpacity={0.9} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Purification Output Chart ─────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-[#059669]" />
            <h2 className="text-[13px] font-semibold text-[#0F172A]">
              Daily Purification Output
            </h2>
            <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9]
                             px-2 py-0.5 rounded-full">
              Volume + TDS trend · 7 days
            </span>
          </div>
          <button
            onClick={() => exportToCSV(MOCK_PURIFICATION_DAILY, 'purification-output-7d')}
            className="flex items-center gap-1 text-[11px] text-[#2563EB]
                       hover:text-[#1D4ED8] font-medium transition-colors"
          >
            <Download size={11} />
            CSV
          </button>
        </div>
        <div className="px-4 pt-4 pb-3">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={MOCK_PURIFICATION_DAILY}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              barCategoryGap="35%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}L`}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border:          '1px solid #E2E8F0',
                  borderRadius:    '8px',
                  fontSize:        '11px',
                  fontFamily:      'Inter, system-ui',
                }}
                formatter={(value, name) => [
                  name === 'volume' ? `${value} L` : `${value} ppm`,
                  name === 'volume' ? 'Volume' : 'TDS Output'
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                formatter={name => name === 'volume' ? 'Volume (L)' : 'TDS Output (ppm)'}
              />
              <Bar dataKey="volume" fill="#2563EB" fillOpacity={0.75} radius={[3,3,0,0]} />
              <Bar dataKey="tds"    fill="#059669" fillOpacity={0.65} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Event Log Table ──────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#2563EB]" />
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Event Log</h2>
            <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9]
                             px-1.5 py-0.5 rounded-full">
              {filteredLog.length} entries
            </span>
          </div>
          <button
            onClick={() => exportToCSV(derivedEventLog, 'idms-event-log')}
            className="flex items-center gap-1.5 text-[12px] font-semibold
                       text-white bg-[#0F172A] hover:bg-[#1E293B]
                       px-3 py-1.5 rounded-md transition-colors"
          >
            <Download size={12} />
            Export All CSV
          </button>
        </div>

        {/* Log toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#F8FAFC] flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full h-8 pl-8 pr-3 text-[12px] text-[#0F172A]
                         bg-white border border-[#E2E8F0] rounded-md
                         placeholder:text-[#94A3B8]
                         focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/10
                         transition-all"
            />
          </div>
          {/* Level filter */}
          <div className="flex items-center gap-1">
            {['ALL', 'WARNING', 'WATCH', 'INFO'].map(lvl => {
              const isActive = levelFilter === lvl;
              const colors = {
                WARNING: { text: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
                WATCH:   { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                INFO:    { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                ALL:     { text: '#475569', bg: '#F8FAFC', border: '#E2E8F0' },
              };
              const c = colors[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold
                             border transition-all"
                  style={{
                    color:           isActive ? c.text  : '#94A3B8',
                    backgroundColor: isActive ? c.bg    : 'transparent',
                    borderColor:     isActive ? c.border: 'transparent',
                  }}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Timestamp', 'Node', 'Event', 'Level', 'Value', 'Channel'].map(h => (
                  <th key={h}
                      className="text-left px-5 py-2.5 text-[10px] font-semibold
                                 text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {filteredLog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-[13px] font-medium text-[#475569]">
                      No events match your filters
                    </p>
                    <button
                      onClick={() => { setSearch(''); setLevel('ALL'); }}
                      className="mt-2 text-[11px] text-[#2563EB] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLog.map((event, idx) => {
                  const levelColors = {
                    WARNING: { color: '#EA580C', bg: '#FFF7ED' },
                    WATCH:   { color: '#D97706', bg: '#FFFBEB' },
                    INFO:    { color: '#2563EB', bg: '#EFF6FF' },
                  };
                  const lc = levelColors[event.level] || levelColors.INFO;
                  return (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-mono text-[#475569]">
                          {event.timestamp}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-mono font-medium text-[#0F172A]">
                          {event.node}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] text-[#0F172A]">{event.event}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{ color: lc.color, backgroundColor: lc.bg }}
                        >
                          {event.level}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-mono text-[#475569]">
                          {event.value}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-[#64748B]">{event.channel}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-[#F8FAFC]">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>
              Showing {filteredLog.length} of {derivedEventLog.length} events
            </span>
            <span>
              ResQMatrix v1.0 · SVCE Tirupati · Team Mind Mashers
            </span>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default ReportsPage;
