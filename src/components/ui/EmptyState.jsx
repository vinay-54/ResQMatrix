import { motion } from 'framer-motion';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    {Icon && (
      <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] flex items-center
                      justify-center mb-3 flex-shrink-0">
        <Icon size={20} className="text-[#94A3B8]" />
      </div>
    )}
    <p className="text-[14px] font-semibold text-[#475569]">{title}</p>
    {description && (
      <p className="text-[12px] text-[#94A3B8] mt-1.5 max-w-xs leading-relaxed">
        {description}
      </p>
    )}
    {action && actionLabel && (
      <button
        onClick={action}
        className="mt-4 text-[12px] font-medium text-[#2563EB]
                   hover:text-[#1D4ED8] transition-colors hover:underline"
      >
        {actionLabel}
      </button>
    )}
  </motion.div>
);

export default EmptyState;
