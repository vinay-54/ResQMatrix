import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UserProfile = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] flex items-center justify-center">
        <User size={22} className="text-[#7C3AED]" />
      </div>
      <h2 className="text-[18px] font-bold text-[#0F172A]">{t('profile.title')}</h2>
      <p className="text-[13px] text-[#64748B]">{t('profile.subtitle')}</p>
      <span className="text-[11px] text-[#94A3B8] bg-[#F1F5F9] px-3 py-1 rounded-full">
        {t('profile.comingSoon')}
      </span>
    </div>
  );
};

export default UserProfile;
