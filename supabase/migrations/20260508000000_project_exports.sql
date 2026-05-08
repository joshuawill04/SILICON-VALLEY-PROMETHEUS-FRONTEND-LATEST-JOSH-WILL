-- Migration: Create project_exports table
-- Description: Foundation for tracking video export jobs and their R2 outputs.

create table if not exists public.project_exports (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references public.projects(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    status text not null default 'pending',
    storage_provider text not null default 'r2',
    storage_bucket text,
    storage_path text,
    mime_type text default 'video/mp4',
    file_size_bytes bigint,
    duration_ms integer,
    width integer,
    height integer,
    fps numeric,
    preset text not null default 'default',
    metadata jsonb not null default '{}'::jsonb,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    failed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Constraints
    constraint project_exports_status_check check (status in ('pending', 'processing', 'completed', 'failed'))
);

-- Enable RLS
alter table public.project_exports enable row level security;

-- RLS Policies
create policy "Users can view their own exports"
on public.project_exports for select
using (auth.uid() = user_id);

create policy "Users can insert their own exports"
on public.project_exports for insert
with check (auth.uid() = user_id);

create policy "Users can update their own exports"
on public.project_exports for update
using (auth.uid() = user_id);

create policy "Users can delete their own exports"
on public.project_exports for delete
using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists project_exports_user_id_idx on public.project_exports(user_id);
create index if not exists project_exports_project_id_idx on public.project_exports(project_id);
create index if not exists project_exports_status_idx on public.project_exports(status);
create index if not exists project_exports_created_at_idx on public.project_exports(created_at);

-- Trigger for updated_at (reusing existing function)
create trigger set_project_exports_updated_at
before update on public.project_exports
for each row execute function public.handle_updated_at();
