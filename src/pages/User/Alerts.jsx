import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, AlertTriangle, AlertOctagon, CheckCircle2,
  Clock, ChevronDown, ChevronUp, Shield, Info,
  RefreshCw, MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useDataStore  from '../../store/useDataStore';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import { formatTimeAgo } from '../../utils/formatters';
import { useMotion } from '../../hooks/useMotion';

// Visual config per level (colors/icons stay constant, text from i18n)
const CITIZEN_ALERT_CONFIG = {
  SAFE:     { icon: CheckCircle2, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  WATCH:    { icon: Bell,         color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  WARNING:  { icon: AlertTriangle, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  DANGER:   { icon: AlertOctagon,  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  CRITICAL: { icon: AlertOctagon,  color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
};

// Convert technical alert message to citizen-readable key
const getCitizenMessageKey = (alert) => {
  const msg = alert.message?.toLowerCase() || '';
  if (msg.includes('threshold') || msg.includes('cm') || msg.includes('level')) {
    if (alert.level === 'CRITICAL') return 'critical';
    if (alert.level === 'DANGER')   return 'danger';
    if (alert.level === 'WARNING')  return 'warning';
    if (alert.level === 'WATCH')    return 'watch';
    return 'safe';
  }
  if (msg.includes('connectivity') || msg.includes('sms') || msg.includes('2g') || msg.includes('lora')) return 'connectivity';
  if (msg.includes('battery') || msg.includes('solar') || msg.includes('charging')) return 'battery';
  if (msg.includes('initialised') || msg.includes('online') || msg.includes('deployed')) return 'online';
  return 'default';
};

// ── Alert Card Component ────────────────────────────────
const AlertCard = ({ alert, idx }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const cfg     = CITIZEN_ALERT_CONFIG[alert.level] || CITIZEN_ALERT_CONFIG.WATCH;
  const Icon    = cfg.icon;
  const tips    = t(`alerts.safetyTips.${alert.level}`, { returnObjects: true }) || [];
  const msgKey  = getCitizenMessageKey(alert);
  const loc     = alert.nodeName || 'your area';
  const message = msgKey === 'default'
    ? (alert.message || t('alerts.citizenMessage.default'))
    : t(`alerts.citizenMessage.${msgKey}`, { location: loc });
  const isActive = !alert.acknowledged;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.18 }}
      className={`rounded-2xl border-2 overflow-hidden transition-all
        ${!isActive ? 'opacity-70' : ''}`}
      style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
    >
      {/* Card Header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-4"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cfg.color + '20' }}
          >
            <Icon
              size={22}
              style={{ color: cfg.color }}
              className={alert.level === 'CRITICAL' || alert.level === 'DANGER'
                ? 'animate-pulse' : ''}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wide
                           px-2 py-0.5 rounded-full"
                style={{ color: cfg.color, backgroundColor: cfg.color + '20' }}
              >
                {t(`alerts.citizenAlert.${alert.level}.tag`)}
              </span>
              <span className="text-[10px] flex items-center gap-1"
                    style={{ color: cfg.color + '99' }}>
                <Clock size={10} />
                {formatTimeAgo(alert.timestamp)}
              </span>
            </div>

            <h3 className="text-[14px] font-bold leading-snug"
                style={{ color: cfg.color }}>
              {t(`alerts.citizenAlert.${alert.level}.headline`)}
            </h3>
            <p className="text-[12px] mt-1 leading-relaxed"
               style={{ color: cfg.color + 'CC' }}>
              {message}
            </p>

            {/* Location if available */}
            {alert.nodeName && (
              <p className="text-[11px] mt-1 font-medium flex items-center gap-1"
                 style={{ color: cfg.color + '99' }}>
                <MapPin size={10} /> {alert.nodeName}
              </p>
            )}
          </div>

          {/* Expand toggle */}
          <div className="flex-shrink-0 mt-1">
            {expanded
              ? <ChevronUp  size={18} style={{ color: cfg.color }} />
              : <ChevronDown size={18} style={{ color: cfg.color }} />
            }
          </div>
        </div>

        {/* Action line — always visible */}
        <div
          className="mt-3 pt-3 flex items-start gap-2 border-t"
          style={{ borderColor: cfg.border }}
        >
          <Shield size={13} style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5" />
          <p className="text-[12px] font-semibold leading-snug"
             style={{ color: cfg.color }}>
            {t(`alerts.citizenAlert.${alert.level}.action`)}
          </p>
        </div>
      </button>

      {/* Expanded Section — Safety Tips */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 border-t"
              style={{ borderColor: cfg.border }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide mt-3 mb-2"
                 style={{ color: cfg.color }}>
                {t('alerts.whatYouShouldDo')}
              </p>
              <div className="space-y-2">
                {Array.isArray(tips) && tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center
                                 flex-shrink-0 mt-0.5 text-[9px] font-bold"
                      style={{ backgroundColor: cfg.color, color: '#fff' }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-[12px] leading-relaxed"
                       style={{ color: cfg.color + 'DD' }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>

              {/* Past/acknowledged badge */}
              {!isActive && (
                <div className="mt-3 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-[#94A3B8]" />
                  <span className="text-[10px] text-[#94A3B8] font-medium">
                    {t('alerts.alertResolved')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Page Component ─────────────────────────────────
const UserAlerts = () => {
  const { t }           = useTranslation();
  const motion_config   = useMotion();
  const alerts          = useDataStore(s => s.alerts);
  const [filter,  setFilter]  = useState('ALL');

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const pastAlerts   = alerts.filter(a => a.acknowledged);

  const FILTER_TABS = [
    { value: 'ALL',    label: t('alerts.filterAll')    },
    { value: 'ACTIVE', label: t('alerts.filterActive') },
    { value: 'PAST',   label: t('alerts.filterPast')   },
  ];

  const filtered = useMemo(() => {
    let list = alerts;
    if (filter === 'ACTIVE') list = activeAlerts;
    if (filter === 'PAST')   list = pastAlerts;
    return [...list].sort((a, b) => b.timestamp - a.timestamp);
  }, [alerts, filter]);

  // Highest active level for summary banner
  const levelOrder = ['CRITICAL','DANGER','WARNING','WATCH','SAFE'];
  const highestActive = levelOrder.find(l =>
    activeAlerts.some(a => a.level === l)
  );
  const highestCfg = highestActive ? CITIZEN_ALERT_CONFIG[highestActive] : null;

  return (
    <motion.div
      {...motion_config.fadeSlideUp}
      className="px-4 pt-4 pb-6 space-y-4"
    >

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#0F172A]">{t('alerts.title')}</h1>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            {t('alerts.activePast', { active: activeAlerts.length, past: pastAlerts.length })}
          </p>
        </div>
        <button
          className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]
                     text-[#475569] hover:bg-[#F8FAFC] transition-colors"
          title={t('alerts.refreshAlerts')}
          aria-label={t('alerts.refreshAlerts')}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Active Alert Summary Banner ──────────────────── */}
      {highestCfg && activeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border-2 px-4 py-3.5"
          style={{
            backgroundColor: highestCfg.bg,
            borderColor:     highestCfg.border,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: highestCfg.color }}
            />
            <span className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: highestCfg.color }}>
              {activeAlerts.length > 1
                ? t('alerts.livePlural', { count: activeAlerts.length })
                : t('alerts.live', { count: activeAlerts.length })}
            </span>
          </div>
          <p className="text-[13px] font-bold" style={{ color: highestCfg.color }}>
            {t(`alerts.citizenAlert.${highestActive}.headline`)} — {t(`alerts.citizenAlert.${highestActive}.action`)}
          </p>
        </motion.div>
      )}

      {/* ── All Clear Banner ─────────────────────────────── */}
      {activeAlerts.length === 0 && (
        <div className="bg-[#ECFDF5] border-2 border-[#A7F3D0] rounded-2xl
                        px-4 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#059669] flex items-center
                          justify-center flex-shrink-0">
            <CheckCircle2 size={24} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#059669]">
              {t('alerts.allClear')}
            </p>
            <p className="text-[12px] text-[#065F46] mt-0.5">
              {t('alerts.allClearSub')}
            </p>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {FILTER_TABS.map(tab => {
          const isActive = filter === tab.value;
          const count = tab.value === 'ALL'
            ? alerts.length
            : tab.value === 'ACTIVE'
            ? activeAlerts.length
            : pastAlerts.length;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full
                          text-[12px] font-semibold transition-all border-2
                ${isActive
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                }`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Alert List ───────────────────────────────────── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center
                              justify-center mb-3">
                <Bell size={24} className="text-[#94A3B8]" />
              </div>
              <p className="text-[15px] font-bold text-[#475569]">
                {filter === 'ACTIVE' ? t('alerts.noActive') : t('alerts.noAlertsFound')}
              </p>
              <p className="text-[12px] text-[#94A3B8] mt-1">
                {filter === 'ACTIVE'
                  ? t('alerts.noActiveArea')
                  : t('alerts.tryDifferentFilter')
                }
              </p>
              {filter !== 'ALL' && (
                <button
                  onClick={() => setFilter('ALL')}
                  className="mt-3 text-[12px] font-medium text-[#2563EB] hover:underline"
                >
                  {t('alerts.showAll')}
                </button>
              )}
            </motion.div>
          ) : (
            filtered.map((alert, idx) => (
              <AlertCard key={alert.id} alert={alert} idx={idx} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Safety Reminder (always at bottom) ──────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-[#2563EB]" />
          <p className="text-[13px] font-bold text-[#0F172A]">
            {t('alerts.inAnyEmergency')}
          </p>
        </div>
        <div className="space-y-2">
          {[
            { text: t('alerts.emergencyTip1'), color: '#DC2626'  },
            { text: t('alerts.emergencyTip2'), color: '#0F172A'  },
            { text: t('alerts.emergencyTip3'), color: '#059669'  },
            { text: t('alerts.emergencyTip4'), color: '#D97706'  },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-[12px] text-[#475569] leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <p className="text-center text-[10px] text-[#CBD5E1]">
        {t('alerts.footer')}
      </p>

    </motion.div>
  );
};

export default UserAlerts;
