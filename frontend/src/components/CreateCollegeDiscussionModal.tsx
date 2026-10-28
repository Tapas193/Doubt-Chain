import { useState, useEffect } from 'react'
import { X, BookOpen, Plus } from 'lucide-react'
import { doubtService } from '../services/doubtService'
import { Subject } from '../types/api'

type CreateCollegeDiscussionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    content: string
    subjectId: string
    academicCategory: string
  }) => Promise<void>
  collegeName?: string
}

const CATEGORIES = [
  { value: 'GENERAL_DOUBT', label: 'General Course Doubt' },
  { value: 'DSA', label: 'Data Structures & Algorithms' },
  { value: 'PROGRAMMING', label: 'Programming & Debugging' },
  { value: 'PROJECTS', label: 'Projects & Hackathons' },
  { value: 'INTERVIEWS', label: 'Interview Preparation' },
  { value: 'RESOURCES', label: 'Study Resources' },
  { value: 'EVENTS', label: 'Academic Events' }
]

export default function CreateCollegeDiscussionModal({
  isOpen,
  onClose,
  onSubmit,
  collegeName
}: CreateCollegeDiscussionModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [category, setCategory] = useState('GENERAL_DOUBT')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      doubtService
        .listSubjects()
        .then(subs => {
          setSubjects(subs || [])
          if (subs && subs.length > 0 && !subjectId) {
            setSubjectId(subs[0].id)
          }
        })
        .catch(console.error)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !subjectId) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        subjectId,
        academicCategory: category
      })
      setTitle('')
      setContent('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create college discussion')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-dc-border bg-dc-bg2 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-dc-subtext hover:bg-dc-card hover:text-dc-text transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dc-blue/15 text-dc-blue border border-dc-blue/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-dc-text">
              New College Discussion
            </h2>
            <p className="text-xs text-dc-subtext">
              Posting in {collegeName || 'your College Community'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-dc-red/30 bg-dc-red/10 p-3 text-xs text-dc-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-dc-subtext mb-1">
                Subject Course
              </label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text focus:border-dc-blue focus:outline-none"
                required
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dc-subtext mb-1">
                Academic Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text focus:border-dc-blue focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dc-subtext mb-1">
              Discussion Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Graph Cycle Detection with DFS vs Union-Find"
              className="w-full rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dc-subtext mb-1">
              Content / Details
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe your doubt, code logic, or conceptual query in detail..."
              className="w-full rounded-xl border border-dc-border bg-dc-card p-3 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-dc-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-dc-border px-4 py-2 text-xs font-medium text-dc-subtext hover:bg-dc-card hover:text-dc-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="dc-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Publishing...' : 'Publish to College'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
