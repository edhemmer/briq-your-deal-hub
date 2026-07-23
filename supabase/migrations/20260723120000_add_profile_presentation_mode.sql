alter table public.profiles
  add column if not exists presentation_mode text not null default 'guided';

alter table public.profiles
  drop constraint if exists profiles_presentation_mode_check;

alter table public.profiles
  add constraint profiles_presentation_mode_check
  check (presentation_mode in ('guided', 'professional'));
