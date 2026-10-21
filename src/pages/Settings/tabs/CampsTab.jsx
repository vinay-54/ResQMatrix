import { useState } from 'react';
import { Plus, Pencil, Trash2, X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import useDataStore from '../../../store/useDataStore';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';
import '../../../utils/leafletIcons';

const CAMPUS_CENTER = [13.6288, 79.4197];
const LocationPicker = ({ onPick }) => { useMapEvents({ click: e => onPick(e.latlng) }); return null; };

const EMPTY_CAMP = { id: '', name: '', lat: 13.6288, lng: 79.4197, capacity: 100, status: 'active', contact: '' };

const CampModal = ({ camp, isEdit, onClose, onSave }) => {
  const [form, setForm] = useState(camp || EMPTY_CAMP);
  const [showMap, setShowMap] = useState(false);
  const [errors, setErrors] = useState({});
  const update = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0F172A]/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                        w-full max-w-[460px] pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <h3 className="text-[14px] font-semibold text-[#0F172A]">
              {isEdit ? 'Edit Rescue Camp' : 'Add Rescue Camp'}
            </h3>
            <button onClick={onClose} className="p-1 text-[#94A3B8] hover:text-[#475569]"><X size={16} /></button>
          </div>
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Camp ID" required error={errors.id}>
                <input value={form.id} onChange={e => update('id', e.target.value)}
                  placeholder="RC-04" className={inputClass} disabled={isEdit} />
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => update('status', e.target.value)} className={selectClass}>
                  <option value="active">Active</option>
                  <option value="full">Full</option>
                  <option value="closed">Closed</option>
                </select>
              </FormField>
            </div>
            <FormField label="Camp Name" required error={errors.name}>
              <input value={form.name} onChange={e => update('name', e.target.value)}
                placeholder="North Gate Relief Camp" className={inputClass} />
            </FormField>
            <FormField label="Capacity (persons)">
              <input type="number" value={form.capacity}
                onChange={e => update('capacity', parseInt(e.target.value))} className={inputClass} />
            </FormField>
            <FormField label="Contact">
              <input value={form.contact} onChange={e => update('contact', e.target.value)}
                placeholder="+91 98765 XXXXX" className={inputClass} />
            </FormField>
            <FormField label="GPS Coordinates">
              <div className="flex items-center gap-2">
                <input type="number" value={form.lat} step="0.000001"
                  onChange={e => update('lat', parseFloat(e.target.value))}
                  className={`${inputClass} flex-1`} placeholder="Latitude" />
                <input type="number" value={form.lng} step="0.000001"
                  onChange={e => update('lng', parseFloat(e.target.value))}
                  className={`${inputClass} flex-1`} placeholder="Longitude" />
                <button type="button" onClick={() => setShowMap(true)}
                  className="flex items-center gap-1 px-2.5 py-2 bg-[#EFF6FF]
                             border border-[#BFDBFE] text-[#2563EB] text-[11px]
                             font-semibold rounded-md hover:bg-[#DBEAFE] transition-colors flex-shrink-0">
                  <MapPin size={11} /> Map
                </button>
              </div>
            </FormField>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#F1F5F9] flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#E2E8F0]
              text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors">Cancel</button>
            <button onClick={() => validate() && onSave(form)}
              className="flex-1 py-2 rounded-lg bg-[#0F172A] text-white
              text-[13px] font-semibold hover:bg-[#1E293B] transition-colors">
              {isEdit ? 'Save Changes' : 'Add Camp'}
            </button>
          </div>
        </div>
      </div>
      {showMap && (
        <>
          <div className="fixed inset-0 z-[60] bg-[#0F172A]/60" onClick={() => setShowMap(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                            w-full max-w-[600px] pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#0F172A]">Select Camp Location</h4>
                  <p className="text-[11px] text-[#94A3B8]">Click on map to set coordinates</p>
                </div>
                <button onClick={() => setShowMap(false)} className="p-1 text-[#94A3B8] hover:text-[#475569]">
                  <X size={16} />
                </button>
              </div>
              <div style={{ height: '380px' }}>
                <MapContainer center={[form.lat, form.lng]} zoom={17} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <LocationPicker onPick={latlng => {
                    setForm(f => ({ ...f, lat: parseFloat(latlng.lat.toFixed(6)), lng: parseFloat(latlng.lng.toFixed(6)) }));
                    setShowMap(false);
                  }} />
                  <CircleMarker center={[form.lat, form.lng]} radius={12}
                    pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.8 }} />
                </MapContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

const CampsTab = () => {
  const toast = useToast();
  const rescueCamps = useDataStore(s => s.rescueCamps);
  const addRescueCamp = useDataStore(s => s.addRescueCamp);
  const updateRescueCamp = useDataStore(s => s.updateRescueCamp);
  const deleteRescueCamp = useDataStore(s => s.deleteRescueCamp);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') { addRescueCamp(form); toast.success(`Camp "${form.name}" added`); }
    else { updateRescueCamp(form.id, form); toast.success(`Camp "${form.name}" updated`); }
    setModal(null);
  };

  const STATUS_COLORS = { active: '#059669', full: '#D97706', closed: '#DC2626' };
  const STATUS_BG = { active: '#ECFDF5', full: '#FFFBEB', closed: '#FEF2F2' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Rescue Camps</h2>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            {rescueCamps.length} camps · Appear on Live Map automatically
          </p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                     text-[12px] font-semibold rounded-md hover:bg-[#1E293B] transition-colors">
          <Plus size={13} /> Add Camp
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Camp', 'Status', 'Capacity', 'Contact', 'GPS', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold
                                         text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {rescueCamps.map(camp => (
                <tr key={camp.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-semibold text-[#0F172A]">{camp.name}</p>
                    <p className="text-[10px] font-mono text-[#94A3B8]">{camp.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full"
                      style={{ color: STATUS_COLORS[camp.status], backgroundColor: STATUS_BG[camp.status] }}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-[#475569]">{camp.capacity} persons</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-[#94A3B8]">{camp.contact || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      {camp.lat?.toFixed(4)}, {camp.lng?.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setModal({ mode: 'edit', camp })}
                        className="p-1.5 rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(camp.id)}
                        className="p-1.5 rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rescueCamps.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#94A3B8]">
                  No camps. <button onClick={() => setModal({ mode: 'add' })}
                    className="text-[#2563EB] font-medium hover:underline">Add first camp</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <CampModal camp={modal.camp} isEdit={modal.mode === 'edit'}
        onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDialog open={!!deleteId} title="Remove Rescue Camp?"
        message={`Remove "${rescueCamps.find(c => c.id === deleteId)?.name}"? It will be removed from the Live Map immediately.`}
        confirmLabel="Remove Camp" onConfirm={() => {
          const c = rescueCamps.find(x => x.id === deleteId);
          deleteRescueCamp(deleteId);
          toast.success(`Camp "${c?.name}" removed`);
          setDeleteId(null);
        }} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default CampsTab;
