import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MOCK_NODES,
  MOCK_ALERTS_FULL,
  MOCK_RESCUE,
  MOCK_DRONE,
  MOCK_PURIFICATION,
  MOCK_PURIFICATION_HISTORY,
  MOCK_PREDICTIONS,
  MOCK_DAILY_SUMMARY,
  MOCK_ALERT_FREQUENCY,
  MOCK_PURIFICATION_DAILY,
  MOCK_EVENT_LOG,
  MOCK_HISTORIES,
} from '../data/mockData';

// ── Initial seed data ────────────────────────────────────────────────────────
const INITIAL_NODES = MOCK_NODES.map(n => ({ ...n }));

const INITIAL_OPERATIONS = [
  {
    id:          'OP-001',
    name:        'East Parking Flood Response',
    type:        'Flood',
    location:    'East Parking Zone, SVCE',
    lat:         13.6285,
    lng:         79.4205,
    startTime:   new Date(Date.now() - 2 * 3600000).toISOString(),
    status:      'active',
    priority:    'high',
    assignedTeams:    ['T-01', 'T-03'],
    assignedResources:['R-01', 'R-02', 'R-05'],
    description: 'Active flood response at East Parking Zone. Water level at Warning (22cm). Evacuation in progress.',
  },
  {
    id:          'OP-002',
    name:        'Canteen Block Monitoring',
    type:        'Monitoring',
    location:    'Canteen Block, SVCE',
    lat:         13.6291,
    lng:         79.4198,
    startTime:   new Date(Date.now() - 5 * 3600000).toISOString(),
    status:      'active',
    priority:    'medium',
    assignedTeams:    ['T-02'],
    assignedResources:['R-03'],
    description: 'Water level monitoring at Watch threshold (38cm). Team on standby.',
  },
];

const INITIAL_DRONES = [
  {
    id:     'DR-001',
    model:  'RoboMonk 450mm Quad-X',
    status: 'standby',
    assignedOperation: null,
    assignedOperator:  null,
    missionStatus:     'idle',
    deployments:       [],
    videoStreamUrl:    null,   // null until optional integration
    videoEnabled:      false,  // false — architecture decision
    telemetry: {
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
    },
    specs: {
      frameSize:   '450mm Quad-X',
      material:    'Carbon fibre / Aluminium',
      motors:      'A2212 1800KV × 4',
      escs:        '30A × 4',
      propellers:  '1045 × 4',
      battery:     '3S 11.1V 5200mAh 40C',
      flightTime:  '12–18 min (target)',
      maxPayload:  '300–500g (unverified)',
      fc:          'Pixhawk 2.4.8',
      firmware:    'ArduCopter',
      rc:          'FlySky FS-i6S 2.4GHz',
      video:       '5.8GHz FPV → Controller',
      telemetry4G: 'Optional — confirm with vendor',
    },
  },
];

const INITIAL_CHECKLIST = MOCK_DRONE.preflight.map(item => ({ ...item, enabled: true }));

const INITIAL_TEAMS   = MOCK_RESCUE.teams.map(t => ({ ...t }));
const INITIAL_RESOURCES = MOCK_RESCUE.resources.map(r => ({ ...r }));

const INITIAL_RESCUE_CAMPS = [
  {
    id:       'RC-01',
    name:     'Main Gate Command Post',
    lat:      13.6288,
    lng:      79.4192,
    capacity: 200,
    status:   'active',
    contact:  '+91 98765 43210',
  },
  {
    id:       'RC-02',
    name:     'Sports Ground Relief Camp',
    lat:      13.6279,
    lng:      79.4199,
    capacity: 500,
    status:   'active',
    contact:  '+91 98765 43211',
  },
  {
    id:       'RC-03',
    name:     'Lab Building Emergency Shelter',
    lat:      13.6294,
    lng:      79.4188,
    capacity: 150,
    status:   'active',
    contact:  '+91 98765 43212',
  },
];

const INITIAL_DANGER_ZONES = [
  {
    id:     'DZ-01',
    name:   'East Parking Zone — Flooded',
    lat:    13.6285,
    lng:    79.4205,
    radius: 80,
    level:  'WARNING',
    reason: 'Water level 22cm — Warning threshold crossed',
  },
  {
    id:     'DZ-02',
    name:   'Canteen Block — Watch',
    lat:    13.6291,
    lng:    79.4198,
    radius: 50,
    level:  'WATCH',
    reason: 'Water level 38cm — Watch threshold crossed',
  },
];

