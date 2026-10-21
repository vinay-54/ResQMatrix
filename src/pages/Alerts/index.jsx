import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Bell, Search, CheckCircle2, AlertTriangle, AlertCircle,
  XCircle, ChevronRight, Clock, MessageSquare, Smartphone,
  Wifi, CheckCheck, Info, X, Filter, Activity, MapPin,
  ExternalLink, RefreshCw
} from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import { formatTimeAgo } from '../../utils/formatters';
import { useMotion } from '../../hooks/useMotion';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

const FILTER_TABS = [
  { label: 'All',          value: 'ALL'          },
  { label: 'Warning',      value: 'WARNING'      },
  { label: 'Watch',        value: 'WATCH'        },
  { label: 'Safe',         value: 'SAFE'         },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
];

const ALERT_ICON_MAP = {
  SAFE:     CheckCircle2,
  WATCH:    AlertTriangle,
  WARNING:  AlertTriangle,
  DANGER:   XCircle,
  CRITICAL: XCircle,
  OFFLINE:  AlertCircle,
};

const CHANNEL_CONFIG = {
  SMS:      { label: 'SMS',      color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  FCM:      { label: 'FCM',      color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  WhatsApp: { label: 'WhatsApp', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  LoRa:     { label: 'LoRa',     color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
};

const AlertsPage = () => {
  const navigate                      = useNavigate();
  const motion_config                 = useMotion();
  const [search,        setSearch]    = useState('');
  const [activeFilter,  setFilter]    = useState('ALL');
  const [selectedAlert, setSelected]  = useState(null);
  const alerts           = useDataStore(s => s.alerts);
  const acknowledgeAlert = useDataStore(s => s.acknowledgeAlert);
  const nodes            = useDataStore(s => s.nodes);

  // ── Derived counts ──────────────────────────────────────
  const counts = useMemo(() => {
    const c = { ALL: alerts.length, ACKNOWLEDGED: 0 };
    alerts.forEach(a => {
      c[a.level]       = (c[a.level] || 0) + 1;
      if (a.acknowledged) c.ACKNOWLEDGED++;
    });
    return c;
  }, [alerts]);

  const unacknowledgedCount = useMemo(
    () => alerts.filter(a => !a.acknowledged).length,
    [alerts]
  );

  // ── Filtered alerts ─────────────────────────────────────
  const filtered = useMemo(() => {
    return alerts
      .filter(a => {
        if (activeFilter === 'ACKNOWLEDGED') return a.acknowledged;
        if (activeFilter !== 'ALL')          return a.level === activeFilter && !a.acknowledged;
        return true;
      })
      .filter(a =>
        !search ||
        a.nodeName.toLowerCase().includes(search.toLowerCase()) ||
        a.message.toLowerCase().includes(search.toLowerCase()) ||
        a.level.toLowerCase().includes(search.toLowerCase())
      );
  }, [alerts, activeFilter, search]);

  // ── Acknowledge handler ──────────────────────────────────
  const handleAcknowledge = (alertId) => {
    acknowledgeAlert(alertId);
    // If the acknowledged alert was selected, update selected too
    if (selectedAlert?.id === alertId) {
      setSelected(prev => ({ ...prev, acknowledged: true }));
    }
  };

  // ── Selected node data ───────────────────────────────────
  const selectedNode = selectedAlert
    ? nodes.find(n => n.id === selectedAlert.nodeId)
    : null;

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Alert Center
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            All system events, threshold crossings, and connectivity changes
          </p>
        </div>
        <button title="Refresh data" aria-label="Refresh data"
                className="flex items-center gap-1.5 text-[12px] font-medium
                           text-[#475569] bg-white border border-[#E2E8F0]
                           hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Stats Strip ───────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        variants={motion_config.staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[
          {
            label:     'Total Events',
            value:     alerts.length,
            icon:      Bell,
            iconBg:    '#EFF6FF',
            iconColor: '#2563EB',
            sub:       'Last 48 hours',
            subColor:  '#64748B',
          },
          {
            label:     'Unacknowledged',
            value:     unacknowledgedCount,
            icon:      AlertCircle,
            iconBg:    unacknowledgedCount > 0 ? '#FFF7ED' : '#F8FAFC',
            iconColor: unacknowledgedCount > 0 ? '#EA580C' : '#94A3B8',
            sub:       unacknowledgedCount > 0 ? 'Requires attention' : 'All clear',
            subColor:  unacknowledgedCount > 0 ? '#EA580C' : '#059669',
          },
          {
            label:     'Warning Level+',
            value:     (counts.WARNING || 0) + (counts.DANGER || 0) + (counts.CRITICAL || 0),
            icon:      AlertTriangle,
            iconBg:    '#FFF7ED',
            iconColor: '#EA580C',
            sub:       'Warning and above',
            subColor:  '#64748B',
          },
          {
            label:     'SMS Dispatched',
            value:     alerts.filter(a => a.channels.includes('SMS')).length,
            icon:      MessageSquare,
            iconBg:    '#FFFBEB',
            iconColor: '#D97706',
            sub:       'Via SIM800L',
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
              <p className="text-[26px] font-bold font-mono tabular-nums text-[#0F172A] leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: stat.subColor }}>
                {stat.sub}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Toolbar: Search + Filter Tabs ─────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">

        {/* Search */}
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts..."
            className="w-full h-9 pl-9 pr-3 text-[13px] text-[#0F172A]
                       bg-white border border-[#E2E8F0] rounded-md
                       placeholder:text-[#94A3B8]
                       focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10
                       transition-all"
          />
        </div>

        {/* Filter Tabs — with Framer Motion layoutId sliding indicator */}
        <LayoutGroup id="alert-filter-tabs">
          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_TABS.map(tab => {
              const isActive = activeFilter === tab.value;
              const count    = counts[tab.value] || 0;
              if (tab.value !== 'ALL' && tab.value !== 'ACKNOWLEDGED' && count === 0) return null;

              return (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-md
                    text-[12px] font-medium transition-colors duration-150
                    ${isActive ? 'text-[#2563EB]' : 'text-[#475569] hover:text-[#0F172A]'}
                  `}
                >
                  {/* Sliding background indicator — the key Emil Kowalski pattern */}
                  {isActive && (
                    <motion.div
                      layoutId="alert-tab-indicator"
                      className="absolute inset-0 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md"
                      transition={{
                        type:      'spring',
                        stiffness: 420,
                        damping:   38,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span className={`relative z-10 text-[10px] font-semibold
                    ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* ── Main Two-Pane Grid ─────────────────────────── */}
      <div className={`grid gap-4 ${selectedAlert ? 'xl:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>

        {/* ── LEFT: Alert List ──────────────────────── */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">

          {/* List header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[#94A3B8]" />
              <span className="text-[13px] font-semibold text-[#0F172A]">
                {activeFilter === 'ALL' ? 'All Events'
                 : activeFilter === 'ACKNOWLEDGED' ? 'Acknowledged'
                 : `${ALERT_LEVELS[activeFilter]?.label || activeFilter} Alerts`}
              </span>
              <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9]
                               px-1.5 py-0.5 rounded-full">
                {filtered.length}
              </span>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="flex items-center gap-1 text-[11px] text-[#94A3B8]
                           hover:text-[#475569] transition-colors"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {/* Alert list body */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alerts found"
              description={search ? 'No alerts match your search query' : 'No events in this category'}
              action={(search || activeFilter !== 'ALL') ? () => { setSearch(''); setFilter('ALL'); } : null}
              actionLabel="Clear all filters"
            />
          ) : (
            <motion.div
              className="divide-y divide-[#F8FAFC]"
              variants={motion_config.staggerContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map(alert => {
                  const level     = ALERT_LEVELS[alert.level] || ALERT_LEVELS.SAFE;
                  const AlertIcon = ALERT_ICON_MAP[alert.level] || AlertCircle;
                  const isSelected = selectedAlert?.id === alert.id;

                  return (
                    <motion.button
                      key={alert.id}
                      layout
                      variants={motion_config.staggerItem}
                      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
                      onClick={() => setSelected(isSelected ? null : alert)}
                      className={`
                        w-full text-left px-5 py-4 transition-colors duration-150
                        flex items-start gap-3
                        ${isSelected
                          ? 'bg-[#EFF6FF] border-l-2 border-l-[#2563EB]'
                          : alert.acknowledged
                            ? 'hover:bg-[#F8FAFC] opacity-60'
                            : 'hover:bg-[#F8FAFC]'
                        }
                      `}
                    >
                      {/* Alert icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: level.bg }}
                      >
                        <AlertIcon size={15} style={{ color: level.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-semibold text-[#0F172A]">
                                {alert.nodeName}
                              </span>
                              <StatusBadge level={alert.level} size="sm" />
                            </div>
                            <p className="text-[12px] text-[#475569] mt-0.5 leading-relaxed line-clamp-2">
                              {alert.message}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[10px] text-[#94A3B8] flex items-center gap-1 justify-end">
                              <Clock size={10} />
                              {formatTimeAgo(alert.timestamp)}
                            </p>
                          </div>
                        </div>

                        {/* Channels + acknowledged row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {alert.channels.map(ch => {
                            const cfg = CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.FCM;
                            return (
                              <span
                                key={ch}
                                className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border"
                                style={{
                                  color:       cfg.color,
                                  backgroundColor: cfg.bg,
                                  borderColor: cfg.border,
                                }}
                              >
                                {cfg.label}
                              </span>
                            );
                          })}
                          {alert.acknowledged && (
                            <span className="flex items-center gap-1 text-[9px] font-medium text-[#94A3B8]">
                              <CheckCheck size={9} />
                              Acknowledged
                            </span>
                          )}
                          {!alert.acknowledged && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledge(alert.id);
                              }}
                              className="text-[9px] font-semibold text-[#2563EB]
                                         bg-[#EFF6FF] border border-[#BFDBFE]
                                         px-1.5 py-0.5 rounded uppercase tracking-wide
                                         hover:bg-[#DBEAFE] transition-colors"
                            >
                              Acknowledge
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F8FAFC]">
            <p className="text-[11px] text-[#94A3B8]">
              Showing {filtered.length} of {alerts.length} events ·
              Click an alert to view details
            </p>
          </div>
        </div>

        {/* ── RIGHT: Detail Panel ───────────────────── */}
        <AnimatePresence mode="wait">
          {selectedAlert ? (
            <motion.div
              key={selectedAlert.id}
              {...motion_config.fadeSlideUp}
              className="space-y-4"
            >
              {/* Detail card */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">

                {/* Detail header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-[#2563EB]" />
                    <span className="text-[13px] font-semibold text-[#0F172A]">
                      Alert Detail
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1 rounded text-[#94A3B8] hover:bg-[#F1F5F9]
                               hover:text-[#475569] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Alert summary */}
                <div className="px-5 py-4 border-b border-[#F8FAFC]">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const level     = ALERT_LEVELS[selectedAlert.level] || ALERT_LEVELS.SAFE;
                      const AlertIcon = ALERT_ICON_MAP[selectedAlert.level] || AlertCircle;
                      return (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: level.bg }}
                        >
                          <AlertIcon size={18} style={{ color: level.color }} />
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[14px] font-semibold text-[#0F172A]">
                          {selectedAlert.nodeName}
                        </span>
                        <StatusBadge level={selectedAlert.level} size="md" />
                      </div>
                      <p className="text-[12px] text-[#475569] leading-relaxed">
                        {selectedAlert.message}
                      </p>
                    </div>
                  </div>

                  {/* Detail text */}
                  <div className="mt-3 p-3 bg-[#F8FAFC] rounded-md border border-[#F1F5F9]">
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      {selectedAlert.detail}
                    </p>
                  </div>
                </div>

                {/* Metadata rows */}
                <div className="divide-y divide-[#F8FAFC]">
                  {[
                    { label: 'Node',      value: selectedAlert.nodeId,       mono: true  },
                    { label: 'Location',  value: selectedAlert.nodeLocation,  mono: false },
                    { label: 'Time',      value: new Date(selectedAlert.timestamp).toLocaleString('en-IN', {
                                            day: 'numeric', month: 'short', hour: '2-digit',
                                            minute: '2-digit', hour12: true
                                          }),                                 mono: false },
                    { label: 'Level',     value: ALERT_LEVELS[selectedAlert.level]?.label || selectedAlert.level,
                                                                              mono: false },
                    { label: 'Status',    value: selectedAlert.acknowledged ? 'Acknowledged' : 'Active',
                                                                              mono: false },
                  ].map(row => (
                    <div key={row.label}
                         className="flex items-center justify-between px-5 py-2.5 gap-3">
                      <span className="text-[11px] text-[#94A3B8] flex-shrink-0">
                        {row.label}
                      </span>
                      <span className={`text-[12px] text-[#0F172A] text-right
                        ${row.mono ? 'font-mono' : 'font-medium'}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Channels row */}
                <div className="px-5 py-3 border-t border-[#F8FAFC]">
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
                    Alert channels fired
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedAlert.channels.map(ch => {
                      const cfg = CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.FCM;
                      const ChIcon = ch === 'SMS' ? MessageSquare : ch === 'FCM' ? Smartphone : Wifi;
                      return (
                        <div
                          key={ch}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border"
                          style={{
                            color:           cfg.color,
                            backgroundColor: cfg.bg,
                            borderColor:     cfg.border,
                          }}
                        >
                          <ChIcon size={11} />
                          <span className="text-[11px] font-semibold">{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Acknowledge action */}
                {!selectedAlert.acknowledged ? (
                  <div className="px-5 py-4 border-t border-[#F1F5F9] bg-[#FFFBEB]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-semibold text-[#0F172A]">
                          Action required
                        </p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          Confirm this alert has been reviewed
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAcknowledge(selectedAlert.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md
                                   bg-[#0F172A] text-white text-[12px] font-semibold
                                   hover:bg-[#1E293B] active:bg-[#334155]
                                   transition-colors flex-shrink-0"
                      >
                        <CheckCheck size={13} />
                        Acknowledge
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3.5 border-t border-[#F1F5F9] bg-[#F0FDF4]">
                    <div className="flex items-center gap-2 text-[#059669]">
                      <CheckCircle2 size={13} />
                      <span className="text-[12px] font-medium">
                        Alert acknowledged
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Node quick card */}
              {selectedNode && (
                <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-[#2563EB]" />
                      <span className="text-[13px] font-semibold text-[#0F172A]">
                        Node Status
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/sensors/${selectedNode.id}`)}
                      className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB]
                                 hover:text-[#1D4ED8] transition-colors"
                    >
                      Open node <ExternalLink size={10} />
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#0F172A]">
                          {selectedNode.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-[#94A3B8]" />
                          <span className="text-[11px] text-[#94A3B8]">
                            {selectedNode.location}
                          </span>
                        </div>
                      </div>
                      <StatusBadge level={selectedNode.alertLevel} size="md" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: 'Water Level',
                          value: `${selectedNode.waterLevel} cm`,
                          color: ALERT_LEVELS[selectedNode.alertLevel]?.color || '#94A3B8',
                        },
                        {
                          label: 'Battery',
                          value: `${selectedNode.battery}%`,
                          color: '#059669',
                        },
                        {
                          label: 'Temperature',
                          value: `${selectedNode.temperature}°C`,
                          color: '#EA580C',
                        },
                      ].map(m => (
                        <div key={m.label}
                             className="bg-[#F8FAFC] rounded-md p-2.5 border border-[#F1F5F9]">
                          <p className="text-[9px] text-[#94A3B8] font-medium uppercase tracking-wide">
                            {m.label}
                          </p>
                          <p className="text-[14px] font-bold font-mono mt-0.5"
                             style={{ color: m.color }}>
                            {m.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          ) : (
            // No alert selected — empty state (only shown when xl grid is active)
            <motion.div
              key="empty-detail"
              {...motion_config.fadeIn}
              className="hidden xl:flex flex-col items-center justify-center
                         bg-white border border-[#E2E8F0] rounded-lg
                         min-h-[300px] text-center px-6"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center mb-3">
                <Bell size={18} className="text-[#94A3B8]" />
              </div>
              <p className="text-[13px] font-medium text-[#475569]">No alert selected</p>
              <p className="text-[11px] text-[#94A3B8] mt-1 max-w-[200px]">
                Click any alert in the list to view full details
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

export default AlertsPage;
