import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MapPin, Radio, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Phone, Truck,
  Ship, Package, Zap, RefreshCw, Activity,
  Info, MessageSquare, Send, Circle,
  ArrowRight, UserCheck
} from 'lucide-react';
import { MOCK_RESCUE } from '../../data/mockData';
import useDataStore from '../../store/useDataStore';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import { formatTimeAgo } from '../../utils/formatters';
import { useMotion } from '../../hooks/useMotion';
import StatusBadge from '../../components/ui/StatusBadge';

/* ── Config ─────────────────────────────────────────────────────────────── */

const TEAM_STATUS_CONFIG = {
  deployed:  { label: 'Deployed',  color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dot: '#059669' },
  standby:   { label: 'Standby',   color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8' },
  returning: { label: 'Returning', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', dot: '#2563EB' },
  'off-duty':{ label: 'Off Duty',  color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', dot: '#CBD5E1' },
};

const RESOURCE_ICONS = {
  boat:    Ship,
  vehicle: Truck,
  supply:  Package,
  power:   Zap,
};

const ACTIVITY_CONFIG = {
  dispatch: { color: '#2563EB', bg: '#EFF6FF', icon: Send     },
  alert:    { color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
  status:   { color: '#059669', bg: '#ECFDF5', icon: Radio    },
  system:   { color: '#7C3AED', bg: '#F5F3FF', icon: Activity },
};

/* ── Main Page Component ────────────────────────────────────────────────── */

const RescuePage = () => {
  const motion_config = useMotion();
  const teams       = useDataStore(s => s.teams);
  const resources   = useDataStore(s => s.resources);
  const activityLog = useDataStore(s => s.activityLog);
  const nodes       = useDataStore(s => s.nodes);

  const summary = {
    totalTeams:      teams.length,
    deployed:        teams.filter(t => t.status === 'deployed').length,
    standby:         teams.filter(t => t.status === 'standby').length,
    returning:       teams.filter(t => t.status === 'returning').length,
    totalPersonnel:  teams.reduce((s, t) => s + (t.members || 0), 0),
    residentsHelped: MOCK_RESCUE.summary.residentsHelped,
    zonesActive:     teams.filter(t => t.status === 'deployed').length,
  };
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Rescue Portal
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Team coordination · Zone assignments · Activity log
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-[12px] font-medium
                           text-[#475569] bg-white border border-[#E2E8F0]
                           hover:bg-[#F8FAFC] px-3 py-1.5 rounded-md transition-colors">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Summary KPI Strip ───────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        variants={motion_config.staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[
          {
            label:     'Teams Deployed',
            value:     summary.deployed,
            unit:      `/ ${summary.totalTeams}`,
            icon:      Users,
            iconBg:    '#ECFDF5',
            iconColor: '#059669',
            sub:       `${summary.standby} standby · ${summary.returning} returning`,
            subColor:  '#64748B',
          },
          {
            label:     'Total Personnel',
            value:     summary.totalPersonnel,
            unit:      '',
            icon:      UserCheck,
            iconBg:    '#EFF6FF',
            iconColor: '#2563EB',
            sub:       'Field + command post',
            subColor:  '#64748B',
          },
          {
            label:     'Residents Helped',
            value:     summary.residentsHelped,
            unit:      '',
            icon:      CheckCircle2,
            iconBg:    '#ECFDF5',
            iconColor: '#059669',
            sub:       'Assisted today',
            subColor:  '#059669',
          },
          {
            label:     'Active Zones',
            value:     summary.zonesActive,
            unit:      `/ ${summary.totalTeams}`,
            icon:      MapPin,
            iconBg:    '#FFF7ED',
            iconColor: '#EA580C',
            sub:       'Warning level or above',
            subColor:  '#EA580C',
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
                <span className="text-[26px] font-bold font-mono tabular-nums text-[#0F172A] leading-none">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-[13px] text-[#94A3B8] font-medium ml-0.5">{stat.unit}</span>
                )}
              </div>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: stat.subColor }}>
                {stat.sub}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 mb-4">

        {/* ── LEFT: Team Cards ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-2">
              <Users size={14} className="text-[#2563EB]" />
              Rescue Teams
            </h2>
            <span className="text-[11px] text-[#94A3B8]">
              Click team to view details
            </span>
          </div>

          {teams.map(team => {
            const sc          = TEAM_STATUS_CONFIG[team.status] || TEAM_STATUS_CONFIG.standby;
            const node        = nodes.find(n => n.id === team.nodeId);
            const nodeLevel   = node ? ALERT_LEVELS[node.alertLevel] : null;
            const isSelected  = selectedTeam === team.id;

            return (
              <motion.div
                key={team.id}
                layout
                onClick={() => setSelectedTeam(isSelected ? null : team.id)}
                className={`bg-white border rounded-lg overflow-hidden cursor-pointer
                             transition-all duration-150
                  ${isSelected
                    ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
              >
                {/* Team card header */}
                <div className="flex items-start justify-between px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    {/* Status indicator */}
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sc.dot }}
                      />
                      <div className="w-px flex-1 min-h-[20px]"
                           style={{ backgroundColor: sc.dot + '30' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold text-[#0F172A]">
                          {team.name}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color:           sc.color,
                            backgroundColor: sc.bg,
                            borderColor:     sc.border,
                          }}
                        >
                          {sc.label}
                        </span>
                        {node && nodeLevel && (
                          <StatusBadge level={node.alertLevel} size="sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                          <Users size={10} />
                          {team.members} members · {team.lead}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                          <MapPin size={10} />
                          {team.zone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-[#94A3B8]">
                      {formatTimeAgo(team.lastUpdate)}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`transition-transform text-[#CBD5E1]
                        ${isSelected ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{    height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 border-t border-[#F8FAFC] pt-3 space-y-3">
                        {/* Current task */}
                        <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#F1F5F9]">
                          <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wide mb-1">
                            Current Task
                          </p>
                          <p className="text-[12px] text-[#475569] leading-relaxed">
                            {team.task}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Vehicle */}
                          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#F1F5F9]">
                            <p className="text-[10px] text-[#94A3B8] mb-1">Vehicle</p>
                            <p className="text-[12px] font-semibold text-[#0F172A]">
                              {team.vehicle}
                            </p>
                          </div>
                          {/* Contact */}
                          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#F1F5F9]">
                            <p className="text-[10px] text-[#94A3B8] mb-1">Contact</p>
                            <div className="flex items-center gap-1.5">
                              <Phone size={10} className="text-[#059669]" />
                              <p className="text-[11px] font-mono text-[#0F172A]">
                                {team.contact}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* GPS coords */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <MapPin size={11} className="text-[#94A3B8]" />
                          <span className="text-[#94A3B8]">GPS:</span>
                          <span className="font-mono text-[#475569]">
                            {team.coords.lat}, {team.coords.lng}
                          </span>
                        </div>

                        {/* Node status for this zone */}
                        {node && nodeLevel && (
                          <div
                            className="flex items-center gap-2 p-2.5 rounded-md border"
                            style={{
                              backgroundColor: nodeLevel.bg,
                              borderColor:     nodeLevel.border,
                            }}
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: nodeLevel.color }}
                            />
                            <span className="text-[11px] font-medium"
                                  style={{ color: nodeLevel.color }}>
                              Zone sensor {node.name}: {node.waterLevel}cm —{' '}
                              {ALERT_LEVELS[node.alertLevel]?.label} level
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── RIGHT: Activity Log ───────────────────────── */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
            <Radio size={14} className="text-[#2563EB]" />
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Activity Log</h2>
            <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9]
                             px-1.5 py-0.5 rounded-full">
              Live
            </span>
          </div>

          <motion.div
            className="divide-y divide-[#F8FAFC]"
            variants={motion_config.staggerContainer}
            initial="initial"
            animate="animate"
          >
            {activityLog.map(entry => {
              const cfg  = ACTIVITY_CONFIG[entry.type] || ACTIVITY_CONFIG.status;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={entry.id}
                  variants={motion_config.staggerItem}
                  className="flex items-start gap-3 px-5 py-3.5"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon size={12} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: cfg.color }}
                      >
                        {entry.teamName}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] flex-shrink-0 flex items-center gap-1">
                        <Clock size={9} />
                        {formatTimeAgo(entry.time)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      {entry.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="px-5 py-3 border-t border-[#F8FAFC]">
            <p className="text-[10px] text-[#94A3B8]">
              {activityLog.length} events logged · Updates every 30 seconds
            </p>
          </div>
        </div>
      </div>

      {/* ── Resource Inventory ───────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-[#2563EB]" />
            <h2 className="text-[13px] font-semibold text-[#0F172A]">Resource Inventory</h2>
            <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9]
                             px-1.5 py-0.5 rounded-full">
              {resources.length} items
            </span>
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            <span className="text-[#059669] font-medium">
              {resources.filter(r => r.status === 'standby').length} available
            </span>
            {' · '}
            <span className="text-[#2563EB] font-medium">
              {resources.filter(r => r.status === 'deployed').length} deployed
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Resource', 'Type', 'Status', 'Assigned Team'].map(h => (
                  <th key={h}
                      className="text-left px-5 py-2.5 text-[10px] font-semibold
                                 text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {resources.map(resource => {
                const Icon = RESOURCE_ICONS[resource.type] || Package;
                const assignedTeam = resource.team
                  ? teams.find(t => t.id === resource.team)
                  : null;
                const statusConf = {
                  deployed:  { label: 'Deployed',  color: '#059669', bg: '#ECFDF5' },
                  standby:   { label: 'Available', color: '#64748B', bg: '#F8FAFC' },
                  returning: { label: 'Returning', color: '#2563EB', bg: '#EFF6FF' },
                };
                const rsc = statusConf[resource.status] || statusConf.standby;

                return (
                  <tr key={resource.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                          <Icon size={12} className="text-[#64748B]" />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-[#0F172A]">{resource.name}</p>
                          <p className="text-[10px] text-[#94A3B8] font-mono">{resource.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-[#475569] capitalize">{resource.type}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: rsc.color, backgroundColor: rsc.bg }}
                      >
                        {rsc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {assignedTeam ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: TEAM_STATUS_CONFIG[assignedTeam.status]?.dot || '#94A3B8'
                            }}
                          />
                          <span className="text-[12px] font-medium text-[#0F172A]">
                            {assignedTeam.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8]">Unassigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
};

export default RescuePage;
