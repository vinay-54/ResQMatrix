import { ALERT_LEVELS, CONNECTIVITY_TIERS } from '../constants/alertLevels';

export const MOCK_NODES = [
  {
    id:          'node-01',
    name:        'Main Gate',
    location:    'SVCE Main Entrance',
    lat:         13.6288,
    lng:         79.4192,
    waterLevel:  82,        // cm distance from sensor to water — 82cm = safe
    alertLevel:  'SAFE',
    connectivity:'FOUR_G',
    battery:     94,        // percentage
    solar:       true,
    temperature: 28.4,
    humidity:    72,
    pressure:    1012,
    rain:        false,
    tdsInput:    340,
    tdsOutput:   22,
    lastSeen:    Date.now() - 15000,
    uptime:      '6d 14h',
  },
  {
    id:          'node-02',
    name:        'Canteen Block',
    location:    'Near College Canteen',
    lat:         13.6291,
    lng:         79.4198,
    waterLevel:  38,        // 38cm — WATCH level
    alertLevel:  'WATCH',
    connectivity:'FOUR_G',
    battery:     81,
    solar:       true,
    temperature: 29.1,
    humidity:    78,
    pressure:    1010,
    rain:        true,
    tdsInput:    null,
    tdsOutput:   null,
    lastSeen:    Date.now() - 22000,
    uptime:      '6d 14h',
  },
  {
    id:          'node-03',
    name:        'Parking Area',
    location:    'East Parking Zone',
    lat:         13.6285,
    lng:         79.4205,
    waterLevel:  22,        // 22cm — WARNING level
    alertLevel:  'WARNING',
    connectivity:'TWO_G',   // Degraded to 2G
    battery:     67,
    solar:       true,
    temperature: 29.8,
    humidity:    83,
    pressure:    1009,
    rain:        true,
    tdsInput:    null,
    tdsOutput:   null,
    lastSeen:    Date.now() - 45000,
    uptime:      '6d 13h',
  },
  {
    id:          'node-04',
    name:        'Sports Ground',
    location:    'South Sports Complex',
    lat:         13.6279,
    lng:         79.4199,
    waterLevel:  71,        // 71cm — SAFE
    alertLevel:  'SAFE',
    connectivity:'FOUR_G',
    battery:     88,
    solar:       true,
    temperature: 28.9,
    humidity:    70,
    pressure:    1013,
    rain:        false,
    tdsInput:    null,
    tdsOutput:   null,
    lastSeen:    Date.now() - 18000,
    uptime:      '6d 14h',
  },
  {
    id:          'node-05',
    name:        'Lab Terrace',
    location:    'Main Lab Building, Roof',
    lat:         13.6294,
    lng:         79.4188,
    waterLevel:  90,        // 90cm — deepest, SAFE
    alertLevel:  'SAFE',
    connectivity:'FOUR_G',
    battery:     76,
    solar:       true,
    temperature: 30.2,
    humidity:    68,
    pressure:    1011,
    rain:        false,
    tdsInput:    null,
    tdsOutput:   null,
    lastSeen:    Date.now() - 12000,
    uptime:      '6d 14h',
  },
];

export const MOCK_ALERTS = [
  {
    id:           'alert-001',
    nodeId:       'node-03',
    nodeName:     'Parking Area',
    level:        'WARNING',
    message:      'Water level crossed 25cm threshold',
    detail:       'Current reading: 22cm. Connectivity degraded to 2G SMS.',
    timestamp:    Date.now() - 8 * 60 * 1000,
    acknowledged: false,
    channels:     ['SMS', 'FCM'],
  },
  {
    id:           'alert-002',
    nodeId:       'node-02',
    nodeName:     'Canteen Block',
    level:        'WATCH',
    message:      'Water level crossed 40cm threshold',
    detail:       'Active rainfall detected. Monitoring elevated.',
    timestamp:    Date.now() - 23 * 60 * 1000,
    acknowledged: false,
    channels:     ['FCM'],
  },
  {
    id:           'alert-003',
    nodeId:       'node-03',
    nodeName:     'Parking Area',
    level:        'WARNING',
    message:      'Connectivity downgraded to 2G SMS',
    detail:       '4G signal lost. Fallback active, data continuing via SMS.',
    timestamp:    Date.now() - 41 * 60 * 1000,
    acknowledged: true,
    channels:     ['SMS'],
  },
  {
    id:           'alert-004',
    nodeId:       'node-01',
    nodeName:     'Main Gate',
    level:        'SAFE',
    message:      'System initialised — all channels active',
    detail:       'Node online. 4G connected. Solar charging.',
    timestamp:    Date.now() - 6 * 60 * 60 * 1000,
    acknowledged: true,
    channels:     ['FCM'],
  },
];

