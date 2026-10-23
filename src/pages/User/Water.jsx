import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, MapPin, CheckCircle2, AlertTriangle,
  Clock, Navigation, Phone, Info, ChevronRight,
  Waves, FlaskConical, Zap, Sun, RefreshCw, Users
} from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { MOCK_PURIFICATION } from '../../data/mockData';
import { useMotion } from '../../hooks/useMotion';

// Convert TDS ppm to plain citizen language
const getTDSQuality = (ppm) => {
  if (ppm === null || ppm === undefined) return null;
  if (ppm <= 50)  return { label: 'Excellent', sub: 'Very safe to drink', color: '#059669', bg: '#ECFDF5' };
  if (ppm <= 150) return { label: 'Good',      sub: 'Safe to drink',      color: '#059669', bg: '#F0FDF4' };
  if (ppm <= 300) return { label: 'Acceptable', sub: 'Safe to drink',     color: '#D97706', bg: '#FFFBEB' };
  if (ppm <= 500) return { label: 'Poor',      sub: 'Use with caution',   color: '#EA580C', bg: '#FFF7ED' };
  return                  { label: 'Unsafe',    sub: 'Do not drink',       color: '#DC2626', bg: '#FEF2F2' };
};

// FWPU-X water points — derived from rescue camps + purification data
const getWaterPoints = (rescueCamps, purification) => {
  const camps = rescueCamps.filter(c => c.status === 'active');
  return camps.map((camp, idx) => ({
    id:          `WP-${String(idx + 1).padStart(2, '0')}`,
    name:        `Water Point — ${camp.name}`,
    location:    camp.name,
    lat:         camp.lat,
    lng:         camp.lng,
    contact:     camp.contact,
    status:      'operational',
    tdsOutput:   idx === 0 ? purification?.current?.tdsOutput ?? 22 : 18 + idx * 3,
    flowRate:    idx === 0 ? purification?.current?.flowRate  ?? 2.8 : 2.2,
    dailyOutput: idx === 0 ? purification?.daily?.volumeProduced ?? 42.6 : 38.4,
    uvActive:    true,
    solarPowered: true,
    lastUpdated: Date.now() - (idx * 8 * 60 * 1000),
    waitTime:    idx === 0 ? '< 5 min' : '5\u201310 min',
  }));
};

