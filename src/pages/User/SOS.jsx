import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon, MapPin, CheckCircle2, Phone,
  Loader2, RefreshCw, Clock, Users, Navigation,
  Crosshair, Shield, ChevronRight, Radio
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useDataStore   from '../../store/useDataStore';
import useAuthStore   from '../../store/useAuthStore';
import useGeolocation from '../../hooks/useGeolocation';
import { formatTimeAgo } from '../../utils/formatters';
import { useMotion } from '../../hooks/useMotion';

// SOS has 4 states
const SOS_STATE = {
  READY:      'READY',
  CONFIRMING: 'CONFIRMING',
  SENDING:    'SENDING',
  SENT:       'SENT',
};

// ── Hold Button Component ───────────────────────────────
// Requires a 3-second press-and-hold to activate — prevents accidental SOS
const HoldButton = ({ onConfirm, disabled }) => {
  const { t } = useTranslation();
  const [holding,   setHolding]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const intervalRef = useRef(null);
  const HOLD_MS     = 3000;
  const TICK_MS     = 50;

  const startHold = useCallback(() => {
    if (disabled) return;
    setHolding(true);
    setProgress(0);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed  = Date.now() - start;
      const pct      = Math.min(100, (elapsed / HOLD_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        setHolding(false);
        setProgress(0);
        onConfirm();
      }
    }, TICK_MS);
  }, [disabled, onConfirm]);

  const cancelHold = useCallback(() => {
    clearInterval(intervalRef.current);
    setHolding(false);
    setProgress(0);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const circumference = 2 * Math.PI * 90;
  const strokeOffset  = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulsing ring — only when not holding */}
      {!holding && (
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-[210px] h-[210px] rounded-full bg-[#DC2626]/20"
        />
      )}

      {/* Progress ring SVG */}
      <svg
        width="210" height="210"
        className="absolute"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="105" cy="105" r="90"
          fill="none"
          stroke={holding ? '#DC2626' : 'transparent'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>

      {/* Main SOS button */}
      <motion.button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        whileTap={{ scale: 0.95 }}
        disabled={disabled}
        className="relative w-[180px] h-[180px] rounded-full
                   flex flex-col items-center justify-center
                   select-none touch-none
                   shadow-[0_8px_32px_rgba(220,38,38,0.45)]
                   active:shadow-[0_4px_16px_rgba(220,38,38,0.6)]
                   transition-shadow"
        style={{
          backgroundColor: holding ? '#991B1B' : '#DC2626',
          border: '6px solid rgba(255,255,255,0.3)',
        }}
        aria-label={t('sos.holdToSend')}
      >
        <AlertOctagon size={52} className="text-white mb-1" />
        <span className="text-[22px] font-black text-white tracking-widest">
          SOS
        </span>
        <span className="text-[10px] text-white/80 font-medium mt-1">
          {holding
            ? t('sos.holding', { seconds: Math.round((100 - progress) / 100 * 3) })
            : t('sos.holdToSend')
          }
        </span>
      </motion.button>
    </div>
  );
};

// ── Main SOS Page Component ─────────────────────────────
const UserSOS = () => {
  const { t }             = useTranslation();
  const motion_config     = useMotion();
  const user              = useAuthStore(s => s.user);
  const addAlert          = useDataStore(s => s.addAlert);
  const addActivity       = useDataStore(s => s.addActivity);
  const rescueCamps       = useDataStore(s => s.rescueCamps);
  const geo               = useGeolocation();

  const [sosState,    setSosState]    = useState(SOS_STATE.READY);
  const [sosId,       setSosId]       = useState(null);
  const [sentTime,    setSentTime]    = useState(null);
  const [sosStatus,   setSosStatus]   = useState('CREATED');
  const [elapsed,     setElapsed]     = useState(0);

  // Status messages config — translated
  const STATUS_MESSAGES = {
    CREATED:      { label: t('sos.statusCreated'),      color: '#2563EB', icon: Radio        },
    RECEIVED:     { label: t('sos.statusReceived'),     color: '#2563EB', icon: CheckCircle2 },
    ACKNOWLEDGED: { label: t('sos.statusAcknowledged'), color: '#D97706', icon: Users        },
    DISPATCHED:   { label: t('sos.statusDispatched'),   color: '#059669', icon: Navigation   },
    RESOLVED:     { label: t('sos.statusResolved'),     color: '#059669', icon: CheckCircle2 },
  };

  // Auto-request location on mount
  useEffect(() => {
    geo.requestOnce();
  }, []);

  // Elapsed time counter after SOS sent
  useEffect(() => {
    if (sosState !== SOS_STATE.SENT) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sentTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [sosState, sentTime]);

  // Simulate progressive status updates after SOS sent
  useEffect(() => {
    if (sosState !== SOS_STATE.SENT) return;
    const timers = [
      setTimeout(() => setSosStatus('RECEIVED'),     3000),
      setTimeout(() => setSosStatus('ACKNOWLEDGED'), 8000),
      setTimeout(() => setSosStatus('DISPATCHED'),  15000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [sosState]);

  const handleConfirm = useCallback(() => {
    setSosState(SOS_STATE.SENDING);

    const id      = `SOS-${Date.now()}`;
    const now     = Date.now();
    const locText = geo.location
      ? `GPS: ${geo.location.lat.toFixed(5)}, ${geo.location.lng.toFixed(5)}`
      : 'Location unavailable';

    addAlert({
      nodeId:   'sos-device',
      nodeName: user?.name || 'Citizen',
      level:    'DANGER',
      message:  `SOS Alert from ${user?.name || 'Citizen'} — ${locText}`,
      detail:   `Emergency SOS pressed by citizen via ResQMatrix User Portal. ${locText}. Rescue required immediately.`,
      timestamp: now,
      channels:  ['FCM', 'SMS'],
      isSOS:     true,
      location:  geo.location || null,
    });

    addActivity({
      team:     null,
      teamName: 'ResQMatrix System',
      type:     'alert',
      message:  `SOS received from ${user?.name || 'Citizen'} — ${locText}`,
      level:    'warning',
    });

    setSosId(id);
    setSentTime(now);

    setTimeout(() => {
      setSosState(SOS_STATE.SENT);
      setSosStatus('CREATED');
    }, 1000);
  }, [geo.location, user, addAlert, addActivity]);

  const handleReset = () => {
    setSosState(SOS_STATE.READY);
    setSosId(null);
    setSentTime(null);
    setSosStatus('CREATED');
    setElapsed(0);
  };

  const nearestCamp = rescueCamps.find(c => c.status === 'active');

  const formatElapsed = (s) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════ */}
        {/* STATE 1 — READY                               */}
        {/* ══════════════════════════════════════════════ */}
        {sosState === SOS_STATE.READY && (
          <motion.div
            key="ready"
            {...motion_config.fadeSlideUp}
            className="flex flex-col min-h-screen px-4 pt-4 pb-[80px]"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-[22px] font-black text-[#DC2626]">
                {t('sos.title')}
              </h1>
              <p className="text-[13px] text-[#64748B] mt-1">
                {t('sos.subtitle')}
              </p>
            </div>

            {/* Location status */}
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 border
              ${geo.location
                ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                : geo.loading
                ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                : 'bg-[#FFF7ED] border-[#FED7AA]'
              }`}>
              {geo.loading ? (
                <>
                  <Loader2 size={16} className="text-[#2563EB] animate-spin flex-shrink-0" />
                  <p className="text-[12px] font-semibold text-[#2563EB]">
                    {t('sos.gettingLocation')}
                  </p>
                </>
              ) : geo.location ? (
                <>
                  <MapPin size={16} className="text-[#059669] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-[#059669]">
                      {t('sos.locationReady')}
                    </p>
                    <p className="text-[10px] text-[#065F46] font-mono mt-0.5">
                      {geo.location.lat.toFixed(5)}, {geo.location.lng.toFixed(5)}
                      {' '}(±{Math.round(geo.location.accuracy || 0)}m)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <MapPin size={16} className="text-[#D97706] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-[#D97706]">
                      {t('sos.locationNotAvailable')}
                    </p>
                    <p className="text-[10px] text-[#92400E] mt-0.5">
                      {t('sos.locationNotAvailableSub')}
                    </p>
                  </div>
                  <button
                    onClick={geo.requestOnce}
                    className="text-[10px] font-bold text-[#D97706] bg-white
                               border border-[#FDE68A] px-2 py-1 rounded-lg flex-shrink-0"
                  >
                    {t('sos.enable')}
                  </button>
                </>
              )}
            </div>

            {/* THE BIG SOS BUTTON */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <HoldButton onConfirm={handleConfirm} disabled={false} />

              <p className="text-[12px] text-[#94A3B8] text-center max-w-[200px]">
                {t('sos.holdPrevention')}
              </p>
            </div>

            {/* What happens section */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4">
              <p className="text-[13px] font-bold text-[#0F172A] mb-3">
                {t('sos.whatHappens')}
              </p>
              <div className="space-y-2.5">
                {[
                  { step: '1', text: t('sos.step1'), color: '#2563EB' },
                  { step: '2', text: t('sos.step2'), color: '#EA580C' },
                  { step: '3', text: t('sos.step3'), color: '#D97706' },
                  { step: '4', text: t('sos.step4'), color: '#059669' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center
                                 flex-shrink-0 text-[11px] font-bold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.step}
                    </div>
                    <p className="text-[12px] text-[#475569]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct call option */}
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2 w-full py-3.5
                         bg-white border-2 border-[#E2E8F0] rounded-2xl
                         text-[14px] font-bold text-[#0F172A]
                         active:scale-[0.97] transition-all"
            >
              <Phone size={17} className="text-[#DC2626]" />
              {t('sos.orCall112')}
            </a>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STATE 2 — SENDING                             */}
        {/* ══════════════════════════════════════════════ */}
        {sosState === SOS_STATE.SENDING && (
          <motion.div
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen
                       px-6 text-center bg-[#DC2626]"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Radio size={64} className="text-white mb-4" />
            </motion.div>
            <h2 className="text-[24px] font-black text-white mb-2">
              {t('sos.sending')}
            </h2>
            <p className="text-[14px] text-white/80">
              {t('sos.sendingSub')}
            </p>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STATE 3 — SENT (Status Tracking)              */}
        {/* ══════════════════════════════════════════════ */}
        {sosState === SOS_STATE.SENT && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 pt-4 pb-[80px]"
          >
            {/* Alert dispatched header */}
            <div className="bg-[#DC2626] rounded-2xl px-5 py-5 mb-4 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center
                              justify-center mx-auto mb-3">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h2 className="text-[22px] font-black text-white">
                {t('sos.alertSent')}
              </h2>
              <p className="text-[13px] text-white/80 mt-1">
                {t('sos.alertSentSub')}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-white/60">
                <Clock size={12} />
                <span className="text-[11px]">
                  {t('sos.sentAgo', { time: formatElapsed(elapsed) })}
                </span>
              </div>
            </div>

            {/* Alert ID */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#94A3B8]">{t('sos.alertReference')}</span>
                <span className="text-[11px] font-mono font-bold text-[#0F172A]">
                  {sosId}
                </span>
              </div>
              {geo.location && (
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-[#94A3B8]">{t('sos.yourLocation')}</span>
                  <span className="text-[10px] font-mono text-[#059669]">
                    {geo.location.lat.toFixed(5)}, {geo.location.lng.toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {/* Status timeline */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">
                {t('sos.rescueStatus')}
              </h3>
              <div className="space-y-0">
                {Object.entries(STATUS_MESSAGES).map(([key, cfg], idx, arr) => {
                  const statusOrder  = Object.keys(STATUS_MESSAGES);
                  const currentIdx   = statusOrder.indexOf(sosStatus);
                  const thisIdx      = statusOrder.indexOf(key);
                  const isCompleted  = thisIdx < currentIdx;
                  const isCurrent    = key === sosStatus;
                  const isPending    = thisIdx > currentIdx;
                  const Icon         = cfg.icon;
                  const isLast       = idx === arr.length - 1;

                  return (
                    <div key={key} className="flex items-start gap-3">
                      {/* Timeline dot and line */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center
                                     justify-center border-2 transition-all"
                          style={{
                            backgroundColor: isCompleted || isCurrent
                              ? cfg.color : 'white',
                            borderColor: isPending ? '#E2E8F0' : cfg.color,
                          }}
                        >
                          {isCurrent ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            >
                              <Loader2 size={14} className="text-white" />
                            </motion.div>
                          ) : (
                            <Icon
                              size={14}
                              className={isCompleted ? 'text-white' : 'text-[#CBD5E1]'}
                            />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className="w-0.5 h-6 mt-1"
                            style={{
                              backgroundColor: isCompleted ? cfg.color : '#E2E8F0',
                            }}
                          />
                        )}
                      </div>

                      {/* Status text */}
                      <div className="flex-1 pb-6">
                        <p
                          className="text-[13px] font-semibold leading-none"
                          style={{
                            color: isPending ? '#94A3B8' : cfg.color,
                          }}
                        >
                          {cfg.label}
                        </p>
                        {isCurrent && (
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">
                            {t('sos.inProgress')}
                          </p>
                        )}
                        {isCompleted && (
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">
                            {t('sos.done')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stay safe instructions */}
            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-4 mb-4">
              <p className="text-[13px] font-bold text-[#D97706] mb-2">
                {t('sos.whileYouWait')}
              </p>
              <div className="space-y-2">
                {[
                  t('sos.waitTip1'),
                  t('sos.waitTip2'),
                  t('sos.waitTip3'),
                  t('sos.waitTip4'),
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]
                                    flex-shrink-0 mt-1.5" />
                    <p className="text-[12px] text-[#92400E] leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearest camp */}
            {nearestCamp && (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0]
                              rounded-2xl p-4 mb-4">
                <p className="text-[11px] font-bold text-[#059669] uppercase
                              tracking-wide mb-2">
                  {t('sos.nearestSafeZone')}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-[#059669]">
                      {nearestCamp.name}
                    </p>
                    <p className="text-[11px] text-[#065F46]">
                      {t('sos.capacity', { count: nearestCamp.capacity })}
                    </p>
                  </div>
                  {nearestCamp.contact && (
                    <a
                      href={`tel:${nearestCamp.contact}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#059669]
                                 text-white rounded-xl text-[11px] font-bold"
                    >
                      <Phone size={12} />
                      {t('sos.callCamp')}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Emergency call */}
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2 w-full py-4
                         bg-[#0F172A] text-white rounded-2xl text-[15px]
                         font-black mb-3 active:scale-[0.97] transition-all"
            >
              <Phone size={18} />
              {t('sos.call112')}
            </a>

            {/* Send another SOS */}
            <button
              onClick={handleReset}
              className="w-full py-3 border-2 border-[#E2E8F0] rounded-2xl
                         text-[12px] font-semibold text-[#475569]
                         hover:bg-[#F8FAFC] transition-all"
            >
              {t('sos.sendAnother')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSOS;
