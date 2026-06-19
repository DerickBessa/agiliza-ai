# Agiliza AI — Project Guide

## Overview
Kanban-style card management platform for 3 teams (CS, Comercial, Tech). Built with React + Vite + Tailwind v4 + Supabase.

**URL:** https://agiliza-ai-sigma.vercel.app

## Stack
- **Frontend:** React 19, React Router v6, Vite 8, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL, Realtime, Storage)
- **Deploy:** Vercel (SPA with rewrites in `vercel.json`)
- **Auth:** Password-protected per role (env vars, no real auth)

## Project Structure
```
src/
  components/     Reusable UI (CardCreate, KanbanBoard, PasswordModal, Layout, KanbanSelector)
  pages/          Route pages (RoleSelect, TechPanel, TechDashboard, TechReport, TechKanban, CSKanban, ComercialKanban, CardDetail)
  lib/            Supabase client
  types.ts        Shared TS types
  index.css       Global styles (CSS variables, dark mode, @theme)
  main.tsx        Entry point (dark mode init)
  App.tsx         Router config
supabase/
  migrations/     DB migration files
```

## Key Business Rules

### Roles & Access
- **CS** — Client Support. Opens cards, tracks to completion, approves/rejects.
- **Comercial** — Sales. Same flow as CS.
- **Tech** — Development. Receives cards, implements, moves through statuses.

All roles require a password (`VITE_*_PASSWORD` from `.env`). Optional 7-day remember token in localStorage.

### Card Lifecycle
```
a_fazer → em_progresso → concluido → aprovado (by CS/Comercial)
                                   → reprovado (can spawn a new related card)
```

### Card Fields
- `title`, `description`, `photo_url`, `system_id`, `kanban_id`, `area`
- `type`: `'Bug' | 'Inovação'`
- `severity`: `'bug' | 'melhoria' | 'sugestao'`
- `resolved_by`: developer name (free text)
- `status`: `'a_fazer' | 'em_progresso' | 'concluido' | 'aprovado' | 'reprovado'`

### Multi-Kanban
Each role can have multiple kanbans (e.g., "Geral", "Sprint 1"). Cards belong to one kanban.

### Tech Dashboard & Report
- `/tech/relatorio` — Monthly/annual report of approved cards grouped by developer. Print-to-PDF.
- `/tech/dashboard` — Password-protected. Shows card age, dev productivity with CSS bar charts, severity-type metrics.

## CSS Conventions
- All colors via CSS variables (`--_p`, `--_bg`, `--_txt`, etc.) mapped through `@theme`
- Dark mode default (checked via `localStorage.getItem('dark') !== 'false'`)
- Pure black text in light mode, pure white in dark mode
- Orange brand (`#ea580c`)
- Global click feedback: `button, a, [role="button"], label { cursor: pointer; transition: transform 0.15s ease; }:active { transform: scale(0.97); }`
- Kanban columns use Jira style: pastel tint 20% (light) / dark tint 35% (dark)

## Environment Variables
All in `.env` (gitignored, copy `.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TECH_PASSWORD=
VITE_CS_PASSWORD=
VITE_COMERCIAL_PASSWORD=
```
Vite bakes `VITE_*` vars into the client bundle at build time — never put truly sensitive secrets here.

## Deploy
```bash
npm run build          # tsc + vite build
vercel --prod --yes    # deploy to production
vercel --prod --yes --force  # force fresh build (no cache)
```

## Database
- Supabase project `kzorizquxpdzijshfrwf`
- Tables: `cards`, `systems`, `kanbans`, `comments`, `feedbacks`
- Realtime enabled on `cards` and `comments`
- RLS: public access (all policies allow all)

### Migration Workflow
```bash
supabase migration new <name>   # create migration file
# edit the file
supabase db push --linked        # apply to remote
```

## Patterns & Style
- No comments in code unless absolutely necessary
- No inline colors — always use CSS variables or Tailwind theme tokens
- Icons from `lucide-react`
- Forms use controlled inputs with `useState`
- Realtime subscriptions via Supabase channels (cleaned up on unmount)
- Drag-and-drop uses native HTML5 Drag API (no library)

## Points to Improve
- [ ] No real auth system — passwords are client-side and visible in JS bundle
- [ ] No route guards — anyone can navigate to any path if they know the URL
- [ ] No developer/team table — `resolved_by` is free text
- [ ] No server-side filtering on reports — all data fetched client-side
- [ ] No loading skeletons or error boundaries
- [ ] No tests
- [ ] No TypeScript strict mode
- [ ] `severity` column name in DB still uses old constraint (allows legacy values)
- [ ] Password modals don't show error state color per team
