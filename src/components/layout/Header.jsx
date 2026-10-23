import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { PAGE_META } from '../../constants/navigation';
import useAuthStore from '../../store/useAuthStore';
import useDataStore from '../../store/useDataStore';
import useSensorStore from '../../store/useSensorStore';

const Header = ({ onMenuToggle }) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const alerts     = useDataStore(s => s.alerts);
  const alertCount = alerts.filter(a => !a.acknowledged).length;
  const [lastUpdatedText, setLastUpdatedText] = useState('just now');

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'VK';

  // Find matching page meta
  const matchKey = Object.keys(PAGE_META)
    .sort((a, b) => b.length - a.length)
    .find((key) => location.pathname === key || location.pathname.startsWith(key + '/'));

  const meta = PAGE_META[matchKey] || {
    title: 'ResQMatrix',
    subtitle: 'Integrated Disaster Management',
  };

  // Last updated timer
  useEffect(() => {
    const interval = setInterval(() => {
      const lastUpdated = useSensorStore.getState().lastUpdated;
      if (!lastUpdated) {
        setLastUpdatedText('just now');
        return;
      }
      const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
      if (seconds < 10) setLastUpdatedText('just now');
      else if (seconds < 60) setLastUpdatedText(`${seconds}s ago`);
      else setLastUpdatedText(`${Math.floor(seconds / 60)}m ago`);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-[52px] flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-[#E2E8F0] sticky top-0 z-20">

      {/* Left — Mobile menu + Page title */}
      <div className="flex items-center">
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-3 p-1.5 rounded-md text-[#475569]
                     hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-[14px] font-semibold text-[#0F172A] leading-tight">
            {meta.title}
          </h1>
          <p className="text-[11px] text-[#94A3B8] leading-tight hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right — Status + notifications + user */}
      <div className="flex items-center gap-3 ml-auto">

        {/* System status pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          <span className="text-[11px] font-medium text-[#059669]">Live</span>
        </div>

        {/* Last updated */}
        <span className="hidden lg:block text-[11px] text-[#94A3B8]">
          Updated {lastUpdatedText}
        </span>

        {/* Vertical divider */}
        <div className="hidden md:block w-px h-5 bg-[#E2E8F0]" />

        {/* Notifications bell */}
        <button title="Notifications" aria-label="Notifications"
                className="relative p-2 rounded-md text-[#475569]
                           hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer
                           min-w-[36px] min-h-[36px] flex items-center justify-center">
          <Bell size={17} />
          {alertCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-[16px] h-[16px]
                             bg-[#DC2626] text-white text-[9px] font-bold
                             rounded-full flex items-center justify-center leading-none">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User avatar chip (desktop only) */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]
                          flex items-center justify-center">
            <span className="text-[11px] font-semibold text-[#2563EB]">{initials}</span>
          </div>
          <div className="text-left">
            <p className="text-[12px] font-medium text-[#0F172A] leading-none">
              {user?.name || 'Vinay Kumar'}
            </p>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
