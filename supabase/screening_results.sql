-- Screening protocol results (voice, DDK, picture naming + per-domain outcome).
-- Run in the Supabase SQL editor, then set VITE_SAVE_SCREENING=true in the app's environment.
create table if not exists public.screening_results (
  id                 bigint generated always as identity primary key,
  created_at         timestamptz not null default now(),
  speaker_id         text not null references public.speakers (speaker_id),
  age                int,
  age_band           text,
  overall_status     text not null check (overall_status in ('typical', 'monitor', 'refer', 'inconclusive', 'not_tested')),
  domains            jsonb not null,
  avg_word_accuracy  int,
  voice_attempts     jsonb,
  ddk                jsonb,
  picture_naming     jsonb
);

create index if not exists screening_results_speaker_idx on public.screening_results (speaker_id);

-- Match the insert-only access used by the other tables for the anon key.
alter table public.screening_results enable row level security;
create policy "anon can insert screening results"
  on public.screening_results for insert
  to anon
  with check (true);
