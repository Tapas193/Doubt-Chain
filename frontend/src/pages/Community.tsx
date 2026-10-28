import { Link } from 'react-router-dom'
import { Users, Clock, ChevronRight } from 'lucide-react'
import AppShell from '../layouts/AppShell'

interface Mentor {
  name: string
  role: string
  subjectCode: string
  expertise: string[]
  hours: string
  isFaculty?: boolean
}

const mentors: Mentor[] = [
  {
    name: 'Prof. S. Mehta',
    role: 'Course Instructor · Data Structures',
    subjectCode: 'CS201',
    expertise: ['Trees', 'Graphs', 'Algorithm Analysis'],
    hours: 'Tues & Thurs · 4:00 PM',
    isFaculty: true
  },
  {
    name: 'Arjun Verma',
    role: 'Peer Mentor · 3rd Year CSE',
    subjectCode: 'CS201',
    expertise: ['Data Structures', 'Discrete Mathematics'],
    hours: 'Available for peer questions'
  },
  {
    name: 'Meera Kulkarni',
    role: 'Peer Mentor · 4th Year CSE',
    subjectCode: 'CS314',
    expertise: ['Operating Systems', 'Concurrency', 'Deadlocks'],
    hours: 'Office hours · Friday 5:30 PM'
  }
]

export default function Community() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-dc-blue">
            PEER LEARNING & ACADEMIC SUPPORT
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-dc-text">
            Community & Mentors
          </h1>
          <p className="mt-1 text-sm text-dc-subtext">
            Connect with course mentors, faculty office hours, and peer discussion leads.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-dc-border bg-dc-card p-4 text-xs text-dc-subtext">
          <Users className="h-5 w-5 text-dc-blue shrink-0" />
          <span>
            Peer mentors are vetted academic contributors and teaching assistants. All course doubts and accepted solutions are publicly accessible across enrolled cohorts.
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map(m => (
            <div
              key={m.name}
              className="flex flex-col justify-between rounded-xl border border-dc-border bg-dc-card p-5 transition-all hover:border-dc-blue/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-dc-blue/10 text-sm font-bold text-dc-blue">
                    {m.name.split(' ').map(x => x[0]).join('').replace('.', '').slice(0, 2)}
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      m.isFaculty ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {m.isFaculty ? 'Faculty' : 'Peer Mentor'}
                  </span>
                </div>

                <h2 className="mt-3 text-base font-semibold text-dc-text">{m.name}</h2>
                <p className="text-xs text-dc-subtext">{m.role}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.expertise.map(t => (
                    <span key={t} className="rounded bg-dc-bg2 px-2 py-0.5 text-[10px] text-dc-subtext border border-dc-border">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-dc-border pt-3">
                <div className="flex items-center gap-1.5 text-xs text-dc-subtext">
                  <Clock className="h-3.5 w-3.5 text-dc-blue" />
                  <span>{m.hours}</span>
                </div>
                <Link
                  to="/doubts"
                  className="mt-3 flex items-center justify-between rounded-lg border border-dc-border bg-dc-bg2/40 px-3 py-1.5 text-xs font-medium text-dc-text transition-colors hover:border-dc-blue hover:text-dc-blue"
                >
                  <span>Explore Questions</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
