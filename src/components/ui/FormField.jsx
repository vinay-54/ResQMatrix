const FormField = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-[#475569] mb-1.5 uppercase tracking-wide">
      {label} {required && <span className="text-[#DC2626]">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-[10px] text-[#DC2626] mt-1">{error}</p>
    )}
  </div>
);

export const inputClass = `
  w-full h-9 px-3 text-[13px] text-[#0F172A]
  bg-white border border-[#E2E8F0] rounded-md
  placeholder:text-[#94A3B8]
  focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10
  transition-all
`;

export const selectClass = inputClass;

export default FormField;
