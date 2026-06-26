---
name: Sidebar nav mapping
description: The sidebar uses renamed labels that differ from the underlying route/page names
---

The sidebar nav (app-layout.tsx) uses 6 items matching the Studio Ops reference design:
- Dashboard → /dashboard
- Projects → /clients
- Events → /shoots
- Post Production → /deliverables
- Finance → /profit
- Settings → /settings

**Why:** User requested nav labels match their Studio Ops reference screenshots, but backend routes remain as originally built (clients, shoots, etc.).

**How to apply:** If adding a new sidebar link, use the user-facing label (Projects/Events etc.) while pointing to the actual route. Do not rename routes or page files.
