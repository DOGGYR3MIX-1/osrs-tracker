-- Run this entire file in Supabase: Project -> SQL Editor -> New query -> paste -> Run

-- One row per activity (boss / minigame). Easy to add more later.
create table activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,             -- e.g. "Doom of Mokhaiotl"
  slug text not null unique,      -- e.g. "doom"
  created_at timestamptz not null default now()
);

-- Defines which extra fields each activity tracks, in what order,
-- and (optionally) a cost-per-unit so "Cost" can be auto-calculated.
create table activity_fields (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  key text not null,              -- e.g. "arrows_used" (no spaces, used as identifier)
  label text not null,            -- e.g. "Arrows used" (shown in the UI)
  unit text,                      -- e.g. "arrows", "sips" (just for display)
  cost_per_unit numeric default 0,-- gp cost per 1 unit, used to auto-calculate Cost
  sort_order int not null default 0,
  unique (activity_id, key)
);

-- One row per logged run.
create table runs (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  run_number int not null,
  run_date date not null default current_date,
  duration_minutes numeric,
  loot_value numeric not null default 0,
  cost numeric not null default 0,           -- auto-calculated from field values, but editable
  outcome text not null default 'S',         -- 'T' teleported, 'S' survived, 'D' died
  notes text,
  created_at timestamptz not null default now()
);

-- The flexible per-activity field values for each run (e.g. depth: 35, arrows_used: 220).
create table run_field_values (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  field_key text not null,
  value numeric not null default 0,
  unique (run_id, field_key)
);

-- Seed Doom of Mokhaiotl as the first activity, matching your spreadsheet columns.
insert into activities (name, slug) values ('Doom of Mokhaiotl', 'doom');

insert into activity_fields (activity_id, key, label, unit, cost_per_unit, sort_order)
select id, 'delve_depth', 'Delve depth', 'depth', 0, 1 from activities where slug = 'doom'
union all
select id, 'arrows_used', 'Arrows used', 'arrows', 0, 2 from activities where slug = 'doom'
union all
select id, 'sharks_used', 'Sharks used', 'sharks', 0, 3 from activities where slug = 'doom'
union all
select id, 'brew_sips_used', 'Brew sips used', 'sips', 0, 4 from activities where slug = 'doom'
union all
select id, 'restore_sips_used', 'Restore sips used', 'sips', 0, 5 from activities where slug = 'doom'
union all
select id, 'ranging_sips_used', 'Ranging sips used', 'sips', 0, 6 from activities where slug = 'doom'
union all
select id, 'antivenom_sips_used', 'Anti-venom sips used', 'sips', 0, 7 from activities where slug = 'doom';

-- Update the cost_per_unit values above later (Supabase Table Editor -> activity_fields)
-- to match what you actually paid for arrows/sharks/brews/etc, same as your old "prices" sheet.

-- This is for personal/single-user use, so we keep row level security off for simplicity.
-- If you ever open this up to other people, this is the first thing to revisit.
alter table activities disable row level security;
alter table activity_fields disable row level security;
alter table runs disable row level security;
alter table run_field_values disable row level security;
