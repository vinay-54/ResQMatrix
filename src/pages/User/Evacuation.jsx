import { Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UserEvacuation = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] flex items-center justify-center">
        <Route size={22} className="text-[#059669]" />
      </div>
      <h2 className="text-[18px] font-bold text-[#0F172A]">{t('evacuation.title')}</h2>
      <p className="text-[13px] text-[#64748B]">{t('evacuation.subtitle')}</p>
      <span className="text-[11px] text-[#94A3B8] bg-[#F1F5F9] px-3 py-1 rounded-full">
        {t('evacuation.comingSoon')}
      </span>
    </div>
  );
};

export default UserEvacuation;
