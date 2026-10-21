import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Bell, Map, ShieldCheck, Phone, User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useDataStore  from '../../store/useDataStore';
import UserTopBar    from './UserTopBar';
import UserSOSButton from './UserSOSButton';

const USER_NAV = [
  { path: '/user/dashboard',  labelKey: 'nav.home',     icon: Home     },
  { path: '/user/alerts',     labelKey: 'nav.alerts',   icon: Bell     },
  { path: '/user/map',        labelKey: 'nav.map',      icon: Map      },
  { path: '/user/status',     labelKey: 'nav.imSafe',   icon: ShieldCheck },
  { path: '/user/contacts',   labelKey: 'nav.help',     icon: Phone    },
  { path: '/user/profile',    labelKey: 'nav.profile',  icon: User     },
];

const UserShell = ({ children }) => {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const location  = useLocation();
  const alerts    = useDataStore(s => s.alerts);
  const unreadCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] max-w-[480px] mx-auto
                    relative">

      {/* ── Top Status Bar ────────────────────────────── */}
      <UserTopBar />

      {/* ── Page Content ─────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-[64px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={location.pathname === '/user/map' ? 'h-full' : ''}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Floating SOS Button ──────────────────────── */}
      <UserSOSButton />

      {/* ── Bottom Navigation ────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px]
                      bg-white border-t border-[#E2E8F0] z-40
                      flex items-center justify-around
                      px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {USER_NAV.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const showBadge = item.path === '/user/alerts' && unreadCount > 0;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl
                          min-w-[52px] transition-all duration-150 relative
                ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all
                ${isActive ? 'bg-[#EFF6FF]' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4
                                   bg-[#DC2626] text-white text-[9px] font-bold
                                   rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none
                ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default UserShell;