export const MOCK_SYSTEM = {
  uptime:          '6d 14h 22m',
  totalDataPoints: 68420,
  smsAlertsSent:   3,
  fcmSentToday:    7,
  roOutputToday:   42.6,          // litres
  tdsOutput:       22,
  droneStatus:     'standby',
  droneBattery:    100,
  lastSync:        Date.now() - 15000,
  simulationMode:  false,
};

// Generate 48 hourly water level readings per node
// Simulates a realistic pattern: stable, then rising, then stabilising
export const generateNodeHistory = (nodeId, currentLevel) => {
  const now    = Date.now();
  const HOUR   = 3600000;
  const points = [];

  // Seed a realistic 48-hour pattern based on nodeId
  const patterns = {
    'node-01': { base: 85, variance: 6,  trend: -3  },  // stable/safe
    'node-02': { base: 72, variance: 18, trend: -34 },  // declining — rising water
    'node-03': { base: 60, variance: 25, trend: -38 },  // sharp decline — warning
    'node-04': { base: 78, variance: 8,  trend: -7  },  // mostly stable
    'node-05': { base: 92, variance: 4,  trend: -2  },  // very stable
  };

  const p = patterns[nodeId] || { base: 80, variance: 10, trend: -5 };

  for (let i = 47; i >= 0; i--) {
    const hoursAgo  = i;
    const progress  = 1 - (i / 47);   // 0 at start, 1 at current
    const trendVal  = p.trend * progress;
    const noise     = (Math.random() - 0.5) * p.variance * 0.4;
    const level     = Math.max(5, Math.min(120, p.base + trendVal + noise));
    const timestamp = now - (hoursAgo * HOUR);

    points.push({
      time:       timestamp,
      timeLabel:  new Date(timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit', hour12: false
                  }),
      dateLabel:  new Date(timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short'
                  }),
      waterLevel: Math.round(level * 10) / 10,
      hour:       new Date(timestamp).getHours(),
    });
  }

  // Force last point to match current reading
  if (points.length > 0) {
    points[points.length - 1].waterLevel = currentLevel;
  }

  return points;
};

// Pre-generate histories for all nodes
export const MOCK_HISTORIES = Object.fromEntries(
  MOCK_NODES.map(node => [node.id, generateNodeHistory(node.id, node.waterLevel)])
);

