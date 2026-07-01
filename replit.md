# Captora CRM

A full-stack CRM web application for Captora Photography Company — a wedding photography studio in Lucknow, India.

## Run & Operate

- `pnpm --filter @workspace/captora-nextjs run dev` — run the Next.js app (port 3002, serves both UI and API)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **App**: Next.js 15 App Router (unified frontend + API routes)
- **UI**: TailwindCSS v4 + shadcn/ui components, React Query (via `@workspace/api-client-react` generated hooks)
- **Auth**: base64-encoded JSON token stored in cookie (`captora_token`) + localStorage; `requireAuth()` reads Authorization header in API routes
- **DB**: PostgreSQL + Drizzle ORM (`@workspace/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/`)

## Where things live

- `artifacts/captora-nextjs/` — Next.js 15 app (previewPath `/`, port 3002)
  - `app/(dashboard)/` — all CRM pages (layout with sidebar)
  - `app/api/` — all API route handlers
  - `app/login/` — login page
  - `lib/api-auth.ts` — `requireAuth()` for API routes
  - `lib/auth-context.tsx` — client-side auth state
  - `lib/studio-context.tsx` — studio branding/theme config (localStorage)
- `lib/db/` — Drizzle schema and migrations
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — generated React Query hooks + Zod schemas

## Architecture decisions

- **Next.js App Router**: Single unified app — no separate Express backend. API routes live under `app/api/`.
- **Sub-routes pattern**: `clients/[id]` and `shoots/[id]` use `?sub=` query param for sub-operations (notes, freelancers, status, team, project-expenses).
- **Contract-first API**: All endpoints defined in OpenAPI spec → Orval generates hooks. Never call APIs manually; use generated hooks.
- **Auth**: Admin credentials stored in `admin_users` table (plain text password). Token base64-encoded in Authorization header. Cookie `captora_token` + localStorage.
- **Light theme**: primary/accent color `#E0533C` (coral), sidebar `#1E293B` (slate-800).
- **Indian Rupee (₹)**: All monetary values in INR, formatted with `en-IN` locale.
- **No `customFetch` export**: `customFetch` is internal to `api-client-react`. Use generated hooks directly.
- **TS7030 fix**: Never use `return toast({...})` — use `{ toast({...}); return; }` to avoid mixed return types.
- **Query options pattern**: Pass `queryKey` explicitly when using `useGetClient(id, { query: { queryKey: getGetClientQueryKey(id), enabled: !!id } })`.
- **Next.js 15 async params**: Route handlers use `ctx: { params: Promise<{id: string}> }` → `const { id } = await ctx.params`.

## Product

12 modules accessible from sidebar:
1. **Dashboard** — upcoming shoots, overdue payments, monthly stats
2. **Clients** — full CRUD, status pipeline (Lead→Completed), WhatsApp link
3. **Client Detail** — event info, payment summary, project P&L, freelancer assignments, notes, deliverables
4. **Shoots** — schedule management with function tags
5. **Finance** — 4 tabs: P&L overview, Payments, Expenses, Team Costs
6. **Deliverables** — checklist tracker per client (photos, videos, albums)
7. **Content Ideas** — Kanban-style board for social/reel ideas
8. **Team Planner** — upcoming shoot overview with function tags
9. **Settings** — branding, themes, service categories, password change

## Admin Credentials

- Username: `admin`
- Password: `captora2024`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Shoot schema**: NO `shootType`, `city`, `assignedStaff`, `assignedFreelancers`, `notes`. Use `functions[]` for types, `specialInstructions` for notes.
- **Deliverable fields**: `editedPhotos`, `cinematicHighlight`, `traditionalVideo`, `instagramReels`, `albumOrdered`, `albumDelivered`, `rawDataCopied`, `magazineDelivered`, `photoFrameDelivered`. NO `rawPhotos`, `photoAlbum`, `miniFilm`, `teaser`.
- **Client**: has `totalPaid`, `totalPending` fields. NO `pendingAmount`.
- **StaffInput**: `joiningDate` is required in the type.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change.
- Run `pnpm --filter @workspace/db run push` after any schema change.
- **captora-crm and api-server artifacts**: still present in repo but superseded by captora-nextjs; their workflows have been stopped.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
