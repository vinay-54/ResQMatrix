import { ALERT_LEVELS } from '../constants/alertLevels';

export const getAlertLevelFromDistance = (cm) => {
  if (cm === null || cm === undefined) return 'OFFLINE';
  if (cm <= 8)  return 'CRITICAL';
  if (cm <= 15) return 'DANGER';
  if (cm <= 25) return 'WARNING';
  if (cm <= 40) return 'WATCH';
  return 'SAFE';
};

// For Recharts reference lines — sorted ascending
export const WATER_THRESHOLDS = [
  { value: 8,  label: 'Critical', color: '#DC2626' },
  { value: 15, label: 'Danger',   color: '#EF4444' },
  { value: 25, label: 'Warning',  color: '#EA580C' },
  { value: 40, label: 'Watch',    color: '#D97706' },
];

// Returns color for a given water level reading
export const getLevelColor = (cm) => {
  const level = getAlertLevelFromDistance(cm);
  return ALERT_LEVELS[level]?.color || '#94A3B8';
};

// Chart Y-axis: higher distance = safer = chart shows it lower-right as "safer"
// Lower distance = flood = chart shows rising risk
export const formatChartTick = (value) => `${value}`;

export const getBatteryColor = (pct) => {
  if (pct > 50) return '#059669';
  if (pct > 20) return '#D97706';
  return '#DC2626';
};
