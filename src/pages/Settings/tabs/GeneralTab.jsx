import { useState } from 'react';
import { Settings2, RefreshCw, AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import useDataStore from '../../../store/useDataStore';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';

const SectionCard = ({ title, description, children }) => (
  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
    <div className="px-5 py-3.5 border-b border-[#F1F5F9]">
      <h3 className="text-[13px] font-semibold text-[#0F172A]">{title}</h3>
      {description && <p className="text-[11px] text-[#94A3B8] mt-0.5">{description}</p>}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const GeneralTab = () => {
  const toast             = useToast();
  const activeAreaId      = useDataStore(s => s.activeAreaId);
  const deploymentAreas   = useDataStore(s => s.deploymentAreas);
  const setActiveArea     = useDataStore(s => s.setActiveArea);
  const addDeploymentArea = useDataStore(s => s.addDeploymentArea);
  const resetToDefaults   = useDataStore(s => s.resetToDefaults);

  const [newAreaName, setNewAreaName] = useState('');
  const [showReset, setShowReset]     = useState(false);

  const handleAreaChange = (e) => {
    setActiveArea(e.target.value);
    toast.success('Deployment area updated');
  };

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    addDeploymentArea({ name: newAreaName.trim() });
    setNewAreaName('');
    toast.success(`Area "${newAreaName.trim()}" added`);
  };

  const handleReset = () => {
    resetToDefaults();
    setShowReset(false);
    toast.success('System reset to defaults');
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-[#0F172A]">General Settings</h2>
        <p className="text-[12px] text-[#64748B] mt-0.5">System-wide configuration and deployment area management</p>
      </div>

      {/* Deployment Area */}
      <SectionCard
        title="Deployment Area"
        description="Select the active deployment area. All sensor nodes, maps, and operations update accordingly."
      >
        <div className="space-y-3">
          <FormField label="Active Deployment Area" required>
            <select
              value={activeAreaId}
              onChange={handleAreaChange}
              className={selectClass}
            >
              {deploymentAreas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </FormField>

          <div className="flex items-center gap-2 pt-2 border-t border-[#F8FAFC]">
            <input
              type="text"
              value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              placeholder="New area name..."
              className={`${inputClass} flex-1`}
              onKeyDown={e => e.key === 'Enter' && handleAddArea()}
            />
            <button
              onClick={handleAddArea}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                         text-[12px] font-medium rounded-md hover:bg-[#1E293B] transition-colors"
            >
              <Plus size={13} />
              Add Area
            </button>
          </div>

          <div className="mt-2">
            <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wide mb-2">
              Configured Areas
            </p>
            <div className="space-y-1">
              {deploymentAreas.map(area => (
                <div key={area.id}
                     className={`flex items-center gap-2 px-3 py-2 rounded-md text-[12px]
                       ${area.id === activeAreaId
                         ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-medium'
                         : 'bg-[#F8FAFC] text-[#475569]'
                       }`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${area.id === activeAreaId ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'}`} />
                  {area.name}
                  {area.id === activeAreaId && (
                    <span className="ml-auto text-[9px] font-semibold uppercase">Active</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* System Info */}
      <SectionCard title="System Information" description="Current system version and build details">
        <div className="space-y-2.5">
          {[
            { label: 'Application',  value: 'ResQMatrix — Integrated Disaster Management System' },
            { label: 'Version',      value: 'v1.0.0' },
            { label: 'Team',         value: 'Mind Mashers — SVCE Tirupati' },
            { label: 'Reference',    value: 'IDEAAP031106' },
            { label: 'Built With',   value: 'React 18 · Firebase · Node.js · LSTM' },
          ].map(row => (
            <div key={row.label}
                 className="flex items-center justify-between py-2 border-b border-[#F8FAFC] last:border-0">
              <span className="text-[11px] text-[#94A3B8]">{row.label}</span>
              <span className="text-[12px] font-medium text-[#0F172A]">{row.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <div className="bg-white border border-[#FECACA] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#FEE2E2] bg-[#FEF2F2]">
          <h3 className="text-[13px] font-semibold text-[#DC2626] flex items-center gap-2">
            <AlertTriangle size={14} />
            Danger Zone
          </h3>
          <p className="text-[11px] text-[#EF4444] mt-0.5">
            These actions cannot be undone
          </p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#0F172A]">Reset to Default Data</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Restores all sensor nodes, teams, drones, and operations to seed data
            </p>
          </div>
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                       text-[#DC2626] border border-[#FECACA] rounded-md
                       hover:bg-[#FEF2F2] transition-colors"
          >
            <RefreshCw size={12} />
            Reset System
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showReset}
        title="Reset to Default Data?"
        message="This will replace all current nodes, teams, operations, and drones with the original seed data. This cannot be undone."
        confirmLabel="Reset System"
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
      />
    </div>
  );
};

export default GeneralTab;
