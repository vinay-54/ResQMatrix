import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Battery, MapPin, Wifi, WifiOff, CheckCircle2,
  AlertTriangle, Clock, User, Layers, RefreshCw,
  Navigation, Radio, Activity, ChevronRight, ChevronDown,
  CheckCheck, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Flag, ArrowUpRight, History, Info, Crosshair
} from 'lucide-react';
import useDataStore  from '../../store/useDataStore';
import useAuthStore  from '../../store/useAuthStore';
import { useMotion } from '../../hooks/useMotion';
import { MOCK_DRONE } from '../../data/mockData'; // Keep only for flightLog + currentConditions
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge   from '../../components/ui/StatusBadge';
import EmptyState    from '../../components/ui/EmptyState';
import { formatTimeAgo } from '../../utils/formatters';

// ── Constants ────────────────────────────────────────────────────────────────

// Matches RoboMonk spec exactly
const FLIGHT_MODES = {
  STABILIZE: { label: 'Manual',       color: '#64748B' },
  LOITER:    { label: 'Hold',         color: '#2563EB' },
  AUTO:      { label: 'Auto Mission', color: '#059669' },
  RTL:       { label: 'Return Home',  color: '#D97706' },
  LAND:      { label: 'Landing',      color: '#7C3AED' },
  GUIDED:    { label: 'Guided',       color: '#0891B2' },
};

const STATUS_CONFIG = {
  standby:   { label: 'Standby',   color: '#64748B', bg: '#F8FAFC' },
  preflight: { label: 'Preflight', color: '#D97706', bg: '#FFFBEB' },
  airborne:  { label: 'Airborne',  color: '#059669', bg: '#ECFDF5' },
  returning: { label: 'Returning', color: '#2563EB', bg: '#EFF6FF' },
  offline:   { label: 'Offline',   color: '#DC2626', bg: '#FEF2F2' },
  charging:  { label: 'Charging',  color: '#7C3AED', bg: '#F5F3FF' },
};

const BATTERY_COLOR = (pct) => {
  if (pct >= 60) return '#059669';
  if (pct >= 30) return '#D97706';
  return '#DC2626';
};

// Seed telemetry for prototype (matches RoboMonk MQTT payload schema)
const SEED_TELEMETRY = {
  lat:              13.6289,
  lng:              79.4192,
  altitude:         0,
  batteryPct:       100,
  flightMode:       'STABILIZE',
  connectionStatus: 'connected',
  rssi:             -65,
  lastSeen:         Date.now(),
  groundSpeed:      0,
  heading:          0,
};

// ── Component 1 — Telemetry Dashboard Card ───────────────────────────────────

