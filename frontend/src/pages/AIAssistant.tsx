import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  BookOpen,
  Terminal,
  Languages,
  Send,
  RefreshCw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Plus,
  Trash2,
  History,
  ExternalLink,
  AlertCircle,
  X,
  Code2,
  CheckCircle2,
  Clock
} from 'lucide-react'
import AppShell from '../layouts/AppShell'
import ContentTranslationControl from '../components/ContentTranslationControl'
import { doubtService } from '../services/doubtService'
import { AiAskResponse, AiConversation, Subject } from '../types/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { extractCleanText } from '../utils/cleanText'

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
  createdAt?: string
}

const STATIC_EXAMPLE_PROMPTS = [
  'Explain deadlock in Operating Systems.',
  'Dry-run binary search with an example.',
  'Explain normalization in DBMS.',
  'Show the time complexity of merge sort.',
  'Explain this concept in Hinglish.'
]

const FEATURE_INDICATORS = [
  { label: 'Step-by-step explanations', icon: CheckCircle2 },
  { label: 'Real Doubt-Chain context', icon: BookOpen },
  { label: 'English, Hindi & Hinglish', icon: Languages },
  { label: 'Code examples & dry runs', icon: Terminal }
]

export default function AIAssistant() {
  const { user } = useAuth()
  const { language: appLanguage } = useLanguage()

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputQuestion, setInputQuestion] = useState('')
  const [subject, setSubject] = useState('')
  const [subjectsList, setSubjectsList] = useState<Subject[]>([])
  const [mode, setMode] = useState<'beginner' | 'step-by-step' | 'example' | 'hinglish' | 'debug'>('step-by-step')
  const [responseLanguage, setResponseLanguage] = useState<'en' | 'hi' | 'hinglish'>('en')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  // History panel state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Report modal state
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState<
    'FACTUALLY_INCORRECT' | 'INCORRECT_CODE' | 'MISLEADING_EXPLANATION' | 'TRANSLATION_ISSUE' | 'OTHER'
  >('FACTUALLY_INCORRECT')
  const [reportDetails, setReportDetails] = useState('')
  const [reportingSubmitting, setReportingSubmitting] = useState(false)
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null)

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync language with app preference
  useEffect(() => {
    if (appLanguage === 'hi' || appLanguage === 'hinglish') {
      setResponseLanguage(appLanguage)
    }
  }, [appLanguage])

  // Load backend subjects for quick selection
  useEffect(() => {
    doubtService.listSubjects().then(setSubjectsList).catch(() => setSubjectsList([]))
  }, [])

  // Load conversation history from backend
  const loadHistory = () => {
    if (!user) return
    setLoadingHistory(true)
    doubtService
      .listAiConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoadingHistory(false))
  }

  useEffect(() => {
    loadHistory()
  }, [user])

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Send message or handle prompt click
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
        content: question,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
    setMessages(updatedMessages)
    setLoading(true)

    // Send bounded context history (last 8 messages)
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
        loadHistory()
      }

      const cleanAnswer = extractCleanText(response.answer)

      setMessages(prev => [
        ...prev,
        {
          id: response.messageId || `ai-${Date.now()}`,
          role: 'assistant',
          content: cleanAnswer,
          language: response.language,
          retrievedContext: response.retrievedContext,
          feedback: null,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err: any) {
      const msg = err.message || 'Unable to connect to AI Study Assistant.'
      setError(msg)
      setLastFailedQuestion(question)
      // Restore input text so user does not lose their typed question
      if (!textToSend) {
        setInputQuestion(question)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle switching to a past conversation
  const handleSelectConversation = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const conv = await doubtService.getAiConversation(id)
      setConversationId(conv.id)
      if (conv.language && (conv.language === 'en' || conv.language === 'hi' || conv.language === 'hinglish')) {
        setResponseLanguage(conv.language)
      }
      if (conv.messages) {
        setMessages(
          conv.messages.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: extractCleanText(m.content),
            retrievedContext: m.retrievedContext as any,
            feedback: m.feedback ? m.feedback.isHelpful : null,
            reported: m.reports && m.reports.length > 0,
            createdAt: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
        )
      }
      setHistoryOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation history.')
    } finally {
      setLoading(false)
    }
  }

  // Handle deleting a conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation history?')) return

    try {
      await doubtService.deleteAiConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (conversationId === id) {
        handleStartNewConversation()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation.')
    }
  }

  // Feedback (Helpful / Not Helpful)
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

  // Report modal actions
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
      }, 1500)
    } catch (err: any) {
      setReportSuccessMessage(err.message || 'Failed to submit report')
    } finally {
      setReportingSubmitting(false)
    }
  }

  // Copy code blocks
  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  // Reset to new conversation
  const handleStartNewConversation = () => {
    setMessages([])
    setConversationId(null)
    setError(null)
    setLastFailedQuestion(null)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  // Helper to render markdown-like code blocks cleanly
  const renderMessageContent = (content: string, msgId: string) => {
    const cleanContent = extractCleanText(content)
    const parts = cleanContent.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n')
        const firstLine = lines[0].trim()
        const hasLang = /^[a-zA-Z0-9_+#-]+$/.test(firstLine)
        const lang = hasLang ? firstLine : 'code'
        const codeText = hasLang ? lines.slice(1).join('\n') : lines.join('\n')
        const blockId = `${msgId}-code-${index}`

        return (
          <div
            key={index}
            className="my-3 overflow-hidden rounded-xl border border-dc-border bg-dc-bg2 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-dc-border px-3.5 py-1.5 bg-dc-card/60 text-[11px] font-mono text-dc-subtext">
              <span className="flex items-center gap-1.5 uppercase font-semibold text-dc-blue">
                <Code2 className="h-3.5 w-3.5" /> {lang}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(codeText, blockId)}
                className="flex items-center gap-1 text-dc-subtext hover:text-dc-text transition-colors"
              >
                {copiedCodeId === blockId ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-dc-text">
              <code>{codeText}</code>
            </pre>
          </div>
        )
      }

      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      )
    })
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in pb-10">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-dc-blue/40 bg-dc-blue/10 px-3 py-1 text-xs font-semibold text-dc-blue">
            <Sparkles className="h-3.5 w-3.5" />
            <span>✨ Gemini AI · Academic Assistant 2.0</span>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => setHistoryOpen(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
                  historyOpen
                    ? 'border-dc-blue bg-dc-blue/10 text-dc-text font-medium'
                    : 'border-dc-border bg-dc-card text-dc-subtext hover:border-dc-border-strong hover:text-dc-text'
                }`}
                title="View previous academic conversations"
              >
                <History className="h-3.5 w-3.5 text-dc-blue" />
                <span>History</span>
                {conversations.length > 0 && (
                  <span className="rounded-full bg-dc-blue/20 px-1.5 py-0.2 text-[10px] text-dc-blue font-semibold">
                    {conversations.length}
                  </span>
                )}
              </button>
            )}

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleStartNewConversation}
                className="flex items-center gap-1.5 rounded-xl border border-dc-border bg-dc-card px-3 py-1.5 text-xs text-dc-subtext transition-colors hover:border-dc-blue/50 hover:text-dc-text"
              >
                <Plus className="h-3.5 w-3.5 text-dc-blue" />
                <span>New Conversation</span>
              </button>
            )}
          </div>
        </div>

        {/* Redesigned Header */}
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-dc-text sm:text-3xl">
            AI Study Assistant
          </h1>
          <p className="text-sm text-dc-subtext leading-relaxed max-w-2xl">
            Understand difficult concepts, solve coding problems, explore step-by-step explanations, and learn in your preferred language.
          </p>

          {/* Compact Feature Indicators */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-dc-subtext">
            {FEATURE_INDICATORS.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-dc-blue shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Collapsible History Drawer */}
        {historyOpen && (
          <div className="rounded-2xl border border-dc-border bg-dc-card p-4 shadow-dc-card space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-dc-border pb-2.5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-dc-blue" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dc-text">
                  Recent Conversations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="text-dc-subtext hover:text-dc-text p-1"
                aria-label="Close history"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-4 text-center text-xs text-dc-subtext">Loading history...</div>
            ) : conversations.length === 0 ? (
              <div className="py-4 text-center text-xs text-dc-subtext">
                No previous conversations recorded yet. Ask a doubt below to start!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {conversations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c.id)}
                    className={`group flex items-center justify-between gap-3 rounded-xl border p-2.5 text-left cursor-pointer transition-all ${
                      conversationId === c.id
                        ? 'border-dc-blue bg-dc-blue/10 text-dc-text'
                        : 'border-dc-border bg-dc-bg2 text-dc-subtext hover:border-dc-border-strong hover:text-dc-text'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-dc-text">{c.title || 'Untitled Academic Query'}</p>
                      <p className="mt-0.5 text-[10px] text-dc-subtext flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={e => handleDeleteConversation(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-dc-subtext hover:text-dc-red transition-opacity"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compact Settings Panel (Subject, Mode, Language) */}
        <div className="dc-card p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Subject Selector */}
            <div>
              <label className="dc-label-sub">
                Course / Subject (Optional)
              </label>
              {subjectsList.length > 0 ? (
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="dc-input text-xs"
                >
                  <option value="">All Subjects (General Academic)</option>
                  {subjectsList.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems, DBMS"
                  className="dc-input text-xs"
                />
              )}
            </div>

            {/* Explanation Mode */}
            <div>
              <label className="dc-label-sub">
                Explanation Style
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value as any)}
                className="dc-input text-xs"
              >
                <option value="step-by-step">Step-by-Step Derivation</option>
                <option value="beginner">Conceptual & Intuitive</option>
                <option value="example">Real-World Examples</option>
                <option value="hinglish">Hinglish Bilingual</option>
                <option value="debug">Programming & Code Dry-Run</option>
              </select>
            </div>

            {/* Response Language */}
            <div>
              <label className="dc-label-sub">
                Response Language
              </label>
              <select
                value={responseLanguage}
                onChange={e => setResponseLanguage(e.target.value as any)}
                className="dc-input text-xs"
              >
                <option value="en">English (Standard Technical)</option>
                <option value="hi">हिन्दी (Devanagari)</option>
                <option value="hinglish">Hinglish (Roman Hindi + English)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conversation Workspace */}
        <div className="space-y-4 min-h-[300px]">
          {/* Initial Empty State */}
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dc-border bg-dc-card p-8 sm:p-10 text-center space-y-4 shadow-dc-card animate-fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dc-blue/10 text-dc-blue shadow-sm">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-dc-text">
                  What would you like to learn today?
                </h3>
                <p className="text-xs text-dc-subtext leading-relaxed">
                  Ask academic questions, explore tricky proofs, understand core algorithms, and debug programming code with adaptive step-by-step reasoning.
                </p>
              </div>

              {/* Example Prompt Chips */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-dc-subtext">
                  Suggested Questions:
                </span>
                <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                  {STATIC_EXAMPLE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="rounded-full border border-dc-border bg-dc-bg2 px-3 py-1.5 text-xs text-dc-subtext transition-all hover:border-dc-blue/50 hover:bg-dc-card hover:text-dc-text"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Conversation Messages */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-5 shadow-sm ${
                  msg.role === 'user'
                    ? 'border border-dc-blue/30 bg-dc-blue/10 text-dc-text'
                    : 'border border-dc-border bg-dc-card text-dc-text'
                }`}
              >
                {/* Assistant Message Header */}
                {msg.role === 'assistant' && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-dc-border pb-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-dc-blue/30 bg-dc-blue/10 px-2 py-0.5 text-[10px] font-semibold text-dc-blue uppercase">
                        AI-generated
                      </span>
                      {msg.language && (
                        <span className="rounded-full border border-dc-border bg-dc-bg2 px-2 py-0.5 text-[10px] text-dc-subtext">
                          {msg.language === 'hi' ? 'हिन्दी' : msg.language === 'hinglish' ? 'Hinglish' : 'English'}
                        </span>
                      )}
                      {msg.createdAt && (
                        <span className="text-[10px] text-dc-subtext">{msg.createdAt}</span>
                      )}
                    </div>
                    <ContentTranslationControl originalText={msg.content} />
                  </div>
                )}

                {/* Grounded Academic Context Card */}
                {msg.role === 'assistant' && msg.retrievedContext && msg.retrievedContext.length > 0 && (
                  <div className="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs">
                    <p className="font-semibold text-indigo-400 flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Referenced from Doubt-Chain Verified Solutions:
                    </p>
                    {msg.retrievedContext.map((ctx, i) => (
                      <div key={i} className="mt-1 space-y-1">
                        <Link
                          to={`/doubts/${ctx.doubtId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-dc-blue hover:underline inline-flex items-center gap-1"
                        >
                          • {ctx.title} ({ctx.subjectName || 'General'}) <ExternalLink className="h-3 w-3" />
                        </Link>
                        {ctx.verifiedSolution && (
                          <p className="text-[11px] text-dc-subtext italic pl-3 border-l border-indigo-400/30">
                            Verified Solution: "{ctx.verifiedSolution.slice(0, 120)}…"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed break-words text-dc-text">
                  {renderMessageContent(msg.content, msg.id)}
                </div>

                {/* Assistant Footer Actions: Feedback & Reporting */}
                {msg.role === 'assistant' && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dc-border pt-3 text-xs text-dc-subtext">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]">Was this helpful?</span>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, true)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
                          msg.feedback === true
                            ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                            : 'border border-dc-border bg-dc-bg2 hover:text-emerald-400'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>Helpful</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, false)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
                          msg.feedback === false
                            ? 'border border-dc-red/40 bg-dc-red/20 text-dc-red'
                            : 'border border-dc-border bg-dc-bg2 hover:text-dc-red'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        <span>Not helpful</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.reported ? (
                        <span className="text-[11px] text-amber-400 font-medium">Reported</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openReportModal(msg.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-dc-subtext hover:text-dc-red transition-colors"
                        >
                          <Flag className="h-3 w-3" />
                          <span>Report incorrect answer</span>
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
            <div className="flex items-start animate-fade-in">
              <div className="rounded-2xl border border-dc-border bg-dc-card p-4 text-xs text-dc-blue flex items-center gap-3 shadow-dc-card">
                <RefreshCw className="h-4 w-4 animate-spin text-dc-blue" />
                <span>Analyzing doubt and structuring step-by-step academic explanation...</span>
              </div>
            </div>
          )}

          {/* Recoverable Error & Retry */}
          {error && (
            <div className="rounded-xl border border-dc-red/30 bg-dc-red/10 p-4 text-xs text-dc-red flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              {lastFailedQuestion && (
                <button
                  type="button"
                  onClick={() => handleSendMessage(lastFailedQuestion)}
                  className="dc-btn-primary px-3 py-1 text-xs font-semibold"
                >
                  Retry Request
                </button>
              )}
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Composer Bar */}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="dc-card p-4 space-y-3 shadow-lg"
        >
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Ask an academic question or paste a code snippet... (Enter to send, Shift+Enter for new line)"
              rows={3}
              maxLength={5000}
              disabled={loading}
              className="dc-input min-h-[90px] resize-none text-sm leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dc-border">
            <span className="text-[11px] text-dc-subtext">
              {inputQuestion.length}/5000 characters · Markdown code blocks (```) supported
            </span>

            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="dc-btn-primary px-5 py-2 text-xs font-semibold shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Explain with AI</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Report Answer Modal */}
        {reportingMessageId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-dc-border bg-dc-card p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-dc-border pb-3">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-dc-red" />
                  <h3 className="text-sm font-bold text-dc-text">Report AI Response</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReportingMessageId(null)}
                  className="text-dc-subtext hover:text-dc-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {reportSuccessMessage ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 mb-1" />
                  {reportSuccessMessage}
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-dc-text mb-1">
                      Reason for Report
                    </label>
                    <select
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value as any)}
                      className="dc-input text-xs"
                    >
                      <option value="FACTUALLY_INCORRECT">Factually incorrect</option>
                      <option value="INCORRECT_CODE">Incorrect code or logic bug</option>
                      <option value="MISLEADING_EXPLANATION">Misleading academic explanation</option>
                      <option value="TRANSLATION_ISSUE">Language or translation inaccuracy</option>
                      <option value="OTHER">Other academic discrepancy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dc-text mb-1">
                      Optional details (What was incorrect?)
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={e => setReportDetails(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Explain what part was inaccurate..."
                      className="dc-input text-xs resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-dc-border">
                    <button
                      type="button"
                      onClick={() => setReportingMessageId(null)}
                      className="dc-btn-secondary px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reportingSubmitting}
                      className="dc-btn-primary px-4 py-1.5 text-xs font-semibold"
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
    </AppShell>
  )
}