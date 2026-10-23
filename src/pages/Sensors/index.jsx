import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion';
import {
  Activity, Wifi, Radio, MessageSquare, HardDrive,
  Battery, Thermometer, Droplets, Wind, Search,
  ChevronRight, CloudRain, Sun, RefreshCw, MapPin
} from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { ALERT_LEVELS, CONNECTIVITY_TIERS } from '../../constants/alertLevels';
import { formatTimeAgo, formatWaterLevel, formatBattery } from '../../utils/formatters';
import { getBatteryColor } from '../../utils/nodeUtils';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

const FILTER_TABS = [
  { label: 'All Nodes', value: 'ALL'     },
  { label: 'Safe',      value: 'SAFE'    },
  { label: 'Watch',     value: 'WATCH'   },
  { label: 'Warning',   value: 'WARNING' },
  { label: 'Danger',    value: 'DANGER'  },
  { label: 'Offline',   value: 'OFFLINE' },
];

const CONN_ICON_MAP = { Wifi, Radio, MessageSquare, HardDrive };

const SensorsPage = () => {
  const navigate    = useNavigate();
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('ALL');
  const motion_config = useMotion();
  const nodes = useDataStore(s => s.nodes);
  const deploymentAreas = useDataStore(s => s.deploymentAreas);
  const activeAreaId  = useDataStore(s => s.activeAreaId);
  const activeArea    = deploymentAreas.find(a => a.id === activeAreaId);

  const filtered = useMemo(() => {
    return nodes.filter(node => {
      const matchSearch = !search ||
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.location.toLowerCase().includes(search.toLowerCase()) ||
        node.id.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'ALL' || node.alertLevel === filter;
      return matchSearch && matchFilter;
    });
  }, [nodes, search, filter]);

  // Count per level for filter tabs
  const counts = useMemo(() => {
    return nodes.reduce((acc, n) => {
      acc[n.alertLevel] = (acc[n.alertLevel] || 0) + 1;
      return acc;
    }, { ALL: nodes.length });
  }, [nodes]);

  return (
    <motion.div {...motion_config.fadeSlideUp}>
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Sensor Nodes
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            {nodes.length} nodes deployed · {activeArea?.name || 'Deployment Area'}
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-[12px] font-medium
                           text-[#475569] bg-white border border-[#E2E8F0]
                           hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Search + Filter Bar ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full h-9 pl-9 pr-3 text-[13px] text-[#0F172A]
                       bg-white border border-[#E2E8F0] rounded-md
                       placeholder:text-[#94A3B8]
                       focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10
                       transition-all"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {FILTER_TABS.map(tab => {
            const count = counts[tab.value] || 0;
            if (tab.value !== 'ALL' && count === 0) return null;
            const isActive = filter === tab.value;
            const levelConfig = tab.value !== 'ALL' ? ALERT_LEVELS[tab.value] : null;

            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium
                  transition-all border
                  ${isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }
                `}
              >
                {levelConfig && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isActive ? '#2563EB' : levelConfig.color }}
                  />
                )}
                {tab.label}
                <span className={`text-[10px] font-semibold px-1 py-0 rounded
                  ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Node Cards Grid ──────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No nodes match your filters"
          description="Try adjusting the search term or status filter"
          action={() => { setSearch(''); setFilter('ALL'); }}
          actionLabel="Clear all filters"
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          variants={motion_config.staggerContainer}
          initial="initial"
          animate="animate"
        >
          {filtered.map(node => {
            const level     = ALERT_LEVELS[node.alertLevel];
            const conn      = CONNECTIVITY_TIERS[node.connectivity];
            const ConnIcon  = CONN_ICON_MAP[conn?.icon] || Wifi;
            const batColor  = getBatteryColor(node.battery);

            return (
              <motion.div
                key={node.id}
                variants={motion_config.staggerItem}
                onClick={() => navigate(`/sensors/${node.id}`)}
                className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden
                           hover:border-[#2563EB]/30 hover:shadow-card cursor-pointer
                           transition-all duration-150 group"
              >
                {/* Card Top — colored alert level bar */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: level.color }}
                />

                {/* Card Header */}
                <div className="flex items-start justify-between px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[14px] font-semibold text-[#0F172A] truncate">
                        {node.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                      <MapPin size={10} />
                      <span className="truncate">{node.location}</span>
                    </div>
                    <p className="text-[10px] text-[#CBD5E1] mt-0.5 font-mono">{node.id}</p>
                  </div>
                  <StatusBadge level={node.alertLevel} size="md" />
                </div>

                {/* Water Level — main metric */}
                <div className="px-5 pb-4 border-b border-[#F8FAFC]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                      Water Level Distance
                    </span>
                    <span
                      className="text-[22px] font-bold font-mono tabular-nums leading-none"
                      style={{ color: level.color }}
                    >
                      {node.waterLevel}
                      <span className="text-[12px] font-medium text-[#94A3B8] ml-1">cm</span>
                    </span>
                  </div>
                  {/* Full-width progress bar */}
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width:           `${Math.min(100, (node.waterLevel / 100) * 100)}%`,
                        backgroundColor: level.color,
                      }}
                    />
                  </div>
                  {/* Threshold labels */}
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[#DC2626] font-medium">Critical 8cm</span>
                    <span className="text-[9px] text-[#94A3B8]">Safe 80cm+</span>
                  </div>
                </div>

                {/* Environment readings row */}
                <div className="grid grid-cols-4 divide-x divide-[#F8FAFC] border-b border-[#F8FAFC]">
                  {[
                    {
                      icon: Thermometer,
                      value: `${node.temperature}°`,
                      label: 'Temp',
                      color: '#EA580C',
                    },
                    {
                      icon: Droplets,
                      value: `${node.humidity}%`,
                      label: 'Humid',
                      color: '#2563EB',
                    },
                    {
                      icon: Wind,
                      value: `${node.pressure}`,
                      label: 'hPa',
                      color: '#7C3AED',
                    },
                    {
                      icon: node.rain ? CloudRain : Sun,
                      value: node.rain ? 'Rain' : 'Clear',
                      label: 'Weather',
                      color: node.rain ? '#2563EB' : '#D97706',
                    },
                  ].map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                      <div key={idx} className="flex flex-col items-center py-3 px-1 gap-0.5">
                        <Icon size={12} style={{ color: metric.color }} />
                        <span className="text-[11px] font-semibold text-[#0F172A] font-mono">
                          {metric.value}
                        </span>
                        <span className="text-[9px] text-[#94A3B8]">{metric.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer row — connectivity + battery + last seen + arrow */}
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    {/* Connectivity */}
                    <div className="flex items-center gap-1.5">
                      <ConnIcon size={12} style={{ color: conn?.color }} />
                      <span className="text-[11px] font-medium" style={{ color: conn?.color }}>
                        {conn?.label}
                      </span>
                    </div>
                    {/* Separator */}
                    <div className="w-px h-3 bg-[#E2E8F0]" />
                    {/* Battery */}
                    <div className="flex items-center gap-1">
                      <Battery size={11} style={{ color: batColor }} />
                      <span className="text-[11px] font-mono" style={{ color: batColor }}>
                        {node.battery}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#94A3B8]">
                      {formatTimeAgo(node.lastSeen)}
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Footer summary ───────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between text-[11px] text-[#94A3B8]">
        <span>
          Showing {filtered.length} of {nodes.length} nodes
        </span>
        <span>
          {activeArea?.name || 'ResQMatrix'} · {nodes.length} nodes · Solar powered
        </span>
      </div>
    </motion.div>
  );
};

export default SensorsPage;
