// Base skeleton shimmer component
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#F1F5F9] rounded ${className}`} />
);

// Card skeleton — used for KPI cards
export const CardSkeleton = () => (
  <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-2.5 w-20 rounded" />
      <Skeleton className="w-7 h-7 rounded-md" />
    </div>
    <Skeleton className="h-8 w-16 rounded mb-2" />
    <Skeleton className="h-2 w-28 rounded" />
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="border-b border-[#F8FAFC]">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-3.5">
        <Skeleton className={`h-3 rounded ${i === 0 ? 'w-32' : 'w-20'}`} />
        {i === 0 && <Skeleton className="h-2 w-16 rounded mt-1.5" />}
      </td>
    ))}
  </tr>
);

// Node card skeleton
export const NodeCardSkeleton = () => (
  <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
    <div className="h-1 w-full bg-[#F1F5F9]" />
    <div className="px-5 py-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Skeleton className="h-3.5 w-28 rounded mb-1.5" />
          <Skeleton className="h-2.5 w-40 rounded" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-2.5 w-16 rounded mb-2" />
      <Skeleton className="h-2 w-full rounded-full mb-1" />
      <div className="grid grid-cols-4 gap-2 mt-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-2.5 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 200 }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <div className="flex items-end justify-between h-full gap-2 px-4 pb-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 bg-[#F1F5F9] rounded-t"
             style={{ height: `${30 + Math.random() * 60}%` }} />
      ))}
    </div>
  </div>
);

export default Skeleton;
