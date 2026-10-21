import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Delete',
                         confirmColor = '#DC2626', onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-[#0F172A]/40"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{    opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                          w-full max-w-[380px] pointer-events-auto overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#FEF2F2] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-[#DC2626]" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0F172A]">{title}</h3>
              </div>
              <p className="text-[13px] text-[#475569] leading-relaxed">{message}</p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg border border-[#E2E8F0] text-[13px]
                           font-medium text-[#475569] hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-white transition-colors"
                style={{ backgroundColor: confirmColor }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
