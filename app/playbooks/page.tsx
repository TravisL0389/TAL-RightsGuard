import Link from 'next/link';
import { ArrowRight, ClipboardList, FileText, ShieldCheck } from 'lucide-react';
import { playbookSections, templateCards } from '@/lib/rights-data';

export default function PlaybooksPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Operational playbooks</div>
          <h1 className="page-title">Turn copyright uncertainty into a repeatable release process.</h1>
          <p className="page-subtitle max-w-3xl">
            These playbooks focus on the missing work around AI music releases: intake, authorship framing, paperwork, and clean disclosures for distributors, labels, and counsel.
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="surface-panel p-6">
          <div className="flex items-center gap-2 text-emerald-100">
            <ClipboardList className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">Core operating system</span>
          </div>
          <div className="mt-6 grid gap-5">
            {playbookSections.map((section) => (
              <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/64">{section.summary}</p>
                <ul className="mt-4 grid gap-3 text-sm text-white/72">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="surface-panel p-6">
            <div className="flex items-center gap-2 text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Release packet</span>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-white/68">
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Track intake summary with platform, plan tier, terms URL, and creation date.</p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Human-authorship summary listing lyrics, performances, production, and post-generation edits.</p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Contributor paperwork: split sheets, vocalist releases, work-for-hire confirmations, and assignment language.</p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Release disclosure note for distributors, labels, or counsel when AI-generated material was involved.</p>
            </div>
          </div>

          <div className="surface-panel p-6">
            <div className="flex items-center gap-2 text-emerald-100">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Useful templates</span>
            </div>
            <div className="mt-5 space-y-4">
              {templateCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <h2 className="text-base font-semibold text-white">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/62">{card.detail}</p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 font-mono text-xs leading-6 text-emerald-100/88">
                    {card.snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta-panel">
        <div>
          <div className="eyebrow">Need case-specific guidance?</div>
          <h2 className="section-title">Run the playbook through the agent with your exact platform and release facts.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            When a rights question gets specific, the best next step is to combine the playbook with the live platform review and your actual evidence trail.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/agent" className="primary-button">
            Open the agent
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/platforms" className="secondary-button">
            Compare platforms
          </Link>
        </div>
      </section>
    </div>
  );
}