export const MOCK_ALERTS_FULL = [
  {
    id:           'alert-001',
    nodeId:       'node-03',
    nodeName:     'Parking Area',
    nodeLocation: 'East Parking Zone',
    level:        'WARNING',
    message:      'Water level at 22cm — approaching danger threshold',
    detail:       'Continuous decline over 4 hours. Rain sensor active. Level crossed 25cm warning threshold. Recommend pre-positioning rescue team at zone boundary.',
    timestamp:    Date.now() - 2 * 60 * 1000,
    acknowledged: false,
    channels:     ['SMS', 'FCM', 'WhatsApp'],
  },
  {
    id:           'alert-002',
    nodeId:       'node-02',
    nodeName:     'Canteen Block',
    nodeLocation: 'Near College Canteen',
    level:        'WATCH',
    message:      'Water level crossed 40cm threshold',
    detail:       'Active rainfall detected. Water level declining from 72cm base. First threshold crossing today. FCM alert dispatched to registered rescue coordinators.',
    timestamp:    Date.now() - 23 * 60 * 1000,
    acknowledged: false,
    channels:     ['FCM'],
  },
  {
    id:           'alert-003',
    nodeId:       'node-03',
    nodeName:     'Parking Area',
    nodeLocation: 'East Parking Zone',
    level:        'WARNING',
    message:      'Connectivity downgraded to 2G SMS fallback',
    detail:       '4G LTE signal lost at node-03. System automatically activated 2G SMS fallback. Data continuity maintained. SMS delivery confirmed.',
    timestamp:    Date.now() - 41 * 60 * 1000,
    acknowledged: true,
    channels:     ['SMS'],
  },
  {
    id:           'alert-004',
    nodeId:       'node-02',
    nodeName:     'Canteen Block',
    nodeLocation: 'Near College Canteen',
    level:        'WATCH',
    message:      'High humidity reading — 78% with active rainfall',
    detail:       'Temperature 29.1°C, humidity 78%. Weather conditions deteriorating. Combined with water level Watch status. Pressure dropping: 1010 hPa.',
    timestamp:    Date.now() - 62 * 60 * 1000,
    acknowledged: false,
    channels:     ['FCM'],
  },
  {
    id:           'alert-005',
    nodeId:       'node-03',
    nodeName:     'Parking Area',
    nodeLocation: 'East Parking Zone',
    level:        'WATCH',
    message:      'Water level entered Watch zone — 38cm reading',
    detail:       'First threshold crossing for node-03 today. Monitoring escalation initiated. Weather: Rain active. Battery: 67%. Connectivity: 4G LTE at time of alert.',
    timestamp:    Date.now() - 3 * 60 * 60 * 1000,
    acknowledged: true,
    channels:     ['FCM', 'SMS'],
  },
  {
    id:           'alert-006',
    nodeId:       'node-04',
    nodeName:     'Sports Ground',
    nodeLocation: 'South Sports Complex',
    level:        'SAFE',
    message:      'Battery discharge rate normalised',
    detail:       'Earlier elevated discharge rate resolved. Battery at 88%. Solar charging confirmed active. All systems nominal.',
    timestamp:    Date.now() - 5 * 60 * 60 * 1000,
    acknowledged: true,
    channels:     ['FCM'],
  },
  {
    id:           'alert-007',
    nodeId:       'node-01',
    nodeName:     'Main Gate',
    nodeLocation: 'SVCE Main Entrance',
    level:        'SAFE',
    message:      'System initialised — all channels active',
    detail:       'Node online and reporting. 4G LTE connected. Solar charging active. Battery: 94%. LoRa backup registered with gateway. SD card logging active.',
    timestamp:    Date.now() - 6 * 60 * 60 * 1000,
    acknowledged: true,
    channels:     ['FCM'],
  },
  {
    id:           'alert-008',
    nodeId:       'node-05',
    nodeName:     'Lab Terrace',
    nodeLocation: 'Main Lab Building, Roof',
    level:        'SAFE',
    message:      'Solar charging restored after cloud cover',
    detail:       'Battery recovering to 76% after 2-hour partial cloud cover period. Solar input back to normal. No data loss during low-power period.',
    timestamp:    Date.now() - 6.5 * 60 * 60 * 1000,
    acknowledged: true,
    channels:     ['FCM'],
  },
  {
    id:           'alert-009',
    nodeId:       'node-02',
    nodeName:     'Canteen Block',
    nodeLocation: 'Near College Canteen',
    level:        'SAFE',
    message:      'Node came online — initial calibration complete',
    detail:       'Sensor calibration completed successfully. Baseline water level set at 72cm. Weather station reporting. All communication channels verified.',
    timestamp:    Date.now() - 24 * 60 * 60 * 1000,
    acknowledged: true,
    channels:     ['FCM'],
  },
  {
    id:           'alert-010',
    nodeId:       'node-03',
    nodeName:     'Parking Area',
    nodeLocation: 'East Parking Zone',
    level:        'SAFE',
    message:      'Node-03 initial deployment — system check passed',
    detail:       'Full system check completed. JSN-SR04T calibrated. LoRa link to gateway confirmed. 4G LTE primary channel active. SD card 32GB ready.',
    timestamp:    Date.now() - 25 * 60 * 60 * 1000,
    acknowledged: true,
    channels:     ['FCM'],
  },
];

