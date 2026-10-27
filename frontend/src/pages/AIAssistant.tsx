import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import ContentTranslationControl from '../components/ContentTranslationControl'
import { doubtService } from '../services/doubtService'
import { AiAskResponse } from '../types/api'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  language?: 'en' | 'hi' | 'hinglish'
  retrievedContext?: Array<{
    doubtId: string
    title: string
    subjectName?: string
    verifiedSolution: string | null
    faqSummary: string | null
  }>
  feedback?: boolean | null
  reported?: boolean
}

const FOLLOW_UP_PROMPTS = [
  'Explain step 2 in more detail',
  'Can you show a dry-run with a sample input?',
  'Now explain this in Hinglish',
  'What are the edge cases and time complexity?',
  'Give another practical real-world example'
]

export default function AIAssistant() {
  const { t, language: appLanguage } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputQuestion, setInputQuestion] = useState('')
  const [subject, setSubject] = useState('')
  const [mode, setMode] = useState<'beginner' | 'step-by-step' | 'example' | 'hinglish' | 'debug'>('step-by-step')
  const [responseLanguage, setResponseLanguage] = useState<'en' | 'hi' | 'hinglish'>('en')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  // Report modal state
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState<'FACTUALLY_INCORRECT' | 'INCORRECT_CODE' | 'MISLEADING_EXPLANATION' | 'TRANSLATION_ISSUE' | 'OTHER'>('FACTUALLY_INCORRECT')
  const [reportDetails, setReportDetails] = useState('')
  const [reportingSubmitting, setReportingSubmitting] = useState(false)
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null)

  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Sync default response language with app language
  useEffect(() => {
    if (appLanguage === 'hi' || appLanguage === 'hinglish') {
      setResponseLanguage(appLanguage)
    }
  }, [appLanguage])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const modeOptions = [
    { value: 'step-by-step' as const, label: t('ai.modeStepByStep') },
    { value: 'beginner' as const, label: t('ai.modeBeginner') },
    { value: 'example' as const, label: t('ai.modeExample') },
    { value: 'hinglish' as const, label: t('ai.modeHinglish') },
    { value: 'debug' as const, label: t('ai.modeDebug') }
  ]

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputQuestion).trim()
    if (!question || loading) return

    setError(null)
    setLastFailedQuestion(null)
    setInputQuestion('')

    const userMessageId = `user-${Date.now()}`
    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        content: question
      }
    ]
    setMessages(updatedMessages)
    setLoading(true)

    // Send bounded history (last 8 messages)
    const historyPayload = updatedMessages
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const response: AiAskResponse = await doubtService.askStudyAssistant({
        question,
        subject: subject.trim() || undefined,
        mode,
        conversationId: conversationId || undefined,
        history: historyPayload,
        responseLanguage
      })

      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId)
      }

      setMessages(prev => [
        ...prev,
        {
          id: response.messageId || `ai-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          language: response.language,
          retrievedContext: response.retrievedContext,
          feedback: null
        }
      ])
    } catch (err: any) {
      const msg = err.message || 'Unable to connect to AI Study Assistant.'
      setError(msg)
      setLastFailedQuestion(question)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      await doubtService.submitAiFeedback({ messageId, isHelpful })
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, feedback: isHelpful } : m))
      )
    } catch (err) {
      console.warn('Feedback submission error:', err)
    }
  }

  const openReportModal = (messageId: string) => {
    setReportingMessageId(messageId)
    setReportReason('FACTUALLY_INCORRECT')
    setReportDetails('')
    setReportSuccessMessage(null)
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingMessageId) return

    setReportingSubmitting(true)
    try {
      const res = await doubtService.submitAiReport({
        messageId: reportingMessageId,
        reason: reportReason,
        details: reportDetails.trim() || undefined
      })
      setReportSuccessMessage(res.message || 'Report submitted for review.')
      setMessages(prev =>
        prev.map(m => (m.id === reportingMessageId ? { ...m, reported: true } : m))
      )
      setTimeout(() => {
        setReportingMessageId(null)
        setReportSuccessMessage(null)
      }, 1800)
    } catch (err: any) {
      setReportSuccessMessage(err.message || 'Failed to submit report')
    } finally {
      setReportingSubmitting(false)
    }
  }

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  const handleStartNewConversation = () => {
    setMessages([])
    setConversationId(null)
    setError(null)
    setLastFailedQuestion(null)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            ← {t('common.back')}
          </Link>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleStartNewConversation}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400 hover:text-white"
              >
                + New Conversation
              </button>
            )}
            <LanguageSelector />
          </div>
        </div>

        {/* Header */}
        <header className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            <span>✨</span>
            <span>Gemini AI · {t('ai.title')} 2.0</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t('ai.title')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('ai.subtitle')}
          </p>
        </header>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-3">
          {/* Subject (Optional) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {t('doubts.subjectLabel')}
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Data Structures, OS, DBMS"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Explanation Style */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {t('ai.selectMode')}
            </label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as any)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400"
            >
              {modeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Response Language */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Response Language
            </label>
            <select
              value={responseLanguage}
              onChange={e => setResponseLanguage(e.target.value as any)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Devanagari)</option>
              <option value="hinglish">Hinglish (Roman)</option>
            </select>
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                💡
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Ask your academic doubts</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Get adaptive step-by-step explanations, code dry-runs, and multilingual clarity.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {FOLLOW_UP_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:border-cyan-400 hover:text-white transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-5 ${
                  msg.role === 'user'
                    ? 'border border-cyan-500/30 bg-cyan-950/40 text-cyan-100'
                    : 'border border-slate-800 bg-slate-900 text-slate-200 shadow-xl'
                }`}
              >
                {/* Header for assistant message */}
                {msg.role === 'assistant' && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 uppercase">
                        AI-generated
                      </span>
                      {msg.language && (
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          {msg.language === 'hi' ? 'हिन्दी' : msg.language === 'hinglish' ? 'Hinglish' : 'English'}
                        </span>
                      )}
                    </div>
                    <ContentTranslationControl originalText={msg.content} />
                  </div>
                )}

                {/* Grounded Academic Context Card */}
                {msg.role === 'assistant' && msg.retrievedContext && msg.retrievedContext.length > 0 && (
                  <div className="mb-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs">
                    <p className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                      <span>📚</span> Referenced from Doubt-Chain Verified Solutions:
                    </p>
                    {msg.retrievedContext.map((ctx, i) => (
                      <div key={i} className="mt-1 space-y-1">
                        <Link
                          to={`/doubts/${ctx.doubtId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-dc-blue hover:underline"
                        >
                          • {ctx.title} ({ctx.subjectName || 'General'}) ↗
                        </Link>
                        {ctx.verifiedSolution && (
                          <p className="text-[11px] text-slate-300 italic pl-3 border-l border-indigo-400/40">
                            Verified Solution: "{ctx.verifiedSolution.slice(0, 120)}…"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed break-words">
                  {msg.content}
                </div>

                {/* Copy code helper if code is present in message */}
                {msg.content.includes('```') && (
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(msg.content, msg.id)}
                      className="rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                      {copiedCodeId === msg.id ? '✓ Copied' : '📋 Copy Text'}
                    </button>
                  </div>
                )}

                {/* Assistant Footer Actions: Feedback & Report */}
                {msg.role === 'assistant' && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]">Was this helpful?</span>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, true)}
                        className={`rounded px-2 py-0.5 text-xs transition-colors ${
                          msg.feedback === true
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 hover:text-emerald-300'
                        }`}
                      >
                        👍 Helpful
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, false)}
                        className={`rounded px-2 py-0.5 text-xs transition-colors ${
                          msg.feedback === false
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 hover:text-rose-300'
                        }`}
                      >
                        👎 Not helpful
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {msg.reported ? (
                        <span className="text-[11px] text-amber-400">Reported</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openReportModal(msg.id)}
                          className="text-[11px] text-slate-500 hover:text-rose-400 hover:underline"
                        >
                          Report incorrect answer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-cyan-300 flex items-center gap-3 shadow-lg">
                <svg className="h-4 w-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Analyzing doubt and structuring step-by-step explanation...</span>
              </div>
            </div>
          )}

          {/* Recoverable Error & Retry */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              {lastFailedQuestion && (
                <button
                  type="button"
                  onClick={() => handleSendMessage(lastFailedQuestion)}
                  className="rounded bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-500 transition-colors"
                >
                  Retry Request
                </button>
              )}
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Follow-up Prompts suggestions when thread is active */}
        {messages.length > 0 && !loading && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500">Follow-up suggestions:</span>
            {FOLLOW_UP_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-400 hover:border-cyan-400 hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl"
        >
          <div className="relative">
            <textarea
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              placeholder={t('ai.promptPlaceholder')}
              rows={3}
              maxLength={5000}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 disabled:opacity-60"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {inputQuestion.length}/5000
            </span>
            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t('ai.asking') : t('ai.askButton')}
            </button>
          </div>
        </form>

        {/* Report Modal */}
        {reportingMessageId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Report AI Response</h3>
                <button
                  type="button"
                  onClick={() => setReportingMessageId(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {reportSuccessMessage ? (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 text-center">
                  {reportSuccessMessage}
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Reason for Report
                    </label>
                    <select
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
                    >
                      <option value="FACTUALLY_INCORRECT">Factually incorrect</option>
                      <option value="INCORRECT_CODE">Incorrect code</option>
                      <option value="MISLEADING_EXPLANATION">Misleading explanation</option>
                      <option value="TRANSLATION_ISSUE">Language or translation issue</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Optional details (What was incorrect?)
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={e => setReportDetails(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Explain what was wrong with this answer..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-400 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setReportingMessageId(null)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reportingSubmitting}
                      className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                      {reportingSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}