const INITIAL_DEPLOYMENT_AREAS = [
  { id: 'DA-01', name: 'SVCE Campus',         default: true  },
  { id: 'DA-02', name: 'Tirupati City',        default: false },
  { id: 'DA-03', name: 'Flood-prone Village',  default: false },
];

// ── Store ────────────────────────────────────────────────────────────────────
const useDataStore = create(
  persist(
    (set, get) => ({

      // ── State ──────────────────────────────────────────────────────────────
      nodes:           INITIAL_NODES,
      operations:      INITIAL_OPERATIONS,
      drones:          INITIAL_DRONES,
      checklist:       INITIAL_CHECKLIST,
      teams:           INITIAL_TEAMS,
      resources:       INITIAL_RESOURCES,
      rescueCamps:     INITIAL_RESCUE_CAMPS,
      dangerZones:     INITIAL_DANGER_ZONES,
      deploymentAreas: INITIAL_DEPLOYMENT_AREAS,
      activeAreaId:    'DA-01',
      alerts:          MOCK_ALERTS_FULL,
      activityLog:     MOCK_RESCUE.activityLog,
      safetyReports:   [],

      // ── Selectors ─────────────────────────────────────────────────────────
      getActiveArea: () => {
        const s = get();
        return s.deploymentAreas.find(a => a.id === s.activeAreaId);
      },
      getNodeById: (id) => get().nodes.find(n => n.id === id),
      getTeamById: (id) => get().teams.find(t => t.id === id),
      getOperationById: (id) => get().operations.find(o => o.id === id),

      // ── Node CRUD ──────────────────────────────────────────────────────────
      addNode: (node) => set(s => ({
        nodes: [...s.nodes, {
          ...node,
          lastSeen: Date.now(),
          uptime:   '0h',
          id:       node.id || `node-${Date.now()}`,
        }],
      })),

      updateNode: (id, updates) => set(s => ({
        nodes: s.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
      })),

      deleteNode: (id) => set(s => ({
        nodes: s.nodes.filter(n => n.id !== id),
        alerts: s.alerts.filter(a => a.nodeId !== id),
      })),

      // ── Operation CRUD ────────────────────────────────────────────────────
      addOperation: (op) => set(s => ({
        operations: [...s.operations, {
          ...op,
          id: op.id || `OP-${String(s.operations.length + 1).padStart(3,'0')}`,
          startTime: new Date().toISOString(),
        }],
      })),

      updateOperation: (id, updates) => set(s => ({
        operations: s.operations.map(o => o.id === id ? { ...o, ...updates } : o),
      })),

      deleteOperation: (id) => set(s => ({
        operations: s.operations.filter(o => o.id !== id),
      })),

      // ── Drone CRUD ────────────────────────────────────────────────────────
      addDrone: (drone) => set(s => ({
        drones: [...s.drones, {
          ...drone,
          id: drone.id || `UAV-${Date.now()}`,
        }],
      })),

      updateDrone: (id, updates) => set(s => ({
        drones: s.drones.map(d => d.id === id ? { ...d, ...updates } : d),
      })),

      deleteDrone: (id) => set(s => ({
        drones: s.drones.filter(d => d.id !== id),
      })),

      // Update drone telemetry (called by MQTT handler in production)
      updateDroneTelemetry: (id, telemetryUpdate) => set(s => ({
        drones: s.drones.map(d =>
          d.id === id
            ? {
                ...d,
                telemetry: { ...d.telemetry, ...telemetryUpdate, lastSeen: Date.now() },
                status: telemetryUpdate.connectionStatus === 'disconnected' ? 'offline' : d.status,
              }
            : d
        ),
      })),

      // Log a deployment to a drone's history
      logDeployment: (droneId, deployment) => set(s => ({
        drones: s.drones.map(d =>
          d.id === droneId
            ? {
                ...d,
                deployments: [
                  { ...deployment, startTime: new Date().toISOString() },
                  ...(d.deployments || []),
                ],
              }
            : d
        ),
      })),

      // ── Checklist CRUD ────────────────────────────────────────────────────
      addChecklistItem: (item) => set(s => ({
        checklist: [...s.checklist, {
          ...item,
          id:      `pf-${Date.now()}`,
          enabled: true,
        }],
      })),

      updateChecklistItem: (id, updates) => set(s => ({
        checklist: s.checklist.map(c => c.id === id ? { ...c, ...updates } : c),
      })),

      deleteChecklistItem: (id) => set(s => ({
        checklist: s.checklist.filter(c => c.id !== id),
      })),

      toggleChecklistItem: (id) => set(s => ({
        checklist: s.checklist.map(c =>
          c.id === id ? { ...c, enabled: !c.enabled } : c
        ),
      })),

      // ── Team CRUD ─────────────────────────────────────────────────────────
      addTeam: (team) => set(s => ({
        teams: [...s.teams, {
          ...team,
          id:         team.id || `T-${String(s.teams.length + 1).padStart(2,'0')}`,
          lastUpdate: Date.now(),
        }],
      })),

      updateTeam: (id, updates) => set(s => ({
        teams: s.teams.map(t =>
          t.id === id ? { ...t, ...updates, lastUpdate: Date.now() } : t
        ),
      })),

      deleteTeam: (id) => set(s => ({
        teams:     s.teams.filter(t => t.id !== id),
        resources: s.resources.map(r =>
          r.team === id ? { ...r, team: null, status: 'standby' } : r
        ),
      })),

      // ── Rescue Camp CRUD ──────────────────────────────────────────────────
      addRescueCamp: (camp) => set(s => ({
        rescueCamps: [...s.rescueCamps, {
          ...camp,
          id: camp.id || `RC-${Date.now()}`,
        }],
      })),

      updateRescueCamp: (id, updates) => set(s => ({
        rescueCamps: s.rescueCamps.map(c => c.id === id ? { ...c, ...updates } : c),
      })),

      deleteRescueCamp: (id) => set(s => ({
        rescueCamps: s.rescueCamps.filter(c => c.id !== id),
      })),

      // ── Danger Zone CRUD ──────────────────────────────────────────────────
      addDangerZone: (zone) => set(s => ({
        dangerZones: [...s.dangerZones, {
          ...zone,
          id: zone.id || `DZ-${Date.now()}`,
        }],
      })),

      deleteDangerZone: (id) => set(s => ({
        dangerZones: s.dangerZones.filter(z => z.id !== id),
      })),

      // ── Deployment Area ───────────────────────────────────────────────────
      setActiveArea: (areaId) => set({ activeAreaId: areaId }),

      addDeploymentArea: (area) => set(s => ({
        deploymentAreas: [...s.deploymentAreas, {
          ...area,
          id:      area.id || `DA-${Date.now()}`,
          default: false,
        }],
      })),

      // ── Alert actions ─────────────────────────────────────────────────────
      acknowledgeAlert: (id) => set(s => ({
        alerts: s.alerts.map(a =>
          a.id === id ? { ...a, acknowledged: true } : a
        ),
      })),

      addAlert: (alert) => set(s => ({
        alerts: [{ ...alert, id: `alert-${Date.now()}`, acknowledged: false }, ...s.alerts],
      })),

      // ── Activity Log ──────────────────────────────────────────────────────
      addActivity: (entry) => set(s => ({
        activityLog: [
          {
            ...entry,
            id:   `ACT-${Date.now()}`,
            time: Date.now(),
          },
          ...s.activityLog,
        ].slice(0, 100),
      })),

      // ── Safety Reports (citizen check-ins) ─────────────────────────────────
      addSafetyReport: (report) => set(s => ({
        safetyReports: [
          {
            ...report,
            id:        `SAFE-${Date.now()}`,
            timestamp: Date.now(),
          },
          ...s.safetyReports,
        ],
      })),

      updateSafetyReport: (id, updates) => set(s => ({
        safetyReports: s.safetyReports.map(r =>
          r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
        ),
      })),

      // ── Reset to seed data ────────────────────────────────────────────────
      resetToDefaults: () => set({
        nodes:           INITIAL_NODES,
        operations:      INITIAL_OPERATIONS,
        drones:          INITIAL_DRONES,
        checklist:       INITIAL_CHECKLIST,
        teams:           INITIAL_TEAMS,
        resources:       INITIAL_RESOURCES,
        rescueCamps:     INITIAL_RESCUE_CAMPS,
        dangerZones:     INITIAL_DANGER_ZONES,
        deploymentAreas: INITIAL_DEPLOYMENT_AREAS,
        activeAreaId:    'DA-01',
        alerts:          MOCK_ALERTS_FULL,
        activityLog:     MOCK_RESCUE.activityLog,
        safetyReports:   [],
      }),
    }),
    {
      name:    'idms-data',
      partialize: (s) => ({
        nodes:           s.nodes,
        operations:      s.operations,
        drones:          s.drones,
        checklist:       s.checklist,
        teams:           s.teams,
        resources:       s.resources,
        rescueCamps:     s.rescueCamps,
        dangerZones:     s.dangerZones,
        deploymentAreas: s.deploymentAreas,
        activeAreaId:    s.activeAreaId,
        safetyReports:   s.safetyReports,
      }),
    }
  )
);

export default useDataStore;
