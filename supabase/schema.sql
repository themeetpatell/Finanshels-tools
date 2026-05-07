-- Finance Navigator (Finanshels) baseline schema — apply via Supabase SQL editor or CLI migrations.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  work_email text not null,
  phone text not null,
  company_name text not null,
  company_size text not null,
  annual_revenue_band text not null,
  primary_challenge text not null,
  consent_accepted boolean not null default false,
  source_tool_slug text,
  crm_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.calculator_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.leads (id) on delete set null,
  tool_slug text not null,
  inputs jsonb not null,
  outputs jsonb not null
);

create table if not exists public.tool_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.leads (id) on delete set null,
  anonymous_token text,
  tool_slug text not null,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  anonymous_token text,
  payload jsonb not null
);

create index if not exists idx_leads_created_at on public.leads (created_at desc);
create index if not exists idx_calculator_results_tool on public.calculator_results (tool_slug);
create index if not exists idx_tool_sessions_completed on public.tool_sessions (completed_at desc);

comment on table public.leads is 'Finance Navigator outbound leads synchronized for CRM ingestion.';
comment on column public.leads.crm_payload is 'Canonical CRM envelope logged server-side alongside structured columns.';
