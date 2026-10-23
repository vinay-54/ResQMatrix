import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import useDataStore from '../../../store/useDataStore';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';

const EMPTY_DRONE = {
  id: '', model: '', status: 'standby', batteryLevel: 100,
  location: '', assignedOperation: '', pilot: '',
  camera: '4K/30fps', transmission: 'OcuSync 3.0',
  weight: '249g', maxFlightTime: 38, firmware: 'v01.00.0600',
  dgca: 'Sub-250g — No registration required',
};

const DroneModal = ({ drone, isEdit, onClose, onSave }) => {
  const [form, setForm] = useState(drone || EMPTY_DRONE);
  const [errors, setErrors] = useState({});
  const update = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = 'Required';
    if (!form.model.trim()) e.model = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0F172A]/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                        w-full max-w-[480px] pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <h3 className="text-[14px] font-semibold text-[#0F172A]">
              {isEdit ? 'Edit Drone' : 'Add Drone'}
            </h3>
            <button onClick={onClose} className="p-1 text-[#94A3B8] hover:text-[#475569]"><X size={16} /></button>
          </div>
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Drone ID" required error={errors.id}>
                <input value={form.id} onChange={e => update('id', e.target.value)}
                  placeholder="RQM-UAV-02" className={inputClass} disabled={isEdit} />
              </FormField>
              <FormField label="Model" required error={errors.model}>
                <input value={form.model} onChange={e => update('model', e.target.value)}
                  placeholder="DJI Mini 3" className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Status">
                <select value={form.status} onChange={e => update('status', e.target.value)} className={selectClass}>
                  {['standby', 'preflight', 'airborne', 'returning', 'charging'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Battery %">
                <input type="number" min="0" max="100" value={form.batteryLevel}
                  onChange={e => update('batteryLevel', parseInt(e.target.value))} className={inputClass} />
              </FormField>
            </div>
            <FormField label="Pilot / Operator">
              <input value={form.pilot} onChange={e => update('pilot', e.target.value)}
                placeholder="Name of assigned pilot" className={inputClass} />
            </FormField>
            <FormField label="Current Location">
              <input value={form.location} onChange={e => update('location', e.target.value)}
                placeholder="Command post, Building A" className={inputClass} />
            </FormField>
            <FormField label="Assigned Operation">
              <input value={form.assignedOperation} onChange={e => update('assignedOperation', e.target.value)}
                placeholder="OP-001" className={inputClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Camera / Payload">
                <input value={form.camera} onChange={e => update('camera', e.target.value)} className={inputClass} />
              </FormField>
              <FormField label="Max Flight (min)">
                <input type="number" value={form.maxFlightTime}
                  onChange={e => update('maxFlightTime', parseInt(e.target.value))} className={inputClass} />
              </FormField>
            </div>
            <FormField label="Weight">
              <input value={form.weight} onChange={e => update('weight', e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="DGCA / Regulatory Status">
              <input value={form.dgca} onChange={e => update('dgca', e.target.value)} className={inputClass} />
            </FormField>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#F1F5F9] flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#E2E8F0]
              text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors">Cancel</button>
            <button onClick={() => validate() && onSave(form)}
              className="flex-1 py-2 rounded-lg bg-[#0F172A] text-white
              text-[13px] font-semibold hover:bg-[#1E293B] transition-colors">
              {isEdit ? 'Save Changes' : 'Add Drone'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const DronesTab = () => {
  const toast = useToast();
  const drones = useDataStore(s => s.drones);
  const addDrone = useDataStore(s => s.addDrone);
  const updateDrone = useDataStore(s => s.updateDrone);
  const deleteDrone = useDataStore(s => s.deleteDrone);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') { addDrone(form); toast.success('Drone added'); }
    else { updateDrone(form.id, form); toast.success('Drone updated'); }
    setModal(null);
  };

  const handleDelete = () => {
    const d = drones.find(x => x.id === deleteId);
    deleteDrone(deleteId);
    toast.success(`Drone "${d?.model || d?.id}" removed`);
    setDeleteId(null);
  };

  const STATUS_COLORS = {
    standby: '#64748B', preflight: '#D97706', airborne: '#059669',
    returning: '#2563EB', charging: '#7C3AED',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Drone Fleet</h2>
          <p className="text-[12px] text-[#64748B] mt-0.5">{drones.length} drone(s) registered</p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                     text-[12px] font-semibold rounded-md hover:bg-[#1E293B] transition-colors">
          <Plus size={13} /> Add Drone
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Drone', 'Status', 'Battery', 'Pilot', 'Location', 'Operation', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold
                                         text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {drones.map(drone => (
                <tr key={drone.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-semibold text-[#0F172A]">{drone.model}</p>
                    <p className="text-[10px] text-[#94A3B8] font-mono">{drone.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold capitalize"
                      style={{ color: STATUS_COLORS[drone.status] || '#64748B' }}>
                      {drone.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-[#475569]">
                      {drone.batteries?.[0]?.charge ?? drone.batteryLevel ?? '—'}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-[#475569]">{drone.pilot || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-[#475569]">{drone.location || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      {drone.assignedOperation || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setModal({ mode: 'edit', drone })}
                        className="p-1.5 rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(drone.id)}
                        className="p-1.5 rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {drones.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#94A3B8]">
                  No drones registered. <button onClick={() => setModal({ mode: 'add' })}
                    className="text-[#2563EB] font-medium hover:underline">Add first drone</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <DroneModal drone={modal.drone} isEdit={modal.mode === 'edit'}
        onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDialog open={!!deleteId} title="Remove Drone?"
        message={`Remove drone "${drones.find(d => d.id === deleteId)?.model}"? It will be removed from all operations.`}
        confirmLabel="Remove" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default DronesTab;
