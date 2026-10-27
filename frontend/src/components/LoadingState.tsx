export default function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      {/* Spinner */}
      <svg className="h-7 w-7 animate-spin text-dc-blue/60" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-dc-subtext">{message}</p>
    </div>
  )
}

/** Skeleton block — single reusable line placeholder */
export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`dc-skeleton h-4 ${className}`} />
}

/** Skeleton card block */
export function SkeletonCard() {
  return (
    <div className="dc-card space-y-3 p-5">
      <div className="flex items-center gap-2">
        <SkeletonLine className="w-16 rounded-full" />
        <SkeletonLine className="w-12 rounded-full" />
      </div>
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-2/3" />
    </div>
  )
}
