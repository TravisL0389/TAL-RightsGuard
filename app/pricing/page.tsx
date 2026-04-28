'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { pricingFaq, pricingTiers } from '@/lib/rights-data';

export default function PricingPage() {
  const [billingMode, setBillingMode] = useState<'monthly' | 'annual'>('monthly');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="page-shell">
      <div className="page-header text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-emerald-100">
          <Sparkles className="h-3.5 w-3.5" />
          Pricing and workflow tiers
        </div>
        <h1 className="page-title mt-5">Choose the level of rights support your release process actually needs.</h1>
        <p className="page-subtitle mx-auto max-w-3xl">
          Built for artists validating a single track, creators releasing regularly, and studios that need more structured evidence packaging.
        </p>

        <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setBillingMode('monthly')}
            className={`rounded-full px-4 py-2 text-sm transition ${
              billingMode === 'monthly' ? 'bg-white text-slate-950' : 'text-white/65'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingMode('annual')}
            className={`rounded-full px-4 py-2 text-sm transition ${
              billingMode === 'annual' ? 'bg-white text-slate-950' : 'text-white/65'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {pricingTiers.map((tier, index) => {
          const price = billingMode === 'monthly' ? tier.monthly : tier.annual;
          return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            key={tier.name}
            className={`surface-panel relative flex flex-col p-8 transition-all duration-300 hover:-translate-y-1 ${
              tier.featured 
                ? 'border-emerald-300/20 bg-gradient-to-br from-emerald-300/12 to-cyan-300/10' 
                : ''
            }`}
          >
            {tier.featured && (
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-950 shadow-sm">
                Most popular
              </div>
            )}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.22em] text-white/42">{tier.audience}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{tier.name}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{tier.description}</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-semibold text-white">{price === 0 ? '$0' : `$${price}`}</span>
              <span className="ml-2 text-sm text-white/45">{price === 0 ? 'always free' : billingMode === 'monthly' ? '/month' : '/month billed annually'}</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="mr-3 h-5 w-5 shrink-0 text-emerald-200" />
                  <span className="text-sm leading-6 text-white/68">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Link href={tier.href} className={tier.featured ? 'primary-button w-full justify-center' : 'secondary-button w-full justify-center'}>
              {tier.cta}
            </Link>
          </motion.div>
        )})}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-panel p-6">
          <div className="eyebrow">What changes at higher tiers</div>
          <h2 className="section-title">The product grows with the complexity of the release workflow.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-base font-semibold text-white">Starter</h3>
              <p className="mt-2 text-sm leading-6 text-white/66">Best when you need clarity on one track and a cleaner understanding of rights boundaries.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-base font-semibold text-white">Pro</h3>
              <p className="mt-2 text-sm leading-6 text-white/66">Best when you release often and want a repeatable system for evidence, terms review, and registration prep.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-base font-semibold text-white">Studio</h3>
              <p className="mt-2 text-sm leading-6 text-white/66">Best when multiple collaborators, rosters, or label stakeholders need the same rights story told consistently.</p>
            </div>
          </div>
        </section>

        <section className="surface-panel p-6">
          <div className="eyebrow">FAQ</div>
          <h2 className="section-title">Straight answers before you commit.</h2>
          <div className="mt-6 space-y-4">
            {pricingFaq.map((item) => (
              <div key={item.question} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-base font-semibold text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-white/64">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
