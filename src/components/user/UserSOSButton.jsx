import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertOctagon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UserSOSButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on the SOS page itself
  if (location.pathname === '/user/sos') return null;

  return (
    <motion.button
      onClick={() => navigate('/user/sos')}
      whileTap={{ scale: 0.93 }}
      className="fixed z-50 flex items-center gap-2
                 bg-[#DC2626] text-white font-bold
                 shadow-lg rounded-full px-5 py-3
                 text-[14px] tracking-wide"
      style={{
        bottom:     'calc(72px + env(safe-area-inset-bottom, 0px))',
        left:       '50%',
        transform:  'translateX(-50%)',
        boxShadow:  '0 4px 20px rgba(220,38,38,0.45)',
      }}
      aria-label={t('sos.floatingButton')}
    >
      <AlertOctagon size={18} />
      {t('sos.floatingButton')}
    </motion.button>
  );
};

export default UserSOSButton;