const TelemetryCard = ({ drone, telemetry }) => {
  const sc     = STATUS_CONFIG[drone.status] || STATUS_CONFIG.standby;
  const fm     = FLIGHT_MODES[telemetry.flightMode] || FLIGHT_MODES.STABILIZE;
  const batPct = telemetry.batteryPct ?? 0;
  const isAirborne = drone.status === 'airborne';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
      {/* Status header strip */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]"
           style={{ backgroundColor: sc.bg }}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Plane size={20} style={{ color: sc.color }} />
            {isAirborne && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full
                               bg-[#059669] animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#0F172A]">{drone.model || drone.id}</p>
            <p className="text-[10px] font-mono text-[#94A3B8]">{drone.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ color: sc.color, backgroundColor: sc.color + '15' }}>
            {sc.label}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white
                           border border-[#E2E8F0]"
                style={{ color: fm.color }}>
            {fm.label}
          </span>
        </div>
      </div>

      {/* Telemetry grid — 6 tiles */}
      <div className="grid grid-cols-3 gap-px bg-[#F1F5F9]">
        {[
          {
            label: 'Battery',
            value: `${batPct}%`,
            icon:  Battery,
            color: BATTERY_COLOR(batPct),
            sub:   batPct < 30 ? 'Low — land soon' : batPct < 60 ? 'Medium' : 'Good',
          },
          {
            label: 'Altitude',
            value: isAirborne ? `${telemetry.altitude}m` : '—',
            icon:  ArrowUpRight,
            color: '#2563EB',
            sub:   'Above ground',
          },
          {
            label: 'Speed',
            value: isAirborne ? `${telemetry.groundSpeed} m/s` : '—',
            icon:  Activity,
            color: '#7C3AED',
            sub:   'Ground speed',
          },
          {
            label: 'GPS',
            value: telemetry.lat ? `${telemetry.lat.toFixed(4)}` : 'No fix',
            icon:  MapPin,
            color: '#059669',
            sub:   telemetry.lng ? `${telemetry.lng.toFixed(4)}` : '—',
          },
          {
            label: 'Signal',
            value: telemetry.connectionStatus === 'connected' ? 'Online' : 'Offline',
            icon:  telemetry.connectionStatus === 'connected' ? Wifi : WifiOff,
            color: telemetry.connectionStatus === 'connected' ? '#059669' : '#DC2626',
            sub:   telemetry.rssi ? `RSSI: ${telemetry.rssi} dBm` : '—',
          },
          {
            label: 'Last Ping',
            value: formatTimeAgo(telemetry.lastSeen),
            icon:  Clock,
            color: '#64748B',
            sub:   'Telemetry age',
          },
        ].map((tile, i) => {
          const Icon = tile.icon;
          return (
            <div key={i} className="bg-white px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} style={{ color: tile.color }} />
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wide">
                  {tile.label}
                </span>
              </div>
              <p className="text-[16px] font-bold font-mono text-[#0F172A] leading-none">
                {tile.value}
              </p>
              <p className="text-[9px] text-[#94A3B8] mt-0.5">{tile.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Battery bar */}
      <div className="px-5 py-3 border-t border-[#F8FAFC]">
        <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mb-1">
          <span>Battery Level</span>
          <span className="font-semibold" style={{ color: BATTERY_COLOR(batPct) }}>
            {batPct}%
          </span>
        </div>
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${batPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: BATTERY_COLOR(batPct) }}
          />
        </div>
        {batPct < 30 && (
          <p className="text-[10px] text-[#DC2626] font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle size={10} />
            Low battery — initiate Return to Home
          </p>
        )}
      </div>

      {/* ResQMatrix Integration note */}
      <div className="px-5 py-2.5 border-t border-[#F8FAFC] bg-[#F8FAFC]">
        <p className="text-[10px] text-[#94A3B8]">
          <span className="font-semibold text-[#475569]">Live video:</span>{' '}
          Available on pilot's controller monitor (5.8GHz FPV direct link) ·
          Not streamed through ResQMatrix in this version
        </p>
      </div>
    </div>
  );
};

// ── Component 2 — Mission Assignment Panel ───────────────────────────────────

const MissionPanel = ({ drone, onUpdate }) => {
  const operations  = useDataStore(s => s.operations);
  const teams       = useDataStore(s => s.teams);
  const updateDrone = useDataStore(s => s.updateDrone);

  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({
    assignedOperation: drone.assignedOperation || '',
    assignedOperator:  drone.assignedOperator  || '',
    missionStatus:     drone.missionStatus     || 'idle',
  });

  const activeOps      = operations.filter(o => o.status === 'active');
  const availableTeams = teams.filter(t => t.status !== 'off-duty');

  const handleSave = () => {
    updateDrone(drone.id, form);
    setEditing(false);
  };

  const MISSION_STATUSES = ['idle', 'assigned', 'active', 'completed'];
  const MISSION_COLORS   = {
    idle:      '#64748B',
    assigned:  '#D97706',
    active:    '#059669',
    completed: '#2563EB',
  };

  const assignedOp   = operations.find(o => o.id === drone.assignedOperation);
  const assignedTeam = teams.find(t => t.id === drone.assignedOperator);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <Flag size={14} className="text-[#2563EB]" />
          <h3 className="text-[13px] font-semibold text-[#0F172A]">Mission Assignment</h3>
        </div>
        <button
          onClick={() => setEditing(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#475569]
                     px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] transition-colors"
        >
          <Pencil size={12} />
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="px-5 py-4">
        {editing ? (
          <div className="space-y-3">
            {/* Operation selector */}
            <div>
              <label className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                Assigned Operation
              </label>
              <select
                value={form.assignedOperation}
                onChange={e => setForm(p => ({ ...p, assignedOperation: e.target.value }))}
                className="w-full mt-1 h-9 px-3 text-[12px] border border-[#E2E8F0]
                           rounded-md bg-white focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">— None —</option>
                {activeOps.map(op => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </select>
            </div>

            {/* Operator selector */}
            <div>
              <label className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                Assigned Operator / Pilot
              </label>
              <select
                value={form.assignedOperator}
                onChange={e => setForm(p => ({ ...p, assignedOperator: e.target.value }))}
                className="w-full mt-1 h-9 px-3 text-[12px] border border-[#E2E8F0]
                           rounded-md bg-white focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">— None —</option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.lead}</option>
                ))}
              </select>
            </div>

            {/* Mission status */}
            <div>
              <label className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                Mission Status
              </label>
              <div className="flex gap-2 mt-1">
                {MISSION_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(p => ({ ...p, missionStatus: s }))}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-semibold
                               border capitalize transition-all"
                    style={{
                      borderColor:     form.missionStatus === s ? MISSION_COLORS[s] : '#E2E8F0',
                      backgroundColor: form.missionStatus === s ? MISSION_COLORS[s] + '15' : 'white',
                      color:           form.missionStatus === s ? MISSION_COLORS[s] : '#94A3B8',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2 bg-[#0F172A] text-white text-[12px]
                         font-semibold rounded-md hover:bg-[#1E293B] transition-colors"
            >
              Save Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              {
                label: 'Operation',
                value: assignedOp?.name || '— Not assigned —',
                icon:  Layers,
                color: assignedOp ? '#2563EB' : '#94A3B8',
              },
              {
                label: 'Operator / Pilot',
                value: assignedTeam ? `${assignedTeam.name} — ${assignedTeam.lead}` : '— Not assigned —',
                icon:  User,
                color: assignedTeam ? '#059669' : '#94A3B8',
              },
              {
                label: 'Mission Status',
                value: drone.missionStatus || 'idle',
                icon:  Flag,
                color: MISSION_COLORS[drone.missionStatus] || '#94A3B8',
              },
            ].map(row => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center
                                  justify-center flex-shrink-0">
                    <Icon size={14} style={{ color: row.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#94A3B8]">{row.label}</p>
                    <p className="text-[12px] font-semibold capitalize"
                       style={{ color: row.color }}>
                      {row.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Component 3 — Preflight Checklist ────────────────────────────────────────

const PreflightChecklist = ({ droneId }) => {
  const checklist           = useDataStore(s => s.checklist);
  const updateChecklistItem = useDataStore(s => s.updateChecklistItem);

  const activeItems   = checklist.filter(c => c.enabled);
  const [checked, setChecked] = useState(
    Object.fromEntries(activeItems.map(c => [c.id, false]))
  );

  const completedCount = Object.values(checked).filter(Boolean).length;
  const allComplete    = completedCount === activeItems.length && activeItems.length > 0;
  const completePct    = activeItems.length > 0
    ? Math.round((completedCount / activeItems.length) * 100)
    : 0;

  const resetChecklist = () => {
    setChecked(Object.fromEntries(activeItems.map(c => [c.id, false])));
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <CheckCheck size={14} className="text-[#059669]" />
          <h3 className="text-[13px] font-semibold text-[#0F172A]">Pre-Flight Checklist</h3>
          <span className="text-[10px] font-bold text-[#94A3B8]">
            {completedCount}/{activeItems.length}
          </span>
        </div>
        <button
          onClick={resetChecklist}
          className="text-[11px] text-[#94A3B8] hover:text-[#475569] transition-colors
                     flex items-center gap-1"
        >
          <RefreshCw size={11} /> Reset
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-3 pb-2">
        <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${completePct}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full"
            style={{ backgroundColor: allComplete ? '#059669' : '#2563EB' }}
          />
        </div>
        <p className="text-[10px] text-[#94A3B8] mt-1">
          {allComplete
            ? '✅ All checks complete — safe to fly'
            : `${completePct}% complete`}
        </p>
      </div>

      {/* Items */}
      <div className="px-5 pb-4 divide-y divide-[#F8FAFC]">
        {activeItems.map(item => (
          <button
            key={item.id}
            onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))}
            className="w-full flex items-center gap-3 py-2.5 text-left"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                            flex-shrink-0 transition-all
              ${checked[item.id]
                ? 'bg-[#059669] border-[#059669]'
                : 'border-[#CBD5E1] bg-white'
              }`}>
              {checked[item.id] && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className={`text-[12px] font-medium transition-colors
                ${checked[item.id] ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'}`}>
                {item.check}
              </p>
              <p className="text-[9px] text-[#94A3B8] uppercase tracking-wide mt-0.5">
                {item.category}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Complete button */}
      {allComplete && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ECFDF5]
                          border border-[#A7F3D0] rounded-lg">
            <CheckCircle2 size={16} className="text-[#059669] flex-shrink-0" />
            <p className="text-[12px] font-semibold text-[#059669]">
              Pre-flight complete — drone cleared for takeoff
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Component 4 — Drone Specs Card (RoboMonk actual specs) ───────────────────

const DroneSpecsCard = ({ drone }) => (
  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
      <Info size={14} className="text-[#64748B]" />
      <h3 className="text-[13px] font-semibold text-[#0F172A]">Hardware Specifications</h3>
      <span className="text-[10px] text-[#94A3B8] ml-auto">RoboMonk 450mm Quad-X</span>
    </div>
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        {[
          { label: 'Frame',             value: '450×450mm Quad-X'             },
          { label: 'Motors',            value: '4× A2212 1800KV BLDC'         },
          { label: 'ESCs',              value: '4× 30A'                       },
          { label: 'Propellers',        value: '4× 1045 (10 inch)'            },
          { label: 'Battery',           value: '3S 11.1V 5200mAh 40C'         },
          { label: 'Flight Time',       value: '12–18 min (target)'            },
          { label: 'Max Payload',       value: '300–500g (unverified)'         },
          { label: 'Flight Controller', value: 'Pixhawk 2.4.8'                },
          { label: 'Firmware',          value: 'ArduCopter / PX4'              },
          { label: 'RC System',         value: 'FlySky FS-i6S 2.4GHz'         },
          { label: 'Video',             value: '5.8GHz FPV → Controller'       },
          { label: '4G Telemetry',      value: 'Optional — confirm with vendor'},
        ].map(row => (
          <div key={row.label} className="flex items-start justify-between gap-2
                                           border-b border-[#F8FAFC] pb-2 last:border-0">
            <span className="text-[10px] text-[#94A3B8]">{row.label}</span>
            <span className="text-[11px] font-medium text-[#0F172A] text-right">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Important integration note */}
      <div className="mt-3 px-3 py-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
        <p className="text-[10px] font-semibold text-[#2563EB] mb-1">ResQMatrix Integration</p>
        <p className="text-[10px] text-[#1D4ED8] leading-relaxed">
          Telemetry via MQTT (GPS, battery, flight mode, status).
          Live video on pilot's controller — not integrated into ResQMatrix portal in v1.
        </p>
      </div>
    </div>
  </div>
);

// ── Component 5 — Deployment History ─────────────────────────────────────────

const DeploymentHistory = ({ drone }) => {
  const operations  = useDataStore(s => s.operations);
  const deployments = drone.deployments || [];

  if (deployments.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg mb-4">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
          <History size={14} className="text-[#64748B]" />
          <h3 className="text-[13px] font-semibold text-[#0F172A]">Deployment History</h3>
        </div>
        <EmptyState
          icon={History}
          title="No deployments yet"
          description="Flight logs will appear here after the first deployment"
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
        <History size={14} className="text-[#64748B]" />
        <h3 className="text-[13px] font-semibold text-[#0F172A]">Deployment History</h3>
        <span className="text-[10px] text-[#94A3B8] ml-auto">{deployments.length} flights</span>
      </div>
      <div className="divide-y divide-[#F8FAFC]">
        {deployments.map((dep, idx) => {
          const op = operations.find(o => o.id === dep.operationId);
          const duration = dep.endTime && dep.startTime
            ? Math.round((new Date(dep.endTime) - new Date(dep.startTime)) / 60000)
            : null;
          return (
            <div key={idx} className="px-5 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#F1F5F9] flex items-center
                              justify-center flex-shrink-0 text-[10px] font-bold text-[#64748B]">
                {deployments.length - idx}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  {op?.name || dep.operationId || 'Unknown operation'}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(dep.startTime).toLocaleDateString('en-IN')}
                  </span>
                  {duration && (
                    <span>{duration} min flight</span>
                  )}
                </div>
                {dep.notes && (
                  <p className="text-[10px] text-[#64748B] mt-0.5 italic">{dep.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────

const DronePage = () => {
  const motion_config  = useMotion();
  const drones         = useDataStore(s => s.drones);
  const [selectedDroneId, setSelectedDroneId] = useState(null);

  // Seed telemetry in store if not present (prototype mode)
  // In production this comes from MQTT via Socket.io
  const drone = drones.find(d => d.id === selectedDroneId) || drones[0];

  const telemetry = drone?.telemetry || SEED_TELEMETRY;

  // Environment conditions from mock (not from drone — from local weather sensors)
  const conditions = MOCK_DRONE.currentConditions;

  if (!drone) {
    return (
      <motion.div {...motion_config.fadeSlideUp}>
        <EmptyState
          icon={Plane}
          title="No drones registered"
          description="Add a drone in Settings → Drones to get started"
          action={() => window.location.href = '/settings'}
          actionLabel="Go to Settings"
        />
      </motion.div>
    );
  }

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
            Drone Operations
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            {drones.length} drone{drones.length !== 1 ? 's' : ''} registered ·
            Telemetry via MQTT · Video on controller
          </p>
        </div>

        {/* Drone selector if multiple */}
        {drones.length > 1 && (
          <select
            value={selectedDroneId || drone.id}
            onChange={e => setSelectedDroneId(e.target.value)}
            className="h-9 px-3 text-[12px] border border-[#E2E8F0] rounded-lg
                       bg-white focus:outline-none focus:border-[#2563EB]"
          >
            {drones.map(d => (
              <option key={d.id} value={d.id}>{d.model || d.id}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Two-column layout ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">

        {/* Left column */}
        <div>
          <TelemetryCard     drone={drone}  telemetry={telemetry} />
          <MissionPanel      drone={drone} />
          <PreflightChecklist droneId={drone.id} />
          <DeploymentHistory  drone={drone} />
        </div>

        {/* Right column */}
        <div>
          <DroneSpecsCard drone={drone} />

          {/* Current weather conditions */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <Radio size={14} className="text-[#7C3AED]" />
              <h3 className="text-[13px] font-semibold text-[#0F172A]">
                Field Conditions
              </h3>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {Object.entries(conditions || {}).slice(0, 5).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#94A3B8] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-[12px] font-semibold text-[#0F172A]">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default DronePage;
