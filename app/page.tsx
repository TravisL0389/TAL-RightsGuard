'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  FileCheck2,
  HelpCircle,
  LayoutTemplate,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useRightsWorkspaceData, createEvidenceRecord, createRightsMemo, createRightsWork, uploadEvidenceFile } from '@/hooks/use-rights-workspace-data';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useWorkspaceSnapshot } from '@/hooks/use-workspace-snapshot';
import { platformsDatabase } from '@/lib/platforms';
import type { RightsWork } from '@/lib/saas-types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const readinessChecks = [
  'Ownership Verified',
  'Documentation Complete',
  'Clearance Strong',
  'Release Ready',
];

const platformCoverage = [
  { name: 'Spotify', status: 'Monetizable', level: 'good' },
  { name: 'YouTube', status: 'Monetizable', level: 'good' },
  { name: 'Apple Music', status: 'Monetizable', level: 'good' },
  { name: 'TikTok', status: 'Limited', level: 'caution' },
  { name: 'Instagram', status: 'Limited', level: 'caution' },
];

const workflow = [
  { title: 'Composition', status: 'Completed', note: 'Mar 12, 2025' },
  { title: 'Sound Recording', status: 'In Progress', note: 'Recording evidence' },
  { title: 'Release Preparation', status: 'Pending', note: 'Clearance & licensing' },
  { title: 'Release', status: 'Pending', note: 'Distribute & protect' },
];

const jurisdictions = [
  { region: 'United States', status: 'Registered', protection: 'Life + 70 years' },
  { region: 'European Union', status: 'Registered', protection: 'Life + 70 years' },
  { region: 'United Kingdom', status: 'Registered', protection: 'Life + 70 years' },
  { region: 'Canada', status: 'Pending', protection: 'Life + 70 years' },
  { region: 'Australia', status: 'Registered', protection: 'Life + 70 years' },
];

function statusTone(status: string) {
  if (status === 'Completed' || status === 'Registered' || status === 'Monetizable') {
    return 'text-emerald-200';
  }

  if (status === 'In Progress') {
    return 'text-cyan-200';
  }

  return 'text-amber-200';
}

function relativeTime(isoDate: string) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function workAccent(workType: RightsWork['workType']) {
  switch (workType) {
    case 'composition':
      return 'from-amber-500 to-rose-400';
    case 'recording':
      return 'from-indigo-500 to-sky-400';
    case 'release':
      return 'from-fuchsia-500 to-violet-300';
    case 'agreement':
      return 'from-slate-500 to-orange-300';
    default:
      return 'from-slate-500 to-sky-400';
  }
}

