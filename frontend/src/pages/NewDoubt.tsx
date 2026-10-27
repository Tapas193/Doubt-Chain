import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import ProtectedRoute from '../components/ProtectedRoute'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Subject, Doubt, Attachment, SmartDuplicateMatch } from '../types/api'
import { useLanguage } from '../i18n/LanguageContext'

function formatSeconds(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function NewDoubtForm() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const preselectedSubjectId = searchParams.get('subjectId') || ''

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState({
    title: '',
    content: '',
    subjectId: preselectedSubjectId
  })


  // Feature 1 & 4: Smart duplicate detection and search-before-posting suggestions
  const [matches, setMatches] = useState<Doubt[]>([])
  const [smartMatches, setSmartMatches] = useState<SmartDuplicateMatch[]>([])
  const [answeredDoubtId, setAnsweredDoubtId] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchCompleted, setSearchCompleted] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchDismissed, setSearchDismissed] = useState(false)

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Voice note recording state (Feature 2)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<any>(null)

  // Submission & Validation states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'title' | 'content' | 'subjectId', string>>>({})

  useEffect(() => {
    doubtService
      .listSubjects()
      .then(subs => {
        setSubjects(subs)
        if (preselectedSubjectId && subs.some(s => s.id === preselectedSubjectId)) {
          setForm(f => ({ ...f, subjectId: preselectedSubjectId }))
        }
      })
      .catch(() => setSubjects([]))
  }, [preselectedSubjectId])

  // Smart duplicate search using semantic embeddings with fallback
  useEffect(() => {
    const trimmed = form.title.trim()
    if (trimmed.length < 3) {
      setMatches([])
      setSmartMatches([])
      setSearching(false)
      setSearchCompleted(false)
      setSearchError(null)
      return
    }

    let active = true
    setSearching(true)
    setSearchDismissed(false)
    setSearchError(null)
    const searchTimer = setTimeout(() => {
      doubtService
        .findSmartDuplicates(trimmed, {
          subjectId: form.subjectId || undefined
        })
        .then(res => {
          if (active) {
            setSmartMatches(res || [])
            setSearchCompleted(true)
          }
        })
        .catch(() => {
          // Fallback to keyword search
          if (active) {
            doubtService
              .searchDoubts(trimmed, {
                isResolved: true,
                subjectId: form.subjectId || undefined,
                limit: 3
              })
              .then(fallbackRes => {
                if (active) {
                  setMatches(fallbackRes.items)
                  setSearchCompleted(true)
                }
              })
              .catch(err => {
                if (active) {
                  setMatches([])
                  setSmartMatches([])
                  setSearchError(err.message || 'Failed to check similar doubts')
                  setSearchCompleted(false)
                }
              })
          }
        })
        .finally(() => {
          if (active) setSearching(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(searchTimer)
    }
  }, [form.title, form.subjectId])

  const handleAnsweredFeedback = async (matchId: string) => {
    setAnsweredDoubtId(matchId)
    try {
      await doubtService.recordSearchFeedback({
        doubtId: matchId,
        query: form.title,
        action: 'ANSWERED_MY_DOUBT'
      })
    } catch {
      // Non-blocking
    }
  }

  const handleNoneHelpedFeedback = async () => {
    setSearchDismissed(true)
    try {
      await doubtService.recordSearchFeedback({
        query: form.title,
        action: 'NONE_HELPED_POSTED'
      })
    } catch {
      // Non-blocking
    }
  }

  // Cleanup microphone on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Image file selection handler
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    setError(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          setError(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP images are allowed.`)
          continue
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`File too large: ${file.name}. Maximum size is 10MB.`)
          continue
        }
        const uploaded = await doubtService.uploadFile(file)
        setAttachments(prev => [...prev, uploaded])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploadingFiles(false)
      e.target.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Voice recording controls
  const startRecording = async () => {
    setVoiceError(null)
    setVoiceBlob(null)
    setVoicePreviewUrl(null)
    setRecordingDuration(0)

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setVoiceError('Microphone recording is not supported on this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      let chosenMime = 'audio/webm'
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          chosenMime = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          chosenMime = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          chosenMime = 'audio/ogg'
        }
      }

      const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined)
      mediaRecorderRef.current = recorder
      const chunks: Blob[] = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const detectedMime = recorder.mimeType || chosenMime || 'audio/webm'
        const audioBlob = new Blob(chunks, { type: detectedMime })
        setVoiceBlob(audioBlob)
        const url = URL.createObjectURL(audioBlob)
        setVoicePreviewUrl(url)
        // Stop audio tracks
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start(200)
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 120) {
            // Auto stop at 2 minutes
            stopRecording()
            return 120
          }
          return prev + 1
        })
      }, 1000)
    } catch (err: any) {
      setVoiceError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings to record voice notes.'
          : 'Failed to access microphone.'
      )
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const deleteRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
    }
    setVoiceBlob(null)
    setVoicePreviewUrl(null)
    setRecordingDuration(0)
    setIsRecording(false)
    setVoiceError(null)
  }

  const validate = () => {
    const errs: typeof fieldErrors = {}
    if (!form.subjectId) errs.subjectId = 'Please select a subject board.'
    if (form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters long.'
    if (form.title.trim().length > 200) errs.title = 'Title cannot exceed 200 characters.'
    if (form.content.trim().length < 10) errs.content = 'Details must be at least 10 characters to explain your doubt properly.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const finalAttachments = [...attachments]

      // If a recorded voice note exists, upload it first with correct extension
      if (voiceBlob) {
        const mime = voiceBlob.type || 'audio/webm'
        const ext = mime.includes('mp4') ? '.mp4' : mime.includes('ogg') ? '.ogg' : '.webm'
        const audioFile = new File([voiceBlob], `voice-note-${Date.now()}${ext}`, {
          type: mime
        })
        const uploadedVoice = await doubtService.uploadFile(audioFile)
        finalAttachments.push(uploadedVoice)
      }

      const created = await doubtService.createDoubt({
        title: form.title.trim(),
        content: form.content.trim(),
        subjectId: form.subjectId,
        attachments: finalAttachments
      })

      navigate(`/doubts/${created.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to post doubt')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (fieldErrors[k]) setFieldErrors(fe => ({ ...fe, [k]: undefined }))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-dc-text">{t('doubts.askButton')}</h1>
          <p className="mt-0.5 text-sm text-dc-subtext">
            {t('doubts.subtitle')}
          </p>
        </div>

        {error && <ErrorState message={error} />}

        <form onSubmit={handleSubmit} noValidate className="dc-card p-6 space-y-5 shadow-dc-card">
          {/* Subject Board */}
          <div>
            <label htmlFor="subject" className="dc-label">
              {t('doubts.subjectLabel')} <span className="text-rose-400">*</span>
            </label>
            <select
              id="subject"
              value={form.subjectId}
              onChange={set('subjectId')}
              className={`dc-input ${fieldErrors.subjectId ? 'dc-input-error' : ''}`}
            >
              <option value="">{t('doubts.selectSubject')}</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) {s.isMember ? `✓ ${t('subjects.joinedBadge')}` : ''}
                </option>
              ))}
            </select>
            {fieldErrors.subjectId && (
              <p role="alert" className="mt-1.5 text-xs text-rose-400 font-medium">
                {fieldErrors.subjectId}
              </p>
            )}
          </div>

          {/* Title + Feature 4 Live Search Interceptor */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="title" className="dc-label">
                {t('doubts.titleLabel')} <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs text-dc-subtext">{form.title.length}/200</span>
            </div>

            <div className="relative">
              <input
                id="title"
                value={form.title}
                onChange={set('title')}
                maxLength={200}
                required
                placeholder={t('doubts.titlePlaceholder')}
                className={`dc-input pr-10 ${fieldErrors.title ? 'dc-input-error' : ''}`}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 animate-spin text-dc-blue" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>
            {fieldErrors.title && (
              <p role="alert" className="mt-1.5 text-xs text-rose-400 font-medium">
                {fieldErrors.title}
              </p>
            )}

            {searchError && (
              <p className="mt-1 text-xs text-dc-subtext">
                Note: Similar doubts could not be checked ({searchError}).
              </p>
            )}

            {/* Feature 4: Empty search results confirmation */}
            {!searchDismissed && searchCompleted && !searching && smartMatches.length === 0 && matches.length === 0 && form.title.trim().length >= 3 && !searchError && (
              <div
                role="status"
                className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>No similar resolved doubts found — you're good to post this new question!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchDismissed(true)}
                  className="text-[11px] text-emerald-400/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Feature 1 & 4: Smart Semantic Duplicate Suggestions Panel */}
            {!searchDismissed && smartMatches.length > 0 && (
              <div
                role="region"
                aria-label="Similar resolved doubts"
                className="mt-3 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-dc-card to-dc-card p-4 space-y-3 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✨</span>
                    <p className="text-xs font-semibold text-indigo-200">
                      {t('doubts.smartDuplicateNotice')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchDismissed(true)}
                    className="text-xs text-indigo-300 hover:text-white"
                  >
                    ✕ {t('common.close')}
                  </button>
                </div>

                <div className="space-y-2">
                  {smartMatches.map(m => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-indigo-500/20 bg-dc-bg/90 p-3 space-y-2 transition-colors hover:border-dc-blue"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/doubts/${m.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-dc-text hover:text-dc-blue line-clamp-1"
                        >
                          {m.title} ↗
                        </Link>
                        <span className="shrink-0 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-300">
                          {m.similarityPercent}% {t('search.matchScore')}
                        </span>
                      </div>

                      {m.acceptedAnswer && (
                        <div className="rounded bg-emerald-500/5 border-l-2 border-emerald-400 p-2 text-[11px] text-dc-subtext italic">
                          <span className="text-emerald-400 font-medium not-italic">{t('detail.acceptedBadge')}: </span>
                          "{m.acceptedAnswer.content.slice(0, 140)}…"
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-dc-border/40 text-xs">
                        {answeredDoubtId === m.id ? (
                          <span className="text-[11px] font-medium text-emerald-400">
                            ✓ Recorded! Glad this helped you.
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAnsweredFeedback(m.id)}
                            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            ✓ This Answered My Doubt
                          </button>
                        )}
                        <Link
                          to={`/doubts/${m.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-dc-subtext hover:text-dc-blue"
                        >
                          {t('search.viewDiscussion')} →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-indigo-500/20">
                  <span className="text-[11px] text-dc-subtext">None of these match your specific problem?</span>
                  <button
                    type="button"
                    onClick={handleNoneHelpedFeedback}
                    className="text-xs font-medium text-indigo-300 hover:text-white"
                  >
                    None of These Help — Continue Writing →
                  </button>
                </div>
              </div>
            )}

            {/* Keyword Fallback Suggestions Panel */}
            {!searchDismissed && smartMatches.length === 0 && matches.length > 0 && (
              <div
                role="region"
                aria-label="Similar resolved doubts"
                className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💡</span>
                    <p className="text-xs font-semibold text-amber-200">
                      {t('search.similarQuestionsFound')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchDismissed(true)}
                    className="text-xs text-amber-300 hover:text-white"
                  >
                    ✕ {t('common.close')}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {matches.map(m => (
                    <Link
                      key={m.id}
                      to={`/doubts/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 rounded-lg border border-amber-400/20 bg-dc-bg/80 p-2.5 transition-colors hover:border-dc-blue hover:bg-dc-bg"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-dc-text group-hover:text-dc-blue">
                          {m.title}
                        </p>
                        <p className="truncate text-[11px] text-dc-subtext">
                          {m.subject?.name} · {m._count?.answers ?? 0} answers
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        {t('detail.acceptedBadge')} ↗
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details / Content */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="dc-label">
                {t('doubts.contentLabel')} <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs text-dc-subtext">{form.content.length}/10000</span>
            </div>
            <textarea
              id="content"
              value={form.content}
              onChange={set('content')}
              required
              rows={6}
              maxLength={10000}
              placeholder={t('doubts.contentPlaceholder')}
              className={`dc-input resize-none ${fieldErrors.content ? 'dc-input-error' : ''}`}
            />
            {fieldErrors.content && (
              <p role="alert" className="mt-1.5 text-xs text-rose-400 font-medium">
                {fieldErrors.content}
              </p>
            )}
          </div>

          {/* Feature 2: Image Attachments */}
          <div className="space-y-2 border-t border-dc-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="dc-label mb-0">{t('doubts.uploadImage')}</label>
                <p className="text-xs text-dc-subtext">
                  {t('doubts.mediaLabel')}
                </p>
              </div>
              <label className="dc-btn-secondary cursor-pointer text-xs shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {uploadingFiles ? t('common.loading') : t('doubts.uploadImage')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploadingFiles}
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.filter(a => a.fileType === 'IMAGE').length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                {attachments
                  .filter(a => a.fileType === 'IMAGE')
                  .map((att, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-lg border border-dc-border bg-dc-bg2/50">
                      <img
                        src={att.url}
                        alt={att.filename}
                        className="h-28 w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white truncate">
                        {att.filename}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-rose-600 p-1 text-white opacity-90 hover:opacity-100 transition-opacity"
                        aria-label={`Remove image ${att.filename}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Feature 2: Voice Note Recording */}
          <div className="space-y-2 border-t border-dc-border pt-4">
            <div>
              <label className="dc-label mb-0">{t('doubts.recordVoice')}</label>
              <p className="text-xs text-dc-subtext">
                {t('doubts.uploadVoice')}
              </p>
            </div>

            {voiceError && (
              <p role="alert" className="text-xs text-rose-400 font-medium">
                {voiceError}
              </p>
            )}

            {!isRecording && !voicePreviewUrl && (
              <button
                type="button"
                onClick={startRecording}
                className="dc-btn-secondary text-xs inline-flex items-center gap-2"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-dc-red" />
                {t('doubts.recordVoice')}
              </button>
            )}

            {isRecording && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="font-mono text-rose-300 font-semibold">
                  {t('doubts.recording')} {formatSeconds(recordingDuration)} / 02:00
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="rounded bg-rose-600 px-3 py-1 font-medium text-white hover:bg-rose-500"
                  >
                    {t('doubts.stopRecording')}
                  </button>
                  <button
                    type="button"
                    onClick={deleteRecording}
                    className="text-dc-subtext hover:text-white"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {voicePreviewUrl && !isRecording && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dc-border bg-dc-bg2/40 p-3 text-xs">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium text-dc-text mb-1.5">{t('doubts.recordVoice')}:</p>
                  <audio controls src={voicePreviewUrl} className="w-full h-8" />
                </div>
                <button
                  type="button"
                  onClick={deleteRecording}
                  className="dc-btn-secondary text-xs text-rose-300 hover:text-rose-200"
                >
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-dc-border pt-4">
            <Link to="/doubts" className="dc-btn-secondary text-xs">
              {t('common.cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingFiles || isRecording}
              className="dc-btn-primary"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {t('doubts.posting')}
                </>
              ) : (
                t('doubts.postDoubt')
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

export default function NewDoubt() {
  return (
    <ProtectedRoute>
      <NewDoubtForm />
    </ProtectedRoute>
  )
}
