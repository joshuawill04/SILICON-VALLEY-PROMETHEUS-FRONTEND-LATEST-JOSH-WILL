-- Initial Schema for Prometheus Persistence
-- This file defines the core tables for project and source asset management.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects Table
create table if not exists public.projects (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null default 'Untitled project',
    status text not null default 'draft',
    thumbnail_url text,
    preview_kind text,
    source_asset_id uuid, -- We'll link this once source_assets are uploaded
    source_profile jsonb not null default '{}'::jsonb,
    editor_state jsonb not null default '{}'::jsonb,
    animation_plan jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Source Assets Table
create table if not exists public.source_assets (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references public.projects(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    storage_bucket text,
    storage_path text,
    original_filename text,
    mime_type text,
    size_bytes bigint,
    duration_ms integer,
    width integer,
    height integer,
    profile jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- Add foreign key from projects to source_assets (optional circular ref, but let's stick to the user's req)
alter table public.projects 
add constraint fk_projects_source_asset 
foreign key (source_asset_id) references public.source_assets(id) on delete set null;

-- Enable RLS
alter table public.projects enable row level security;
alter table public.source_assets enable row level security;

-- RLS Policies for Projects
create policy "Users can view their own projects" 
on public.projects for select 
using (auth.uid() = user_id);

create policy "Users can insert their own projects" 
on public.projects for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own projects" 
on public.projects for update 
using (auth.uid() = user_id);

create policy "Users can delete their own projects" 
on public.projects for delete 
using (auth.uid() = user_id);

-- RLS Policies for Source Assets
create policy "Users can view their own source assets" 
on public.source_assets for select 
using (auth.uid() = user_id);

create policy "Users can insert their own source assets" 
on public.source_assets for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own source assets" 
on public.source_assets for update 
using (auth.uid() = user_id);

create policy "Users can delete their own source assets" 
on public.source_assets for delete 
using (auth.uid() = user_id);

-- Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.handle_updated_at();
