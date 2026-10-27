type ErrorStateProps = {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-dc-red/30 bg-dc-red/10 px-5 py-4 text-sm"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-dc-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <div className="flex-1">
        <p className="text-rose-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-dc-blue hover:underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
