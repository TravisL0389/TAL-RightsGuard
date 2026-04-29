'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BarChart3,
  CheckCheck,
  CreditCard,
  FileMusic,
  FileStack,
  Files,
  FolderOpen,
  LayoutDashboard,
  Music2,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkspaceSnapshot } from '@/hooks/use-workspace-snapshot';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import type { WorkspaceMode, WorkspacePlanCode, WorkspaceSnapshotResponse } from '@/lib/saas-types';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Works', href: '/#works', icon: FolderOpen },
  { name: 'Compositions', href: '/agent', icon: FileMusic },
  { name: 'Recordings', href: '/platforms', icon: Music2 },
  { name: 'Releases', href: '/pricing', icon: CreditCard },
  { name: 'Licensing', href: '/playbooks', icon: ShieldCheck },
  { name: 'Clearance', href: '/#workflow', icon: CheckCheck },
  { name: 'Contracts', href: '/playbooks', icon: Files },
  { name: 'Evidence', href: '/#evidence', icon: FileStack },
  { name: 'Alerts', href: '/platforms', icon: Bell },
  { name: 'Analytics', href: '/pricing', icon: BarChart3 },
  { name: 'Team', href: '/agent', icon: Users },
  { name: 'Settings', href: '/pricing', icon: Settings },
];

const setupTone = {
  ready: 'border-emerald-200/20 bg-emerald-300/12 text-emerald-100',
  pending: 'border-amber-200/20 bg-amber-300/12 text-amber-100',
  missing: 'border-rose-200/20 bg-rose-300/12 text-rose-100',
} as const;

const modeTone = {
  seed: 'border-amber-200/20 bg-amber-300/12 text-amber-100',
  supabase: 'border-emerald-200/20 bg-emerald-300/12 text-emerald-100',
  azure: 'border-cyan-200/20 bg-cyan-300/12 text-cyan-100',
} as const;

function getWorkspaceModeLabel(mode?: WorkspaceMode) {
  if (mode === 'azure') {
    return 'Azure live';
  }

  if (mode === 'supabase') {
    return 'Supabase live';
  }

  return 'Seed mode';
}

