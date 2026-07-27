export function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="border-b border-stone-100 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-3">
          <div
            className="h-3 bg-stone-100 rounded animate-pulse"
            style={{ width: `${55 + (i * 17 + 23) % 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="bg-white border border-stone-200 rounded-md p-4 space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-stone-100 rounded animate-pulse"
          style={{ width: i === 0 ? '60%' : `${40 + (i * 13) % 30}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-stone-100">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-2 px-3">
                <div className="h-2 bg-stone-100 rounded animate-pulse w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
