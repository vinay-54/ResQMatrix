import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Activity,
  AlertTriangle, CheckCircle2, Info, Clock,
  ChevronDown, RefreshCw, BrainCircuit, Zap
} from 'lucide-react';
import { MOCK_PREDICTIONS, getPredictionSummary } from '../../data/mockData';
import useDataStore from '../../store/useDataStore';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import { useMotion } from '../../hooks/useMotion';
import StatusBadge from '../../components/ui/StatusBadge';

/* ── Custom Chart Tooltip ───────────────────────────────────────────────── */

const PredictionTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const actual    = payload.find(p => p.dataKey === 'actual');
  const predicted = payload.find(p => p.dataKey === 'predicted');
  const upper     = payload.find(p => p.dataKey === 'upper');
  const lower     = payload.find(p => p.dataKey === 'lower');
  const isPred    = !!predicted?.value;

  const value = actual?.value ?? predicted?.value;
  if (value == null) return null;

  const color = value <= 8  ? '#DC2626'
             :  value <= 15 ? '#EF4444'
             :  value <= 25 ? '#EA580C'
             :  value <= 40 ? '#D97706'
             :                '#059669';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-raised
                    px-3 py-2.5 text-left min-w-[140px]">
      <p className="text-[10px] text-[#94A3B8] mb-1.5 flex items-center gap-1">
        <Clock size={9} />
        {label}
        {isPred && (
          <span className="ml-1 text-[9px] font-medium text-[#7C3AED]
                           bg-[#F5F3FF] px-1 py-0 rounded">
            Predicted
          </span>
        )}
      </p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-[18px] font-bold font-mono tabular-nums"
              style={{ color }}>
          {value}
        </span>
        <span className="text-[11px] text-[#94A3B8]">cm</span>
      </div>
      {isPred && upper?.value && lower?.value && (
        <p className="text-[10px] text-[#94A3B8]">
          Range: {lower.value} – {upper.value} cm
        </p>
      )}
      <p className="text-[10px] font-medium mt-1" style={{ color }}>
        {value <= 8  ? 'CRITICAL' : value <= 15 ? 'DANGER'
         : value <= 25 ? 'WARNING' : value <= 40 ? 'WATCH' : 'SAFE'}
      </p>
    </div>
  );
};

/* ── Node Selector Dropdown ─────────────────────────────────────────────── */

