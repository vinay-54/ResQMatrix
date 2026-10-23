import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '../../../components/ui/FormField';

// Users managed in local state only (not in useDataStore)
// Firebase Auth handles real user management in production
const INITIAL_USERS = [
  { id: 'U-01', name: 'Vinay Kumar',    email: 'admin@idms.svce.in',    role: 'admin',       status: 'active' },
  { id: 'U-02', name: 'Geethika Reddy', email: 'coord@idms.svce.in',    role: 'coordinator', status: 'active' },
  { id: 'U-03', name: 'Thimme Gowd',    email: 'operator@idms.svce.in', role: 'operator',    status: 'active' },
  { id: 'U-04', name: 'Jeevan Naidu',   email: 'field@idms.svce.in',    role: 'field',       status: 'active' },
];

const ROLE_CONFIG = {
  admin:       { label: 'Administrator', color: '#7C3AED', bg: '#F5F3FF' },
  coordinator: { label: 'Coordinator',   color: '#2563EB', bg: '#EFF6FF' },
  operator:    { label: 'Operator',      color: '#059669', bg: '#ECFDF5' },
  field:       { label: 'Field Worker',  color: '#D97706', bg: '#FFFBEB' },
};

const EMPTY_USER = { id: '', name: '', email: '', role: 'operator', status: 'active' };

const UserModal = ({ user, isEdit, onClose, onSave }) => {
  const [form, setForm] = useState(user || EMPTY_USER);
  const [errors, setErrors] = useState({});
  const update = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0F172A]/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-raised
                        w-full max-w-[420px] pointer-events-auto overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
            <h3 className="text-[14px] font-semibold text-[#0F172A]">
              {isEdit ? 'Edit User' : 'Invite User'}
            </h3>
            <button onClick={onClose} className="p-1 text-[#94A3B8] hover:text-[#475569]"><X size={16}/></button>
          </div>
          <div className="px-6 py-4 space-y-3">
            <FormField label="Full Name" required error={errors.name}>
              <input value={form.name} onChange={e => update('name', e.target.value)}
                placeholder="Full name" className={inputClass} />
            </FormField>
            <FormField label="Email Address" required error={errors.email}>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="user@svce.edu.in" className={inputClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Role">
                <select value={form.role} onChange={e => update('role', e.target.value)} className={selectClass}>
                  {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => update('status', e.target.value)} className={selectClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#F1F5F9]">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#E2E8F0]
              text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors">Cancel</button>
            <button onClick={() => validate() && onSave(form)}
              className="flex-1 py-2 rounded-lg bg-[#0F172A] text-white
              text-[13px] font-semibold hover:bg-[#1E293B] transition-colors">
              {isEdit ? 'Save Changes' : 'Invite User'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const UsersTab = () => {
  const toast                    = useToast();
  const [users,    setUsers]     = useState(INITIAL_USERS);
  const [modal,    setModal]     = useState(null);
  const [deleteId, setDeleteId]  = useState(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      setUsers(u => [...u, { ...form, id: `U-${Date.now()}` }]);
      toast.success(`User "${form.name}" added`);
    } else {
      setUsers(u => u.map(x => x.id === form.id ? form : x));
      toast.success(`User "${form.name}" updated`);
    }
    setModal(null);
  };

  const handleDelete = () => {
    const u = users.find(x => x.id === deleteId);
    setUsers(p => p.filter(x => x.id !== deleteId));
    toast.success(`User "${u?.name}" removed`);
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">User Management</h2>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            {users.length} users · Role-based access control
          </p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white
                     text-[12px] font-semibold rounded-md hover:bg-[#1E293B] transition-colors">
          <Plus size={13} /> Invite User
        </button>
      </div>

      {/* Role legend */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {Object.entries(ROLE_CONFIG).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full"
                style={{ color: v.color, backgroundColor: v.bg }}>
            <Shield size={9} /> {v.label}
          </span>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['User','Email','Role','Status',''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold
                                         text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {users.map(user => {
                const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.operator;
                return (
                  <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]
                                        flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#2563EB]">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <p className="text-[12px] font-semibold text-[#0F172A]">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-[#475569]">{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: rc.color, backgroundColor: rc.bg }}>
                        {rc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium capitalize ${
                        user.status === 'active' ? 'text-[#059669]' : 'text-[#94A3B8]'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModal({ mode: 'edit', user })}
                          className="p-1.5 rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                          <Pencil size={13} />
                        </button>
                        {user.role !== 'admin' && (
                          <button onClick={() => setDeleteId(user.id)}
                            className="p-1.5 rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#F8FAFC]">
          <p className="text-[10px] text-[#94A3B8]">
            Admin accounts cannot be deleted · Firebase Auth manages authentication in production
          </p>
        </div>
      </div>

      {modal && <UserModal user={modal.user} isEdit={modal.mode === 'edit'}
        onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDialog open={!!deleteId} title="Remove User?"
        message={`Remove "${users.find(u => u.id === deleteId)?.name}"? They will lose all access to ResQMatrix.`}
        confirmLabel="Remove User" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default UsersTab;
