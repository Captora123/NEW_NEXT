---
name: Next.js migration
description: captora-crm (Vite+Express) replaced by captora-nextjs (Next.js 15 App Router); key patterns and gotchas.
---

The app migrated from a React+Vite frontend + Express API to a single Next.js 15 App Router app.

**Key facts:**
- Package: `@workspace/captora-nextjs`, dir `artifacts/captora-nextjs/`, port 3002
- All API routes live under `app/api/` (not a separate Express server)
- Auth: base64 JSON token, cookie `captora_token` + localStorage; `requireAuth(request)` in `lib/api-auth.ts` reads the Authorization header
- Sub-routes for entity operations use `?sub=` query param (e.g. `POST /api/clients/[id]?sub=notes`)
- Next.js 15 async params: `const { id } = await ctx.params` in route handlers
- Old artifacts (captora-crm, api-server) still exist in repo but workflows stopped

**Why:** User requested migration from Vite+Express to Next.js 15 App Router with App Router style.

**How to apply:** All future backend work goes in `app/api/` route handlers. All future frontend work goes in `app/(dashboard)/`. Use `requireAuth()` in every API handler.