// ── LSTM Prediction Data Generator ─────────────────────────────────────────
// Generates 24h historical + 6h prediction for a given node
export const generatePredictionData = (nodeId, currentLevel) => {
  const now  = Date.now();
  const HOUR = 3600000;
  const data = [];

  // Node-specific trend parameters
  const params = {
    'node-01': { base: 88, histTrend: -6,  predTrend: -2,  confidence: 4  },
    'node-02': { base: 75, histTrend: -37, predTrend: -8,  confidence: 6  },
    'node-03': { base: 62, histTrend: -40, predTrend: -5,  confidence: 7  },
    'node-04': { base: 80, histTrend: -9,  predTrend: -3,  confidence: 3  },
    'node-05': { base: 93, histTrend: -3,  predTrend: -1,  confidence: 2  },
  };

  const p = params[nodeId] || params['node-01'];

  // 24 hourly historical points
  for (let i = 23; i >= 0; i--) {
    const progress    = 1 - (i / 23);
    const trend       = p.histTrend * progress;
    const noise       = (Math.random() - 0.5) * 3;
    const level       = Math.max(5, Math.min(120, p.base + trend + noise));
    const ts          = now - (i * HOUR);

    data.push({
      time:      ts,
      label:     new Date(ts).toLocaleTimeString('en-IN', {
                   hour: '2-digit', minute: '2-digit', hour12: false
                 }),
      actual:    Math.round(level * 10) / 10,
      predicted: null,
      upper:     null,
      lower:     null,
      type:      'historical',
    });
  }

  // Force last historical point to match current reading
  data[data.length - 1].actual = currentLevel;

  // 6 hourly prediction points
  const lastActual = currentLevel;
  for (let i = 1; i <= 6; i++) {
    const predLevel   = Math.max(5, lastActual + (p.predTrend * i));
    const confBand    = p.confidence + (i * 0.8); // widens over time
    const ts          = now + (i * HOUR);

    data.push({
      time:      ts,
      label:     new Date(ts).toLocaleTimeString('en-IN', {
                   hour: '2-digit', minute: '2-digit', hour12: false
                 }),
      actual:    null,
      predicted: Math.round(predLevel * 10) / 10,
      upper:     Math.round((predLevel + confBand) * 10) / 10,
      lower:     Math.round(Math.max(5, predLevel - confBand) * 10) / 10,
      type:      'prediction',
    });
  }

  return data;
};

// Pre-generate for all nodes
export const MOCK_PREDICTIONS = Object.fromEntries(
  MOCK_NODES.map(node => [
    node.id,
    generatePredictionData(node.id, node.waterLevel)
  ])
);

// Prediction summary per node
export const getPredictionSummary = (nodeId) => {
  const data       = MOCK_PREDICTIONS[nodeId];
  if (!data) return null;
  const predictions = data.filter(d => d.type === 'prediction');
  const finalPred   = predictions[predictions.length - 1];
  const minPred     = Math.min(...predictions.map(d => d.predicted));
  const trend       = finalPred.predicted < predictions[0].predicted ? 'declining' : 'stable';

  // Will it breach a threshold in 6h?
  const willBreach = minPred <= 40;
  const breachLevel =
    minPred <= 8  ? 'CRITICAL' :
    minPred <= 15 ? 'DANGER'   :
    minPred <= 25 ? 'WARNING'  :
    minPred <= 40 ? 'WATCH'    : null;

  return {
    currentLevel: predictions[0].predicted,
    predictedIn6h: finalPred.predicted,
    confidenceAt6h: finalPred.upper - finalPred.predicted,
    trend,
    willBreach,
    breachLevel,
    minPredicted: minPred,
  };
};

