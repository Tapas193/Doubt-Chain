import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon, Laptop, CheckCircle2, Shield, User, Globe, Sparkles } from 'lucide-react'
import AppShell from '../layouts/AppShell'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme, ThemePreference } from '../context/ThemeContext'
import { replayIntro } from '../components/CinematicIntro'
import { api } from '../lib/apiClient'

export default function Settings() {
  const { user, refresh } = useAuth()
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [preferredLang, setPreferredLang] = useState<'en' | 'hi' | 'hinglish'>(language)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme)
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSavedSuccess(false)

    try {
      setLanguage(preferredLang)
      if (user) {
        await api.patch('/auth/preferences', {
          preferredLanguage: preferredLang
        })
        await refresh()
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-dc-blue">
            PREFERENCES & ACCOUNT
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-dc-text">
            Settings
          </h1>
          <p className="mt-1 text-sm text-dc-subtext">
            Manage your interface appearance, language preferences, and academic profile.
          </p>
        </div>

        {/* Appearance Settings */}
        <section className="rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-dc-blue" />
            <h2 className="text-base font-semibold text-dc-text">Interface Appearance</h2>
          </div>
          <p className="mt-1 text-xs text-dc-subtext">
            Customize how Doubt-Chain is displayed on your device.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon },
              { id: 'light', label: 'Light Mode', icon: Sun },
              { id: 'system', label: 'System Default', icon: Laptop }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleThemeChange(id as ThemePreference)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  theme === id
                    ? 'border-dc-blue bg-dc-blue/10 text-dc-text'
                    : 'border-dc-border bg-dc-bg2 text-dc-subtext hover:border-dc-border-strong hover:text-dc-text'
                }`}
              >
                <Icon className={`h-5 w-5 ${theme === id ? 'text-dc-blue' : 'text-dc-subtext'}`} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Cinematic Spider-Verse Experience */}
        <section className="rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-dc-red" />
                <h2 className="text-base font-semibold text-dc-text">Spider-Verse Cinematic Opening</h2>
              </div>
              <p className="mt-1 text-xs text-dc-subtext">
                Re-experience the 4-scene superhero opening intro, NYC skyline, and web-shoot reveal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => replayIntro()}
              className="dc-btn-primary text-xs py-2 px-4 shadow-sm shrink-0"
            >
              Replay Cinematic Intro 🕷️
            </button>
          </div>
        </section>

        {/* Language & Regional Settings */}
        <section className="rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-dc-blue" />
            <h2 className="text-base font-semibold text-dc-text">Language & Academic Regionalization</h2>
          </div>
          <p className="mt-1 text-xs text-dc-subtext">
            Choose your preferred language for navigation, discussions, and AI Study Assistant 2.0 explanations.
          </p>

          <form onSubmit={handleSavePreferences} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: 'en', title: 'English', desc: 'Standard academic terminology' },
                { id: 'hi', title: 'हिन्दी (Hindi)', desc: 'पूर्ण देवनागरी व्याख्या' },
                { id: 'hinglish', title: 'Hinglish', desc: 'English technical terms + Hindi context' }
              ].map(({ id, title, desc }) => (
                <label
                  key={id}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition-all ${
                    preferredLang === id
                      ? 'border-dc-blue bg-dc-blue/10'
                      : 'border-dc-border bg-dc-bg2 hover:border-dc-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-dc-text">{title}</span>
                    <input
                      type="radio"
                      name="preferredLanguage"
                      value={id}
                      checked={preferredLang === id}
                      onChange={() => setPreferredLang(id as any)}
                      className="text-dc-blue focus:ring-dc-blue"
                    />
                  </div>
                  <span className="mt-1 text-xs text-dc-subtext">{desc}</span>
                </label>
              ))}
            </div>

            {error && <p className="text-xs text-dc-red">{error}</p>}
            {savedSuccess && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Preferences updated successfully!
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="dc-btn-primary px-4 py-2 text-xs"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </section>

        {/* Profile Information */}
        <section className="rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-dc-blue" />
            <h2 className="text-base font-semibold text-dc-text">Authenticated Academic Profile</h2>
          </div>

          {user ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-dc-border bg-dc-bg2 p-3">
                  <span className="text-[11px] uppercase tracking-wider text-dc-subtext">Display Name</span>
                  <p className="mt-0.5 text-sm font-medium text-dc-text">{user.displayName}</p>
                </div>
                <div className="rounded-xl border border-dc-border bg-dc-bg2 p-3">
                  <span className="text-[11px] uppercase tracking-wider text-dc-subtext">Email</span>
                  <p className="mt-0.5 text-sm font-medium text-dc-text">{user.email}</p>
                </div>
                <div className="rounded-xl border border-dc-border bg-dc-bg2 p-3">
                  <span className="text-[11px] uppercase tracking-wider text-dc-subtext">Profession</span>
                  <p className="mt-0.5 text-sm font-medium text-dc-text">{user.profession || 'STUDENT'}</p>
                </div>
                <div className="rounded-xl border border-dc-border bg-dc-bg2 p-3">
                  <span className="text-[11px] uppercase tracking-wider text-dc-subtext">ID / Roll Number</span>
                  <p className="mt-0.5 text-sm font-medium text-dc-text">{user.identificationNumber || 'Not specified'}</p>
                </div>
              </div>
              <div className="pt-2">
                <Link to="/profile" className="dc-btn-secondary text-xs">
                  View Full Academic Profile →
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dc-border bg-dc-bg2 p-4 text-center">
              <Shield className="mx-auto h-6 w-6 text-dc-subtext" />
              <p className="mt-2 text-xs text-dc-subtext">
                You are currently viewing Doubt-Chain in guest mode. Sign in to link your university profile.
              </p>
              <Link to="/login" className="dc-btn-primary mt-3 inline-flex text-xs">
                Sign In to Account
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
