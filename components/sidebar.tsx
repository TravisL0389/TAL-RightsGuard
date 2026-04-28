'use client';

import Link from 'next/link';
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex app-sidebar">
        <div className="flex min-h-0 flex-1 flex-col rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 shadow-[0_12px_30px_rgba(110,231,183,0.12)]">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <span className="text-[2rem] font-medium tracking-tight text-white">RightsGuard AI</span>
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
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                    isActive ? 'bg-[linear-gradient(90deg,rgba(90,202,188,0.24),rgba(90,202,188,0.08))]' : 'bg-white/0 group-hover:bg-white/5'
                  }`} />
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator-desktop"
                      className="absolute inset-y-0 left-0 w-full rounded-2xl border border-emerald-200/12"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
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
                  <p className="truncate text-sm font-medium text-white">Lunar Echoes</p>
                  <p className="truncate text-xs text-white/45">Artist Workspace</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[linear-gradient(180deg,#d6dbe7,#7c8798)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">Maya Rivera</p>
                  <p className="truncate text-xs text-white/45">Admin</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
            </div>
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
            <p className="text-base font-semibold text-white">RightsGuard AI</p>
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
              className={`flex h-14 w-16 flex-col items-center justify-center relative ${
                isActive ? 'text-emerald-200' : 'text-white/45 hover:text-white/72'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator-mobile"
                  className="absolute -top-2 h-1 w-8 rounded-b-full bg-emerald-300"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon className={`mb-1 h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