// ── Water Purification Data ─────────────────────────────────────────────────
export const MOCK_PURIFICATION = {
  system: {
    status:        'operational',   // operational | degraded | offline
    uptime:        '6d 14h 22m',
    pumpActive:    true,
    uvActive:      true,
    solarPowered:  true,
    batteryLevel:  81,
    lastServiced:  '2025-07-01',
  },
  current: {
    tdsInput:       342,   // ppm — contaminated flood water in
    tdsOutput:      22,    // ppm — purified water out
    turbidityInput: 68,    // NTU — cloudiness of input
    turbidityOutput:0.4,   // NTU
    flowRate:       2.8,   // L/min
    pressure:       68,    // PSI — RO membrane pressure
    uvIntensity:    98,    // % of rated UV-C output
    removalRate:    93.6,  // % TDS removal
  },
  daily: {
    volumeProduced:   42.6,    // litres today
    volumeTarget:     60,      // litres target per day
    sessionsRun:      4,
    avgTdsOutput:     21,
    peakFlowRate:     3.1,
  },
  filters: [
    { stage: 1, name: 'Sediment Filter',    status: 'good',    life: 78, replaced: '2025-06-01' },
    { stage: 2, name: 'Carbon Filter I',    status: 'good',    life: 71, replaced: '2025-06-01' },
    { stage: 3, name: 'RO Membrane',        status: 'good',    life: 84, replaced: '2025-06-01' },
    { stage: 4, name: 'Carbon Filter II',   status: 'good',    life: 71, replaced: '2025-06-01' },
    { stage: 5, name: 'UV Sterilizer',      status: 'good',    life: 91, replaced: '2025-06-01' },
  ],
};

// 24-hour hourly production history
export const MOCK_PURIFICATION_HISTORY = (() => {
  const now  = Date.now();
  const HOUR = 3600000;
  return Array.from({ length: 24 }, (_, i) => {
    const h       = 23 - i;
    const ts      = now - (h * HOUR);
    const hour    = new Date(ts).getHours();
    // Production peaks during daylight hours (solar powered)
    const solar   = hour >= 7 && hour <= 18;
    const volume  = solar
      ? parseFloat((Math.random() * 1.8 + 1.4).toFixed(1))
      : parseFloat((Math.random() * 0.4).toFixed(1));
    const tdsOut  = Math.round(18 + Math.random() * 8);
    return {
      label:  new Date(ts).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: false
              }),
      volume,
      tdsOut,
      solar,
    };
  });
})();