// Water point status config
const POINT_STATUS = {
  operational: { label: 'Water Available', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  limited:     { label: 'Limited Supply',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  offline:     { label: 'Offline',         color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

// ── Water Point Card Component ──────────────────────────
const WaterPointCard = ({ point, idx }) => {
  const [expanded, setExpanded] = useState(false);
  const sc      = POINT_STATUS[point.status] || POINT_STATUS.operational;
  const quality = getTDSQuality(point.tdsOutput);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.18 }}
      className="bg-white border-2 rounded-2xl overflow-hidden"
      style={{ borderColor: sc.border }}
    >
      {/* Status strip */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: sc.bg }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ backgroundColor: sc.color }}
          />
          <span className="text-[11px] font-bold uppercase tracking-wide"
                style={{ color: sc.color }}>
            {sc.label}
          </span>
        </div>
        <span className="text-[10px] font-medium"
              style={{ color: sc.color + '99' }}>
          Wait: {point.waitTime}
        </span>
      </div>

      {/* Main card content */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center
                          justify-center flex-shrink-0">
            <Droplets size={24} className="text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-[#0F172A] leading-tight">
              {point.location}
            </h3>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-mono">{point.id}</p>
          </div>
        </div>

        {/* Water quality display */}
        {quality && (
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
            style={{ backgroundColor: quality.bg }}
          >
            <div className="flex items-center gap-2">
              <FlaskConical size={15} style={{ color: quality.color }} />
              <div>
                <p className="text-[13px] font-bold" style={{ color: quality.color }}>
                  Water Quality: {quality.label}
                </p>
                <p className="text-[11px]" style={{ color: quality.color + 'CC' }}>
                  {quality.sub}
                </p>
              </div>
            </div>
            <CheckCircle2 size={18} style={{ color: quality.color }} />
          </div>
        )}

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Available Today', value: `${point.dailyOutput}L`, icon: Waves,    color: '#2563EB' },
            { label: 'Flow Rate',       value: `${point.flowRate} L/min`, icon: Droplets, color: '#059669' },
            { label: 'Powered By',      value: 'Solar',                  icon: Sun,      color: '#D97706' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-[#F8FAFC] rounded-xl px-2 py-2.5 text-center border border-[#F1F5F9]">
                <Icon size={14} style={{ color: stat.color }} className="mx-auto mb-1" />
                <p className="text-[11px] font-bold text-[#0F172A] leading-none">{stat.value}</p>
                <p className="text-[9px] text-[#94A3B8] mt-0.5 leading-none">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* UV Sterilized badge */}
        {point.uvActive && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
            <Zap size={12} className="text-[#059669] flex-shrink-0" />
            <p className="text-[11px] font-semibold text-[#059669]">
              UV sterilized — bacteria and viruses removed
            </p>
          </div>
        )}

        {/* Expand for more info */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between py-1"
        >
          <span className="text-[11px] font-medium text-[#2563EB]">
            {expanded ? 'Less info' : 'More info'}
          </span>
          {expanded
            ? <ChevronRight size={14} className="text-[#2563EB] rotate-90" />
            : <ChevronRight size={14} className="text-[#2563EB]" />
          }
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{    height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-[#F1F5F9] mt-2 space-y-2">
                {[
                  { label: 'Purification',   value: 'Sediment \u2192 Carbon \u2192 RO Membrane \u2192 UV' },
                  { label: 'Safe for',       value: 'Drinking, cooking, and baby formula'    },
                  { label: 'Bring',          value: 'Your own clean container or bottle'     },
                  { label: 'Free of charge', value: 'No payment required \u2014 emergency supply' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <span className="text-[10px] text-[#94A3B8] flex-shrink-0 pt-0.5 w-20">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-medium text-[#475569]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action button — Call only, no Get Directions */}
      <div className="px-4 pb-4">
        {point.contact ? (
          <a
            href={`tel:${point.contact}`}
            className="flex items-center justify-center gap-2 w-full py-3
                       bg-[#059669] text-white rounded-xl text-[13px]
                       font-bold active:scale-[0.97] transition-all"
          >
            <Phone size={15} />
            Call Water Point — {point.contact}
          </a>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F8FAFC]
                          border border-[#E2E8F0] rounded-xl">
            <Info size={13} className="text-[#94A3B8] flex-shrink-0" />
            <p className="text-[11px] text-[#64748B]">
              Go to this location to collect water · See map tab for directions
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Family Water Calculator ─────────────────────────────
const FamilyCalculator = () => {
  const [people, setPeople] = useState(4);

  const drinkingLitres = people * 2.5;
  const cookingLitres  = people * 2;
  const totalLitres    = drinkingLitres + cookingLitres;
  const tripsNeeded    = Math.ceil(totalLitres / 10);

  return (
    <div className="bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-[#2563EB]" />
        <h3 className="text-[14px] font-bold text-[#2563EB]">
          How Much Water Does Your Family Need?
        </h3>
      </div>

      {/* People selector */}
      <div className="bg-white rounded-xl p-3 mb-4 border border-[#BFDBFE]">
        <p className="text-[11px] font-semibold text-[#94A3B8] mb-2 uppercase tracking-wide">
          Number of People
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setPeople(Math.max(1, people - 1))}
            className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]
                       text-[#2563EB] text-[20px] font-bold flex items-center
                       justify-center active:scale-[0.92] transition-all"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <p className="text-[36px] font-black text-[#2563EB] leading-none">{people}</p>
            <p className="text-[11px] text-[#64748B]">
              {people === 1 ? 'person' : 'people'}
            </p>
          </div>
          <button
            onClick={() => setPeople(Math.min(20, people + 1))}
            className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]
                       text-[#2563EB] text-[20px] font-bold flex items-center
                       justify-center active:scale-[0.92] transition-all"
          >
            +
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'For Drinking', value: `${drinkingLitres}L`, sub: '2.5L per person per day', color: '#2563EB', bg: '#EFF6FF' },
          { label: 'For Cooking',  value: `${cookingLitres}L`,  sub: '2L per person per day',   color: '#059669', bg: '#ECFDF5' },
        ].map(s => (
          <div key={s.label}
               className="rounded-xl px-3 py-2.5 border text-center"
               style={{ backgroundColor: s.bg, borderColor: s.color + '40' }}>
            <p className="text-[10px] text-[#94A3B8] mb-1">{s.label}</p>
            <p className="text-[20px] font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-[#94A3B8] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Total + trips */}
      <div className="bg-white rounded-xl px-4 py-3 border border-[#BFDBFE] text-center">
        <p className="text-[11px] text-[#64748B] mb-1">Your family needs</p>
        <p className="text-[28px] font-black text-[#0F172A] leading-none">
          {totalLitres}L
          <span className="text-[14px] font-medium text-[#94A3B8] ml-1">per day</span>
        </p>
        <p className="text-[12px] font-semibold text-[#2563EB] mt-2">
          ≈ {tripsNeeded} trip{tripsNeeded > 1 ? 's' : ''} to the water point today
        </p>
      </div>
    </div>
  );
};

// ── Collection Checklist ────────────────────────────────
const CollectionChecklist = () => {
  const bringItems = [
    'Clean plastic or steel containers with lids',
    'Carry bags — water is heavy (1L = 1kg)',
    'Your phone — in case of emergency',
    'Wear footwear — ground may be wet',
  ];
  const doNotBring = [
    'Dirty or open containers — water will be contaminated',
    'Glass bottles — may break and injure others',
    'Children alone — always have an adult present',
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[18px]">📋</span>
        <h3 className="text-[14px] font-bold text-[#0F172A]">
          When You Go to Collect Water
        </h3>
      </div>

      {/* Bring */}
      <p className="text-[11px] font-bold text-[#059669] uppercase tracking-wide mb-2">
        ✅ Bring these
      </p>
      <div className="space-y-2 mb-4">
        {bringItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#ECFDF5] flex items-center
                            justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px]">✓</span>
            </div>
            <p className="text-[12px] text-[#475569] leading-relaxed">{item}</p>
          </div>
        ))}
      </div>

      {/* Do not bring */}
      <p className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wide mb-2">
        ❌ Do not bring
      </p>
      <div className="space-y-2">
        {doNotBring.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#FEF2F2] flex items-center
                            justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px]">✕</span>
            </div>
            <p className="text-[12px] text-[#475569] leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Water Storage Guide ─────────────────────────────────
const WaterStorageGuide = () => (
  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[18px]">🧴</span>
      <h3 className="text-[14px] font-bold text-[#0F172A]">
        How to Store Water Safely at Home
      </h3>
    </div>
    <div className="space-y-3">
      {[
        { icon: '🪣', title: 'Keep containers covered',              sub: 'Always close lids tightly to prevent contamination' },
        { icon: '🕐', title: 'Purified water stays safe for 24 hours', sub: 'Collect fresh water daily — do not store more than one day' },
        { icon: '🌡️', title: 'Store in a cool, shaded place',         sub: 'Heat speeds up bacterial growth — avoid sunlight' },
        { icon: '🧒', title: 'Keep away from children',              sub: 'Store water containers out of reach to prevent spillage' },
      ].map((tip, idx) => (
        <div key={idx} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
          <span className="text-[20px] flex-shrink-0">{tip.icon}</span>
          <div>
            <p className="text-[12px] font-bold text-[#0F172A]">{tip.title}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{tip.sub}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Emergency Water Alternatives ────────────────────────
const EmergencyWaterGuide = () => (
  <div className="bg-[#FFF7ED] border-2 border-[#FED7AA] rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <AlertTriangle size={16} className="text-[#D97706]" />
      <h3 className="text-[14px] font-bold text-[#D97706]">
        If No Water Points Are Available
      </h3>
    </div>

    <p className="text-[12px] text-[#92400E] mb-3 leading-relaxed">
      If ResQMatrix water points are offline, follow these steps to make water safer:
    </p>

    {/* Boiling guide */}
    <div className="bg-white rounded-xl p-3 mb-3 border border-[#FED7AA]">
      <p className="text-[12px] font-bold text-[#0F172A] mb-2">
        🔥 Boiling Method (Most Reliable)
      </p>
      {[
        'Filter water through a clean cloth to remove solids',
        'Boil at full rolling boil for at least 1 minute',
        'Let it cool in a covered container',
        'Do not re-expose to outside air until use',
      ].map((step, i) => (
        <div key={i} className="flex items-start gap-2 mb-1.5">
          <div className="w-4 h-4 rounded-full bg-[#D97706] flex items-center
                          justify-center flex-shrink-0 mt-0.5">
            <span className="text-[8px] font-bold text-white">{i + 1}</span>
          </div>
          <p className="text-[11px] text-[#475569]">{step}</p>
        </div>
      ))}
    </div>

    {/* Alternatives */}
    <div className="space-y-2">
      {[
        { icon: '💊', text: 'Water purification tablets — 1 tablet per 1L, wait 30 minutes' },
        { icon: '🛒', text: 'Sealed bottled water from shops — check seal before buying' },
        { icon: '📞', text: 'Call rescue teams — they carry emergency water supply' },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span className="text-[16px] flex-shrink-0">{item.icon}</span>
          <p className="text-[12px] text-[#92400E] leading-relaxed">{item.text}</p>
        </div>
      ))}
    </div>
  </div>
);

// ── Main Page Component ─────────────────────────────────
const UserWater = () => {
  const motion_config = useMotion();
  const rescueCamps   = useDataStore(s => s.rescueCamps);
  const purification  = MOCK_PURIFICATION;

  const waterPoints   = getWaterPoints(rescueCamps, purification);
  const operational   = waterPoints.filter(p => p.status === 'operational');

  const systemOnline = operational.length > 0;
  const totalLiters  = waterPoints.reduce((s, p) => s + p.dailyOutput, 0).toFixed(1);

  return (
    <motion.div
      {...motion_config.fadeSlideUp}
      className="px-4 pt-4 pb-6 space-y-4"
    >

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-[#0F172A]">Clean Water</h1>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            {operational.length} water point{operational.length !== 1 ? 's' : ''} active nearby
          </p>
        </div>
        <button
          className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]
                     text-[#475569] hover:bg-[#F8FAFC] transition-colors"
          title="Refresh"
          aria-label="Refresh water points"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── System Status Banner ─────────────────────────── */}
      {systemOnline ? (
        <div className="bg-[#ECFDF5] border-2 border-[#A7F3D0] rounded-2xl px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#059669] flex items-center
                            justify-center flex-shrink-0">
              <Droplets size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[16px] font-black text-[#059669]">
                Clean Water Available
              </p>
              <p className="text-[12px] text-[#065F46]">
                {totalLiters}L purified today · Free of charge
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Points Open',    value: String(operational.length), icon: MapPin },
              { label: 'Purified Today', value: `${totalLiters}L`,          icon: Waves  },
              { label: 'Power Source',   value: 'Solar',                    icon: Sun    },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-xl px-2 py-2 text-center border border-[#A7F3D0]">
                  <Icon size={13} className="text-[#059669] mx-auto mb-1" />
                  <p className="text-[12px] font-bold text-[#059669]">{s.value}</p>
                  <p className="text-[9px] text-[#64748B] mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#FEF2F2] border-2 border-[#FECACA] rounded-2xl px-4 py-4 flex items-center gap-3">
          <AlertTriangle size={24} className="text-[#DC2626] flex-shrink-0" />
          <div>
            <p className="text-[14px] font-bold text-[#DC2626]">No water points currently active</p>
            <p className="text-[12px] text-[#991B1B] mt-0.5">
              Contact rescue teams or call 112 for emergency water supply.
            </p>
          </div>
        </div>
      )}

      {/* ── How To Use ──────────────────────────────────── */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl px-4 py-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <Info size={14} className="text-[#2563EB]" />
          <p className="text-[12px] font-bold text-[#2563EB]">How to collect water</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { step: '1', text: 'Go to the nearest water point on the map',  icon: MapPin       },
            { step: '2', text: 'Bring a clean container or bottle',          icon: Droplets     },
            { step: '3', text: 'Collect purified water — completely free',   icon: CheckCircle2 },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex flex-col items-center text-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center
                                justify-center flex-shrink-0 text-[12px] font-black text-white">
                  {item.step}
                </div>
                <p className="text-[10px] text-[#1D4ED8] leading-tight">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Water Points List ────────────────────────────── */}
      <div>
        <h2 className="text-[13px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">
          Water Points Near You
        </h2>
        {waterPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-3">
              <Droplets size={24} className="text-[#94A3B8]" />
            </div>
            <p className="text-[14px] font-bold text-[#475569]">No water points configured</p>
            <p className="text-[12px] text-[#94A3B8] mt-1 max-w-[220px]">
              Contact rescue teams or call 112 for emergency water assistance
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {waterPoints.map((point, idx) => (
              <WaterPointCard key={point.id} point={point} idx={idx} />
            ))}
          </div>
        )}
      </div>

      {/* ── Family Water Calculator ──────────────────────── */}
      <FamilyCalculator />

      {/* ── Collection Checklist ─────────────────────────── */}
      <CollectionChecklist />

      {/* ── Water Storage Guide ──────────────────────────── */}
      <WaterStorageGuide />

      {/* ── Emergency Alternatives ───────────────────────── */}
      <EmergencyWaterGuide />

      {/* ── FWPU-X System Info ───────────────────────────── */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4">
        <p className="text-[12px] font-bold text-[#0F172A] mb-2">
          About the ResQMatrix Water Purification System
        </p>
        <p className="text-[11px] text-[#64748B] leading-relaxed mb-3">
          ResQMatrix uses solar-powered floating water purification units (FWPU-X) that
          convert flood water into safe drinking water using a 5-stage process —
          sediment filtration, carbon filtration, reverse osmosis membrane,
          and UV sterilization. No mains power required.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Removes',    value: '99.9% bacteria, viruses, impurities' },
            { label: 'Powered by', value: 'Solar panels — works without electricity' },
            { label: 'Capacity',   value: '40–60 litres per day per unit' },
            { label: 'Quality',    value: 'WHO drinking water standard' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl px-3 py-2.5 border border-[#F1F5F9]">
              <p className="text-[9px] text-[#94A3B8] uppercase tracking-wide mb-0.5">{item.label}</p>
              <p className="text-[11px] font-semibold text-[#0F172A] leading-snug">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Water Safety Tips ───────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-[#2563EB]" />
          <p className="text-[13px] font-bold text-[#0F172A]">Water Safety During Floods</p>
        </div>
        <div className="space-y-2.5">
          {[
            { text: 'Only drink water from ResQMatrix water points or sealed bottles', color: '#059669' },
            { text: 'Never drink floodwater — it contains bacteria and chemicals', color: '#DC2626' },
            { text: 'Boil water if ResQMatrix points are unavailable', color: '#D97706' },
            { text: 'Use purified water for cooking and baby formula', color: '#2563EB' },
            { text: 'Store collected water in clean, covered containers', color: '#0F172A' },
          ].map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                   style={{ backgroundColor: tip.color }} />
              <p className="text-[12px] text-[#475569] leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Emergency call ───────────────────────────────── */}
      <a
        href="tel:112"
        className="flex items-center justify-center gap-2 w-full py-4
                   bg-white border-2 border-[#E2E8F0] rounded-2xl
                   text-[14px] font-bold text-[#0F172A]
                   active:scale-[0.97] transition-all"
      >
        <Phone size={16} className="text-[#DC2626]" />
        Emergency — Call 112
      </a>

      {/* Footer */}
      <p className="text-center text-[10px] text-[#CBD5E1]">
        Water quality monitored in real-time by ResQMatrix sensor network
      </p>

    </motion.div>
  );
};

export default UserWater;
