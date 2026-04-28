import { Chat } from '@/components/chat';
import { evidenceChecklist, quickPrompts } from '@/lib/rights-data';
import { FileStack, MessageSquareQuote, ShieldCheck } from 'lucide-react';

export default function AgentPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Rights counsel copilot</div>
          <h1 className="page-title">AI Rights Agent</h1>
          <p className="page-subtitle max-w-3xl">
            Bring in a platform name, a terms URL, or the exact way you built the track. The agent will separate licensing from ownership and tell you what evidence you still need.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_2fr]">
        <section className="surface-panel p-6">
          <div className="flex items-center gap-2 text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">What the agent is best at</span>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-white/70">
            <p>Separating composition claims, master recording claims, and platform license restrictions.</p>
            <p>Checking whether your release packet is strong enough for distributors, labels, or counsel review.</p>
            <p>Explaining what to disclaim if you later pursue registration in a human-authorship framework.</p>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-white">
              <MessageSquareQuote className="h-4 w-4 text-emerald-200" />
              <h2 className="text-sm font-semibold">Strong prompt starters</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-white/68">
              {quickPrompts.slice(0, 3).map((prompt) => (
                <li key={prompt} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {prompt}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-white">
              <FileStack className="h-4 w-4 text-emerald-200" />
              <h2 className="text-sm font-semibold">Evidence the agent will ask about</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {evidenceChecklist.slice(0, 4).map((item) => (
                <li key={item.title} className="text-sm text-white/68">
                  <span className="font-medium text-white">{item.title}</span>
                  <p className="mt-1 leading-6">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="surface-panel min-h-[720px] overflow-hidden">
          <Chat />
        </section>
      </div>
    </div>
  );
}
