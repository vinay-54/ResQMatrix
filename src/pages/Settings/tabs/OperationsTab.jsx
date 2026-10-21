import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import useDataStore from '../../../store/useDataStore';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';

const EMPTY_OP = {
  id: '', name: '', type: 'Flood', location: '', lat: '', lng: '',
  status: 'active', priority: 'medium', description: '',
  assignedTeams: [], assignedResources: [],
};

const OpModal = ({ op, isEdit, onClose, onSave }) => {
  const [form, setForm] = useState(op || EMPTY_OP);
  const [errors, setErrors] = useState({});
  const update = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    if (!form.location.trim()) e.location = 'Required';
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
              {isEdit ? 'Edit Operation' : 'Add Operation'}
            </h3>
            <button onClick={onClose} className="p-1 text-[#94A3B8] hover:text-[#475569]"><X size={16} /></button>
          </div>
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Operation ID" required error={errors.id}>
                <input value={form.id} onChange={e => update('id', e.target.value)}
                  placeholder="OP-003" className={inputClass} disabled={isEdit} />
              </FormField>
              <FormField label="Priority">
                <select value={form.priority} onChange={e => update('priority', e.target.value)} className={selectClass}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </FormField>
            </div>
            <FormField label="Operation Name" required error={errors.name}>
              <input value={form.name} onChange={e => update('name', e.target.value)}
                placeholder="North Zone Flood Response" className={inputClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Disaster Type">
                <select value={form.type} onChange={e => update('type', e.target.value)} className={selectClass}>
                  {['Flood', 'Cyclone', 'Fire', 'Earthquake', 'Monitoring', 'Relief'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => update('status', e.target.value)} className={selectClass}>
                  <option value="active">Active</option>
                  <option value="standby">Standby</option>
                  <option value="completed">Completed</option>
                </select>
              </FormField>
            </div>
            <FormField label="Location" required error={errors.location}>
              <input value={form.location} onChange={e => update('location', e.target.value)}
                placeholder="North Campus Gate Area" className={inputClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude">
                <input type="number" step="0.000001" value={form.lat}
                  onChange={e => update('lat', e.target.value)} className={inputClass} placeholder="13.6288" />
              </FormField>
              <FormField label="Longitude">
                <input type="number" step="0.000001" value={form.lng}
                  onChange={e => update('lng', e.target.value)} className={inputClass} placeholder="79.4197" />
              </FormField>
            </div>
            <FormField label="Description">
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                rows={3} placeholder="Operation details and objectives..."
                className={`${inputClass} h-auto py-2 resize-none`} />
            </FormField>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#F1F5F9] flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#E2E8F0]
              text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors">Cancel</button>
            <button onClick={() => validate() && onSave(form)}
              className="flex-1 py-2 rounded-lg bg-[#0F172A] text-white
              text-[13px] font-semibold hover:bg-[#1E293B] transition-colors">
              {isEdit ? 'Save Changes' : 'Add Operation'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const STATUS_COLORS = {
  active: { color: '#059669', bg: '#ECFDF5' },
  standby: { color: '#64748B', bg: '#F8FAFC' },
  completed: { color: '#2563EB', bg: '#EFF6FF' },
};

const PRIORITY_COLORS = {
  high: { color: '#DC2626', bg: '#FEF2F2' },
  medium: { color: '#D97706', bg: '#FFFBEB' },
  low: { color: '#64748B', bg: '#F8FAFC' },
};

const OperationsTab = () => {
  const toast = useToast();
  const operations = useDataStore(s => s.operations);
  const addOperation = useDataStore(s => s.addOperation);
  const updateOperation = useDataStore(s => s.updateOperation);
  const deleteOperation = useDataStore(s => s.deleteOperation);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') { addOperation(form); toast.success('Operation added'); }
    else { updateOperation(form.id, form); toast.success('Operation updated'); }
    setModal(null);
  };

  const handleDelete = () => {
    const op = operations.find(o => o.id === deleteId);
    deleteOperation(deleteId);
    toast.success(`Operation "${op?.name}" removed`);
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Operations</h2>
          <p className="text-[12px] text-[#64748B] mt-0.5">{operations.length} operations · Add, edit, or close operations</p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                     text-[12px] font-semibold rounded-md hover:bg-[#1E293B] transition-colors">
          <Plus size={13} /> Add Operation
        </button>
      </div>

      <div className="space-y-3">
        {operations.map(op => {
          const sc = STATUS_COLORS[op.status] || STATUS_COLORS.standby;
          const pc = PRIORITY_COLORS[op.priority] || PRIORITY_COLORS.medium;
          return (
            <div key={op.id} className="bg-white border border-[#E2E8F0] rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-semibold text-[#0F172A]">{op.name}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ color: sc.color, backgroundColor: sc.bg }}>
                      {op.status}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ color: pc.color, backgroundColor: pc.bg }}>
                      {op.priority} priority
                    </span>
                    <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                      {op.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">{op.location}</p>
                  {op.description && (
                    <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2">{op.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#94A3B8]">
                    <span className="font-mono">{op.id}</span>
                    {op.assignedTeams?.length > 0 && (
                      <span>{op.assignedTeams.length} team(s)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setModal({ mode: 'edit', op })}
                    className="p-1.5 rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteId(op.id)}
                    className="p-1.5 rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {operations.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-lg py-12 text-center text-[13px] text-[#94A3B8]">
            No operations. <button onClick={() => setModal({ mode: 'add' })}
              className="text-[#2563EB] font-medium hover:underline">Add the first operation</button>
          </div>
        )}
      </div>

      {modal && <OpModal op={modal.op} isEdit={modal.mode === 'edit'}
        onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDialog open={!!deleteId} title="Delete Operation?"
        message={`Delete "${operations.find(o => o.id === deleteId)?.name}"? This cannot be undone.`}
        confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default OperationsTab;
