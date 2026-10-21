import { useState } from 'react';
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import useDataStore from '../../../store/useDataStore';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';

const CATEGORIES = ['Power','Mechanical','Safety','Navigation','Software','Camera','Environment','Communication'];

const ChecklistTab = () => {
  const toast                = useToast();
  const checklist            = useDataStore(s => s.checklist);
  const addChecklistItem     = useDataStore(s => s.addChecklistItem);
  const updateChecklistItem  = useDataStore(s => s.updateChecklistItem);
  const deleteChecklistItem  = useDataStore(s => s.deleteChecklistItem);
  const toggleChecklistItem  = useDataStore(s => s.toggleChecklistItem);

  const [editItem,  setEditItem]  = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [newItem,   setNewItem]   = useState({ check: '', category: 'Safety' });
  const [showAdd,   setShowAdd]   = useState(false);

  const handleAdd = () => {
    if (!newItem.check.trim()) return;
    addChecklistItem(newItem);
    setNewItem({ check: '', category: 'Safety' });
    setShowAdd(false);
    toast.success(`Check "${newItem.check.slice(0, 30)}" added`);
  };

  const handleUpdate = () => {
    if (!editItem.check.trim()) return;
    updateChecklistItem(editItem.id, { check: editItem.check, category: editItem.category });
    toast.success(`Check "${editItem.check.slice(0, 30)}" updated`);
    setEditItem(null);
  };

  const handleDelete = () => {
    deleteChecklistItem(deleteId);
    const item = checklist.find(c => c.id === deleteId);
    toast.success(`Check "${item?.check?.slice(0, 30)}" removed`);
    setDeleteId(null);
  };

  const handleToggle = (id) => {
    toggleChecklistItem(id);
    const item = checklist.find(c => c.id === id);
    toast.info(`"${item?.check?.slice(0, 30)}..." ${item?.enabled ? 'disabled' : 'enabled'}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Pre-Flight Checklist</h2>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            {checklist.filter(c => c.enabled).length} active · {checklist.filter(c => !c.enabled).length} disabled
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                     text-[12px] font-semibold rounded-md hover:bg-[#1E293B] transition-colors">
          <Plus size={13} /> Add Item
        </button>
      </div>

      {/* Add Item Form */}
      {showAdd && (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 mb-4">
          <h4 className="text-[12px] font-semibold text-[#0F172A] mb-3">New Checklist Item</h4>
          <div className="grid grid-cols-[1fr_160px] gap-3 mb-3">
            <FormField label="Check Description" required>
              <input value={newItem.check} onChange={e => setNewItem(p => ({ ...p, check: e.target.value }))}
                placeholder="e.g. Battery fully charged and inserted"
                className={inputClass}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </FormField>
            <FormField label="Category">
              <select value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className={selectClass}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-4 py-1.5 bg-[#0F172A] text-white text-[12px] font-semibold
                         rounded-md hover:bg-[#1E293B] transition-colors">
              Add Item
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-1.5 border border-[#E2E8F0] text-[#475569] text-[12px]
                         font-medium rounded-md hover:bg-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="divide-y divide-[#F8FAFC]">
          {checklist.map((item, idx) => (
            <div key={item.id}
                 className={`flex items-center gap-3 px-5 py-3 transition-colors
                   ${!item.enabled ? 'opacity-50' : 'hover:bg-[#F8FAFC]'}`}>
              {/* Index */}
              <span className="text-[10px] font-mono text-[#CBD5E1] w-5 flex-shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Content */}
              {editItem?.id === item.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input value={editItem.check}
                    onChange={e => setEditItem(p => ({ ...p, check: e.target.value }))}
                    className={`${inputClass} flex-1`}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
                  <select value={editItem.category}
                    onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))}
                    className={`${selectClass} w-32`}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={handleUpdate}
                    className="px-2.5 py-1.5 bg-[#0F172A] text-white text-[11px] font-medium rounded-md">
                    Save
                  </button>
                  <button onClick={() => setEditItem(null)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#475569]">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-medium text-[#0F172A] ${!item.enabled ? 'line-through' : ''}`}>
                    {item.check}
                  </p>
                  <span className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                    {item.category}
                  </span>
                </div>
              )}

              {/* Actions */}
              {editItem?.id !== item.id && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Enable/Disable */}
                  <button onClick={() => handleToggle(item.id)}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                    title={item.enabled ? 'Disable' : 'Enable'}>
                    {item.enabled
                      ? <ToggleRight size={15} className="text-[#059669]" />
                      : <ToggleLeft  size={15} className="text-[#94A3B8]" />
                    }
                  </button>
                  <button onClick={() => setEditItem({ ...item })}
                    className="p-1.5 rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteId(item.id)}
                    className="p-1.5 rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {checklist.length === 0 && (
            <div className="py-12 text-center text-[13px] text-[#94A3B8]">
              No checklist items. <button onClick={() => setShowAdd(true)}
                className="text-[#2563EB] font-medium hover:underline">Add first item</button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={!!deleteId} title="Remove Checklist Item?"
        message={`Remove "${checklist.find(c => c.id === deleteId)?.check}"?`}
        confirmLabel="Remove" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default ChecklistTab;
