import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import useDataStore from '../../../store/useDataStore';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';

const EMPTY_TEAM = {
  id: '', name: '', lead: '', members: 3, status: 'standby',
  zone: '', nodeId: '', vehicle: '', contact: '', task: '',
  coords: { lat: 13.6288, lng: 79.4197 },
};

const TEAM_STATUS_CONFIG = {
  deployed: { color: '#059669', bg: '#ECFDF5' },
  standby: { color: '#64748B', bg: '#F8FAFC' },
  returning: { color: '#2563EB', bg: '#EFF6FF' },
  'off-duty': { color: '#94A3B8', bg: '#F8FAFC' },
};

const TeamModal = ({ team, isEdit, onClose, onSave }) => {
  const nodes = useDataStore(s => s.nodes);
  const [form, setForm] = useState(team || EMPTY_TEAM);
  const [errors, setErrors] = useState({});
  const update = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    if (!form.lead.trim()) e.lead = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0F172A]/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                        w-full max-w-[500px] pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <h3 className="text-[14px] font-semibold text-[#0F172A]">
              {isEdit ? 'Edit Rescue Team' : 'Add Rescue Team'}
            </h3>
            <button onClick={onClose} className="p-1 text-[#94A3B8] hover:text-[#475569]"><X size={16} /></button>
          </div>
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Team ID" required error={errors.id}>
                <input value={form.id} onChange={e => update('id', e.target.value)}
                  placeholder="T-05" className={inputClass} disabled={isEdit} />
              </FormField>
              <FormField label="Team Name" required error={errors.name}>
                <input value={form.name} onChange={e => update('name', e.target.value)}
                  placeholder="Echo Team" className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Team Leader" required error={errors.lead}>
                <input value={form.lead} onChange={e => update('lead', e.target.value)}
                  placeholder="Full name" className={inputClass} />
              </FormField>
              <FormField label="Members">
                <input type="number" min="1" value={form.members}
                  onChange={e => update('members', parseInt(e.target.value))} className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Status">
                <select value={form.status} onChange={e => update('status', e.target.value)} className={selectClass}>
                  {Object.keys(TEAM_STATUS_CONFIG).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Assigned Zone">
                <input value={form.zone} onChange={e => update('zone', e.target.value)}
                  placeholder="East Parking Zone" className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Linked Sensor Node">
                <select value={form.nodeId} onChange={e => update('nodeId', e.target.value)} className={selectClass}>
                  <option value="">— None —</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </FormField>
              <FormField label="Vehicle">
                <input value={form.vehicle} onChange={e => update('vehicle', e.target.value)}
                  placeholder="Rescue Boat RB-03" className={inputClass} />
              </FormField>
            </div>
            <FormField label="Contact Number">
              <input value={form.contact} onChange={e => update('contact', e.target.value)}
                placeholder="+91 98765 XXXXX" className={inputClass} />
            </FormField>
            <FormField label="Current Task">
              <textarea value={form.task} onChange={e => update('task', e.target.value)}
                rows={2} placeholder="Brief description of current assignment"
                className={`${inputClass} h-auto py-2 resize-none`} />
            </FormField>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#F1F5F9] flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#E2E8F0]
              text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors">Cancel</button>
            <button onClick={() => validate() && onSave(form)}
              className="flex-1 py-2 rounded-lg bg-[#0F172A] text-white
              text-[13px] font-semibold hover:bg-[#1E293B] transition-colors">
              {isEdit ? 'Save Changes' : 'Add Team'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const TeamsTab = () => {
  const toast = useToast();
  const teams = useDataStore(s => s.teams);
  const addTeam = useDataStore(s => s.addTeam);
  const updateTeam = useDataStore(s => s.updateTeam);
  const deleteTeam = useDataStore(s => s.deleteTeam);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') { addTeam(form); toast.success(`Team "${form.name}" added`); }
    else { updateTeam(form.id, form); toast.success(`Team "${form.name}" updated`); }
    setModal(null);
  };

  const handleDelete = () => {
    const t = teams.find(x => x.id === deleteId);
    deleteTeam(deleteId);
    toast.success(`Team "${t?.name}" removed`);
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Rescue Teams</h2>
          <p className="text-[12px] text-[#64748B] mt-0.5">{teams.length} teams registered</p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                     text-[12px] font-semibold rounded-md hover:bg-[#1E293B] transition-colors">
          <Plus size={13} /> Add Team
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Team', 'Lead', 'Members', 'Status', 'Zone', 'Contact', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold
                                         text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {teams.map(team => {
                const sc = TEAM_STATUS_CONFIG[team.status] || TEAM_STATUS_CONFIG.standby;
                return (
                  <tr key={team.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-[#0F172A]">{team.name}</p>
                      <p className="text-[10px] font-mono text-[#94A3B8]">{team.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-[#475569]">{team.lead}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-[#475569]">{team.members}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full"
                        style={{ color: sc.color, backgroundColor: sc.bg }}>
                        {team.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-[#475569]">{team.zone || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono text-[#94A3B8]">{team.contact || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModal({ mode: 'edit', team })}
                          className="p-1.5 rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteId(team.id)}
                          className="p-1.5 rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {teams.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#94A3B8]">
                  No teams. <button onClick={() => setModal({ mode: 'add' })}
                    className="text-[#2563EB] font-medium hover:underline">Add first team</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <TeamModal team={modal.team} isEdit={modal.mode === 'edit'}
        onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDialog open={!!deleteId} title="Remove Team?"
        message={`Remove "${teams.find(t => t.id === deleteId)?.name}"? Resources assigned to this team will become unassigned.`}
        confirmLabel="Remove Team" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default TeamsTab;
