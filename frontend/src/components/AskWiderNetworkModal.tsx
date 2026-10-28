import { useState } from 'react'
import { Globe, ShieldAlert, CheckCircle2, X, Lock } from 'lucide-react'

type AskWiderNetworkModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  discussionTitle: string
  collegeName?: string
}

export default function AskWiderNetworkModal({
  isOpen,
  onClose,
  onConfirm,
  discussionTitle,
  collegeName
}: AskWiderNetworkModalProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleShare = async () => {
    if (!confirmed) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to share discussion with wider network')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-dc-border bg-dc-bg2 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-dc-subtext hover:bg-dc-card hover:text-dc-text transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dc-blue/15 text-dc-blue border border-dc-blue/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dc-text">
              Ask the Wider Network
            </h2>
            <p className="text-xs text-dc-subtext">
              Peer-to-Peer Cross-College Academic Collaboration
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dc-border bg-dc-card p-4 space-y-3">
          <p className="text-xs font-semibold text-dc-text">
            “{discussionTitle}”
          </p>
          <p className="text-xs text-dc-subtext leading-relaxed">
            This discussion is currently visible only within{' '}
            <span className="font-semibold text-dc-text">
              {collegeName || 'your college community'}
            </span>
            . Sharing it with the wider network will allow verified students and faculty from other academic institutions to view and reply to it.
          </p>
        </div>

        <div className="mt-4 space-y-2.5 text-xs text-dc-subtext">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>What is shared:</strong> Question title, description, subject code, and your college badge so peers recognize your institution.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-dc-blue shrink-0 mt-0.5" />
            <span>
              <strong>What remains private:</strong> Other private college-only discussions, internal student rosters, and college admin requests remain strictly hidden.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Linked Replies:</strong> All answers and solutions from external peers will be directly connected to this original discussion thread.
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-dc-red/30 bg-dc-red/10 p-3 text-xs text-dc-red">
            {error}
          </div>
        )}

        <div className="mt-5 border-t border-dc-border pt-4">
          <label className="flex items-center gap-2.5 text-xs text-dc-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-dc-border bg-dc-bg text-dc-blue focus:ring-dc-blue"
            />
            <span>
              I understand that this question will be published to the Wider Academic Network.
            </span>
          </label>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-dc-border px-4 py-2 text-xs font-medium text-dc-subtext hover:bg-dc-card hover:text-dc-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={!confirmed || submitting}
              className="dc-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              <Globe className="h-4 w-4" />
              {submitting ? 'Sharing...' : 'Confirm & Share with Network'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
