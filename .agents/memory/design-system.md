---
name: Light theme design system
description: Color palette, spacing, and component conventions for Captora CRM
---

**Background:** #F5F5EE (warm off-white, slightly cream)
**Cards:** #FFFFFF with border #E2E8F0, border-radius 12px (rounded-xl), NO heavy box shadows
**Sidebar:** #1E293B dark slate, flat nav (no group labels), square avatar with "C" letter
**Primary accent:** #E0533C coral — buttons, active states, amounts due, function pills
**Secondary text:** #94A3B8 slate-400 for labels/subtitles

**Status pills (light mode):**
- Pending/Lead: bg-amber-50 text-amber-700 border-amber-200
- Completed: bg-green-50 text-green-700 border-green-200
- Cancelled: bg-red-50 text-red-600 border-red-200
- Scheduled: bg-blue-50 text-blue-700 border-blue-200

**Tables:** thead bg-slate-50, th text-xs uppercase tracking-wider text-slate-400, td py-4 px-5, border-b border-slate-100

**Why:** User requested Studio Ops reference layout — warm off-white bg, dark sidebar, coral accent.

**How to apply:** All new pages follow this system. Use inline style={{ color: "#E0533C" }} for coral text (avoids Tailwind arbitrary class issues). Buttons use style={{ background: "#E0533C" }} not bg-primary.
