create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'studio')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  seats_included integer not null default 1,
  ai_query_limit integer not null default 80,
  work_limit integer not null default 5,
  renews_at timestamptz,
  mrr_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period_start date not null default current_date,
  ai_queries_used integer not null default 0,
  rights_reports_used integer not null default 0,
  storage_bytes_used bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('stripe', 'resend', 'slack', 'make', 'publishing')),
  status text not null default 'pending' check (status in ('pending', 'connected', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_integration_connections_org_kind
  on public.integration_connections (organization_id, kind);

create table if not exists public.rights_works (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  work_type text not null check (work_type in ('composition', 'recording', 'release', 'agreement')),
  status text not null default 'draft',
  platform_source text,
  release_stage text,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_id uuid references public.rights_works (id) on delete cascade,
  title text not null,
  file_url text,
  evidence_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rights_memos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_id uuid references public.rights_works (id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_memberships_org on public.organization_memberships (organization_id);
create index if not exists idx_subscriptions_org on public.subscriptions (organization_id, created_at desc);
create index if not exists idx_usage_counters_org on public.usage_counters (organization_id, period_start desc);
create index if not exists idx_rights_works_org on public.rights_works (organization_id, created_at desc);

insert into public.organizations (name, slug)
values ('RightsGuard AI', 'rightsguard')
on conflict (slug) do nothing;
