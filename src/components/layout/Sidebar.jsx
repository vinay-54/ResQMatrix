import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion';
import {
  LayoutDashboard, Map, Activity, Bell, TrendingUp,
  Droplets, Plane, Users, BarChart3, Settings2,
  ShieldCheck, ChevronUp, Settings, HelpCircle, LogOut
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useDataStore from '../../store/useDataStore';
import { NAV_GROUPS } from '../../constants/navigation';

const ICON_MAP = {
  LayoutDashboard, Map, Activity, Bell, TrendingUp,
  Droplets, Plane, Users, BarChart3, Settings2,
};

const Sidebar = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const storeAlerts = useDataStore(s => s.alerts);
  const alertCount = storeAlerts.filter(a => !a.acknowledged).length;
  const nodeCount = useDataStore(s => s.nodes.length);
  const motion_config = useMotion();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'VK';

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 z-30 w-[220px] flex flex-col bg-white border-r border-[#E2E8F0]">

      {/* ── Section 1 — Logo Bar ── */}
      <div className="h-[52px] flex items-center px-4 border-b border-[#E2E8F0] flex-shrink-0">
        <img src="/logo.svg" alt="ResQMatrix" className="h-[22px] w-auto flex-shrink-0" />
        <span className="ml-auto text-[10px] font-medium text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
          v1.0
        </span>
      </div>

      {/* ── Section 2 — Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx}>
            {group.group && (
              <p className="px-4 pt-4 pb-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const IconComponent = ICON_MAP[item.icon];
              const badgeCount = item.badgeDynamic ? alertCount : null;
              const badgeLabel = item.badgeDynamic
                ? (alertCount > 0 ? String(alertCount) : null)
                : item.badge
                  ? (item.label === 'Sensor Nodes' ? String(nodeCount) : item.badge)
                  : null;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-[7px] mx-1 rounded-md
                    text-[13px] transition-all duration-100 text-left cursor-pointer
                    ${isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-normal'
                    }
                  `}
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  {IconComponent && (
                    <IconComponent
                      size={15}
                      className={`flex-shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}
                    />
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  {badgeLabel && (
                    <span
                      className={`
                        text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                        ${item.badgeStyle === 'danger' && badgeCount > 0
                          ? 'bg-[#FEF2F2] text-[#DC2626]'
                          : 'bg-[#F1F5F9] text-[#64748B]'
                        }
                      `}
                    >
                      {badgeLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Section 3 — System Status Chip ── */}
      <div className="px-4 py-3 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#059669] flex-shrink-0" />
          <span className="text-[11px] text-[#475569] font-medium">All nodes operational</span>
        </div>
      </div>

      {/* ── Section 4 — User Profile ── */}
      <div className="relative px-3 py-3 border-t border-[#E2E8F0]">
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md
                     hover:bg-[#F8FAFC] transition-colors text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]
                          flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-[#2563EB]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#0F172A] truncate">
              {user?.name || 'Vinay Kumar'}
            </p>
            <p className="text-[10px] text-[#94A3B8] truncate capitalize">
              Administrator
            </p>
          </div>
          <ChevronUp
            size={13}
            className={`text-[#94A3B8] transition-transform flex-shrink-0 ${
              userMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* User Menu Popover */}
        <AnimatePresence>
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <motion.div
                {...motion_config.springPopover}
                className="absolute bottom-full left-0 right-0 mb-1 z-50
                           bg-white border border-[#E2E8F0] rounded-lg shadow-raised
                           overflow-hidden"
              >
                <div className="px-3 py-3 border-b border-[#F1F5F9]">
                  <p className="text-[12px] font-semibold text-[#0F172A]">
                    {user?.name || 'Vinay Kumar'}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {user?.email || 'admin@idms.svce.in'}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2
                               text-[12px] text-[#475569] hover:bg-[#F8FAFC]
                               hover:text-[#0F172A] transition-colors text-left cursor-pointer"
                    onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                  >
                    <Settings size={13} className="text-[#94A3B8]" />
                    Account settings
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2
                               text-[12px] text-[#475569] hover:bg-[#F8FAFC]
                               hover:text-[#0F172A] transition-colors text-left cursor-pointer"
                  >
                    <HelpCircle size={13} className="text-[#94A3B8]" />
                    Help and support
                  </button>
                </div>
                <div className="border-t border-[#F1F5F9] py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2
                               text-[12px] text-[#DC2626] hover:bg-[#FEF2F2]
                               transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Sidebar;
