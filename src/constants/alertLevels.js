export const ALERT_LEVELS = {
  SAFE: {
    label:  'Safe',
    value:  0,
    color:  '#059669',
    bg:     '#ECFDF5',
    border: '#A7F3D0',
    dot:    'bg-status-safe',
  },
  WATCH: {
    label:  'Watch',
    value:  1,
    color:  '#D97706',
    bg:     '#FFFBEB',
    border: '#FDE68A',
    dot:    'bg-status-watch',
  },
  WARNING: {
    label:  'Warning',
    value:  2,
    color:  '#EA580C',
    bg:     '#FFF7ED',
    border: '#FED7AA',
    dot:    'bg-status-warning',
  },
  DANGER: {
    label:  'Danger',
    value:  3,
    color:  '#DC2626',
    bg:     '#FEF2F2',
    border: '#FECACA',
    dot:    'bg-status-danger',
  },
  CRITICAL: {
    label:  'Critical',
    value:  4,
    color:  '#DC2626',
    bg:     '#FEF2F2',
    border: '#FECACA',
    dot:    'bg-status-danger animate-pulse-danger',
  },
  OFFLINE: {
    label:  'Offline',
    value:  -1,
    color:  '#64748B',
    bg:     '#F8FAFC',
    border: '#E2E8F0',
    dot:    'bg-status-offline',
  },
};

export const CONNECTIVITY_TIERS = {
  FOUR_G:  { label: '4G LTE',     color: '#059669', icon: 'Wifi' },
  TWO_G:   { label: '2G SMS',     color: '#D97706', icon: 'MessageSquare' },
  LORA:    { label: 'LoRa Mesh',  color: '#EA580C', icon: 'Radio' },
  SD_CARD: { label: 'SD Logging', color: '#DC2626', icon: 'HardDrive' },
  OFFLINE: { label: 'No Signal',  color: '#64748B', icon: 'WifiOff' },
};
