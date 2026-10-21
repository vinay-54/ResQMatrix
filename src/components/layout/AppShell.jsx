import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion';
import Sidebar from './Sidebar';
import Header from './Header';
import OfflineBanner from './OfflineBanner';
import PageTransition from './PageTransition';

const AppShell = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const motion_config = useMotion();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:block flex-shrink-0 w-[220px]">
        <Sidebar />
      </div>

      {/* ── Mobile Drawer — Backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-[#0F172A]/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Drawer — Panel ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            {...motion_config.springDrawer}
            className="fixed inset-y-0 left-0 z-50 w-[220px] lg:hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Sticky Header */}
        <Header onMenuToggle={() => setMobileOpen((v) => !v)} />
        <OfflineBanner />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <PageTransition>
            <div className="max-w-[1400px] h-full mx-auto px-6 py-6">
              {children}
            </div>
          </PageTransition>
        </main>

      </div>
    </div>
  );
};

export default AppShell;
