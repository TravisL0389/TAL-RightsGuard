'use client';

import { useState, useEffect } from 'react';
import { platformsDatabase, Platform } from '@/lib/platforms';
import { AlertCircle, Database, ExternalLink, Filter, Loader2, Plus, Search, Wand2, X } from 'lucide-react';
import { motion } from 'motion/react';

const riskFilters: Array<'all' | Platform['riskLevel']> = ['all', 'lower', 'moderate', 'higher'];

export default function PlatformsPage() {
  const [customPlatforms, setCustomPlatforms] = useState<Platform[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'all' | Platform['riskLevel']>('all');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Load custom platforms from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('custom_platforms');
    if (stored) {
      try {
        setCustomPlatforms(JSON.parse(stored));
      } catch {
        console.error('Failed to parse custom platforms');
      }
    }
  }, []);

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newName.trim()) {
      setError('Platform name is required.');
      return;
    }
    if (!newUrl.trim()) {
      setError('Website URL is required.');
      return;
    }
    if (!isValidUrl(newUrl.trim())) {
      setError('Please enter a valid HTTP or HTTPS URL.');
      return;
    }
    if (!newNotes.trim()) {
      setError('Analysis notes are required.');
      return;
    }

    const newPlatform: Platform = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      url: newUrl.trim(),
      analysisNotes: newNotes.trim(),
      commercialUse: 'Verify current plan language directly on the platform.',
      ownershipPosition: 'Treat the generated audio as license-bound unless the terms state otherwise.',
      humanAuthorshipNote: 'Strengthen your position with original lyrics, new performances, and substantial DAW edits.',
      watchouts: ['Terms may change frequently', 'Confirm commercial limits', 'Keep a creation-time terms snapshot'],
      evidenceToKeep: 'Terms snapshot, prompt log, lyric drafts, and post-generation edits.',
      riskLevel: 'moderate',
      bestFor: 'Custom analysis pending counsel review.',
      lastReviewed: 'User-added record',
    };

    const updatedPlatforms = [...customPlatforms, newPlatform];
    setCustomPlatforms(updatedPlatforms);
    localStorage.setItem('custom_platforms', JSON.stringify(updatedPlatforms));

    // Reset form
    setNewName('');
    setNewUrl('');
    setNewNotes('');
    setError('');
    setIsAdding(false);
  };

  const handleAutoAnalyze = async () => {
    setError('');
    if (!newUrl.trim()) {
      setError("Please enter a valid Website URL first.");
      return;
    }
    if (!isValidUrl(newUrl.trim())) {
      setError("Please enter a valid HTTP or HTTPS URL before analyzing.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/platform-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to analyze the URL.');
      }

      if (payload.summary) {
        setNewNotes(payload.summary);
      } else {
        setError("Could not generate analysis. Please enter notes manually.");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze the URL. The site might be blocking access, or the URL is invalid. Please enter notes manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const allPlatforms = [...platformsDatabase, ...customPlatforms];
  const filteredPlatforms = allPlatforms.filter((platform) => {
    const matchesRisk = selectedRisk === 'all' || platform.riskLevel === selectedRisk;
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      platform.name.toLowerCase().includes(search) ||
      platform.analysisNotes.toLowerCase().includes(search) ||
      platform.bestFor.toLowerCase().includes(search);

    return matchesRisk && matchesSearch;
  });

  return (
    <div className="page-shell">
      <div className="page-header flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="eyebrow">Platform intelligence</div>
          <h1 className="page-title flex items-center gap-3">
            <Database className="h-8 w-8 text-emerald-200" />
            AI music platform database
          </h1>
          <p className="page-subtitle max-w-3xl">
            Compare commercial usage rules, ownership posture, and release watchouts across the tools creators use most. Then analyze any custom platform directly from its live terms.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setError('');
            }}
            className="secondary-button"
          >
            {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isAdding ? 'Cancel' : 'Analyze a platform'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-300/18 bg-amber-300/10 p-5 mb-8 flex items-start space-x-3 text-amber-100">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm leading-relaxed">
          <strong>Disclaimer:</strong> Terms of Service change frequently. The analysis notes below are general summaries based on standard platform practices. Always verify current terms directly on the platform or consult the AI Rights Agent for real-time analysis.
        </p>
      </div>

      {isAdding && (
        <form onSubmit={handleAddPlatform} className="surface-panel mb-8 animate-in fade-in slide-in-from-top-4 duration-300 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Analyze a custom platform</h2>
          
          {error && (
            <div className="mb-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-white/70">Platform Name</label>
              <input
                id="name"
                type="text"
                required
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(''); }}
                placeholder="e.g., MyCustomAI"
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="url" className="mb-1 block text-sm font-medium text-white/70">Website URL</label>
              <div className="flex space-x-2">
                <input
                  id="url"
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => { setNewUrl(e.target.value); setError(''); }}
                  placeholder="https://..."
                  className="field-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAutoAnalyze}
                  disabled={isAnalyzing || !newUrl.trim()}
                  aria-label="Auto-analyze Terms of Service"
                  className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 font-medium text-emerald-100 transition-colors hover:bg-emerald-300/18 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Auto-analyze Terms of Service"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-white/70">Analysis Notes</label>
              <textarea
                id="notes"
                required
                rows={5}
                value={newNotes}
                onChange={(e) => { setNewNotes(e.target.value); setError(''); }}
                placeholder="Briefly describe the copyright terms, commercial usage rights, and ownership rules..."
                className="field-input min-h-[140px] w-full resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="primary-button"
            >
              Save Platform
            </button>
          </div>
        </form>
      )}

      <div className="surface-panel mb-8 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by platform, rights model, or best use case"
              className="field-input w-full pl-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {riskFilters.map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => setSelectedRisk(risk)}
                className={`rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition ${
                  selectedRisk === risk
                    ? 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100'
                    : 'border-white/10 bg-white/5 text-white/45 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  {risk === 'all' ? 'All risk bands' : `${risk} risk`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {filteredPlatforms.map((platform, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            key={platform.id} 
            className="surface-panel flex flex-col p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">{platform.name}</h2>
                  {platform.id.startsWith('custom-') && (
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                      Custom
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-white/56">{platform.bestFor}</p>
              </div>
              <a 
                href={platform.url} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`Visit ${platform.name} website`}
                className="rounded-2xl border border-white/10 bg-white/6 p-2 text-emerald-100 transition hover:bg-white/10 hover:text-white"
                title={`Visit ${platform.name}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
                {platform.riskLevel} risk
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
                {platform.lastReviewed}
              </span>
            </div>

            <div className="grid gap-4 text-sm text-white/68">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <span className="block text-xs font-medium uppercase tracking-[0.22em] text-white/35">Rights snapshot</span>
                <p className="mt-3 leading-6">{platform.analysisNotes}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <span className="block text-xs font-medium uppercase tracking-[0.22em] text-white/35">Commercial use</span>
                  <p className="mt-3 leading-6">{platform.commercialUse}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <span className="block text-xs font-medium uppercase tracking-[0.22em] text-white/35">Ownership posture</span>
                  <p className="mt-3 leading-6">{platform.ownershipPosition}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <span className="block text-xs font-medium uppercase tracking-[0.22em] text-white/35">Human-authorship lever</span>
                <p className="mt-3 leading-6">{platform.humanAuthorshipNote}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <span className="block text-xs font-medium uppercase tracking-[0.22em] text-white/35">Watchouts</span>
                  <ul className="mt-3 space-y-2">
                    {platform.watchouts.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <span className="block text-xs font-medium uppercase tracking-[0.22em] text-white/35">Evidence to keep</span>
                  <p className="mt-3 leading-6">{platform.evidenceToKeep}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
