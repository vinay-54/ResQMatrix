import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, AlertOctagon,
  Plus, Trash2, CheckCircle2, Clock,
  Users, Phone, RefreshCw, Edit2, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useDataStore from '../../store/useDataStore';
import useAuthStore  from '../../store/useAuthStore';
import { formatTimeAgo } from '../../utils/formatters';
import { useMotion } from '../../hooks/useMotion';

// ── Add Member Modal ─────────────────────────────────────────────────────────
const AddMemberModal = ({ onAdd, onClose }) => {
  const { t } = useTranslation();
  const [name,   setName]   = useState('');
  const [phone,  setPhone]  = useState('');
  const [status, setStatus] = useState('unknown');

  const MEMBER_STATUS = [
    { value: 'safe',    label: t('status.safe'),      color: '#059669', bg: '#ECFDF5' },
    { value: 'unknown', label: t('status.unknown'),   color: '#94A3B8', bg: '#F8FAFC' },
    { value: 'help',    label: t('status.needsHelp'), color: '#D97706', bg: '#FFFBEB' },
  ];

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), phone: phone.trim(), status });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0F172A]/50" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{    y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2
                   w-full max-w-[480px] z-50
                   bg-white rounded-t-3xl p-5
                   border-t border-[#E2E8F0]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#0F172A]">{t('status.addFamilyMember')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8]
                                              hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
              {t('status.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('status.namePlaceholder')}
              className="w-full mt-1.5 h-12 px-4 text-[14px] text-[#0F172A]
                         bg-white border-2 border-[#E2E8F0] rounded-xl
                         focus:outline-none focus:border-[#2563EB] transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
              {t('status.phoneLabel')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t('status.phonePlaceholder')}
              className="w-full mt-1.5 h-12 px-4 text-[14px] text-[#0F172A]
                         bg-white border-2 border-[#E2E8F0] rounded-xl
                         focus:outline-none focus:border-[#2563EB] transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-1.5 block">
              {t('status.currentStatus')}
            </label>
            <div className="flex gap-2">
              {MEMBER_STATUS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className="flex-1 py-2 rounded-xl border-2 text-[11px] font-bold
                             transition-all"
                  style={{
                    borderColor:     status === s.value ? s.color : '#E2E8F0',
                    backgroundColor: status === s.value ? s.bg : 'white',
                    color:           status === s.value ? s.color : '#94A3B8',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-[#0F172A] text-white rounded-xl
                     text-[14px] font-bold disabled:opacity-40 transition-all"
        >
          {t('status.addFamilyMember')}
        </button>
      </motion.div>
    </>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const UserStatus = () => {
  const { t }              = useTranslation();
  const motion_config      = useMotion();
  const user               = useAuthStore(s => s.user);
  const addSafetyReport    = useDataStore(s => s.addSafetyReport);
  const addAlert           = useDataStore(s => s.addAlert);
  const addActivity        = useDataStore(s => s.addActivity);

  // Status options — translated
  const STATUS_OPTIONS = [
    {
      value:  'safe',
      label:  t('status.iAmSafe'),
      sub:    t('status.iAmSafeSub'),
      color:  '#059669', bg: '#ECFDF5', border: '#A7F3D0',
      icon:   ShieldCheck,
    },
    {
      value:  'help',
      label:  t('status.iNeedHelp'),
      sub:    t('status.iNeedHelpSub'),
      color:  '#D97706', bg: '#FFFBEB', border: '#FDE68A',
      icon:   AlertTriangle,
    },
    {
      value:  'sos',
      label:  t('status.emergencyNeedRescue'),
      sub:    t('status.emergencyNeedRescueSub'),
      color:  '#DC2626', bg: '#FEF2F2', border: '#FECACA',
      icon:   AlertOctagon,
    },
  ];

  const MEMBER_STATUS = [
    { value: 'safe',    label: t('status.safe'),      color: '#059669', bg: '#ECFDF5' },
    { value: 'unknown', label: t('status.unknown'),   color: '#94A3B8', bg: '#F8FAFC' },
    { value: 'help',    label: t('status.needsHelp'), color: '#D97706', bg: '#FFFBEB' },
  ];

  // My own status
  const [myStatus,       setMyStatus]       = useState(null);
  const [statusTime,     setStatusTime]     = useState(null);
  const [reportId,       setReportId]       = useState(null);
  const [confirming,     setConfirming]     = useState(null);

  // Family members
  const [familyMembers,  setFamilyMembers]  = useState([]);
  const [showAddMember,  setShowAddMember]  = useState(false);

  const handleSetStatus = (statusValue) => {
    if (statusValue === 'sos') {
      addAlert({
        nodeId:   'sos-device',
        nodeName: user?.name || 'Citizen',
        level:    'DANGER',
        message:  `Emergency — ${user?.name || 'Citizen'} needs immediate rescue`,
        detail:   'Emergency status set via IDMS User Portal status check-in.',
        timestamp: Date.now(),
        channels:  ['FCM', 'SMS'],
        isSOS:     true,
      });
      addActivity({
        teamName: 'IDMS System',
        type:     'alert',
        message:  `EMERGENCY: ${user?.name || 'Citizen'} needs immediate rescue — Status page`,
        level:    'warning',
      });
    } else {
      addActivity({
        teamName: 'IDMS System',
        type:     'status',
        message:  `${user?.name || 'Citizen'} marked status: ${statusValue.toUpperCase()}`,
        level:    'info',
      });
    }

    const id = `STATUS-${Date.now()}`;
    addSafetyReport({
      id,
      userId:   user?.email || 'unknown',
      userName: user?.name  || 'Citizen',
      status:   statusValue,
    });

    setMyStatus(statusValue);
    setStatusTime(Date.now());
    setReportId(id);
    setConfirming(null);
  };

  const resetStatus = () => {
    setMyStatus(null);
    setStatusTime(null);
    setReportId(null);
    setConfirming(null);
  };

  const addFamilyMember = (member) => {
    setFamilyMembers(prev => [
      ...prev,
      { ...member, id: `FM-${Date.now()}`, addedAt: Date.now() }
    ]);
  };

  const updateMemberStatus = (id, newStatus) => {
    setFamilyMembers(prev =>
      prev.map(m => m.id === id ? { ...m, status: newStatus, updatedAt: Date.now() } : m)
    );
  };

  const removeMember = (id) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const safeCount    = familyMembers.filter(m => m.status === 'safe').length;
  const unknownCount = familyMembers.filter(m => m.status === 'unknown').length;
  const helpCount    = familyMembers.filter(m => m.status === 'help').length;

  return (
    <motion.div
      {...motion_config.fadeSlideUp}
      className="px-4 pt-4 pb-6 space-y-4"
    >

      {/* ── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-black text-[#0F172A]">{t('status.title')}</h1>
        <p className="text-[12px] text-[#64748B] mt-0.5">
          {t('status.subtitle')}
        </p>
      </div>

      {/* ── Why This Matters ────────────────────────────── */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl px-4 py-3">
        <p className="text-[12px] font-bold text-[#2563EB] mb-1.5">
          {t('status.whyReport')}
        </p>
        <p className="text-[12px] text-[#1D4ED8] leading-relaxed"
           dangerouslySetInnerHTML={{ __html: t('status.whyReportText') }} />
      </div>

      {/* ── MY STATUS ──────────────────────────────────── */}
      <div>
        <h2 className="text-[13px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">
          {t('status.myCurrentStatus')}
        </h2>

        {myStatus ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 p-5 text-center"
            style={{
              backgroundColor: STATUS_OPTIONS.find(s => s.value === myStatus)?.bg,
              borderColor:     STATUS_OPTIONS.find(s => s.value === myStatus)?.border,
            }}
          >
            {(() => {
              const sc   = STATUS_OPTIONS.find(s => s.value === myStatus);
              const Icon = sc?.icon || ShieldCheck;
              return (
                <>
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center
                               mx-auto mb-3"
                    style={{ backgroundColor: sc?.color + '20' }}
                  >
                    <Icon size={38} style={{ color: sc?.color }} />
                  </div>
                  <p className="text-[20px] font-black" style={{ color: sc?.color }}>
                    {sc?.label}
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: sc?.color + 'CC' }}>
                    {sc?.sub}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-3"
                       style={{ color: sc?.color + '99' }}>
                    <Clock size={11} />
                    <span className="text-[10px]">
                      {t('status.reported', { time: statusTime ? formatTimeAgo(statusTime) : 'just now' })}
                    </span>
                  </div>
                  {reportId && (
                    <p className="text-[9px] font-mono mt-1"
                       style={{ color: sc?.color + '70' }}>
                      {t('status.ref', { id: reportId })}
                    </p>
                  )}
                  <button
                    onClick={resetStatus}
                    className="mt-4 px-5 py-2 rounded-full text-[12px] font-bold
                               bg-white border-2 transition-all"
                    style={{ borderColor: sc?.border, color: sc?.color }}
                  >
                    {t('status.updateMyStatus')}
                  </button>
                </>
              );
            })()}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {STATUS_OPTIONS.map(option => {
              const Icon = option.icon;
              const isConfirming = confirming === option.value;
              return (
                <motion.div key={option.value} layout>
                  <button
                    onClick={() => {
                      if (isConfirming) {
                        handleSetStatus(option.value);
                      } else {
                        setConfirming(option.value);
                        setTimeout(() => setConfirming(null), 5000);
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl
                               border-2 text-left transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: isConfirming ? option.bg : 'white',
                      borderColor:     isConfirming ? option.color : option.border,
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center
                                 justify-center flex-shrink-0"
                      style={{ backgroundColor: option.color + '18' }}
                    >
                      <Icon size={28} style={{ color: option.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold"
                         style={{ color: isConfirming ? option.color : '#0F172A' }}>
                        {isConfirming ? t('status.tapToConfirm') : option.label}
                      </p>
                      <p className="text-[11px] mt-0.5"
                         style={{ color: isConfirming ? option.color + 'CC' : '#64748B' }}>
                        {option.sub}
                      </p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full border-2 flex items-center
                                 justify-center flex-shrink-0"
                      style={{
                        borderColor:     option.color,
                        backgroundColor: isConfirming ? option.color : 'transparent',
                      }}
                    >
                      {isConfirming && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                  </button>
                </motion.div>
              );
            })}
            <p className="text-[11px] text-[#94A3B8] text-center">
              {t('status.tapOnceConfirm')}
            </p>
          </div>
        )}
      </div>

      {/* ── FAMILY MEMBERS ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wide">
              {t('status.familyMembers')}
            </h2>
            {familyMembers.length > 0 && (
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {t('status.safeCount', { safe: safeCount, unknown: unknownCount, help: helpCount })}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F172A]
                       text-white rounded-xl text-[12px] font-bold
                       active:scale-[0.96] transition-all"
          >
            <Plus size={14} />
            {t('status.add')}
          </button>
        </div>

        {/* Summary when members exist */}
        {familyMembers.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: t('status.safe'),      count: safeCount,    color: '#059669', bg: '#ECFDF5' },
              { label: t('status.unknown'),   count: unknownCount, color: '#94A3B8', bg: '#F8FAFC' },
              { label: t('status.needsHelp'), count: helpCount,    color: '#D97706', bg: '#FFFBEB' },
            ].map(s => (
              <div key={s.label}
                   className="rounded-xl px-2 py-2.5 text-center border"
                   style={{ backgroundColor: s.bg, borderColor: s.color + '30' }}>
                <p className="text-[22px] font-black" style={{ color: s.color }}>
                  {s.count}
                </p>
                <p className="text-[10px] text-[#94A3B8]">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Member list */}
        {familyMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center
                          bg-white border-2 border-dashed border-[#E2E8F0] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center
                            justify-center mb-3">
              <Users size={24} className="text-[#94A3B8]" />
            </div>
            <p className="text-[13px] font-bold text-[#475569]">
              {t('status.noFamilyMembers')}
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-1 max-w-[220px]">
              {t('status.noFamilyMembersSub')}
            </p>
            <button
              onClick={() => setShowAddMember(true)}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-[#EFF6FF]
                         border border-[#BFDBFE] text-[#2563EB] rounded-xl
                         text-[12px] font-bold"
            >
              <Plus size={13} />
              {t('status.addFirstMember')}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {familyMembers.map(member => {
                const sc = MEMBER_STATUS.find(s => s.value === member.status)
                  || MEMBER_STATUS[1];
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{    opacity: 0, x: -20 }}
                    className="bg-white border-2 border-[#E2E8F0] rounded-2xl
                               overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full flex items-center
                                      justify-center flex-shrink-0 text-[16px] font-black"
                           style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {member.name[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#0F172A] truncate">
                          {member.name}
                        </p>
                        {member.phone && (
                          <a href={`tel:${member.phone}`}
                             className="text-[11px] text-[#2563EB] font-mono">
                            {member.phone}
                          </a>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full
                                   flex-shrink-0"
                        style={{ color: sc.color, backgroundColor: sc.bg }}
                      >
                        {sc.label}
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-[#DC2626]
                                   hover:bg-[#FEF2F2] transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Status buttons */}
                    <div className="flex border-t border-[#F1F5F9]">
                      {MEMBER_STATUS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => updateMemberStatus(member.id, s.value)}
                          className="flex-1 py-2.5 text-[10px] font-bold
                                     transition-all border-r last:border-r-0 border-[#F1F5F9]"
                          style={{
                            backgroundColor: member.status === s.value ? s.bg : 'white',
                            color:           member.status === s.value ? s.color : '#94A3B8',
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Add Member Modal ──────────────────────────── */}
      <AnimatePresence>
        {showAddMember && (
          <AddMemberModal
            onAdd={addFamilyMember}
            onClose={() => setShowAddMember(false)}
          />
        )}
      </AnimatePresence>

      {/* ── How This Helps ────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={15} className="text-[#059669]" />
          <p className="text-[13px] font-bold text-[#0F172A]">
            {t('status.howStatusHelps')}
          </p>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: CheckCircle2, color: '#059669', text: t('status.helpTip1') },
            { icon: AlertTriangle, color: '#D97706', text: t('status.helpTip2') },
            { icon: AlertOctagon, color: '#DC2626', text: t('status.helpTip3') },
            { icon: Users, color: '#2563EB', text: t('status.helpTip4') },
          ].map((tip, i) => {
            const TipIcon = tip.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                     style={{ backgroundColor: tip.color + '15' }}>
                  <TipIcon size={14} style={{ color: tip.color }} />
                </div>
                <p className="text-[12px] text-[#475569] leading-relaxed">{tip.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Emergency ──────────────────────────────────── */}
      <a
        href="tel:112"
        className="flex items-center justify-center gap-2 w-full py-4
                   bg-white border-2 border-[#E2E8F0] rounded-2xl
                   text-[14px] font-bold text-[#0F172A]
                   active:scale-[0.97] transition-all"
      >
        <Phone size={16} className="text-[#DC2626]" />
        {t('status.emergencyCall112')}
      </a>

    </motion.div>
  );
};

export default UserStatus;
