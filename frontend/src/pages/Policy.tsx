import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, BookOpen, Lock, Scale, Building2 } from 'lucide-react'
import AppShell from '../layouts/AppShell'

const policyData: Record<string, { title: string; icon: typeof ShieldCheck; text: string; details: string[] }> = {
  ethics: {
    title: 'Academic Ethics & Integrity Policy',
    icon: Scale,
    text: 'Doubt-Chain is designed to promote genuine conceptual understanding, collaborative learning, and transparent peer discussion.',
    details: [
      'Honor Code: Questions should demonstrate an effort to understand core course materials rather than requesting direct answers for active examinations or graded assessments.',
      'Attribution: Always attribute external sources, academic textbooks, research papers, and faculty lecture notes when explaining complex derivations or code.',
      'Collaborative Explanations: Solutions should explain the underlying algorithms and principles, providing step-by-step reasoning rather than unverified shortcuts.'
    ]
  },
  privacy: {
    title: 'Privacy & Data Governance Policy',
    icon: Lock,
    text: 'We protect academic identities and discussion threads with strict credential isolation and role-based permissions.',
    details: [
      'Credential Security: Passwords and sensitive session tokens are never stored in browser localStorage; sessions use secure HTTP-only cookies with SameSite protection.',
      'Audit Logs: Course administrators and instructors maintain oversight on subject discussion boards to prevent abuse or violation of university policies.',
      'Data Portability: Students retain ownership of their original explanations, questions, and learning track contributions.'
    ]
  },
  licensing: {
    title: 'Course Materials & Research Licensing',
    icon: BookOpen,
    text: 'Institutional curriculum resources and lecture materials remain under the intellectual property rights of the respective university departments.',
    details: [
      'Fair Use: Discussion of problem sets and syllabus topics is permitted under educational fair use guidelines.',
      'Third-Party Code: Open source libraries and research implementations shared in answers must comply with their respective MIT, Apache 2.0, or BSD licenses.',
      'Non-Commercial: Doubt-Chain academic materials may not be scraped or redistributed for commercial coaching without explicit faculty authorization.'
    ]
  },
  'university-directory': {
    title: 'University Directory & Identity Integration',
    icon: Building2,
    text: 'Campus identity verification links enrolled students and faculty to authenticated subject boards.',
    details: [
      'Role Verification: Faculty and Peer Mentors receive verified department badges upon authentication.',
      'Cohort Access: Join codes are unique per academic semester and subject board to prevent unauthorized access.',
      'Privacy First: Student contact information is never disclosed publicly on open discussion boards.'
    ]
  }
}

export default function Policy() {
  const { slug = 'privacy' } = useParams<{ slug?: string }>()
  const policy = policyData[slug] || {
    title: 'Policy Information',
    icon: ShieldCheck,
    text: 'The requested policy document is being updated in accordance with university academic standards.',
    details: ['Please contact your department coordinator for formal guidelines.']
  }

  const Icon = policy.icon

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <Link to="/welcome" className="inline-flex items-center gap-1.5 text-xs text-dc-subtext hover:text-dc-text">
          <ArrowLeft className="h-4 w-4" /> About Doubt-Chain
        </Link>

        <div className="rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-dc-blue">
                DOUBT-CHAIN ACADEMIC PROTOCOL
              </span>
              <h1 className="text-xl font-bold text-dc-text">{policy.title}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-dc-subtext leading-relaxed">{policy.text}</p>
        </div>

        <div className="space-y-3">
          {policy.details.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-dc-border bg-dc-card p-4">
              <p className="text-xs text-dc-subtext leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link to="/policy/ethics" className="dc-btn-secondary text-xs">
            Academic Ethics
          </Link>
          <Link to="/policy/privacy" className="dc-btn-secondary text-xs">
            Privacy Policy
          </Link>
          <Link to="/policy/licensing" className="dc-btn-secondary text-xs">
            Research Licensing
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
