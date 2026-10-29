import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Shield, AlertTriangle, Heart,
  Navigation, ChevronRight, ChevronDown,
  CheckCircle2, Users, MapPin, Info,
  Flame, Siren, Building2, Radio,
  Brain, Backpack, Zap, ArrowUp,
  Waves, Tent, LifeBuoy, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useDataStore  from '../../store/useDataStore';
import { useMotion } from '../../hooks/useMotion';

// Lucide icon mapping for evacuation steps (replaces emojis)
const EVAC_ICONS = {
  1: Brain,     // was 🧠
  2: Backpack,  // was 🎒
  3: Zap,       // was ⚡
  4: ArrowUp,   // was ⬆️
  5: Waves,     // was 🌊
  6: Tent,      // was 🏕️
  7: LifeBuoy,  // was 🆘
  8: Home,      // was 🏠
};

// ── Emergency contacts — hardcoded so they work offline ──────────────────────
const EMERGENCY_CONTACTS = [
  { id: 'ec-01', nameKey: 'nationalEmergency',  subKey: 'nationalEmergencySub',  number: '112',            icon: Siren,    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', priority: true  },
  { id: 'ec-02', nameKey: 'ndrfHelpline',       subKey: 'ndrfHelplineSub',       number: '011-24363260',   icon: Shield,   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', priority: false },
  { id: 'ec-03', nameKey: 'ambulanceName',       subKey: 'ambulanceSub',          number: '108',            icon: Heart,    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', priority: false },
  { id: 'ec-04', nameKey: 'policeControlRoom',   subKey: 'policeControlRoomSub',  number: '100',            icon: Shield,   color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', priority: false },
  { id: 'ec-05', nameKey: 'fireServices',        subKey: 'fireServicesSub',       number: '101',            icon: Flame,    color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', priority: false },
  { id: 'ec-06', nameKey: 'apDisasterAuthority', subKey: 'apDisasterAuthoritySub', number: '1070',          icon: Building2, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', priority: false },
  { id: 'ec-07', nameKey: 'svceCommandPost',     subKey: 'svceCommandPostSub',    number: '+91 99483 43423', icon: Radio,   color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', priority: false },
];

// ── Evacuation steps config ─────────────────────────────
const EVAC_STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8];
const EVAC_COLORS = {
  1: '#2563EB', 2: '#D97706', 3: '#D97706', 4: '#EA580C',
  5: '#DC2626', 6: '#059669', 7: '#DC2626', 8: '#7C3AED',
};

// ── Evacuation Step Card ─────────────────────────────────────────────────────
const EvacuationCard = ({ stepNum, idx }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const EvacIcon = EVAC_ICONS[stepNum];
  const color = EVAC_COLORS[stepNum];
  const title  = t(`help.evacuation.step${stepNum}Title`);
  const detail = t(`help.evacuation.step${stepNum}Detail`);
  const tips   = t(`help.evacuation.step${stepNum}Tips`, { returnObjects: true }) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="bg-white border-2 border-[#E2E8F0] rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
      >
        {/* Step number + icon */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center
                       text-[13px] font-black text-white"
            style={{ backgroundColor: color }}
          >
            {stepNum}
          </div>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color + '15' }}
          >
            <EvacIcon size={16} style={{ color }} />
          </div>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#0F172A] leading-snug">
            {title}
          </p>
          {!expanded && (
            <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
              {detail}
            </p>
          )}
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0">
          {expanded
            ? <ChevronDown size={18} className="text-[#94A3B8]" />
            : <ChevronRight size={18} className="text-[#94A3B8]" />
          }
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[#F1F5F9]">
              {/* Detail */}
              <div
                className="mt-3 px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: color + '10' }}
              >
                <p className="text-[12px] font-semibold leading-relaxed"
                   style={{ color }}>
                  {detail}
                </p>
              </div>
              {/* Tips */}
              <div className="mt-3 space-y-2">
                {Array.isArray(tips) && tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center
                                 flex-shrink-0 mt-0.5 text-[9px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-[12px] text-[#475569] leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const UserContacts = () => {
  const { t }           = useTranslation();
  const navigate        = useNavigate();
  const motion_config   = useMotion();
  const [activeTab, setActiveTab] = useState('contacts');
  const rescueCamps = useDataStore(s => s.rescueCamps);
  const teams       = useDataStore(s => s.teams);
  const deployed    = teams.filter(t => t.status === 'deployed');

  const TABS = [
    { value: 'contacts',   label: t('help.tabContacts')  },
    { value: 'evacuation', label: t('help.tabEvacuate')  },
  ];

  return (
    <motion.div
      {...motion_config.fadeSlideUp}
      className="px-4 pt-4 pb-6"
    >

      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="text-[22px] font-black text-[#0F172A]">{t('help.title')}</h1>
        <p className="text-[12px] text-[#64748B] mt-0.5">
          {t('help.subtitle')}
        </p>
      </div>

      {/* ── Tab Switcher ─────────────────────────────────── */}
      <div className="flex gap-2 mb-5 bg-[#F1F5F9] p-1 rounded-2xl">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold
                        transition-all duration-150
              ${activeTab === tab.value
                ? 'bg-white text-[#0F172A] shadow-sm'
                : 'text-[#64748B]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════ */}
        {/* CONTACTS TAB                                */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'contacts' && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0  }}
            exit={{    opacity: 0, x: -8  }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Priority contact — 112 */}
            {(() => {
              const c = EMERGENCY_CONTACTS[0];
              const Icon = c.icon;
              return (
                <a
                  href={`tel:${c.number}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2
                             active:scale-[0.97] transition-all"
                  style={{ backgroundColor: c.bg, borderColor: c.color }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center
                               justify-center flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    <Icon size={30} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-black" style={{ color: c.color }}>
                      {t(`help.contacts.${c.nameKey}`)}
                    </p>
                    <p className="text-[24px] font-black text-[#0F172A] leading-none mt-0.5">
                      {c.number}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: c.color + 'CC' }}>
                      {t(`help.contacts.${c.subKey}`)}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center
                               justify-center flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    <Phone size={18} className="text-white" />
                  </div>
                </a>
              );
            })()}

            {/* Other contacts */}
            <div className="space-y-2.5">
              {EMERGENCY_CONTACTS.slice(1).map((contact, idx) => {
                const Icon = contact.icon;
                return (
                  <motion.a
                    key={contact.id}
                    href={`tel:${contact.number}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3.5 bg-white
                               border border-[#E2E8F0] rounded-2xl
                               active:scale-[0.97] transition-all"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center
                                 justify-center flex-shrink-0"
                      style={{ backgroundColor: contact.bg }}
                    >
                      <Icon size={20} style={{ color: contact.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#0F172A]">
                        {t(`help.contacts.${contact.nameKey}`)}
                      </p>
                      <p className="text-[15px] font-black font-mono"
                         style={{ color: contact.color }}>
                        {contact.number}
                      </p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">
                        {t(`help.contacts.${contact.subKey}`)}
                      </p>
                    </div>
                    <div
                      className="w-9 h-9 rounded-full flex items-center
                                 justify-center flex-shrink-0"
                      style={{ backgroundColor: contact.bg, border: `1.5px solid ${contact.border}` }}
                    >
                      <Phone size={15} style={{ color: contact.color }} />
                    </div>
                  </motion.a>
                );
              })}
            </div>

            {/* Dynamic rescue camps from store */}
            {rescueCamps.filter(c => c.status === 'active' && c.contact).length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase
                              tracking-wide mb-2.5 mt-2">
                  {t('help.rescueCampsInArea')}
                </p>
                <div className="space-y-2">
                  {rescueCamps
                    .filter(c => c.status === 'active' && c.contact)
                    .map(camp => (
                      <a
                        key={camp.id}
                        href={`tel:${camp.contact}`}
                        className="flex items-center gap-3 px-4 py-3 bg-[#F0FDF4]
                                   border border-[#A7F3D0] rounded-xl
                                   active:scale-[0.97] transition-all"
                      >
                        <MapPin size={16} className="text-[#059669] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-[#059669] truncate">
                            {camp.name}
                          </p>
                          <p className="text-[13px] font-black font-mono text-[#065F46]">
                            {camp.contact}
                          </p>
                        </div>
                        <Phone size={14} className="text-[#059669] flex-shrink-0" />
                      </a>
                    ))}
                </div>
              </div>
            )}

            {/* Deployed teams with contact */}
            {deployed.filter(t => t.contact).length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase
                              tracking-wide mb-2.5 mt-2">
                  {t('help.activeRescueTeams')}
                </p>
                <div className="space-y-2">
                  {deployed.filter(t => t.contact).map(team => (
                    <a
                      key={team.id}
                      href={`tel:${team.contact}`}
                      className="flex items-center gap-3 px-4 py-3 bg-[#EFF6FF]
                                 border border-[#BFDBFE] rounded-xl
                                 active:scale-[0.97] transition-all"
                    >
                      <Users size={15} className="text-[#2563EB] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#2563EB] truncate">
                          {team.name} · {team.lead}
                        </p>
                        <p className="text-[13px] font-black font-mono text-[#1D4ED8]">
                          {team.contact}
                        </p>
                      </div>
                      <Phone size={14} className="text-[#2563EB] flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3">
              <p className="text-[11px] text-[#64748B] leading-relaxed text-center">
                {t('help.tapToCallTip')}
              </p>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* EVACUATION TAB                              */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'evacuation' && (
          <motion.div
            key="evacuation"
            initial={{ opacity: 0, x: 8  }}
            animate={{ opacity: 1, x: 0  }}
            exit={{    opacity: 0, x: 8  }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Interactive Evacuation Guide link */}
            <button
              onClick={() => navigate('/user/evacuation')}
              className="w-full flex items-center justify-between px-4 py-3.5
                         bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded-2xl mb-4
                         active:scale-[0.97] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center
                                justify-center flex-shrink-0">
                  <Navigation size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#2563EB]">
                    Interactive Evacuation Guide
                  </p>
                  <p className="text-[11px] text-[#1D4ED8] mt-0.5">
                    Step-by-step guided flow with checklists
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#2563EB]" />
            </button>

            {/* Header banner */}
            <div className="bg-[#FEF2F2] border-2 border-[#FECACA] rounded-2xl
                            px-4 py-3.5 flex items-start gap-3">
              <AlertTriangle size={20} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-[#DC2626]">
                  {t('help.readStepsNow')}
                </p>
                <p className="text-[11px] text-[#991B1B] mt-0.5 leading-relaxed">
                  {t('help.readStepsSub')}
                </p>
              </div>
            </div>

            {/* Step cards */}
            {EVAC_STEP_IDS.map((stepNum, idx) => (
              <EvacuationCard key={stepNum} stepNum={stepNum} idx={idx} />
            ))}

            {/* Quick reference */}
            <div className="bg-[#0F172A] rounded-2xl p-4">
              <p className="text-[12px] font-bold text-white mb-3">
                {t('help.quickReference')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { num: '112', label: t('help.emergency'),   color: '#EF4444' },
                  { num: '108', label: t('help.ambulance'),   color: '#F97316' },
                  { num: '100', label: t('help.police'),      color: '#60A5FA' },
                  { num: '1070',label: t('help.apDisaster'),  color: '#34D399' },
                ].map(n => (
                  <a key={n.num} href={`tel:${n.num}`}
                     className="flex items-center justify-between px-3 py-2.5
                                rounded-xl bg-white/10 active:bg-white/20 transition-all">
                    <span className="text-[11px] text-white/70">{n.label}</span>
                    <span className="text-[16px] font-black" style={{ color: n.color }}>
                      {n.num}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Navigate to SOS */}
            <button
              onClick={() => navigate('/user/sos')}
              className="w-full flex items-center justify-between px-5 py-4
                         bg-[#DC2626] rounded-2xl text-left
                         active:scale-[0.97] transition-all"
            >
              <div>
                <p className="text-[15px] font-black text-white">
                  {t('help.needRescueNow')}
                </p>
                <p className="text-[12px] text-white/70 mt-0.5">
                  {t('help.needRescueNowSub')}
                </p>
              </div>
              <ChevronRight size={22} className="text-white flex-shrink-0" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserContacts;
