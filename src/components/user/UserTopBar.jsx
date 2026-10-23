import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useDataStore  from '../../store/useDataStore';
import { ALERT_LEVELS } from '../../constants/alertLevels';
import { LANGUAGES } from '../../i18n';

const UserTopBar = () => {
  const { t, i18n } = useTranslation();
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);
  const nodes     = useDataStore(s => s.nodes);

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Determine highest current alert level across all nodes
  const levelOrder = ['CRITICAL','DANGER','WARNING','WATCH','SAFE'];
  const highestLevel = levelOrder.find(l =>
    nodes.some(n => n.alertLevel === l)
  ) || 'SAFE';
  const levelCfg = ALERT_LEVELS[highestLevel] || ALERT_LEVELS.SAFE;

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('idms-language', code);
    setLangOpen(false);
  };

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] px-4 pt-[env(safe-area-inset-top,0px)]
                       sticky top-0 z-30">
      <div className="flex items-center justify-between h-[52px]">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="ResQMatrix" className="h-[20px] w-auto flex-shrink-0" />
          <div>
            <p className="text-[9px] text-[#94A3B8] leading-none">
              {t('topbar.hi', { name: user?.name?.split(' ')[0] || 'User' })}
            </p>
          </div>
        </div>

        {/* Live area status pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold"
          style={{
            color:           levelCfg.color,
            backgroundColor: levelCfg.bg,
            borderColor:     levelCfg.border,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: levelCfg.color }}
          />
          {t(`topbar.statusLabels.${highestLevel}`)}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Language selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="p-2 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]
                         hover:text-[#475569] transition-colors"
              title={t('common.selectLanguage')}
              aria-label={t('common.selectLanguage')}
              id="language-selector-btn"
            >
              <Globe size={17} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl
                              border border-[#E2E8F0] shadow-lg overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-[#F1F5F9]">
                  <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    {t('common.selectLanguage')}
                  </p>
                </div>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left
                                text-[13px] transition-colors
                                ${i18n.language === lang.code
                                  ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                                  : 'text-[#334155] hover:bg-[#F8FAFC]'}`}
                  >
                    <span>{lang.nativeLabel}</span>
                    {i18n.language === lang.code && (
                      <Check size={14} className="text-[#2563EB]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]
                       hover:text-[#475569] transition-colors"
            title={t('topbar.signOut')}
            aria-label={t('topbar.signOut')}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default UserTopBar;
