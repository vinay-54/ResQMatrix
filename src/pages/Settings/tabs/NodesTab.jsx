import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import { Plus, Pencil, Trash2, MapPin, X } from 'lucide-react';
import useDataStore from '../../../store/useDataStore';
import { ALERT_LEVELS, CONNECTIVITY_TIERS } from '../../../constants/alertLevels';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';
import StatusBadge from '../../../components/ui/StatusBadge';
import '../../../utils/leafletIcons';

const CAMPUS_CENTER = [13.6288, 79.4197];

// Listens for map clicks and returns coordinates
const LocationPicker = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
};

const EMPTY_NODE = {
  id: '',
  name: '',
  location: '',
  lat: 13.6288,
  lng: 79.4197,
  alertLevel: 'SAFE',
  connectivity: 'FOUR_G',
  battery: 100,
  solar: true,
  waterLevel: 80,
  temperature: 28,
  humidity: 70,
  pressure: 1012,
  rain: false,
};

const NodeModal = ({ node, onClose, onSave, isEdit }) => {
  const [form, setForm] = useState(node || EMPTY_NODE);
  const [showMap, setShowMap] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = 'Node ID is required';
    if (!form.name.trim()) e.name = 'Node name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.lat || !form.lng) e.lat = 'Location coordinates are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  const handleMapPick = (latlng) => {
    setForm(f => ({ ...f, lat: parseFloat(latlng.lat.toFixed(6)), lng: parseFloat(latlng.lng.toFixed(6)) }));
    setShowMap(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0F172A]/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                        w-full max-w-[560px] pointer-events-auto overflow-hidden
                        max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <h3 className="text-[14px] font-semibold text-[#0F172A]">
              {isEdit ? 'Edit Sensor Node' : 'Add Sensor Node'}
            </h3>
            <button onClick={onClose} className="p-1 rounded text-[#94A3B8] hover:text-[#475569]">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Node ID" required error={errors.id}>
                <input
                  value={form.id}
                  onChange={e => update('id', e.target.value)}
                  placeholder="node-06"
                  className={inputClass}
                  disabled={isEdit}
                />
              </FormField>
              <FormField label="Node Name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="River Bridge East"
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label="Installation Location" required error={errors.location}>
              <input
                value={form.location}
                onChange={e => update('location', e.target.value)}
                placeholder="Bridge abutment, 2m above low-water mark"
                className={inputClass}
              />
            </FormField>

            {/* GPS Coordinates + Map Picker */}
            <FormField label="GPS Coordinates" required error={errors.lat}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.lat}
                  onChange={e => update('lat', parseFloat(e.target.value))}
                  placeholder="Latitude"
                  step="0.000001"
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="number"
                  value={form.lng}
                  onChange={e => update('lng', parseFloat(e.target.value))}
                  placeholder="Longitude"
                  step="0.000001"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#EFF6FF]
                             border border-[#BFDBFE] text-[#2563EB] text-[11px]
                             font-semibold rounded-md hover:bg-[#DBEAFE] transition-colors
                             flex-shrink-0 whitespace-nowrap"
                >
                  <MapPin size={12} />
                  Pick on Map
                </button>
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">
                Current: {form.lat}, {form.lng}
              </p>
            </FormField>

            {/* Status fields */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Alert Level">
                <select value={form.alertLevel} onChange={e => update('alertLevel', e.target.value)} className={selectClass}>
                  {Object.keys(ALERT_LEVELS).map(l => (
                    <option key={l} value={l}>{ALERT_LEVELS[l].label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Connectivity">
                <select value={form.connectivity} onChange={e => update('connectivity', e.target.value)} className={selectClass}>
                  {Object.keys(CONNECTIVITY_TIERS).map(k => (
                    <option key={k} value={k}>{CONNECTIVITY_TIERS[k].label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Battery %">
                <input type="number" min="0" max="100" value={form.battery}
                  onChange={e => update('battery', parseInt(e.target.value))} className={inputClass} />
              </FormField>
              <FormField label="Water Level (cm)">
                <input type="number" min="0" value={form.waterLevel}
                  onChange={e => update('waterLevel', parseInt(e.target.value))} className={inputClass} />
              </FormField>
              <FormField label="Solar Charging">
                <select value={form.solar ? 'yes' : 'no'}
                  onChange={e => update('solar', e.target.value === 'yes')} className={selectClass}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-[#F1F5F9] flex-shrink-0">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#E2E8F0] text-[13px]
                         font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors">
              Cancel
            </button>
            <button onClick={handleSave}
              className="flex-1 py-2 rounded-lg bg-[#0F172A] text-white
                         text-[13px] font-semibold hover:bg-[#1E293B] transition-colors">
              {isEdit ? 'Save Changes' : 'Add Node'}
            </button>
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      {showMap && (
        <>
          <div className="fixed inset-0 z-[60] bg-[#0F172A]/60" onClick={() => setShowMap(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                            w-full max-w-[700px] pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#0F172A]">Select Node Location</h4>
                  <p className="text-[11px] text-[#94A3B8]">Click anywhere on the map to set coordinates</p>
                </div>
                <button onClick={() => setShowMap(false)} className="p-1 rounded text-[#94A3B8] hover:text-[#475569]">
                  <X size={16} />
                </button>
              </div>
              <div style={{ height: '420px' }}>
                <MapContainer
                  center={[form.lat || CAMPUS_CENTER[0], form.lng || CAMPUS_CENTER[1]]}
                  zoom={17}
                  zoomControl
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <LocationPicker onPick={handleMapPick} />
                  {form.lat && form.lng && (
                    <CircleMarker
                      center={[form.lat, form.lng]}
                      radius={12}
                      pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.8 }}
                    />
                  )}
                </MapContainer>
              </div>
              <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#F1F5F9]">
                <p className="text-[11px] text-[#64748B]">
                  Selected: <strong className="font-mono">{form.lat}, {form.lng}</strong>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

const NodesTab = () => {
  const toast = useToast();
  const nodes = useDataStore(s => s.nodes);
  const addNode = useDataStore(s => s.addNode);
  const updateNode = useDataStore(s => s.updateNode);
  const deleteNode = useDataStore(s => s.deleteNode);

  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      addNode(form);
      toast.success(`Node "${form.name}" added`);
    } else {
      updateNode(form.id, form);
      toast.success(`Node "${form.name}" updated`);
    }
    setModal(null);
  };

  const handleDelete = () => {
    const node = nodes.find(n => n.id === deleteId);
    deleteNode(deleteId);
    toast.success(`Node "${node?.name}" removed`);
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Sensor Nodes</h2>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            {nodes.length} nodes configured · Add, edit, or remove sensor nodes
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                     text-[12px] font-semibold rounded-md hover:bg-[#1E293B] transition-colors"
        >
          <Plus size={13} />
          Add Node
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Node', 'Location', 'Status', 'Connectivity', 'Battery', 'GPS', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold
                                         text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {nodes.map(node => (
                <tr key={node.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-semibold text-[#0F172A]">{node.name}</p>
                    <p className="text-[10px] text-[#94A3B8] font-mono">{node.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[11px] text-[#475569]">{node.location}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge level={node.alertLevel} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-medium"
                      style={{ color: CONNECTIVITY_TIERS[node.connectivity]?.color }}>
                      {CONNECTIVITY_TIERS[node.connectivity]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-[#475569]">{node.battery}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      {node.lat?.toFixed(4)}, {node.lng?.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModal({ mode: 'edit', node })}
                        className="p-1.5 rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(node.id)}
                        className="p-1.5 rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#94A3B8]">
                    No sensor nodes configured.{' '}
                    <button onClick={() => setModal({ mode: 'add' })}
                      className="text-[#2563EB] font-medium hover:underline">
                      Add the first node
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <NodeModal
          node={modal.node}
          isEdit={modal.mode === 'edit'}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Sensor Node?"
        message={`Are you sure you want to delete node "${nodes.find(n => n.id === deleteId)?.name}"? It will be removed from the map, dashboard, and all pages.`}
        confirmLabel="Delete Node"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default NodesTab;