// ── Drone Operations Data ───────────────────────────────────────────────────
export const MOCK_DRONE = {
  unit: {
    model:        'DJI Mini 3',
    id:           'IDMS-UAV-01',
    weight:       '249g',
    dgca:         'Sub-250g — No registration required',
    firmware:     'v01.00.0600',
    status:       'standby',   // standby | preflight | airborne | returning | charging
  },
  batteries: [
    { id: 'BAT-01', label: 'Primary',   charge: 100, cycles: 12, health: 98, status: 'ready'    },
    { id: 'BAT-02', label: 'Spare 1',   charge: 87,  cycles: 18, health: 96, status: 'ready'    },
    { id: 'BAT-03', label: 'Spare 2',   charge: 43,  cycles: 31, health: 93, status: 'charging' },
  ],
  specs: {
    maxFlightTime: 38,      // minutes
    maxRange:      10,      // km
    maxWindSpeed:  10.8,    // m/s
    camera:        '4K/30fps + 12MP',
    transmission:  'OcuSync 3.0',
  },
  preflight: [
    { id: 'pf-01', check: 'Primary battery inserted and charged',    category: 'Power'    },
    { id: 'pf-02', check: 'Propellers inspected — no cracks/damage', category: 'Mechanical'},
    { id: 'pf-03', check: 'Propeller guards attached',               category: 'Safety'   },
    { id: 'pf-04', check: 'GPS signal acquired (8+ satellites)',      category: 'Navigation'},
    { id: 'pf-05', check: 'DJI Fly app connected and calibrated',    category: 'Software' },
    { id: 'pf-06', check: 'Camera gimbal calibrated',                category: 'Camera'   },
    { id: 'pf-07', check: 'Return-to-home altitude set (30m)',       category: 'Safety'   },
    { id: 'pf-08', check: 'Flight area surveyed — no obstacles',     category: 'Environment'},
    { id: 'pf-09', check: 'Wind speed within limits (<10 m/s)',      category: 'Environment'},
    { id: 'pf-10', check: 'Safety perimeter briefed to team',        category: 'Safety'   },
  ],
  flightLog: [
    {
      id:        'FLT-006',
      date:      'Today',
      time:      '09:14',
      mission:   'Campus perimeter survey',
      duration:  22,
      area:      'Full campus',
      battery:   'BAT-01',
      status:    'completed',
      distance:  1.4,
      footage:   true,
    },
    {
      id:        'FLT-005',
      date:      'Yesterday',
      time:      '15:32',
      mission:   'Parking Area flood extent mapping',
      duration:  18,
      area:      'East Parking Zone',
      battery:   'BAT-01',
      status:    'completed',
      distance:  0.9,
      footage:   true,
    },
    {
      id:        'FLT-004',
      date:      'Yesterday',
      time:      '11:07',
      mission:   'Node-03 visual inspection',
      duration:  8,
      area:      'East Parking Zone',
      battery:   'BAT-02',
      status:    'completed',
      distance:  0.3,
      footage:   false,
    },
    {
      id:        'FLT-003',
      date:      '15 Sep',
      time:      '14:45',
      mission:   'Mock flood terrain demo',
      duration:  31,
      area:      'Sports Ground',
      battery:   'BAT-01',
      status:    'completed',
      distance:  2.1,
      footage:   true,
    },
    {
      id:        'FLT-002',
      date:      '14 Sep',
      time:      '10:20',
      mission:   'Victim location simulation',
      duration:  14,
      area:      'Sports Ground',
      battery:   'BAT-02',
      status:    'completed',
      distance:  0.7,
      footage:   true,
    },
    {
      id:        'FLT-001',
      date:      '13 Sep',
      time:      '08:00',
      mission:   'Initial test flight',
      duration:  6,
      area:      'Main Gate area',
      battery:   'BAT-01',
      status:    'completed',
      distance:  0.2,
      footage:   false,
    },
  ],
  currentConditions: {
    windSpeed:   4.2,    // m/s
    windDir:     'NE',
    temperature: 30.2,
    visibility:  'Good',
    flyable:     true,
  },
};

