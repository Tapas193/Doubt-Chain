type StatusBadgeProps = {
  status: 'resolved' | 'unresolved' | 'info'
}

const CONFIG: Record<StatusBadgeProps['status'], { label: string; cls: string; dot: string }> = {
  resolved:   { label: 'Resolved',   cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/25', dot: 'bg-emerald-400' },
  unresolved: { label: 'Open',       cls: 'bg-amber-500/10  text-amber-300  border-amber-400/25',    dot: 'bg-amber-400'   },
  info:       { label: 'Info',       cls: 'bg-blue-500/10   text-sky-300    border-sky-400/25',       dot: 'bg-sky-400'     },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, cls, dot } = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
