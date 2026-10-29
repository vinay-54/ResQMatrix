import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence }                  from 'framer-motion';
import {
  FlaskConical, Play, Square, RefreshCw, Zap,
  Activity, AlertTriangle, AlertOctagon, CheckCircle2,
  Bell, Radio, Database, Wifi, ChevronDown, ChevronUp,
  Gauge, Cloud, Droplets, Thermometer, Timer, Terminal
} from 'lucide-react';
import useDataStore  from '../../store/useDataStore';
import { useMotion } from '../../hooks/useMotion';
import { ALERT_LEVELS } from '../../constants/alertLevels';

// ── Alert level helpers ───────────────────────────────────────────────────
const getAlertLevel = (wl, thresholds = {}) => {
  const t = {
    safe:     thresholds?.safe     ?? 80,
    watch:    thresholds?.watch    ?? 40,
    warning:  thresholds?.warning  ?? 25,
    danger:   thresholds?.danger   ?? 15,
    critical: thresholds?.critical ?? 8,
  };
  if (wl <= t.critical) return 'CRITICAL';
  if (wl <= t.danger)   return 'DANGER';
  if (wl <= t.warning)  return 'WARNING';
  if (wl <= t.watch)    return 'WATCH';
  return 'SAFE';
};

// ── Preset scenarios ──────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id:          'quick-storm',
    name:        'Quick Storm',
    icon:        '⛈️',
    description: 'Rapid rise to WARNING then recovery over 30 seconds',
    color:       '#D97706',
    steps: [
      { wl: 70, delay: 0    },
      { wl: 55, delay: 3000 },
      { wl: 38, delay: 6000 },
      { wl: 24, delay: 9000 },
      { wl: 20, delay: 12000},
      { wl: 30, delay: 17000},
      { wl: 50, delay: 22000},
      { wl: 75, delay: 28000},
    ],
  },
  {
    id:          'slow-flood',
    name:        'Slow Flood',
    icon:        '🌊',
    description: 'Gradual escalation through all 5 alert levels',
    color:       '#EA580C',
    steps: [
      { wl: 80, delay: 0    },
      { wl: 65, delay: 4000 },
      { wl: 42, delay: 8000 },
      { wl: 28, delay: 12000},
      { wl: 18, delay: 16000},
      { wl: 10, delay: 20000},
      { wl: 6,  delay: 24000},
    ],
  },
  {
    id:          'flash-flood',
    name:        'Flash Flood',
    icon:        '🚨',
    description: 'Instant jump to CRITICAL — maximum emergency response',
    color:       '#DC2626',
    steps: [
      { wl: 80, delay: 0    },
      { wl: 45, delay: 1500 },
      { wl: 12, delay: 3000 },
      { wl: 5,  delay: 4500 },
    ],
  },
  {
    id:          'dam-break',
    name:        'Dam Break',
    icon:        '💥',
    description: 'Multiple nodes escalate simultaneously to DANGER',
    color:       '#991B1B',
    multiNode:   true,
    steps: [
      { wl: 80, delay: 0    },
      { wl: 22, delay: 2000 },
      { wl: 14, delay: 4000 },
      { wl: 8,  delay: 6000 },
    ],
  },
  {
    id:          'recovery',
    name:        'Recovery',
    icon:        '✅',
    description: 'Simulate flood receding — all nodes return to SAFE',
    color:       '#059669',
    steps: [
      { wl: 10, delay: 0    },
      { wl: 20, delay: 3000 },
      { wl: 35, delay: 7000 },
      { wl: 55, delay: 12000},
      { wl: 75, delay: 18000},
      { wl: 85, delay: 24000},
    ],
  },
];

// ── Log entry types ───────────────────────────────────────────────────────
const LOG_TYPES = {
  mqtt:     { color: '#7C3AED', icon: Radio,         label: 'MQTT'     },
  alert:    { color: '#DC2626', icon: Bell,          label: 'ALERT'    },
  firebase: { color: '#F59E0B', icon: Database,      label: 'FIREBASE' },
  socket:   { color: '#2563EB', icon: Wifi,          label: 'SOCKET'   },
  system:   { color: '#64748B', icon: Activity,      label: 'SYSTEM'   },
  notify:   { color: '#059669', icon: CheckCircle2,  label: 'NOTIFY'   },
};