// ── Rescue Portal Data ──────────────────────────────────────────────────────
export const MOCK_RESCUE = {
  teams: [
    {
      id:       'T-01',
      name:     'Alpha Team',
      lead:     'Ravi Sharma',
      members:  4,
      status:   'deployed',   // deployed | standby | returning | off-duty
      zone:     'East Parking Zone',
      nodeId:   'node-03',
      vehicle:  'Rescue Boat RB-01',
      contact:  '+91 98765 43210',
      lastUpdate: Date.now() - 4 * 60 * 1000,
      task:     'Water level assessment and resident evacuation',
      coords:   { lat: 13.6285, lng: 79.4205 },
    },
    {
      id:       'T-02',
      name:     'Bravo Team',
      lead:     'Priya Nair',
      members:  3,
      status:   'standby',
      zone:     'Main Gate Area',
      nodeId:   'node-01',
      vehicle:  'Response Van RV-01',
      contact:  '+91 98765 43211',
      lastUpdate: Date.now() - 12 * 60 * 1000,
      task:     'Standing by at command post',
      coords:   { lat: 13.6288, lng: 79.4192 },
    },
    {
      id:       'T-03',
      name:     'Charlie Team',
      lead:     'Arun Reddy',
      members:  5,
      status:   'deployed',
      zone:     'Canteen Block Area',
      nodeId:   'node-02',
      vehicle:  'Rescue Boat RB-02',
      contact:  '+91 98765 43212',
      lastUpdate: Date.now() - 7 * 60 * 1000,
      task:     'Resident welfare check and supply distribution',
      coords:   { lat: 13.6291, lng: 79.4198 },
    },
    {
      id:       'T-04',
      name:     'Delta Team',
      lead:     'Sneha Patel',
      members:  3,
      status:   'returning',
      zone:     'Sports Ground',
      nodeId:   'node-04',
      vehicle:  'Response Van RV-02',
      contact:  '+91 98765 43213',
      lastUpdate: Date.now() - 2 * 60 * 1000,
      task:     'Returning to base after completing zone check',
      coords:   { lat: 13.6279, lng: 79.4199 },
    },
  ],
  resources: [
    { id: 'R-01', name: 'Rescue Boat RB-01',    type: 'boat',    status: 'deployed', team: 'T-01' },
    { id: 'R-02', name: 'Rescue Boat RB-02',    type: 'boat',    status: 'deployed', team: 'T-03' },
    { id: 'R-03', name: 'Response Van RV-01',   type: 'vehicle', status: 'standby',  team: 'T-02' },
    { id: 'R-04', name: 'Response Van RV-02',   type: 'vehicle', status: 'returning',team: 'T-04' },
    { id: 'R-05', name: 'Medical Kit MK-01',    type: 'supply',  status: 'deployed', team: 'T-01' },
    { id: 'R-06', name: 'Water Supply WS-01',   type: 'supply',  status: 'standby',  team: null   },
    { id: 'R-07', name: 'Generator GEN-01',     type: 'power',   status: 'standby',  team: null   },
  ],
  activityLog: [
    {
      id:        'ACT-010',
      time:      Date.now() - 2 * 60 * 1000,
      team:      'T-04',
      teamName:  'Delta Team',
      type:      'status',
      message:   'Delta Team returning to base — zone check complete',
      level:     'info',
    },
    {
      id:        'ACT-009',
      time:      Date.now() - 4 * 60 * 1000,
      team:      'T-01',
      teamName:  'Alpha Team',
      type:      'alert',
      message:   'Resident family located at East Parking Zone Block C — evacuation initiated',
      level:     'warning',
    },
    {
      id:        'ACT-008',
      time:      Date.now() - 7 * 60 * 1000,
      team:      'T-03',
      teamName:  'Charlie Team',
      type:      'status',
      message:   'Supply distribution underway at Canteen Block — 12 residents assisted',
      level:     'info',
    },
    {
      id:        'ACT-007',
      time:      Date.now() - 15 * 60 * 1000,
      team:      'T-01',
      teamName:  'Alpha Team',
      type:      'dispatch',
      message:   'Alpha Team dispatched to East Parking Zone — water level at Warning (22cm)',
      level:     'warning',
    },
    {
      id:        'ACT-006',
      time:      Date.now() - 23 * 60 * 1000,
      team:      'T-03',
      teamName:  'Charlie Team',
      type:      'dispatch',
      message:   'Charlie Team dispatched to Canteen Block — Watch level water rise reported',
      level:     'info',
    },
    {
      id:        'ACT-005',
      time:      Date.now() - 35 * 60 * 1000,
      team:      null,
      teamName:  'System',
      type:      'system',
      message:   'IDMS Alert: Node-03 water level crossed Warning threshold (25cm)',
      level:     'warning',
    },
    {
      id:        'ACT-004',
      time:      Date.now() - 62 * 60 * 1000,
      team:      'T-02',
      teamName:  'Bravo Team',
      type:      'status',
      message:   'Bravo Team at command post — all personnel accounted for',
      level:     'info',
    },
    {
      id:        'ACT-003',
      time:      Date.now() - 90 * 60 * 1000,
      team:      null,
      teamName:  'System',
      type:      'system',
      message:   'IDMS Alert: Node-02 water level entered Watch zone (38cm)',
      level:     'info',
    },
  ],
  summary: {
    totalTeams:      4,
    deployed:        2,
    standby:         1,
    returning:       1,
    totalPersonnel:  15,
    residentsHelped: 12,
    zonesActive:     2,
  },
};

