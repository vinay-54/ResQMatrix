const PagePlaceholder = ({ title, description, icon }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-6">
    <div className="w-10 h-10 rounded-lg bg-panel border border-border flex items-center justify-center mb-1">
      <span className="text-xl">📊</span>
    </div>
    <h2 className="text-xl font-semibold text-text-primary tracking-tight">{title}</h2>
    <p className="text-sm text-text-secondary max-w-xs">{description}</p>
    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted
                     bg-panel border border-border rounded px-2.5 py-1">
      Stage in progress
    </span>
  </div>
);

export default PagePlaceholder;