// ── Water level bar component ─────────────────────────────────────────────
const WaterBar = ({ waterLevel, alertLevel }) => {
  const cfg    = ALERT_LEVELS[alertLevel] || ALERT_LEVELS.SAFE;
  const fillPct = Math.max(0, Math.min(100, ((120 - waterLevel) / 112) * 100));

  return (
    <div className="relative h-32 w-10 bg-[#F1F5F9] rounded-full overflow-hidden
                    border border-[#E2E8F0] mx-auto">
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-full"
        animate={{ height: `${fillPct}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ backgroundColor: cfg.color + '90' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black text-[#0F172A] z-10 rotate-0">
          {waterLevel}
        </span>
      </div>
    </div>
  );
};

// ── Node simulator card ───────────────────────────────────────────────────
const NodeCard = ({ node, onWaterLevelChange }) => {
  const nodeId     = node.nodeId || node.id;
  const wl         = node.latest?.waterLevel ?? node.waterLevel ?? 80;
  const alertLevel = getAlertLevel(
    wl,
    node.thresholds
  );
  const cfg        = ALERT_LEVELS[alertLevel] || ALERT_LEVELS.SAFE;

  return (
    <div
      className="bg-white border-2 rounded-xl overflow-hidden transition-all"
      style={{ borderColor: cfg.color + '40' }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ backgroundColor: cfg.color + '10' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: cfg.color }}
          />
          <span className="text-[11px] font-bold text-[#0F172A] truncate max-w-[120px]">
            {node.name}
          </span>
        </div>
        <span
          className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
          style={{ color: cfg.color, backgroundColor: cfg.color + '15' }}
        >
          {alertLevel}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-end gap-4">
          <WaterBar waterLevel={wl} alertLevel={alertLevel} />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#94A3B8]">Water Level</span>
              <span
                className="text-[13px] font-black font-mono"
                style={{ color: cfg.color }}
              >
                {wl} cm
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={5}
              max={120}
              value={wl}
              onChange={e => onWaterLevelChange(nodeId, Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${cfg.color} 0%, ${cfg.color} ${((wl - 5) / 115) * 100}%, #E2E8F0 ${((wl - 5) / 115) * 100}%, #E2E8F0 100%)`,
              }}
            />

            {/* Threshold markers */}
            <div className="flex justify-between mt-1">
              {[
                { label: 'C', val: 8,  color: '#DC2626' },
                { label: 'D', val: 15, color: '#DC2626' },
                { label: 'W', val: 25, color: '#EA580C' },
                { label: 'W', val: 40, color: '#D97706' },
                { label: 'S', val: 80, color: '#059669' },
              ].map((t, i) => (
                <button
                  key={i}
                  onClick={() => onWaterLevelChange(nodeId, t.val)}
                  className="text-[8px] font-black px-1 rounded hover:bg-slate-100 transition-colors"
                  style={{ color: t.color }}
                  title={`Set to ${t.val}cm`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Log panel ─────────────────────────────────────────────────────────────
const LogPanel = ({ entries, onClear }) => (
  <div className="bg-[#0C1620] border border-[#1E3347] rounded-xl overflow-hidden
                  flex flex-col" style={{ height: 340 }}>
    <div className="flex items-center justify-between px-4 py-2.5 border-b
                    border-[#1E3347]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
        <span className="text-[11px] font-bold text-[#94A3B8] font-mono">
          PIPELINE LOG
        </span>
      </div>
      <button
        onClick={onClear}
        className="text-[10px] text-[#475569] hover:text-[#94A3B8] transition-colors"
      >
        Clear
      </button>
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 font-mono">
      <AnimatePresence initial={false}>
        {entries.length === 0 ? (
          <p className="text-[11px] text-[#334155] text-center py-8">
            Run a scenario or adjust a slider to see pipeline activity
          </p>
        ) : (
          entries.map(entry => {
            const type = LOG_TYPES[entry.type] || LOG_TYPES.system;
            const Icon = type.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0  }}
                transition={{ duration: 0.12 }}
                className="flex items-start gap-2 py-0.5"
              >
                <span className="text-[9px] text-[#334155] flex-shrink-0 mt-0.5 w-16">
                  {entry.time}
                </span>
                <span
                  className="text-[9px] font-bold flex-shrink-0 w-14"
                  style={{ color: type.color }}
                >
                  [{type.label}]
                </span>
                <Icon size={10} style={{ color: type.color }} className="flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-[#94A3B8] leading-tight">
                  {entry.message}
                </span>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────
const Simulation = () => {
  const motion_config   = useMotion();
  const nodes           = useDataStore(s => s.nodes);
  const updateNode      = useDataStore(s => s.updateNode);
  const addAlert        = useDataStore(s => s.addAlert);
  const addActivity     = useDataStore(s => s.addActivity);

  const [logEntries,    setLogEntries]    = useState([]);
  const [running,       setRunning]       = useState(false);
  const [activeScenario,setActiveScenario]= useState(null);
  const [elapsed,       setElapsed]       = useState(0);
  const [nodeAlertState, setNodeAlertState] = useState({});
  const [expandScenarios, setExpandScenarios] = useState(true);

  const timerRef    = useRef(null);
  const timeoutsRef = useRef([]);
  const logRef      = useRef([]);
  const entryIdRef  = useRef(0);

  // ── Log helper ──────────────────────────────────────────────────────────
  const addLog = useCallback((type, message) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const entry = { id: ++entryIdRef.current, type, message, time };
    logRef.current = [entry, ...logRef.current].slice(0, 200);
    setLogEntries([...logRef.current]);
  }, []);

  // ── Simulate full pipeline for a node ──────────────────────────────────
  const simulatePipeline = useCallback(async (nodeId, waterLevel) => {
    const node        = useDataStore.getState().nodes.find(n => n.nodeId === nodeId || n.id === nodeId);
    if (!node) return;
    const targetId    = node.id || node.nodeId || nodeId;

    const newLevel    = getAlertLevel(waterLevel, node.thresholds);
    const prevLevel   = node.alertLevel;
    const levelChanged = newLevel !== prevLevel;

    // Step 1 — MQTT packet received
    addLog('mqtt', `Received packet from ${targetId} — waterLevel: ${waterLevel}cm, commLayer: 4G`);

    // Step 2 — MongoDB write (simulated)
    const t1 = setTimeout(() => {
      addLog('system', `SensorReading saved to MongoDB — nodeId: ${targetId}, alertLevel: ${newLevel}`);

      // Step 3 — Update node in store
      updateNode(targetId, {
        waterLevel,
        alertLevel: newLevel,
        status:     'online',
        lastSeen:   Date.now(),
        latest: {
          waterLevel,
          temperature: 28 + Math.random() * 4,
          humidity:    75 + Math.random() * 10,
          pressure:    1012 + Math.random() * 5,
          rainfall:    waterLevel < 40,
          battery:     80 + Math.floor(Math.random() * 15),
          commLayer:   '4G',
          receivedAt:  Date.now(),
        },
      });

      // Track alert state per node
      setNodeAlertState(prev => ({ ...prev, [targetId]: newLevel }));

    }, 120);
    timeoutsRef.current.push(t1);

    // Step 4 — Firebase update
    const t2 = setTimeout(() => {
      addLog('firebase', `idms/nodes/${targetId} updated — alertLevel: ${newLevel}, waterLevel: ${waterLevel}cm`);
    }, 200);
    timeoutsRef.current.push(t2);

    // Step 5 — Socket.io emit
    const t3 = setTimeout(() => {
      addLog('socket', `admin-room ← sensor:live { nodeId: ${targetId}, alertLevel: ${newLevel} }`);
    }, 250);
    timeoutsRef.current.push(t3);

    // Step 6 — Alert generation (only on level change)
    if (levelChanged && newLevel !== 'SAFE') {
      const t4 = setTimeout(() => {
        addLog('alert', `LEVEL CHANGE ${prevLevel} → ${newLevel} — generating alert for ${node.name}`);

        const alert = {
          id:             `sim-alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          nodeId:         targetId,
          nodeName:       node.name,
          nodeLocation:   node.location || 'Simulated Location',
          level:          newLevel,
          message:        `${node.name}: water level ${waterLevel}cm — ${newLevel} [SIMULATED]`,
          citizenMessage: `Water level ${newLevel === 'CRITICAL' ? 'is extremely dangerous' : newLevel === 'DANGER' ? 'is dangerously high' : 'is rising fast'} at ${node.name}`,
          waterLevel,
          channels:       ['WARNING','DANGER','CRITICAL'].includes(newLevel) ? ['FCM'] : [],
          isSOS:          false,
          timestamp:      Date.now(),
          acknowledged:   false,
        };

        addAlert(alert);
        addActivity({
          teamName: 'Simulation Engine',
          type:     'alert',
          message:  `[SIM] ${node.name} escalated to ${newLevel} — ${waterLevel}cm`,
          level:    newLevel === 'SAFE' ? 'info' : 'warning',
        });

        addLog('system', `Alert created in MongoDB — level: ${newLevel}, nodeId: ${targetId}`);
        addLog('socket', `admin-room ← alert:new { level: ${newLevel}, nodeName: ${node.name} }`);
        addLog('firebase', `idms/system/activeAlertCount incremented`);

        if (['WARNING','DANGER','CRITICAL'].includes(newLevel)) {
          addLog('socket', `user-room ← alert:citizen { level: ${newLevel}, citizenMessage: ... }`);
        }
      }, 400);
      timeoutsRef.current.push(t4);

      // Step 7 — Notifications
      if (['DANGER','CRITICAL'].includes(newLevel)) {
        const t5 = setTimeout(() => {
          addLog('notify', `FCM broadcast → topic: idms-alerts — "${newLevel} flood alert at ${node.name}"`);
          addLog('notify', `SMS broadcast → users with notifySMS: true`);
        }, 600);
        timeoutsRef.current.push(t5);
      } else if (newLevel === 'WARNING') {
        const t6 = setTimeout(() => {
          addLog('notify', `FCM broadcast → topic: idms-alerts — "Flood warning at ${node.name}"`);
        }, 600);
        timeoutsRef.current.push(t6);
      }
    } else if (levelChanged && newLevel === 'SAFE') {
      const t7 = setTimeout(() => {
        addLog('system', `${node.name} returned to SAFE — no alert generated`);
        addLog('firebase', `idms/system/activeAlertCount decremented`);
      }, 400);
      timeoutsRef.current.push(t7);
    }
  }, [addLog, updateNode, addAlert, addActivity]);

  // ── Manual slider change ────────────────────────────────────────────────
  const handleWaterLevelChange = useCallback((nodeId, waterLevel) => {
    simulatePipeline(nodeId, waterLevel);
  }, [simulatePipeline]);

  // ── Run scenario ────────────────────────────────────────────────────────
  const runScenario = useCallback((scenario) => {
    if (running) return;

    setRunning(true);
    setActiveScenario(scenario.id);
    setElapsed(0);

    addLog('system', `━━━ Scenario started: ${scenario.name} ━━━`);
    addLog('system', `${scenario.description}`);

    const targetNodes = scenario.multiNode ? nodes : [nodes[0]];

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // Schedule steps
    scenario.steps.forEach(step => {
      targetNodes.forEach(node => {
        const targetId = node.nodeId || node.id;
        const t = setTimeout(() => {
          simulatePipeline(targetId, step.wl);
        }, step.delay + (targetNodes.indexOf(node) * 300));
        timeoutsRef.current.push(t);
      });
    });

    // Calculate total duration
    const lastDelay = Math.max(...scenario.steps.map(s => s.delay));
    const endTimeout = setTimeout(() => {
      setRunning(false);
      setActiveScenario(null);
      clearInterval(timerRef.current);
      addLog('system', `━━━ Scenario complete: ${scenario.name} ━━━`);
    }, lastDelay + 2000 + (targetNodes.length * 300));

    timeoutsRef.current.push(endTimeout);
  }, [running, nodes, simulatePipeline, addLog]);

  // ── Stop scenario ───────────────────────────────────────────────────────
  const stopScenario = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    clearInterval(timerRef.current);
    setRunning(false);
    setActiveScenario(null);
    setElapsed(0);
    addLog('system', '⛔ Scenario stopped by operator');
  }, [addLog]);

  // ── Reset all nodes ─────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    if (running) stopScenario();
    nodes.forEach(node => {
      const targetId = node.nodeId || node.id;
      updateNode(targetId, {
        waterLevel: 85,
        alertLevel: 'SAFE',
        status:     'online',
        lastSeen:   Date.now(),
        latest: {
          waterLevel:   85,
          temperature:  27,
          humidity:     68,
          pressure:     1013,
          rainfall:     false,
          battery:      95,
          commLayer:    '4G',
          receivedAt:   Date.now(),
        },
      });
    });
    setNodeAlertState({});
    addLog('system', '🔄 All nodes reset to SAFE — waterLevel: 85cm');
    addLog('firebase', 'idms/nodes/* — all alertLevels set to SAFE');
    addLog('socket', 'admin-room ← sensor:live (all nodes SAFE)');
  }, [running, nodes, updateNode, stopScenario, addLog]);

  // Cleanup on unmount
  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    clearInterval(timerRef.current);
  }, []);

  // ── Summary stats ───────────────────────────────────────────────────────
  const levelCounts = nodes.reduce((acc, n) => {
    acc[n.alertLevel] = (acc[n.alertLevel] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div {...motion_config.fadeSlideUp}>

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={18} className="text-[#7C3AED]" />
            <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
              Simulation Mode
            </h1>
            {running && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold
                               text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full
                               border border-[#A7F3D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                RUNNING {elapsed}s
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#64748B]">
            Simulate flood escalation without hardware — test the complete pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <button
              onClick={stopScenario}
              className="flex items-center gap-2 px-4 py-2 bg-[#FEF2F2]
                         border border-[#FECACA] text-[#DC2626] rounded-lg
                         text-[12px] font-semibold hover:bg-[#FEE2E2] transition-colors"
            >
              <Square size={13} />
              Stop
            </button>
          )}
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 bg-white
                       border border-[#E2E8F0] text-[#475569] rounded-lg
                       text-[12px] font-semibold hover:bg-[#F8FAFC] transition-colors"
          >
            <RefreshCw size={13} />
            Reset All to Safe
          </button>
        </div>
      </div>

      {/* ── Status summary ──────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { level:'SAFE',     color:'#059669', bg:'#ECFDF5' },
          { level:'WATCH',    color:'#D97706', bg:'#FFFBEB' },
          { level:'WARNING',  color:'#EA580C', bg:'#FFF7ED' },
          { level:'DANGER',   color:'#DC2626', bg:'#FEF2F2' },
          { level:'CRITICAL', color:'#991B1B', bg:'#FEF2F2' },
        ].map(({ level, color, bg }) => (
          <div key={level}
               className="rounded-lg border px-3 py-2.5 text-center"
               style={{ backgroundColor: bg, borderColor: color + '30' }}>
            <p className="text-[22px] font-black" style={{ color }}>
              {levelCounts[level] || 0}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wide"
               style={{ color: color + 'BB' }}>
              {level}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">

        {/* LEFT — Node controls + scenarios */}
        <div className="space-y-5">

          {/* Scenarios */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandScenarios(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5
                         border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[#7C3AED]" />
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  Preset Scenarios
                </span>
                <span className="text-[10px] text-[#94A3B8]">
                  {SCENARIOS.length} scenarios
                </span>
              </div>
              {expandScenarios
                ? <ChevronUp size={16} className="text-[#94A3B8]" />
                : <ChevronDown size={16} className="text-[#94A3B8]" />
              }
            </button>

            {expandScenarios && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {SCENARIOS.map(scenario => {
                  const isActive = activeScenario === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => isActive ? stopScenario() : runScenario(scenario)}
                      disabled={running && !isActive}
                      className="flex items-start gap-3 p-3.5 rounded-lg border-2
                                 text-left transition-all disabled:opacity-40
                                 disabled:cursor-not-allowed
                                 active:scale-[0.97]"
                      style={{
                        borderColor:     isActive ? scenario.color : '#E2E8F0',
                        backgroundColor: isActive ? scenario.color + '08' : 'white',
                      }}
                    >
                      <span className="text-[22px] flex-shrink-0">{scenario.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[12px] font-bold text-[#0F172A]">
                            {scenario.name}
                          </p>
                          {isActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5
                                             rounded-full animate-pulse"
                                  style={{ color: scenario.color,
                                           backgroundColor: scenario.color + '15' }}>
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
                          {scenario.description}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {isActive
                            ? <Square size={11} style={{ color: scenario.color }} />
                            : <Play   size={11} style={{ color: scenario.color }} />
                          }
                          <span className="text-[10px] font-semibold"
                                style={{ color: scenario.color }}>
                            {isActive ? 'Stop' : 'Run Scenario'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Node sliders */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <Gauge size={14} className="text-[#2563EB]" />
              <h3 className="text-[13px] font-semibold text-[#0F172A]">
                Manual Node Control
              </h3>
              <span className="text-[10px] text-[#94A3B8]">
                Drag sliders or click threshold buttons
              </span>
            </div>
            <div className="p-4">
              {nodes.length === 0 ? (
                <div className="text-center py-8 text-[#94A3B8] text-[13px]">
                  No sensor nodes configured. Add nodes in Settings → Sensor Nodes.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nodes.map(node => (
                    <NodeCard
                      key={node.nodeId || node.id}
                      node={node}
                      onWaterLevelChange={handleWaterLevelChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pipeline diagram */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9]">
              <Activity size={14} className="text-[#059669]" />
              <h3 className="text-[13px] font-semibold text-[#0F172A]">
                Pipeline — What Happens on Each Reading
              </h3>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-0 flex-wrap">
                {[
                  { icon: Radio,        label: 'MQTT',       color: '#7C3AED', desc: 'ESP32 publishes'        },
                  { icon: Database,     label: 'MongoDB',    color: '#F59E0B', desc: 'SensorReading saved'    },
                  { icon: Activity,     label: 'Alert Engine',color:'#DC2626', desc: 'Threshold checked'      },
                  { icon: Database,     label: 'Firebase',   color: '#F59E0B', desc: 'Live state updated'     },
                  { icon: Wifi,         label: 'Socket.io',  color: '#2563EB', desc: 'Admin map updated'      },
                  { icon: Bell,         label: 'FCM / SMS',  color: '#059669', desc: 'Citizens notified'      },
                ].map((step, i, arr) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center gap-1 px-2 py-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                             style={{ backgroundColor: step.color + '15' }}>
                          <Icon size={16} style={{ color: step.color }} />
                        </div>
                        <p className="text-[9px] font-bold text-[#0F172A] text-center">
                          {step.label}
                        </p>
                        <p className="text-[8px] text-[#94A3B8] text-center w-16 leading-tight">
                          {step.desc}
                        </p>
                      </div>
                      {i < arr.length - 1 && (
                        <span className="text-[#E2E8F0] text-[16px] flex-shrink-0">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Live log */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F1F5F9]">
              <Terminal size={13} className="text-[#7C3AED]" />
              <h3 className="text-[12px] font-semibold text-[#0F172A]">Live Pipeline Log</h3>
            </div>
            <div className="p-3">
              <LogPanel
                entries={logEntries}
                onClear={() => {
                  logRef.current = [];
                  setLogEntries([]);
                }}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F1F5F9]">
              <p className="text-[12px] font-semibold text-[#0F172A]">Quick Actions</p>
            </div>
            <div className="p-3 space-y-2">
              {[
                {
                  label: 'Set all nodes → SAFE',
                  color: '#059669',
                  wl:    85,
                  bg:    '#ECFDF5',
                },
                {
                  label: 'Set all nodes → WARNING',
                  color: '#EA580C',
                  wl:    22,
                  bg:    '#FFF7ED',
                },
                {
                  label: 'Set all nodes → DANGER',
                  color: '#DC2626',
                  wl:    13,
                  bg:    '#FEF2F2',
                },
                {
                  label: 'Set all nodes → CRITICAL',
                  color: '#991B1B',
                  wl:    6,
                  bg:    '#FEF2F2',
                },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => {
                    nodes.forEach((node, i) => {
                      const targetId = node.nodeId || node.id;
                      setTimeout(() => {
                        simulatePipeline(targetId, action.wl);
                      }, i * 400);
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-lg text-[12px] font-semibold
                             text-left transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ backgroundColor: action.bg, color: action.color,
                           border: `1px solid ${action.color}30` }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warning banner */}
          <div className="px-4 py-3 bg-[#FFFBEB] border border-[#FDE68A]
                          rounded-lg flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#92400E] leading-relaxed">
              Simulation updates the live store and generates real alerts.
              These appear in Alert Center, on the Live Map, and in the User Portal.
              Click Reset All to Safe to clear after demo.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Simulation;

