# Captora CRM

A full-stack CRM web application for Captora Photography Company — a wedding photography studio in Lucknow, India.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/captora-crm run dev` — run the frontend (port 26222)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui, React Query
- API: Express 5, JWT auth (base64 encoded, SESSION_SECRET env var)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/captora-crm/` — React+Vite frontend (previewPath `/`)
- `artifacts/api-server/` — Express 5 backend (path `/api`, port 8080)
- `lib/db/` — Drizzle schema and migrations
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — generated React Query hooks + Zod schemas

## Architecture decisions

- **Contract-first API**: All endpoints defined in OpenAPI spec → Orval generates hooks. Never call APIs manually; use generated hooks.
- **JWT auth**: Admin credentials stored in `admin_users` table (plain text password). Token base64-encoded in Authorization header.
- **Dark theme + gold accents**: primary color `#C5A059`, background `#0a0a0a`, card `#141414`.
- **Indian Rupee (₹)**: All monetary values in INR, formatted with `en-IN` locale.
- **No `customFetch` export**: `customFetch` is internal to `api-client-react`. Use generated hooks directly.
- **TS7030 fix**: Never use `return toast({...})` — use `{ toast({...}); return; }` to avoid mixed return types.
- **Query options pattern**: Pass `queryKey` explicitly when using `useGetClient(id, { query: { queryKey: getGetClientQueryKey(id), enabled: !!id } })`.

## Product

11 modules accessible from sidebar:
1. **Dashboard** — upcoming shoots, overdue payments, monthly stats
2. **Clients** — full CRUD, status pipeline (Lead→Completed), WhatsApp link
3. **Client Detail** — event info, payment summary, notes, deliverables view
4. **Shoots** — schedule management with function tags
5. **Payments** — installment tracking, payment modes, summary
6. **Freelancers** — per-shoot rates, bank details
7. **Staff** — salary, joining date, roles
8. **Expenses** — category-based expense tracking with monthly summary
9. **P&L** — monthly profit/loss report with bar chart
10. **Deliverables** — checklist tracker per client (photos, videos, albums)
11. **Content Ideas** — Kanban-style board for social/reel ideas
12. **Team Planner** — upcoming shoot overview with function tags

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

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
