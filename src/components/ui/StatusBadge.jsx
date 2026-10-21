import { ALERT_LEVELS } from '../../constants/alertLevels';

const StatusBadge = ({ level, size = 'md', animate = false }) => {
  const config = ALERT_LEVELS[level] || ALERT_LEVELS.OFFLINE;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
    lg: 'text-[12px] px-2.5 py-1 gap-1.5',
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]}`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <span
        className={`${dotSize[size]} rounded-full flex-shrink-0 ${
          (level === 'CRITICAL' || animate) ? 'animate-pulse' : ''
        }`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
