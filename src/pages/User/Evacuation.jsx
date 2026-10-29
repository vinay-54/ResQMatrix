import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate }           from 'react-router-dom';
import { useTranslation }        from 'react-i18next';
import {
  CheckCircle2, Circle, ChevronRight, ChevronLeft,
  AlertTriangle, MapPin, Phone, ShieldCheck,
  Zap, ArrowUp, Backpack, Waves, Home,
  AlertOctagon, Navigation, RefreshCw, Flag
} from 'lucide-react';
import useDataStore  from '../../store/useDataStore';
import useAuthStore  from '../../store/useAuthStore';
import { useMotion } from '../../hooks/useMotion';

// ── Evacuation Stages Data ──────────────────────────────────────────────────
const EVACUATION_STAGES = [
  {
    id:       'ev-01',
    step:     1,
    icon:     AlertTriangle,
    color:    '#2563EB',
    bg:       '#EFF6FF',
    border:   '#BFDBFE',
    title:    'Understand the Situation',
    summary:  'Know your current alert level before moving',
    detail:   'Check the IDMS alert level for your area. Do not wait for water to enter your home before acting — leave when you receive a WARNING, not when you see DANGER.',
    items: [
      { id: 'ev-01-01', text: 'Check current flood alert level on Home screen'    },
      { id: 'ev-01-02', text: 'Warn your immediate family and neighbours'           },
      { id: 'ev-01-03', text: 'Decide whether to shelter in place or evacuate'     },
      { id: 'ev-01-04', text: 'Do not wait — act now while roads are still passable'},
    ],
  },
  {
    id:     'ev-02',
    step:   2,
    icon:   Backpack,
    color:  '#D97706',
    bg:     '#FFFBEB',
    border: '#FDE68A',
    title:  'Pack Your Emergency Bag',
    summary:'You have 5 minutes. Take only what you can carry.',
    detail: 'Pack one bag per adult. Every minute you spend inside is a minute the water is rising. Take what you cannot replace — not what you value.',
    items: [
      { id: 'ev-02-01', text: 'Aadhar card, ID documents, and insurance papers' },
      { id: 'ev-02-02', text: 'Mobile phone, charger, and powerbank'             },
      { id: 'ev-02-03', text: 'Medicines — especially for elderly and children'  },
      { id: 'ev-02-04', text: 'Cash — ATMs may not work during floods'           },
      { id: 'ev-02-05', text: '1 to 2 litres of drinking water per person'       },
      { id: 'ev-02-06', text: 'One change of clothes per person'                 },
    ],
  },
  {
    id:     'ev-03',
    step:   3,
    icon:   Zap,
    color:  '#D97706',
    bg:     '#FFFBEB',
    border: '#FDE68A',
    title:  'Switch Off Electricity',
    summary:'Electrical shocks kill more people than the flood itself.',
    detail: 'Find your home electrical main switch or fuse box and turn it fully OFF. Do this only if it is safe to reach — do not enter a room that already has water on the floor.',
    items: [
      { id: 'ev-03-01', text: 'Locate your home main electrical breaker or fuse box' },
      { id: 'ev-03-02', text: 'Switch it fully to the OFF position'                  },
      { id: 'ev-03-03', text: 'Turn off gas supply valve if accessible'              },
      { id: 'ev-03-04', text: 'Do NOT enter a room with water already on the floor'  },
    ],
  },
  {
    id:     'ev-04',
    step:   4,
    icon:   ArrowUp,
    color:  '#EA580C',
    bg:     '#FFF7ED',
    border: '#FED7AA',
    title:  'Move to Higher Ground',
    summary:'Go up — upper floors, strong buildings, elevated land.',
    detail: 'Always go higher — never lower. A strong multi-storey building is safer than trying to travel in active floodwater. Never go to a basement or ground floor during rising water.',
    items: [
      { id: 'ev-04-01', text: 'Use stairs only — never an elevator during flooding'          },
      { id: 'ev-04-02', text: 'Walk on pavements not roads — manholes may be open underwater' },
      { id: 'ev-04-03', text: 'Avoid bridges and underpasses — water flows fastest there'    },
      { id: 'ev-04-04', text: 'Do not attempt to cross moving water on foot'                 },
    ],
  },
  {
    id:     'ev-05',
    step:   5,
    icon:   Waves,
    color:  '#DC2626',
    bg:     '#FEF2F2',
    border: '#FECACA',
    title:  'Avoid Floodwater',
    summary:'15cm of fast water can knock an adult off their feet.',
    detail: '30cm of moving water can sweep away a car. Floodwater contains sewage, chemicals, sharp objects, and electrical hazards from submerged power lines. Treat every flooded road as impassable.',
    items: [
      { id: 'ev-05-01', text: 'Never walk through floodwater — even ankle deep'        },
      { id: 'ev-05-02', text: 'Never drive into flooded roads — turn back immediately' },
      { id: 'ev-05-03', text: 'Watch for fallen power lines — water conducts electricity'},
      { id: 'ev-05-04', text: 'Use a stick to test depth if you absolutely must move'  },
    ],
  },
  {
    id:     'ev-06',
    step:   6,
    icon:   Navigation,
    color:  '#059669',
    bg:     '#ECFDF5',
    border: '#A7F3D0',
    title:  'Go to the Nearest Rescue Camp',
    summary:'Rescue camps have food, water, medicine, and shelter.',
    detail: 'Use the IDMS Safety Map to get directions to the nearest open rescue camp. Stay with your family — do not separate. Carry your ID — you may need to register at the camp.',
    items: [
      { id: 'ev-06-01', text: 'Open Map tab to see the nearest rescue camp'          },
      { id: 'ev-06-02', text: 'Walk along the highest available route'               },
      { id: 'ev-06-03', text: 'Stay with your family — do not separate in the crowd' },
      { id: 'ev-06-04', text: 'Carry your Aadhar card to register at the camp'       },
    ],
  },
  {
    id:     'ev-07',
    step:   7,
    icon:   AlertOctagon,
    color:  '#DC2626',
    bg:     '#FEF2F2',
    border: '#FECACA',
    title:  'If Trapped — Signal for Help',
    summary:'Make yourself visible and audible to rescuers.',
    detail: 'If you cannot move safely, do not risk it. Stay where you are, signal your location, and press SOS. Rescue teams will come to you — your job is to stay visible and alive.',
    items: [
      { id: 'ev-07-01', text: 'Press SOS button in IDMS — rescue team gets your GPS'              },
      { id: 'ev-07-02', text: 'Wave a brightly coloured cloth from a window or rooftop'           },
      { id: 'ev-07-03', text: 'Shout or make noise when you hear rescuers nearby'                 },
      { id: 'ev-07-04', text: 'Stay above water level — do not go to ground floor'               },
      { id: 'ev-07-05', text: 'Keep your phone charged — rescuers will call back'                },
    ],
  },
  {
    id:     'ev-08',
    step:   8,
    icon:   Home,
    color:  '#7C3AED',
    bg:     '#F5F3FF',
    border: '#DDD6FE',
    title:  'After Rescue — Do Not Return Yet',
    summary:'Floodwater causes hidden damage. Wait for clearance.',
    detail: 'Do not return home until official authorities say it is safe. Floodwater weakens foundations, contaminates water supply, and electrical wiring inside walls may still be live.',
    items: [
      { id: 'ev-08-01', text: 'Wait for official clearance from NDRF or district authorities'   },
      { id: 'ev-08-02', text: 'Do not use indoor taps until water supply is certified safe'     },
      { id: 'ev-08-03', text: 'Check for structural damage before entering any room'            },
      { id: 'ev-08-04', text: 'Watch for snakes and insects displaced by the flood'             },
      { id: 'ev-08-05', text: 'Report any damage to your local authority or rescue camp'        },
    ],
  },
];

