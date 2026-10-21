import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{    height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden flex-shrink-0"
        >
          <div className="flex items-center gap-2.5 px-6 py-2.5
                          bg-[#FFF7ED] border-b border-[#FED7AA]">
            <WifiOff size={13} className="text-[#D97706] flex-shrink-0" />
            <span className="text-[12px] font-medium text-[#92400E]">
              You are offline — showing cached data.
              Alerts and live readings are paused until connection is restored.
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
              <span className="text-[10px] font-semibold text-[#D97706]">OFFLINE</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