function getWorkspaceModePill(mode?: WorkspaceMode) {
  if (mode === 'azure') {
    return 'Azure workspace';
  }

  if (mode === 'supabase') {
    return 'Live workspace';
  }

  return 'Seed workspace';
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${className}`}>
      {label}
    </span>
  );
}

function WorkspaceAccessCard({
  snapshot,
  reload,
}: {
  snapshot: WorkspaceSnapshotResponse | null;
  reload: () => void;
}) {
  const { supabase, isConfigured, session, user, loading } = useSupabaseAuth();
  const isAzureOwnerMode = Boolean(snapshot?.backend.azurePostgres);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState(snapshot?.workspace.workspaceName || 'RightsGuard AI');
  const [workspaceSlug, setWorkspaceSlug] = useState(snapshot?.workspace.workspaceSlug || 'rightsguard');
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlanCode>('pro');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setWorkspaceName(snapshot.workspace.workspaceName);
    setWorkspaceSlug(snapshot.workspace.workspaceSlug);
    setSelectedPlan(snapshot.workspace.plan.code);
  }, [snapshot]);

  const handleSignIn = async () => {
    if (!supabase || !email.trim() || !password.trim()) {
      setMessage('Enter email and password to sign in.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    setMessage(error ? error.message : 'Signed in. You can bootstrap the workspace now.');
    if (!error) {
      reload();
    }
  };

  const handleSignUp = async () => {
    if (!supabase || !email.trim() || !password.trim()) {
      setMessage('Enter email and password to create an account.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setBusy(false);
    setMessage(error ? error.message : 'Account created. Confirm the email if your Supabase project requires it.');
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    setMessage('Signed out.');
    reload();
  };

  const handleBootstrap = async () => {
    if (!isAzureOwnerMode && !session?.access_token) {
      setMessage('Sign in before creating the workspace.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/bootstrap-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          workspaceName,
          workspaceSlug,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Workspace bootstrap failed');
      }

      setMessage(isAzureOwnerMode ? 'Workspace bootstrapped in Azure PostgreSQL.' : 'Workspace bootstrapped in Supabase.');
      reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workspace bootstrap failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpgrade = async () => {
    if (!isAzureOwnerMode && !session?.access_token) {
      setMessage('Sign in before opening Stripe checkout.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          workspaceSlug,
          planCode: selectedPlan,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Checkout session failed');
      }

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      if (result.activated) {
        setMessage(result.message || 'Starter plan activated.');
        reload();
        return;
      }

      setMessage('Checkout session created, but no redirect URL was returned.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenPortal = async () => {
    if (!isAzureOwnerMode && !session?.access_token) {
      setMessage('Sign in before opening the billing portal.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          workspaceSlug,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Billing portal session failed');
      }

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      setMessage('Billing portal session created, but no redirect URL was returned.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open billing portal.');
    } finally {
      setBusy(false);
    }
  };

  if (!isConfigured && !isAzureOwnerMode) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Auth setup</div>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable live sign-in and workspace bootstrap.
        </p>
      </div>
    );
  }

  if (loading && !isAzureOwnerMode) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Auth setup</div>
        <p className="mt-3 text-sm leading-6 text-white/62">Checking Supabase session…</p>
      </div>
    );
  }

  if (!user && !isAzureOwnerMode) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Auth setup</div>
          <StatusPill label="Supabase ready" className="border-emerald-200/20 bg-emerald-300/12 text-emerald-100" />
        </div>
        <div className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={handleSignIn} disabled={busy} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:brightness-105 disabled:opacity-60">
              Sign in
            </button>
            <button type="button" onClick={handleSignUp} disabled={busy} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/8 disabled:opacity-60">
              Sign up
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/45">
          Create an account here, then bootstrap the first rights workspace into Supabase.
        </p>
        {message ? <p className="mt-3 text-xs leading-5 text-amber-100">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Workspace access</div>
        <StatusPill
          label={getWorkspaceModePill(snapshot?.mode)}
          className={snapshot ? modeTone[snapshot.mode] : 'border-white/10 bg-white/5 text-white/65'}
        />
      </div>
      <p className="mt-3 text-sm font-medium text-white">
        {isAzureOwnerMode ? 'Azure owner mode' : user?.email || 'Authenticated user'}
      </p>
      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={workspaceName}
          onChange={(event) => setWorkspaceName(event.target.value)}
          placeholder="Workspace name"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
        <input
          type="text"
          value={workspaceSlug}
          onChange={(event) => setWorkspaceSlug(event.target.value)}
          placeholder="Workspace slug"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
        <select
          value={selectedPlan}
          onChange={(event) => setSelectedPlan(event.target.value as WorkspacePlanCode)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="studio">Studio</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={handleBootstrap} disabled={busy} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:brightness-105 disabled:opacity-60">
            {snapshot?.mode === 'seed' ? 'Create workspace' : 'Refresh workspace'}
          </button>
          <button
            type="button"
            onClick={isAzureOwnerMode ? reload : handleSignOut}
            disabled={busy}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/8 disabled:opacity-60"
          >
            {isAzureOwnerMode ? 'Refresh snapshot' : 'Sign out'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={handleUpgrade} disabled={busy} className="rounded-2xl border border-emerald-200/20 bg-emerald-300/12 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/16 disabled:opacity-60">
            Upgrade in Stripe
          </button>
          <button type="button" onClick={handleOpenPortal} disabled={busy} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/8 disabled:opacity-60">
            Billing portal
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/45">
        {isAzureOwnerMode
          ? 'This creates the organization, owner membership, starter subscription, usage counters, and rights integration placeholders in Azure PostgreSQL.'
          : 'This creates the organization, owner membership, starter subscription, usage counters, and rights integration placeholders.'}
      </p>
      {message ? <p className="mt-3 text-xs leading-5 text-amber-100">{message}</p> : null}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { snapshot, reload } = useWorkspaceSnapshot();
  const workspace = snapshot?.workspace;
  const modeLabel = getWorkspaceModeLabel(snapshot?.mode);

  return (
    <>
      <aside className="hidden md:flex app-sidebar">
        <div className="flex min-h-0 flex-1 flex-col rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 shadow-[0_12px_30px_rgba(110,231,183,0.12)]">
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <span className="text-[2rem] font-medium tracking-tight text-white">RightsGuard AI</span>
              <div className="mt-1 flex items-center gap-2">
                <StatusPill label={modeLabel} className={snapshot ? modeTone[snapshot.mode] : 'border-white/10 bg-white/5 text-white/65'} />
              </div>
            </div>
          </div>

          <nav className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                      isActive ? 'bg-[linear-gradient(90deg,rgba(90,202,188,0.24),rgba(90,202,188,0.08))]' : 'bg-white/0 group-hover:bg-white/5'
                    }`}
                  />
                  {isActive ? (
                    <motion.div
                      layoutId="active-nav-indicator-desktop"
                      className="absolute inset-y-0 left-0 w-full rounded-2xl border border-emerald-200/12"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <item.icon className={`relative z-10 h-[18px] w-[18px] transition-transform duration-300 ${isActive ? 'text-emerald-200' : 'group-hover:scale-110'}`} />
                  <span className="relative z-10 text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[radial-gradient(circle_at_top,#ef7acb,transparent_52%),linear-gradient(180deg,#303f74,#141a2b)] shadow-[0_12px_30px_rgba(88,101,242,0.25)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{workspace?.workspaceName || 'Lunar Echoes'}</p>
                  <p className="truncate text-xs text-white/45">{workspace ? `${workspace.plan.label} plan` : 'Artist Workspace'}</p>
                </div>
              </div>
              {workspace ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/55">
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em]">Reports</div>
                    <div className="mt-1 text-sm font-medium text-white">{workspace.usage.rightsReportsUsed}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em]">MRR</div>
                    <div className="mt-1 text-sm font-medium text-white">${workspace.billing.monthlyRecurringRevenue}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[linear-gradient(180deg,#d6dbe7,#7c8798)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{workspace?.operatorName || 'Maya Rivera'}</p>
                  <p className="truncate text-xs text-white/45">{workspace?.operatorRole || 'Admin'}</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
            </div>

            {workspace ? (
              <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={workspace.setup.database === 'ready' ? 'Database wired' : 'Database pending'} className={setupTone[workspace.setup.database]} />
                  <StatusPill label={workspace.setup.billing === 'ready' ? 'Billing wired' : 'Billing pending'} className={setupTone[workspace.setup.billing]} />
                  <StatusPill label={workspace.setup.ai === 'ready' ? 'AI ready' : 'AI pending'} className={setupTone[workspace.setup.ai]} />
                </div>
              </div>
            ) : null}

            <WorkspaceAccessCard snapshot={snapshot} reload={reload} />
          </div>
        </div>
      </aside>

      <div className="mobile-topbar md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-300">
            <ShieldCheck className="h-5 w-5 text-slate-950" />
          </div>
          <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Rights workspace</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-white">RightsGuard AI</p>
                {snapshot ? <StatusPill label={snapshot.mode === 'azure' ? 'Azure' : snapshot.mode === 'supabase' ? 'Live' : 'Seed'} className={modeTone[snapshot.mode]} /> : null}
              </div>
            </div>
          </div>
      </div>

      <div className="mobile-bottom-nav md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex h-14 w-16 flex-col items-center justify-center ${isActive ? 'text-emerald-200' : 'text-white/45 hover:text-white/72'}`}
            >
              {isActive ? (
                <motion.div
                  layoutId="active-nav-indicator-mobile"
                  className="absolute -top-2 h-1 w-8 rounded-b-full bg-emerald-300"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ) : null}
              <item.icon className={`mb-1 h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
