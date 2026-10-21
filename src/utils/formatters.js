export const formatTimeAgo = (timestamp) => {
  const diff = Date.now() - timestamp;
  const s    = Math.floor(diff / 1000);
  const m    = Math.floor(s / 60);
  const h    = Math.floor(m / 60);
  const d    = Math.floor(h / 24);
  if (s < 60)  return `${s}s ago`;
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  return `${d}d ago`;
};

export const formatWaterLevel = (cm) => {
  if (cm === null || cm === undefined) return '—';
  return `${cm} cm`;
};

export const formatBattery = (pct) => `${pct}%`;

export const formatTDS = (ppm) => {
  if (ppm === null || ppm === undefined) return '—';
  return `${ppm} ppm`;
};

export const getAlertLevelFromDistance = (cm) => {
  if (cm === null || cm === undefined) return 'OFFLINE';
  if (cm <= 8)  return 'CRITICAL';
  if (cm <= 15) return 'DANGER';
  if (cm <= 25) return 'WARNING';
  if (cm <= 40) return 'WATCH';
  return 'SAFE';
};

export const formatNumber = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