// ── Reports Data ────────────────────────────────────────────────────────────

// 7-day daily summary per node
export const MOCK_DAILY_SUMMARY = (() => {
  const days   = ['10 Sep', '11 Sep', '12 Sep', '13 Sep', '14 Sep', '15 Sep', '16 Sep'];
  const nodeBaselines = {
    'node-01': [88, 86, 84, 85, 83, 82, 82],
    'node-02': [74, 70, 65, 58, 50, 42, 38],
    'node-03': [65, 60, 52, 44, 35, 28, 22],
    'node-04': [80, 78, 76, 75, 74, 72, 71],
    'node-05': [92, 91, 91, 90, 90, 90, 90],
  };
  return days.map((day, i) => ({
    day,
    'Main Gate':    nodeBaselines['node-01'][i],
    'Canteen Block':nodeBaselines['node-02'][i],
    'Parking Area': nodeBaselines['node-03'][i],
    'Sports Ground':nodeBaselines['node-04'][i],
    'Lab Terrace':  nodeBaselines['node-05'][i],
  }));
})();

// Alert frequency by day
export const MOCK_ALERT_FREQUENCY = [
  { day: '10 Sep', Safe: 2, Watch: 0, Warning: 0 },
  { day: '11 Sep', Safe: 1, Watch: 0, Warning: 0 },
  { day: '12 Sep', Safe: 2, Watch: 1, Warning: 0 },
  { day: '13 Sep', Safe: 1, Watch: 1, Warning: 0 },
  { day: '14 Sep', Safe: 2, Watch: 2, Warning: 1 },
  { day: '15 Sep', Safe: 1, Watch: 1, Warning: 1 },
  { day: '16 Sep', Safe: 2, Watch: 1, Warning: 1 },
];

// Daily purification output
export const MOCK_PURIFICATION_DAILY = [
  { day: '10 Sep', volume: 38.2, tds: 19 },
  { day: '11 Sep', volume: 41.5, tds: 21 },
  { day: '12 Sep', volume: 39.8, tds: 20 },
  { day: '13 Sep', volume: 44.1, tds: 22 },
  { day: '14 Sep', volume: 43.0, tds: 23 },
  { day: '15 Sep', volume: 40.6, tds: 21 },
  { day: '16 Sep', volume: 42.6, tds: 22 },
];

// Exportable event log (flat for CSV)
export const MOCK_EVENT_LOG = [
  { timestamp: '2026-09-16 14:32', node: 'node-03', event: 'Warning threshold crossed', level: 'WARNING', value: '22cm', channel: 'SMS, FCM, WhatsApp' },
  { timestamp: '2026-09-16 14:09', node: 'node-02', event: 'Watch threshold crossed',   level: 'WATCH',   value: '38cm', channel: 'FCM' },
  { timestamp: '2026-09-16 13:51', node: 'node-03', event: 'Connectivity → 2G SMS',    level: 'INFO',    value: '—',    channel: 'SMS' },
  { timestamp: '2026-09-16 13:10', node: 'node-02', event: 'High humidity: 78%',        level: 'INFO',    value: '78%',  channel: 'FCM' },
  { timestamp: '2026-09-16 11:30', node: 'node-03', event: 'Watch threshold crossed',   level: 'WATCH',   value: '38cm', channel: 'FCM, SMS' },
  { timestamp: '2026-09-15 15:32', node: 'node-03', event: 'Flood extent mapping done', level: 'INFO',    value: '—',    channel: '—' },
  { timestamp: '2026-09-15 11:07', node: 'node-03', event: 'Node visual inspection',    level: 'INFO',    value: '—',    channel: '—' },
  { timestamp: '2026-09-14 14:45', node: 'all',     event: 'Mock flood demo complete',  level: 'INFO',    value: '—',    channel: '—' },
  { timestamp: '2026-09-13 08:00', node: 'all',     event: 'Initial deployment — all nodes online', level: 'INFO', value: '—', channel: 'FCM' },
];
