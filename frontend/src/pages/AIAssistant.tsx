import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/apiClient'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import ContentTranslationControl from '../components/ContentTranslationControl'

type AIResponse = {
  answer: string
  generatedBy: string
  disclaimer: string
}

function AIAssistant() {
  const { t } = useLanguage()
  const [question, setQuestion] = useState('')
  const [subject, setSubject] = useState('')
  const [mode, setMode] = useState<'beginner' | 'step-by-step' | 'example' | 'hinglish' | 'debug'>('beginner')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const modeOptions = [
    { value: 'beginner' as const, label: t('ai.modeBeginner') },
    { value: 'step-by-step' as const, label: t('ai.modeStepByStep') },
    { value: 'example' as const, label: t('ai.modeExample') },
    { value: 'hinglish' as const, label: t('ai.modeHinglish') },
    { value: 'debug' as const, label: t('ai.modeDebug') }
  ]

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setAnswer('')

    if (!question.trim()) {
      setError('Please enter your question.')
      return
    }

    setLoading(true)

    try {
      const payload = await api.post<AIResponse>('/ai/ask', {
        question: question.trim(),
        subject: subject.trim() || undefined,
        mode
      })

      if (!payload?.answer) {
        throw new Error('The AI response was empty.')
      }

      setAnswer(payload.answer)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to get an AI response.'

      setError(
        `${message} Check that you are logged in and the backend and Gemini API are configured.`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-cyan-300 hover:text-cyan-200"
          >
            ← {t('common.back')}
          </Link>
          <LanguageSelector />
        </div>

        <header className="mb-8 mt-6">
          <div className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
            Gemini AI · {t('ai.title')}
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('ai.title')}
          </h1>

          <p className="mt-3 text-slate-400">
            {t('ai.subtitle')}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7"
        >
          <div>
            <label
              htmlFor="subject"
              className="mb-2 block text-sm font-medium"
            >
              {t('doubts.subjectLabel')} <span className="text-slate-500">({t('common.none')})</span>
            </label>

            <input
              id="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Data Structures, DBMS, Operating Systems"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"
            />
          </div>

          <div>
            <label htmlFor="mode" className="mb-2 block text-sm font-medium">
              {t('ai.selectMode')}
            </label>

            <select
              id="mode"
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as typeof mode)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            >
              {modeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="question"
              className="mb-2 block text-sm font-medium"
            >
              {t('doubts.titleLabel')}
            </label>

            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t('ai.promptPlaceholder')}
              rows={5}
              maxLength={5000}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"
            />

            <p className="mt-1 text-right text-xs text-slate-500">
              {question.length}/5000
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t('ai.asking') : t('ai.askButton')}
          </button>
        </form>

        {answer && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{t('ai.responseTitle')}</h2>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  AI-generated
                </span>
                <ContentTranslationControl originalText={answer} />
              </div>
            </div>

            <div className="whitespace-pre-wrap break-words leading-7 text-slate-200">
              {answer}
            </div>

            <p className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
              {t('ai.disclaimer')}
            </p>
          </section>
        )}
      </div>
    </main>
  )
}

export default AIAssistant