export default function Dashboard() {
  const { snapshot } = useWorkspaceSnapshot();
  const { session } = useSupabaseAuth();
  const workspaceSlug = snapshot?.workspace.workspaceSlug || 'rightsguard';
  const { data: rightsData, loading: rightsLoading, error: rightsError, reload } = useRightsWorkspaceData(workspaceSlug);
  const [newWork, setNewWork] = useState({
    title: '',
    workType: 'recording' as RightsWork['workType'],
    status: 'In Progress',
    platformSource: '',
    releaseStage: '',
  });
  const [newEvidence, setNewEvidence] = useState({
    title: '',
    evidenceType: 'session',
    workId: '',
    fileUrl: '',
    file: null as File | null,
  });
  const [newMemo, setNewMemo] = useState({
    summary: '',
    workId: '',
  });
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<null | 'work' | 'evidence' | 'memo'>(null);
  const accessToken = session?.access_token ?? null;
  const score = 92;
  const scoreDegrees = Math.round((score / 100) * 360);
  const platformReview = platformsDatabase.slice(0, 5);
  const liveWorks = rightsData?.works || [];
  const liveEvidence = rightsData?.evidence || [];
  const liveMemos = rightsData?.memos || [];
  const completedEvidenceCount = Math.min(liveEvidence.length, 16);
  const evidenceCompletion = liveEvidence.length ? `${completedEvidenceCount} / 16` : '0 / 16';
  const workOptions = useMemo(
    () => liveWorks.map((work) => ({ value: work.id, label: work.title })),
    [liveWorks]
  );

  const handleCreateWork = async () => {
    if (!newWork.title.trim()) {
      setPanelMessage('Work title is required.');
      return;
    }

    setSubmitting('work');

    try {
      await createRightsWork(accessToken, {
        workspaceSlug,
        title: newWork.title,
        workType: newWork.workType,
        status: newWork.status,
        platformSource: newWork.platformSource,
        releaseStage: newWork.releaseStage,
      });
      setNewWork({
        title: '',
        workType: 'recording',
        status: 'In Progress',
        platformSource: '',
        releaseStage: '',
      });
      setPanelMessage('Rights work created.');
      reload();
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : 'Failed to create rights work.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCreateEvidence = async () => {
    if (!newEvidence.title.trim()) {
      setPanelMessage('Evidence title is required.');
      return;
    }

    setSubmitting('evidence');

    try {
      let fileUrl = newEvidence.fileUrl.trim() || undefined;

      if (newEvidence.file) {
        const upload = await uploadEvidenceFile(accessToken, {
          workspaceSlug,
          workId: newEvidence.workId || undefined,
          file: newEvidence.file,
        });
        fileUrl = upload.url;
      }

      await createEvidenceRecord(accessToken, {
        workspaceSlug,
        title: newEvidence.title,
        evidenceType: newEvidence.evidenceType,
        workId: newEvidence.workId || undefined,
        fileUrl,
      });
      setNewEvidence({
        title: '',
        evidenceType: 'session',
        workId: '',
        fileUrl: '',
        file: null,
      });
      setPanelMessage('Evidence record created.');
      reload();
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : 'Failed to create evidence.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCreateMemo = async () => {
    if (!newMemo.summary.trim()) {
      setPanelMessage('Memo summary is required.');
      return;
    }

    setSubmitting('memo');

    try {
      await createRightsMemo(accessToken, {
        workspaceSlug,
        summary: newMemo.summary,
        workId: newMemo.workId || undefined,
      });
      setNewMemo({
        summary: '',
        workId: '',
      });
      setPanelMessage('Rights memo created.');
      reload();
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : 'Failed to create memo.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="page-shell gap-3">
      <motion.section variants={itemVariants} className="flex justify-end">
        <div className="hidden items-center gap-3 md:flex">
          {[Bell, HelpCircle, Search].map((Icon, index) => (
            <button
              key={index}
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/4 text-white/65 transition hover:border-white/14 hover:bg-white/7 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 xl:grid-cols-[1.65fr_1.05fr_0.85fr]">
        <div className="overview-panel px-6 py-8 md:px-8 md:py-10">
          <div className="max-w-3xl">
            <h1 className="font-display text-[3.1rem] leading-[0.92] tracking-[-0.05em] text-white md:text-[4.7rem]">
              AI music copyright.
              <br />
              Protected. Proven. <span className="text-emerald-200">Ready.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-9 text-white/62">
              RightsGuard AI helps artists and labels prepare every work for copyright protection, licensing, and global release.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/agent" className="primary-button min-w-[168px] justify-center">
                New Work
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/playbooks" className="secondary-button min-w-[180px] justify-center">
                Run Rights Check
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="overview-card p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
            <span>Rights Readiness Score</span>
            <HelpCircle className="h-3.5 w-3.5" />
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-[176px_1fr]">
            <div
              className="relative flex h-44 w-44 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(rgba(102, 226, 191, 0.95) 0deg ${scoreDegrees}deg, rgba(255,255,255,0.12) ${scoreDegrees}deg 360deg)`,
              }}
            >
              <div className="absolute inset-[12px] rounded-full bg-[#10181c]" />
              <div className="relative z-10 text-center">
                <div className="font-display text-6xl leading-none text-white">{score}</div>
                <div className="mt-2 text-sm text-white/45">/ 100</div>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-3xl font-semibold text-emerald-200">Excellent</div>
                <p className="mt-3 max-w-xs text-sm leading-7 text-white/60">
                  Your catalog is well-prepared for protection and release.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {readinessChecks.map((check) => (
                  <div key={check} className="flex items-center gap-3 text-sm text-white/68">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/14">
                      <Check className="h-3.5 w-3.5 text-emerald-200" />
                    </span>
                    {check}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link href="/playbooks" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white">
            View Score Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overview-card p-5">
          <div className="flex items-center gap-2 text-lg font-medium text-white">
            <span>Platform Intelligence</span>
            <HelpCircle className="h-4 w-4 text-white/35" />
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm text-white/72">
            <span>High Confidence</span>
            <span className="rounded-full bg-emerald-300/14 px-2.5 py-1 text-xs font-medium text-emerald-100">87%</span>
          </div>
          <div className="mt-5 space-y-4">
            {platformCoverage.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.level === 'good' ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                  <span className="text-white/82">{item.name}</span>
                </div>
                <span className={item.level === 'good' ? 'text-emerald-200' : 'text-amber-200'}>{item.status}</span>
              </div>
            ))}
          </div>
          <Link href="/platforms" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white">
            View Full Report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section id="workflow" variants={itemVariants} className="overview-card px-5 py-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Your Workflow</div>
            <div className="relative mt-8">
              <div className="absolute left-0 right-0 top-5 hidden h-px bg-white/10 xl:block" />
              <div className="grid gap-6 xl:grid-cols-4">
                {workflow.map((step, index) => (
                  <div key={step.title} className="relative flex items-start gap-4 xl:flex-col xl:gap-5">
                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      index < 2
                        ? 'border-emerald-200/28 bg-emerald-300/12 text-emerald-200'
                        : 'border-white/12 bg-white/5 text-white/35'
                    }`}>
                      {index === 0 ? <Check className="h-5 w-5" /> : <LayoutTemplate className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-lg font-medium text-white">{index + 1}. {step.title}</div>
                      <div className={`mt-1 text-sm ${statusTone(step.status)}`}>{step.status}</div>
                      <div className="mt-1 text-sm text-white/42">{step.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link href="/playbooks" className="secondary-button self-start xl:self-center">
            View Workflow
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 xl:grid-cols-[1fr_1.35fr_1.1fr]">
        <div className="overview-card p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
            <span>Jurisdiction Snapshot</span>
            <HelpCircle className="h-3.5 w-3.5" />
          </div>
          <p className="mt-2 text-sm text-white/45">Protection status across key regions</p>
          <div className="relative mt-5 h-44 overflow-hidden rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_20%_30%,rgba(102,226,191,0.18),transparent_16%),radial-gradient(circle_at_58%_34%,rgba(102,226,191,0.12),transparent_10%),radial-gradient(circle_at_84%_78%,rgba(102,226,191,0.18),transparent_10%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="absolute left-[8%] top-[32%] h-12 w-24 rounded-[48%] bg-white/12 blur-[2px]" />
            <div className="absolute left-[29%] top-[52%] h-7 w-10 rounded-[48%] bg-white/10 blur-[1px]" />
            <div className="absolute left-[48%] top-[26%] h-8 w-12 rounded-[48%] bg-white/10 blur-[1px]" />
            <div className="absolute left-[56%] top-[45%] h-11 w-10 rounded-[46%] bg-white/10 blur-[1px]" />
            <div className="absolute left-[76%] top-[66%] h-7 w-12 rounded-[48%] bg-white/12 blur-[1px]" />
            <div className="absolute left-[11%] top-[30%] h-16 w-32 rounded-[48%] bg-emerald-300/25 blur-xl" />
            <div className="absolute left-[48%] top-[27%] h-12 w-16 rounded-[48%] bg-emerald-300/20 blur-lg" />
            <div className="absolute left-[75%] top-[69%] h-7 w-14 rounded-[48%] bg-emerald-300/20 blur-lg" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-[1.45fr_0.9fr_1fr] gap-3 text-[11px] uppercase tracking-[0.18em] text-white/35">
              <span>Jurisdiction</span>
              <span>Status</span>
              <span>Protection</span>
            </div>
            {jurisdictions.map((item) => (
              <div key={item.region} className="grid grid-cols-[1.45fr_0.9fr_1fr] gap-3 text-sm text-white/72">
                <span>{item.region}</span>
                <span className={statusTone(item.status)}>{item.status}</span>
                <span className="text-white/58">{item.protection}</span>
              </div>
            ))}
          </div>
          <Link href="/playbooks" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white">
            View All Jurisdictions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div id="works" className="overview-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-medium text-white">Recent Works</div>
            </div>
            <Link href="/playbooks" className="text-sm text-emerald-200 hover:text-white">
              View All
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-[2fr_0.8fr_0.95fr_0.7fr] gap-3 text-[11px] uppercase tracking-[0.18em] text-white/35">
              <span>Title</span>
              <span>Type</span>
              <span>Status</span>
              <span>Updated</span>
            </div>
            {liveWorks.map((work) => (
              <div key={work.id} className="grid grid-cols-[2fr_0.8fr_0.95fr_0.7fr] gap-3 border-t border-white/7 pt-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${workAccent(work.workType)}`} />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{work.title}</div>
                    <div className="truncate text-xs text-white/40">{work.platformSource || work.releaseStage || 'Rights workspace item'}</div>
                  </div>
                </div>
                <span className="self-center capitalize text-white/68">{work.workType}</span>
                <span className={`self-center ${statusTone(work.status)}`}>{work.status}</span>
                <span className="self-center text-white/45">{relativeTime(work.createdAt)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Create new work</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newWork.title}
                onChange={(event) => setNewWork((current) => ({ ...current, title: event.target.value }))}
                placeholder="Track or project title"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
              <select
                value={newWork.workType}
                onChange={(event) => setNewWork((current) => ({ ...current, workType: event.target.value as RightsWork['workType'] }))}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
              >
                <option value="composition">Composition</option>
                <option value="recording">Recording</option>
                <option value="release">Release</option>
                <option value="agreement">Agreement</option>
              </select>
              <input
                value={newWork.platformSource}
                onChange={(event) => setNewWork((current) => ({ ...current, platformSource: event.target.value }))}
                placeholder="Platform source"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
              <input
                value={newWork.releaseStage}
                onChange={(event) => setNewWork((current) => ({ ...current, releaseStage: event.target.value }))}
                placeholder="Release stage"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={handleCreateWork} disabled={submitting === 'work'} className="primary-button">
                {submitting === 'work' ? 'Creating…' : 'Create work'}
              </button>
            </div>
          </div>
          <Link href="/playbooks" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white">
            Go to Works
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div id="evidence" className="overview-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-2xl font-medium text-white">
                <span>Legal Evidence Checklist</span>
                <HelpCircle className="h-4 w-4 text-white/35" />
              </div>
              <p className="mt-2 text-sm text-white/45">Complete and verify the evidence for this work.</p>
            </div>
            <div className="text-xl text-white">{completedEvidenceCount} <span className="text-white/35">/ 16</span></div>
          </div>
          <div className="mt-5 space-y-1">
            {liveEvidence.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 border-t border-white/7 py-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-white/45">
                    <FileCheck2 className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-white/84">{item.title}</div>
                    <div className="text-xs text-white/40">{item.workTitle ? `${item.evidenceType} for ${item.workTitle}` : item.evidenceType}</div>
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-xs text-emerald-200 transition hover:text-white"
                      >
                        Open file
                      </a>
                    ) : null}
                  </div>
                </div>
                <span className="mt-0.5 text-emerald-200">
                  <Check className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Add evidence</div>
            <div className="mt-4 grid gap-3">
              <input
                value={newEvidence.title}
                onChange={(event) => setNewEvidence((current) => ({ ...current, title: event.target.value }))}
                placeholder="Evidence title"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={newEvidence.evidenceType}
                  onChange={(event) => setNewEvidence((current) => ({ ...current, evidenceType: event.target.value }))}
                  placeholder="Evidence type"
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
                <select
                  value={newEvidence.workId}
                  onChange={(event) => setNewEvidence((current) => ({ ...current, workId: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="">Attach later</option>
                  {workOptions.map((work) => (
                    <option key={work.value} value={work.value}>{work.label}</option>
                  ))}
                </select>
              </div>
              <input
                value={newEvidence.fileUrl}
                onChange={(event) => setNewEvidence((current) => ({ ...current, fileUrl: event.target.value }))}
                placeholder="File URL (optional)"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
              <label className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-3 text-sm text-white/72">
                <span className="block text-[11px] uppercase tracking-[0.18em] text-white/35">Upload file to Azure Blob</span>
                <input
                  type="file"
                  onChange={(event) =>
                    setNewEvidence((current) => ({
                      ...current,
                      file: event.target.files?.[0] || null,
                    }))
                  }
                  className="mt-3 block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-emerald-300/14 file:px-3 file:py-2 file:text-xs file:font-medium file:text-emerald-100"
                />
                <span className="mt-2 block text-xs text-white/42">
                  {newEvidence.file ? `Selected: ${newEvidence.file.name}` : 'Optional. If selected, this uploads before the evidence record is saved.'}
                </span>
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={handleCreateEvidence} disabled={submitting === 'evidence'} className="primary-button">
                {submitting === 'evidence' ? 'Saving…' : 'Add evidence'}
              </button>
            </div>
          </div>
          <Link href="/playbooks" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white">
            View Evidence Vault
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="overview-strip flex flex-col gap-5 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/18 bg-emerald-300/10 text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-medium text-white">Secure your rights before you release.</div>
            <p className="mt-1 text-sm text-white/48">
              Run a final Rights Check to identify any gaps and reduce takedown or claim risk.
            </p>
          </div>
        </div>
        <Link href="/agent" className="primary-button self-start md:self-auto">
          Run Rights Check
          <ShieldCheck className="h-4 w-4" />
        </Link>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 xl:grid-cols-2">
        <div className="overview-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-medium text-white">Rights Memos</div>
              <p className="mt-2 text-sm text-white/45">Saved release-readiness notes tied to actual works.</p>
            </div>
            <div className="text-sm text-white/45">{rightsLoading ? 'Loading…' : `${liveMemos.length} saved`}</div>
          </div>
          <div className="mt-5 space-y-4">
            {liveMemos.map((memo) => (
              <div key={memo.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-100">{memo.workTitle || 'General rights memo'}</div>
                  <div className="text-xs text-white/35">{relativeTime(memo.createdAt)}</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/68">{memo.summary}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Draft a memo</div>
            <div className="mt-4 grid gap-3">
              <select
                value={newMemo.workId}
                onChange={(event) => setNewMemo((current) => ({ ...current, workId: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
              >
                <option value="">General workspace memo</option>
                {workOptions.map((work) => (
                  <option key={work.value} value={work.value}>{work.label}</option>
                ))}
              </select>
              <textarea
                value={newMemo.summary}
                onChange={(event) => setNewMemo((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Summarize the rights position, evidence gaps, or release watchouts..."
                className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={handleCreateMemo} disabled={submitting === 'memo'} className="primary-button">
                {submitting === 'memo' ? 'Saving…' : 'Save memo'}
              </button>
            </div>
          </div>
        </div>

        {platformReview.map((platform) => (
          <div key={platform.id} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-medium text-white">{platform.name}</div>
                <div className="mt-1 text-sm text-white/42">{platform.bestFor}</div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/52">
                {platform.riskLevel} risk
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/58">{platform.analysisNotes}</p>
          </div>
        ))}
      </motion.section>

      {panelMessage || rightsError || rightsData?.warnings?.[0] ? (
        <motion.section variants={itemVariants} className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4 text-sm text-white/68">
          {panelMessage || rightsError || rightsData?.warnings?.[0]}
          {rightsLoading ? <span className="ml-2 text-white/35">Refreshing workspace data…</span> : null}
          {!rightsLoading ? <span className="ml-2 text-white/35">{evidenceCompletion} evidence checkpoints represented.</span> : null}
        </motion.section>
      ) : null}
    </motion.div>
  );
}
