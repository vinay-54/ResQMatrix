import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Users, Bell, MessageSquare,
  Globe, LogOut, ChevronRight, Check, Edit2, X, Save,
  Shield, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { useMotion }  from '../../hooks/useMotion';
import { LANGUAGES }  from '../../i18n';

// ── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
    {title && (
      <div className="px-4 py-3 border-b border-[#F1F5F9]">
        <p className="text-[13px] font-semibold text-[#0F172A]">{title}</p>
      </div>
    )}
    <div>{children}</div>
  </div>
);

// ── Row item ────────────────────────────────────────────────────────────────
const Row = ({ icon: Icon, label, value, color = '#475569', onClick, trailing }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left
                border-b border-[#F8FAFC] last:border-0
                ${onClick ? 'hover:bg-[#F8FAFC] active:bg-[#F1F5F9] cursor-pointer' : 'cursor-default'}
                transition-colors`}
  >
    <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-[#64748B]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-medium truncate" style={{ color }}>{value || '—'}</p>
    </div>
    {trailing || (onClick && <ChevronRight size={16} className="text-[#CBD5E1] flex-shrink-0" />)}
  </button>
);

// ── Toggle ──────────────────────────────────────────────────────────────────
const Toggle = ({ label, description, enabled, onChange, icon: Icon }) => (
  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F8FAFC] last:border-0">
    <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-[#64748B]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-[#0F172A]">{label}</p>
      {description && (
        <p className="text-[10px] text-[#94A3B8] mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0
                  ${enabled ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'}`}
    >
      <div
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm
                    transition-transform ${enabled ? 'translate-x-[20px]' : 'translate-x-[2px]'}`}
      />
    </button>
  </div>
);

// ── Edit profile bottom sheet ───────────────────────────────────────────────
const EditSheet = ({ profile, onSave, onClose, t }) => {
  const [form, setForm] = useState({
    name:        profile.name        || '',
    phone:       profile.phone       || '',
    homeAddress: profile.homeAddress || '',
    familyCount: profile.familyCount || 1,
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0F172A]/50" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2
                   w-full max-w-[480px] z-50
                   bg-white rounded-t-3xl p-5
                   border-t border-[#E2E8F0]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#0F172A]">
            {t('profile.editTitle')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {/* Name */}
          <div>
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
              {t('profile.name')}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0]
                         text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]
                         focus:ring-1 focus:ring-[#2563EB]/20"
              placeholder={t('profile.namePlaceholder')}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
              {t('profile.phone')}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0]
                         text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]
                         focus:ring-1 focus:ring-[#2563EB]/20"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Home Address */}
          <div>
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
              {t('profile.address')}
            </label>
            <input
              type="text"
              value={form.homeAddress}
              onChange={e => update('homeAddress', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0]
                         text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]
                         focus:ring-1 focus:ring-[#2563EB]/20"
              placeholder={t('profile.addressPlaceholder')}
            />
          </div>

          {/* Family members */}
          <div>
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
              {t('profile.familyCount')}
            </label>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => update('familyCount', Math.max(1, form.familyCount - 1))}
                className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center
                           justify-center text-[#475569] hover:bg-[#F1F5F9] text-[16px] font-bold"
              >
                −
              </button>
              <span className="text-[18px] font-bold text-[#0F172A] w-8 text-center">
                {form.familyCount}
              </span>
              <button
                onClick={() => update('familyCount', Math.min(20, form.familyCount + 1))}
                className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center
                           justify-center text-[#475569] hover:bg-[#F1F5F9] text-[16px] font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => { onSave(form); onClose(); }}
          className="w-full py-3 rounded-xl bg-[#2563EB] text-white text-[14px]
                     font-semibold flex items-center justify-center gap-2
                     hover:bg-[#1D4ED8] active:scale-[0.98] transition-all"
        >
          <Save size={16} />
          {t('profile.save')}
        </button>
      </motion.div>
    </>
  );
};

// ── Main Profile Page ───────────────────────────────────────────────────────
const UserProfile = () => {
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();
  const motion_config = useMotion();

  const user            = useAuthStore(s => s.user);
  const userProfile     = useAuthStore(s => s.userProfile);
  const updateProfile   = useAuthStore(s => s.updateUserProfile);
  const clearAuth       = useAuthStore(s => s.clearAuth);

  const [editing, setEditing]   = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const displayName = userProfile.name || user?.name || 'Citizen User';
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('idms-language', code);
    updateProfile({ language: code });
    setLangOpen(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  const handleSave = (form) => {
    updateProfile(form);
  };

  return (
    <motion.div {...motion_config.fadeSlideUp} className="px-4 py-5 space-y-4">

      {/* ── Avatar + Name Header ────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED]
                        flex items-center justify-center mb-3 shadow-lg shadow-[#2563EB]/20">
          <span className="text-[20px] font-bold text-white">{initials}</span>
        </div>
        <h2 className="text-[18px] font-bold text-[#0F172A]">{displayName}</h2>
        <p className="text-[12px] text-[#94A3B8] mt-0.5">
          {user?.email || t('profile.citizenAccount')}
        </p>
        <button
          onClick={() => setEditing(true)}
          className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold
                     text-[#2563EB] px-3 py-1.5 rounded-full bg-[#EFF6FF]
                     hover:bg-[#DBEAFE] active:scale-[0.97] transition-all"
        >
          <Edit2 size={12} />
          {t('profile.editProfile')}
        </button>
      </div>

      {/* ── Personal Information ─────────────────────────────── */}
      <Section title={t('profile.personalInfo')}>
        <Row icon={User}   label={t('profile.name')}    value={displayName} />
        <Row icon={Mail}   label={t('profile.email')}   value={user?.email || '—'} />
        <Row icon={Phone}  label={t('profile.phone')}   value={userProfile.phone || t('profile.notSet')} />
        <Row icon={MapPin}  label={t('profile.address')} value={userProfile.homeAddress || t('profile.notSet')} />
        <Row icon={Users}  label={t('profile.familyCount')}
             value={`${userProfile.familyCount} ${userProfile.familyCount === 1 ? t('profile.member') : t('profile.members')}`} />
      </Section>

      {/* ── Notification Preferences ─────────────────────────── */}
      <Section title={t('profile.notifications')}>
        <Toggle
          icon={Bell}
          label={t('profile.pushAlerts')}
          description={t('profile.pushAlertsDesc')}
          enabled={userProfile.notifyAlerts}
          onChange={val => updateProfile({ notifyAlerts: val })}
        />
        <Toggle
          icon={MessageSquare}
          label={t('profile.smsAlerts')}
          description={t('profile.smsAlertsDesc')}
          enabled={userProfile.notifySMS}
          onChange={val => updateProfile({ notifySMS: val })}
        />
      </Section>

      {/* ── Language ─────────────────────────────────────────── */}
      <Section title={t('common.language')}>
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                     hover:bg-[#F8FAFC] transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
            <Globe size={15} className="text-[#64748B]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wide">
              {t('common.selectLanguage')}
            </p>
            <p className="text-[13px] font-medium text-[#0F172A]">
              {currentLang.nativeLabel} ({currentLang.label})
            </p>
          </div>
          <ChevronRight size={16} className={`text-[#CBD5E1] transition-transform ${langOpen ? 'rotate-90' : ''}`} />
        </button>

        {langOpen && (
          <div className="px-4 pb-3">
            <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] overflow-hidden">
              {LANGUAGES.map(lang => {
                const isActive = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left
                                border-b border-[#E2E8F0] last:border-0 transition-colors
                                ${isActive ? 'bg-[#EFF6FF]' : 'hover:bg-white'}`}
                  >
                    <span className={`text-[13px] ${isActive ? 'font-semibold text-[#2563EB]' : 'text-[#334155]'}`}>
                      {lang.nativeLabel}
                      <span className="text-[#94A3B8] ml-1.5">({lang.label})</span>
                    </span>
                    {isActive && <Check size={16} className="text-[#2563EB]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      {/* ── About ─────────────────────────────────────────── */}
      <Section>
        <Row
          icon={Shield}
          label={t('profile.about')}
          value="ResQMatrix v1.0"
          trailing={
            <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
              IDMS
            </span>
          }
        />
      </Section>

      {/* ── Sign Out ──────────────────────────────────────── */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2]
                   text-[14px] font-semibold text-[#DC2626]
                   flex items-center justify-center gap-2
                   hover:bg-[#FEE2E2] active:scale-[0.98] transition-all"
      >
        <LogOut size={16} />
        {t('profile.signOut')}
      </button>

      {/* ── Safety note ───────────────────────────────────── */}
      <div className="px-4 py-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl
                      flex items-start gap-2.5 mb-2">
        <AlertTriangle size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#92400E] leading-relaxed">
          {t('profile.safetyNote')}
        </p>
      </div>

      {/* ── Edit Sheet ─────────────────────────────────────── */}
      {editing && (
        <EditSheet
          profile={userProfile}
          onSave={handleSave}
          onClose={() => setEditing(false)}
          t={t}
        />
      )}
    </motion.div>
  );
};

export default UserProfile;