const NodeSelector = ({ selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const nodes    = useDataStore(s => s.nodes);
  const selected = nodes.find(n => n.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0]
                   rounded-lg text-[13px] font-medium text-[#0F172A]
                   hover:bg-[#F8FAFC] transition-colors min-w-[180px]"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: ALERT_LEVELS[selected?.alertLevel]?.color || '#94A3B8' }}
        />
        <span className="flex-1 text-left truncate">{selected?.name || 'Select node'}</span>
        <ChevronDown
          size={14}
          className={`text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -4, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              className="absolute top-full left-0 mt-1 z-20 w-full min-w-[200px]
                         bg-white border border-[#E2E8F0] rounded-lg shadow-raised
                         overflow-hidden"
            >
              {nodes.map(node => {
                const level   = ALERT_LEVELS[node.alertLevel];
                const summary = getPredictionSummary(node.id);
                const isActive = node.id === selectedId;
                return (
                  <button
                    key={node.id}
                    onClick={() => { onSelect(node.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5
                                text-left transition-colors
                                ${isActive ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: level.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0F172A] truncate">
                        {node.name}
                      </p>
                      {summary && (
                        <p className="text-[10px] text-[#94A3B8]">
                          {node.waterLevel}cm now →{' '}
                          <span style={{ color: level.color }}>
                            {summary.predictedIn6h}cm in 6h
                          </span>
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main Page Component ────────────────────────────────────────────────── */

const PredictionPage = () => {
  const navigate             = useNavigate();
  const motion_config        = useMotion();
  const nodes                = useDataStore(s => s.nodes);
  const [selectedNode, setSelectedNode] = useState('node-03');
  const [replayMode,   setReplayMode]   = useState(false);

  const node    = nodes.find(n => n.id === selectedNode);
  const level   = ALERT_LEVELS[node?.alertLevel] || ALERT_LEVELS.SAFE;
  const data    = MOCK_PREDICTIONS[selectedNode] || [];
  const summary = getPredictionSummary(selectedNode);

  // Split for chart annotation
  const historicalCount = data.filter(d => d.type === 'historical').length;
  const nowLabel        = data[historicalCount - 1]?.label;

  // All node summaries for the bottom grid
  const allSummaries = useMemo(() =>
    nodes.map(n => ({
      node:    n,
      summary: getPredictionSummary(n.id),
    })),
  [nodes]);

  const TrendIcon = summary?.trend === 'declining' ? TrendingDown
                  : summary?.trend === 'stable'    ? Minus
                  : TrendingUp;

  const trendColor = summary?.trend === 'declining' ? '#DC2626'
                   : summary?.trend === 'stable'    ? '#64748B'
                   : '#059669';

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Flood Prediction
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            LSTM model · 6-hour forward forecast · Updated every 30 minutes
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Replay mode toggle */}
          <button
            onClick={() => setReplayMode(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px]
                        font-medium transition-colors border
                        ${replayMode
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                        }`}
          >
            <Zap size={13} />
            {replayMode ? 'Replay Active' : 'Speed Replay'}
          </button>
          <button className="flex items-center gap-1.5 text-[12px] font-medium
                             text-[#475569] bg-white border border-[#E2E8F0]
                             hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Replay Mode Banner ───────────────────────────── */}
      <AnimatePresence>
        {replayMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{    opacity: 0, height: 0     }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F3FF]
                            border border-[#DDD6FE] rounded-lg">
              <Zap size={14} className="text-[#7C3AED] flex-shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-[#7C3AED]">
                  Speed Replay Mode Active
                </p>
                <p className="text-[11px] text-[#6D28D9] mt-0.5">
                  Simulates a 6-hour flood scenario compressed to 2 minutes.
                  LSTM prediction updates in real time. Used for judge demonstrations.
                </p>
              </div>
              <button
                onClick={() => setReplayMode(false)}
                className="ml-auto text-[11px] font-medium text-[#7C3AED]
                           hover:text-[#6D28D9] transition-colors flex-shrink-0"
              >
                Stop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Node Selector + Prediction Summary Strip ─────── */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <NodeSelector selectedId={selectedNode} onSelect={setSelectedNode} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                          bg-[#F5F3FF] border border-[#DDD6FE]">
            <BrainCircuit size={12} className="text-[#7C3AED]" />
            <span className="text-[11px] font-medium text-[#7C3AED]">
              LSTM · CWC Training Data
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                          bg-[#F0FDF4] border border-[#BBF7D0]">
            <CheckCircle2 size={12} className="text-[#059669]" />
            <span className="text-[11px] font-medium text-[#059669]">
              Model confidence 87%
            </span>
          </div>
        </div>
      </div>

      {/* ── Key Metrics Strip ───────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode}
          {...motion_config.fadeSlideUp}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        >
          {[
            {
              label:     'Current Level',
              value:     `${node?.waterLevel}`,
              unit:      'cm',
              icon:      Activity,
              iconBg:    level.bg,
              iconColor: level.color,
              sub:       level.label + ' zone',
              subColor:  level.color,
            },
            {
              label:     'Predicted in 6h',
              value:     `${summary?.predictedIn6h ?? '—'}`,
              unit:      'cm',
              icon:      TrendIcon,
              iconBg:    summary?.willBreach ? '#FEF2F2' : '#F0FDF4',
              iconColor: trendColor,
              sub:       summary?.trend === 'declining'
                           ? 'Water level falling'
                           : 'Level stabilising',
              subColor:  trendColor,
            },
            {
              label:     'Confidence Band',
              value:     `±${summary?.confidenceAt6h?.toFixed(1) ?? '—'}`,
              unit:      'cm',
              icon:      Info,
              iconBg:    '#F5F3FF',
              iconColor: '#7C3AED',
              sub:       'At 6-hour horizon',
              subColor:  '#64748B',
            },
            {
              label:     'Breach Risk',
              value:     summary?.willBreach ? summary.breachLevel : 'None',
              unit:      '',
              icon:      summary?.willBreach ? AlertTriangle : CheckCircle2,
              iconBg:    summary?.willBreach ? '#FEF2F2' : '#F0FDF4',
              iconColor: summary?.willBreach
                           ? ALERT_LEVELS[summary.breachLevel]?.color
                           : '#059669',
              sub:       summary?.willBreach
                           ? 'Threshold may be crossed'
                           : 'No threshold at risk',
              subColor:  summary?.willBreach ? '#DC2626' : '#059669',
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white border border-[#E2E8F0] rounded-lg p-4">
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
                  <span className="text-[22px] font-bold font-mono tabular-nums text-[#0F172A] leading-none">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-[12px] text-[#94A3B8] ml-0.5">{stat.unit}</span>
                  )}
                </div>
                <p className="text-[10px] mt-1.5 font-medium" style={{ color: stat.subColor }}>
                  {stat.sub}
                </p>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* ── Main Chart Card ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode + '-chart'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4"
        >
          {/* Chart header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-[#7C3AED]" />
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Water Level Forecast — {node?.name}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              {/* Chart legend */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 rounded bg-[#2563EB]" />
                  <span className="text-[10px] text-[#64748B]">Historical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 rounded bg-[#7C3AED]" style={{ borderTop: '2px dashed #7C3AED' }} />
                  <span className="text-[10px] text-[#64748B]">Predicted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-3 rounded-sm bg-[#7C3AED]/10 border border-[#7C3AED]/20" />
                  <span className="text-[10px] text-[#64748B]">Confidence band</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pt-4 pb-3">
            {/* Threshold legend */}
            <div className="flex items-center gap-4 flex-wrap mb-3">
              {[
                { value: 40, label: 'Watch',   color: '#D97706' },
                { value: 25, label: 'Warning', color: '#EA580C' },
                { value: 15, label: 'Danger',  color: '#DC2626' },
                { value: 8,  label: 'Critical',color: '#991B1B' },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-px border-t-2 border-dashed" style={{ borderColor: t.color }} />
                  <span className="text-[10px] font-medium" style={{ color: t.color }}>
                    {t.label} {t.value}cm
                  </span>
                </div>
              ))}
            </div>

            {/* Recharts ComposedChart */}
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
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
                  interval={4}
                />
                <YAxis
                  domain={[0, 120]}
                  tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter, ui-monospace' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}`}
                  width={36}
                  label={{
                    value: 'cm',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: { fontSize: 10, fill: '#CBD5E1' }
                  }}
                />
                <Tooltip content={<PredictionTooltip />} />

                {/* Threshold reference lines */}
                {[
                  { y: 40, color: '#D97706' },
                  { y: 25, color: '#EA580C' },
                  { y: 15, color: '#DC2626' },
                  { y: 8,  color: '#991B1B' },
                ].map(t => (
                  <ReferenceLine
                    key={t.y}
                    y={t.y}
                    stroke={t.color}
                    strokeDasharray="5 4"
                    strokeWidth={1}
                    strokeOpacity={0.65}
                  />
                ))}

                {/* "Now" vertical reference line */}
                {nowLabel && (
                  <ReferenceLine
                    x={nowLabel}
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    label={{
                      value: 'Now',
                      position: 'insideTopRight',
                      style: { fontSize: 10, fill: '#94A3B8' }
                    }}
                  />
                )}

                {/* Confidence band — must come before predicted line */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="#7C3AED"
                  fillOpacity={0.08}
                  connectNulls={false}
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="#F8FAFC"
                  fillOpacity={1}
                  connectNulls={false}
                  legendType="none"
                />

                {/* Historical actual line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                  connectNulls={false}
                />

                {/* Predicted line */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <p className="text-[10px] text-[#CBD5E1] text-right mt-1">
              Higher value = greater sensor-to-water distance = safer ·
              Confidence band widens with prediction horizon
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── All Nodes Prediction Summary Grid ───────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
          <BrainCircuit size={15} className="text-[#7C3AED]" />
          <h2 className="text-[13px] font-semibold text-[#0F172A]">
            All Nodes — 6-Hour Forecast Summary
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Node', 'Current', 'Predicted 6h', 'Trend', 'Confidence', 'Breach Risk', ''].map(h => (
                  <th key={h}
                      className="text-left px-5 py-2.5 text-[10px] font-semibold
                                 text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {allSummaries.map(({ node: n, summary: s }) => {
                if (!s) return null;
                const lvl    = ALERT_LEVELS[n.alertLevel];
                const isSelected = n.id === selectedNode;
                const TIcon  = s.trend === 'declining' ? TrendingDown
                             : s.trend === 'stable'    ? Minus
                             : TrendingUp;
                const tColor = s.trend === 'declining' ? '#DC2626'
                             : s.trend === 'stable'    ? '#64748B'
                             : '#059669';
                return (
                  <tr
                    key={n.id}
                    className={`transition-colors cursor-pointer
                      ${isSelected
                        ? 'bg-[#EFF6FF]'
                        : 'hover:bg-[#F8FAFC]'
                      }`}
                    onClick={() => setSelectedNode(n.id)}
                  >
                    {/* Node */}
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-[#0F172A]">{n.name}</p>
                      <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">{n.id}</p>
                    </td>
                    {/* Current level */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-mono font-semibold"
                              style={{ color: lvl.color }}>
                          {n.waterLevel} cm
                        </span>
                        <StatusBadge level={n.alertLevel} size="sm" />
                      </div>
                    </td>
                    {/* Predicted */}
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-mono font-semibold text-[#7C3AED]">
                        {s.predictedIn6h} cm
                      </span>
                    </td>
                    {/* Trend */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <TIcon size={13} style={{ color: tColor }} />
                        <span className="text-[12px] font-medium capitalize"
                              style={{ color: tColor }}>
                          {s.trend}
                        </span>
                      </div>
                    </td>
                    {/* Confidence */}
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] font-mono text-[#475569]">
                        ±{s.confidenceAt6h.toFixed(1)} cm
                      </span>
                    </td>
                    {/* Breach risk */}
                    <td className="px-5 py-3.5">
                      {s.willBreach ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold
                                     px-2 py-0.5 rounded-full"
                          style={{
                            color:           ALERT_LEVELS[s.breachLevel]?.color,
                            backgroundColor: ALERT_LEVELS[s.breachLevel]?.bg,
                          }}
                        >
                          <AlertTriangle size={9} />
                          {ALERT_LEVELS[s.breachLevel]?.label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px]
                                         font-medium text-[#059669]">
                          <CheckCircle2 size={11} />
                          None
                        </span>
                      )}
                    </td>
                    {/* Select button */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedNode(n.id); }}
                        className={`text-[11px] font-medium transition-colors
                          ${isSelected
                            ? 'text-[#2563EB]'
                            : 'text-[#94A3B8] hover:text-[#2563EB]'
                          }`}
                      >
                        {isSelected ? 'Viewing' : 'View chart'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-[#F8FAFC]">
          <p className="text-[11px] text-[#94A3B8]">
            Click any row to load that node's forecast chart above ·
            LSTM model trained on CWC historical river level data
          </p>
        </div>
      </div>

    </motion.div>
  );
};

export default PredictionPage;
