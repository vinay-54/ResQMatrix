export const NAV_GROUPS = [
  {
    group: null,
    items: [
      {
        label: 'Dashboard',
        path:  '/dashboard',
        icon:  'LayoutDashboard',
        description: 'System overview',
      },
      {
        label: 'Live Map',
        path:  '/map',
        icon:  'Map',
        description: 'Sensor locations',
      },
    ],
  },
  {
    group: 'Monitoring',
    items: [
      {
        label:       'Sensor Nodes',
        path:        '/sensors',
        icon:        'Activity',
        description: 'IoT node management',
        badge:       '5',
        badgeStyle:  'neutral',
      },
      {
        label:       'Alert Center',
        path:        '/alerts',
        icon:        'Bell',
        description: 'Active alerts and history',
        badgeDynamic: true,
        badgeStyle:  'danger',
      },
    ],
  },
  {
    group: 'Operations',
    items: [
      {
        label: 'Flood Prediction',
        path:  '/prediction',
        icon:  'TrendingUp',
        description: 'LSTM flood forecast',
      },
      {
        label: 'Purification',
        path:  '/purification',
        icon:  'Droplets',
        description: 'Water quality system',
      },
      {
        label: 'Drone Ops',
        path:  '/drone',
        icon:  'Plane',
        description: 'Aerial monitoring',
      },
      {
        label: 'Rescue Portal',
        path:  '/rescue',
        icon:  'Users',
        description: 'Team coordination',
      },
    ],
  },
  {
    group: 'Management',
    items: [
      {
        label: 'Reports',
        path:  '/reports',
        icon:  'BarChart3',
        description: 'Analytics and exports',
      },
      {
        label: 'System Health',
        path:  '/system-health',
        icon:  'Activity',
        description: 'Component status',
      },
      {
        label: 'Simulation',
        path:  '/simulation',
        icon:  'FlaskConical',
        badge: null,
      },
      {
        label: 'Settings',
        path:  '/settings',
        icon:  'Settings2',
        description: 'System configuration',
      },
    ],
  },
];

export const PAGE_META = {
  '/dashboard':    { title: 'Dashboard',         subtitle: 'System overview and key metrics' },
  '/map':          { title: 'Live Map',           subtitle: 'Real-time sensor node locations' },
  '/sensors':      { title: 'Sensor Nodes',       subtitle: 'IoT node status and management' },
  '/alerts':       { title: 'Alert Center',       subtitle: 'Active alerts and event history' },
  '/prediction':   { title: 'Flood Prediction',   subtitle: 'LSTM model forecast and analysis' },
  '/purification': { title: 'Water Purification', subtitle: 'RO/UV system status and output' },
  '/drone':        { title: 'Drone Operations',   subtitle: 'Aerial monitoring and mapping' },
  '/rescue':       { title: 'Rescue Portal',      subtitle: 'Team assignments and coordination' },
  '/reports':      { title: 'Reports',            subtitle: 'Data analytics and CSV exports' },
  '/simulation':   { title: 'Simulation Mode',   subtitle: 'Pipeline simulation and sensor testing' },
  '/settings':      { title: 'Settings',           subtitle: 'System and node configuration' },
  '/system-health': { title: 'System Health',      subtitle: 'Component status and diagnostics' },
};
