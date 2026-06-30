# OSRS grind tracker

A personal website for logging PvM/skilling grinds, starting with Doom of Mokhaiotl.

## What's in here

- `app/` - the Next.js website (dashboard page)
- `components/RunWizard.tsx` - the step-by-step "+" entry modal
- `components/RunsTable.tsx` - the logged-runs table, color-coded by outcome
- `supabase/schema.sql` - the database structure, run this once in Supabase
- `lib/` - the Supabase connection and shared types

## One-time setup

### 1. Database (Supabase)

1. Create a project at supabase.com.
2. Go to the SQL Editor, paste in the entire contents of `supabase/schema.sql`, and run it.
   This creates the tables and seeds "Doom of Mokhaiotl" with your spreadsheet's columns.
3. Go to Project Settings -> API and copy the **Project URL** and **anon public key**.
4. Go to Table Editor -> `activity_fields` and fill in `cost_per_unit` for each row
   (e.g. how much you pay per arrow, per shark, per brew sip) so Cost/Profit calculate
   automatically. Leave at 0 for anything you don't want auto-costed.

### 2. Local environment variables

Copy `.env.local.example` to `.env.local` and fill in the two Supabase values from above.
This file is for your local machine only and should never be committed to GitHub
(it's already in `.gitignore`).

### 3. Push to GitHub

Create a new (private) GitHub repository and push this folder to it.

### 4. Deploy (Vercel)

1. Sign into vercel.com with GitHub.
2. "Add New Project" -> import the repo you just pushed.
3. In the project's environment variables, add the same two Supabase values
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy. Vercel gives you a live URL you can open on any device.

## Adding a new activity later (e.g. ToA, Wintertodt)

Insert a new row into `activities`, then add its tracked fields as rows in
`activity_fields` (same pattern as the Doom seed data at the bottom of `schema.sql`).
No code changes needed - the dashboard and wizard both build themselves from
whatever fields are defined for an activity. (The current dashboard page is
hardcoded to show the "doom" activity - switching activities in the UI is the
next thing to add once you're tracking more than one.)