// ── Checklist Item Component ────────────────────────────────────────────────
const CheckItem = ({ item, checked, onToggle, color }) => (
  <button
    onClick={() => onToggle(item.id)}
    className="w-full flex items-start gap-3 py-3 text-left
               border-b border-[#F1F5F9] last:border-0 transition-colors
               active:bg-[#F8FAFC]"
  >
    <div className="flex-shrink-0 mt-0.5">
      {checked
        ? <CheckCircle2 size={20} style={{ color }} />
        : <Circle      size={20} className="text-[#CBD5E1]" />
      }
    </div>
    <p className={`text-[13px] leading-relaxed transition-colors ${
      checked
        ? 'text-[#94A3B8] line-through'
        : 'text-[#0F172A] font-medium'
    }`}>
      {item.text}
    </p>
  </button>
);

// ── Progress Bar Component ──────────────────────────────────────────────────
const ProgressBar = ({ current, total, color }) => {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-[#64748B]">
          Step {current + 1} of {total}
        </span>
        <span className="text-[11px] font-bold" style={{ color }}>
          {pct}% complete
        </span>
      </div>
      <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// ── Completed Screen Component ──────────────────────────────────────────────
const CompletedScreen = ({ onRestart, onMarkSafe, nearestCamp }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center px-6 py-8 gap-4"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-[#ECFDF5] flex items-center
                   justify-center mb-2"
      >
        <Flag size={44} className="text-[#059669]" />
      </motion.div>

      <h2 className="text-[24px] font-black text-[#059669]">
        You Have Reached Safety
      </h2>
      <p className="text-[14px] text-[#64748B] leading-relaxed max-w-[280px]">
        You have completed all evacuation steps. Please inform rescue teams
        and mark yourself safe so they can focus on others.
      </p>

      {/* Mark safe CTA */}
      <button
        onClick={onMarkSafe}
        className="w-full py-4 bg-[#059669] text-white rounded-2xl
                   text-[15px] font-black mt-2
                   active:scale-[0.97] transition-all
                   flex items-center justify-center gap-2"
      >
        <ShieldCheck size={20} />
        Mark Myself as Safe
      </button>

      {/* Find nearest camp */}
      {nearestCamp && (
        <button
          onClick={() => navigate('/user/map')}
          className="w-full py-3.5 bg-white border-2 border-[#A7F3D0]
                     text-[#059669] rounded-2xl text-[13px] font-bold
                     active:scale-[0.97] transition-all
                     flex items-center justify-center gap-2"
        >
          <MapPin size={16} />
          Find Rescue Camp on Map
        </button>
      )}

      {/* Emergency call */}
      <a
        href="tel:112"
        className="w-full py-3.5 bg-[#FEF2F2] border-2 border-[#FECACA]
                   text-[#DC2626] rounded-2xl text-[13px] font-bold
                   active:scale-[0.97] transition-all
                   flex items-center justify-center gap-2"
      >
        <Phone size={16} />
        Call 112 — Emergency Services
      </a>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="flex items-center gap-2 text-[12px] font-medium
                   text-[#94A3B8] hover:text-[#475569] transition-colors mt-2"
      >
        <RefreshCw size={13} />
        Restart evacuation guide
      </button>
    </motion.div>
  );
};

// ── Main Page Component ─────────────────────────────────────────────────────
const UserEvacuation = () => {
  const navigate       = useNavigate();
  const motion_config  = useMotion();
  const { t }          = useTranslation();
  const rescueCamps    = useDataStore(s => s.rescueCamps);
  const addSafetyReport = useDataStore(s => s.addSafetyReport);
  const addActivity    = useDataStore(s => s.addActivity);
  const user           = useAuthStore(s => s.user);

  // Current step index (0-based)
  const [step, setStep] = useState(0);

  // Checked items — persisted to sessionStorage so refresh doesn't reset
  const [checked, setChecked] = useState(() => {
    try {
      const saved = sessionStorage.getItem('idms-evac-checked');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Completed steps
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = sessionStorage.getItem('idms-evac-steps');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [completed, setCompleted] = useState(false);

  const nearestCamp = rescueCamps.find(c => c.status === 'active');
  const currentStage = EVACUATION_STAGES[step];

  // Items checked in current step
  const currentCheckedCount = currentStage.items.filter(
    item => checked[item.id]
  ).length;
  const allCurrentChecked =
    currentCheckedCount === currentStage.items.length;

  // Persist to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem('idms-evac-checked', JSON.stringify(checked));
      sessionStorage.setItem('idms-evac-steps',   JSON.stringify(completedSteps));
    } catch {}
  }, [checked, completedSteps]);

  const toggleItem = (itemId) => {
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleNext = () => {
    // Mark current step as completed
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
    if (step < EVACUATION_STAGES.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  const handleRestart = () => {
    setStep(0);
    setChecked({});
    setCompletedSteps([]);
    setCompleted(false);
    try {
      sessionStorage.removeItem('idms-evac-checked');
      sessionStorage.removeItem('idms-evac-steps');
    } catch {}
  };

  const handleMarkSafe = () => {
    addSafetyReport({
      userId:   user?.email || 'unknown',
      userName: user?.name  || 'Citizen',
      status:   'safe',
    });
    addActivity({
      teamName: 'IDMS System',
      type:     'status',
      message:  `${user?.name || 'Citizen'} completed evacuation and marked safe`,
      level:    'info',
    });
    navigate('/user/status');
  };

  const IconComponent = currentStage.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[16px] font-black text-[#0F172A]">
            Evacuation Guide
          </h1>
          {step > 0 && !completed && (
            <button
              onClick={handleRestart}
              className="text-[11px] text-[#94A3B8] flex items-center gap-1"
            >
              <RefreshCw size={11} />
              Restart
            </button>
          )}
        </div>

        {!completed && (
          <ProgressBar
            current={step}
            total={EVACUATION_STAGES.length}
            color={currentStage.color}
          />
        )}

        {/* Step dots */}
        {!completed && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {EVACUATION_STAGES.map((s, i) => {
              const isDone    = completedSteps.includes(i);
              const isCurrent = i === step;
              return (
                <div
                  key={s.id}
                  className="rounded-full transition-all"
                  style={{
                    width:           isCurrent ? 20 : 7,
                    height:          7,
                    backgroundColor: isDone
                      ? '#059669'
                      : isCurrent
                      ? currentStage.color
                      : '#E2E8F0',
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Content ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-[80px]">
        <AnimatePresence mode="wait">
          {completed ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CompletedScreen
                onRestart={handleRestart}
                onMarkSafe={handleMarkSafe}
                nearestCamp={nearestCamp}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20  }}
              animate={{ opacity: 1, x: 0   }}
              exit={{    opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="px-4 pt-4 space-y-4"
            >
              {/* Step header card */}
              <div
                className="rounded-2xl border-2 overflow-hidden"
                style={{
                  backgroundColor: currentStage.bg,
                  borderColor:     currentStage.border,
                }}
              >
                <div className="px-5 py-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center
                                 justify-center flex-shrink-0"
                      style={{ backgroundColor: currentStage.color + '20' }}
                    >
                      <IconComponent
                        size={28}
                        style={{ color: currentStage.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-black uppercase tracking-wide
                                     px-2 py-0.5 rounded-full"
                          style={{
                            color:           currentStage.color,
                            backgroundColor: currentStage.color + '20',
                          }}
                        >
                          Step {currentStage.step}
                        </span>
                        {completedSteps.includes(step) && (
                          <CheckCircle2
                            size={14}
                            className="text-[#059669]"
                          />
                        )}
                      </div>
                      <h2
                        className="text-[18px] font-black leading-tight"
                        style={{ color: currentStage.color }}
                      >
                        {currentStage.title}
                      </h2>
                      <p
                        className="text-[12px] mt-1 leading-relaxed"
                        style={{ color: currentStage.color + 'CC' }}
                      >
                        {currentStage.summary}
                      </p>
                    </div>
                  </div>

                  {/* Detail paragraph */}
                  <div
                    className="px-4 py-3 rounded-xl"
                    style={{ backgroundColor: currentStage.color + '12' }}
                  >
                    <p
                      className="text-[12px] leading-relaxed font-medium"
                      style={{ color: currentStage.color }}
                    >
                      {currentStage.detail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist card */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3
                                border-b border-[#F1F5F9]">
                  <p className="text-[12px] font-bold text-[#0F172A]">
                    Action Checklist
                  </p>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      color:           currentStage.color,
                      backgroundColor: currentStage.color + '15',
                    }}
                  >
                    {currentCheckedCount}/{currentStage.items.length}
                  </span>
                </div>
                <div className="px-4">
                  {currentStage.items.map(item => (
                    <CheckItem
                      key={item.id}
                      item={item}
                      checked={!!checked[item.id]}
                      onToggle={toggleItem}
                      color={currentStage.color}
                    />
                  ))}
                </div>
              </div>

              {/* Special action cards per step */}
              {step === 5 && nearestCamp && (
                <button
                  onClick={() => navigate('/user/map')}
                  className="w-full flex items-center gap-3 px-4 py-4
                             bg-[#ECFDF5] border-2 border-[#A7F3D0]
                             rounded-2xl text-left
                             active:scale-[0.97] transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#059669]
                                  flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-[#059669]">
                      {nearestCamp.name}
                    </p>
                    <p className="text-[11px] text-[#065F46] mt-0.5">
                      Tap to get directions on Safety Map
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-[#059669]" />
                </button>
              )}

              {step === 6 && (
                <button
                  onClick={() => navigate('/user/sos')}
                  className="w-full flex items-center justify-center gap-2
                             py-4 bg-[#DC2626] text-white rounded-2xl
                             text-[14px] font-black
                             active:scale-[0.97] transition-all"
                >
                  <AlertOctagon size={20} />
                  Press SOS — Alert Rescue Teams
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Navigation ────────────────────────────── */}
      {!completed && (
        <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2
                        w-full max-w-[480px] px-4 py-3
                        bg-white border-t border-[#E2E8F0] z-10">
          <div className="flex gap-3">
            {/* Previous */}
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="flex items-center justify-center gap-2 px-5 py-3.5
                         bg-white border-2 border-[#E2E8F0] rounded-xl
                         text-[13px] font-semibold text-[#475569]
                         disabled:opacity-40 transition-all
                         active:scale-[0.97]"
            >
              <ChevronLeft size={17} />
              Back
            </button>

            {/* Next / Complete */}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2
                         py-3.5 rounded-xl text-[14px] font-black
                         text-white transition-all
                         active:scale-[0.97]"
              style={{ backgroundColor: currentStage.color }}
            >
              {allCurrentChecked ? (
                <>
                  <CheckCircle2 size={18} />
                  {step === EVACUATION_STAGES.length - 1
                    ? 'I Have Reached Safety'
                    : 'Next Step'
                  }
                </>
              ) : (
                <>
                  {step === EVACUATION_STAGES.length - 1
                    ? 'Finish'
                    : 'Next Step'
                  }
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Skip step hint */}
          {!allCurrentChecked && (
            <p className="text-center text-[10px] text-[#CBD5E1] mt-2">
              Check all items above or tap Next Step to continue without completing
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserEvacuation;
