# Implementation Plan: Premium UI/UX Redesign for MITE Ride Manager

## Overview

Purely presentational upgrade — no server actions, Prisma schema, TypeScript interfaces, or npm packages change. Work flows from the CSS token layer outward through shell components, new chart components, and finally each tab. Every source of truth for colour and glass style lives in `globals.css`; every component reads from those tokens.

## Tasks

- [x] 1. Update CSS token layer and animation keyframes (`globals.css`)
  - [x] 1.1 Replace colour tokens with violet + cyan palette
    - In both `:root` and `.dark`: change `--primary` from `#6366F1` to `#7c3aed`, `--primary-glow` from `#A855F7` to `#6d28d9`
    - In `.dark`: change `--background` to `#08090d`, `--card` to `#0f1117`, `--surface-2` / `--muted` to `#161922`, `--border` to `rgba(255,255,255,0.08)`
    - Add `--cyan: #06b6d4` token to both `:root` and `.dark` blocks; also expose as `--color-cyan` in the `@theme inline` block
    - Update `--gradient-primary` to `linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)` in both blocks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Rewrite `.glass-premium` and update scrollbar
    - Replace `.glass-premium` body with: `background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06);`
    - Replace `::-webkit-scrollbar` rules: width/height `4px`, thumb `background: linear-gradient(to bottom, #7c3aed, #6d28d9); border-radius: 999px;`
    - _Requirements: 1.6, 1.7_

  - [x] 1.3 Add new keyframes and animation utilities
    - Add `@keyframes count-up` (0% `opacity:0; transform:translateY(8px)` → 100% `opacity:1; transform:translateY(0)`)
    - Add `@keyframes gradient-shift` (0%/100% `background-position:0% 50%` → 50% `background-position:100% 50%`)
    - Add `@keyframes pulse-overdue` (`0%,100% {opacity:1}  50% {opacity:0.4}`)
    - Add `.animate-count-up`, `.animate-gradient-shift`, `.animate-pulse-overdue` utility classes
    - _Requirements: 1.8, 1.9_

- [x] 2. Update `AppShell.tsx` ambient background blobs
  - [x] 2.1 Replace ambient glow blobs with four-blob violet + cyan layout
    - Top-left: `#7c3aed` at 10% opacity, 500 px, `blur-[120px]`
    - Top-right: `#6d28d9` at 10% opacity, 400 px, `blur-[100px]`
    - Bottom-right: `#06b6d4` at 10% opacity, 300 px, `blur-[80px]`
    - Bottom-left: `#7c3aed` at 5% opacity, 600 px, `blur-[150px]`
    - Update fixed top accent bar to `from-[#7c3aed] via-[#6d28d9] to-[#7c3aed]`
    - Keep `glass-premium` on header, keep "System Online" success-green indicator unchanged
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update `tab-router.tsx` glass pill navigation
  - [x] 3.1 Update sliding indicator and inactive tab styles
    - Change indicator element: `bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]`, `box-shadow: 0 0 20px rgba(124,58,237,0.4)`
    - Inactive tabs: `text-white/30`, `hover:text-white/60`; preserve existing `indicatorStyle` left/width computation via `tabRefs` unchanged
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

  - [x] 3.2 Apply per-tab active icon glow colours
    - When a tab is active, apply `drop-shadow` filter to its icon using the colour map: Dashboard/History → `rgba(124,58,237,0.6)` violet; Create Ride → `rgba(16,185,129,0.6)` emerald; Pending → `rgba(245,158,11,0.6)` amber; Rides → `rgba(6,182,212,0.6)` cyan; Settings → `rgba(100,116,139,0.6)` slate
    - Build a `TAB_GLOW` constant map keyed by tab id
    - Preserve all `isAdmin &&` gates — Create Ride and Settings tabs remain admin-only
    - _Requirements: 3.3, 3.4, 3.7, 3.8, 15.1, 15.2_

- [x] 4. Create `WeeklyEarningsBarChart` component
  - [x] 4.1 Build `components/charts/WeeklyEarningsBarChart.tsx`
    - Accept `data: Array<{ month: string; amount: number }>` prop
    - Render `BarChart` with `ResponsiveContainer` from existing `recharts` package only
    - Define `<linearGradient id="violetBarGradient">` in `<defs>`: from `#7c3aed` (top) to `#6d28d9` (bottom); set `fill="url(#violetBarGradient)"` on `<Bar>`
    - Render `XAxis` with short month labels, `YAxis` with `₹` prefix, `CartesianGrid` with `stroke-muted/50`
    - Reuse the `CustomTooltip` pattern from `MonthlyFuelChart.tsx`: glass card with `bg-card/95 backdrop-blur-xl`
    - No new npm imports — only `recharts`, `lucide-react`, `@/lib/utils`
    - _Requirements: 6.2, 6.3, 6.8, 16.5_

  - [ ]* 4.2 Write unit test for WeeklyEarningsBarChart data formatting
    - Verify the month-label derivation produces short names (e.g. "Jan", "Feb")
    - Verify zero-data case renders without crash
    - _Requirements: 6.3_

- [x] 5. Create `CollectionRateDonutChart` component
  - [x] 5.1 Build `components/charts/CollectionRateDonutChart.tsx`
    - Accept `collected: number` and `pending: number` props
    - Render `PieChart` with `Pie` at `innerRadius={55}` `outerRadius={85}` from existing `recharts`
    - Collected segment: `#06b6d4` (cyan); Pending segment: `#f59e0b` (amber)
    - Center label: compute `rate = collected + pending > 0 ? Math.round(collected / (collected + pending) * 100) : 0`; render as SVG `<text>` element (or a positioned div via `label` prop) showing `{rate}%`
    - Render "Collected" (cyan) and "Pending" (amber) pill legend labels below chart
    - No new npm imports
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 16.5_

  - [ ]* 5.2 Write property test for collection rate bounds (Property 7 & 8)
    - **Property 7: Collection Rate Bounds** — for any `collected >= 0` and `pending >= 0`, computed `rate` satisfies `0 <= rate <= 100`
    - **Property 8: Donut Display Consistency** — collected renders cyan, pending renders amber, centre label equals `Math.round(c/(c+p)*100)` or 0 when both zero
    - **Validates: Requirements 6.5, 6.6, 5.9**

- [x] 6. Redesign `DashboardTab.tsx` — hero card, stat cards, and charts
  - [x] 6.1 Rebuild the HeroCard section
    - Replace `glass-premium` ambient-mesh background on the hero div with a hard gradient: `background: linear-gradient(135deg, #1a0533, #0a1628)`; add `animate-gradient-shift` class
    - Apply `rounded-3xl overflow-hidden` on outer container
    - Update car image container `box-shadow` to: `0 0 60px rgba(124,58,237,0.3), 0 0 120px rgba(109,40,217,0.15), inset 0 0 40px rgba(124,58,237,0.05)`
    - Replace inline marquee fuel badge with the live price badge: pulsing green dot + `₹{todayPetrolPrice}/L` + "Live" label
    - Keep the 2×2 spec grid (mileage, routeDistance, fuel required, est. trip cost in `text-[#7c3aed]`) and the frosted inner panel unchanged in structure
    - On mobile (`sm:` breakpoint) stack text and image vertically
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 14.3_

  - [x] 6.2 Rebuild the 4-card StatCard row
    - Reduce the `statCards` array from 8 items to exactly 4: Today's Fuel Cost (violet `#7c3aed`), Total Pending (amber `#f59e0b`), Total Collected (cyan `#06b6d4`), Collection Rate (`#10b981`)
    - Compute `collectionRate = totalCollected / (totalPending + totalCollected) * 100` client-side (show `0` when denominator is 0)
    - Update `StatCard` component: icon square 44×44 px with accent-colour at 10% bg + 100% icon; value text `text-4xl font-light` (approx 36-40 px, weight 300); label `text-[11px] uppercase tracking-[0.1em]`
    - Trend badge: `ArrowUpRight`/`ArrowDownRight` icon + `bg-success/15 text-success` or `bg-destructive/15 text-destructive` pill; import `ArrowUpRight` and `ArrowDownRight` from `lucide-react`
    - Sparkline colour: violet for fuel-cost card, amber for pending, cyan for collected, green for rate
    - Hover: `hover:-translate-y-0.5` + `hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]`
    - Stat grid collapses to single column on mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 14.1_

  - [x] 6.3 Wire charts row into DashboardTab
    - Replace the `MonthlyFuelChart` + quick-stats column with a two-column row: `WeeklyEarningsBarChart` in `lg:col-span-2` and `CollectionRateDonutChart` in `lg:col-span-1`
    - Pass `data={stats.monthlyFuelSpend}` to `WeeklyEarningsBarChart`
    - Compute `donutData` client-side: `collected = stats.totalCollected`, `pending = stats.totalPending`; pass as props to `CollectionRateDonutChart`
    - Wrap both charts in `glass-premium rounded-2xl p-6` containers
    - On small/medium screens (`< lg`) stack the two charts vertically to full width
    - Remove the old quick-stats column (mostFrequentDefaulter, avg cost/person, collection rate bar) from Dashboard (they are now covered by the 4 stat cards and the donut chart)
    - _Requirements: 6.1, 6.9, 14.4, 17.1_

  - [ ]* 6.4 Write property test for trend badge polarity (Property 6)
    - **Property 6: Trend Badge Polarity** — delta >= 0 → `bg-success/15 text-success` + ArrowUpRight; delta < 0 → `bg-destructive/15 text-destructive` + ArrowDownRight
    - **Validates: Requirements 5.6**

- [x] 7. Checkpoint — verify globals.css, AppShell, TabRouter, charts, and DashboardTab
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Redesign `PendingPaymentsTab.tsx` — summary pills and avatar member cards
  - [x] 8.1 Replace circular-progress summary cards with glass stat pills
    - Replace the three `bg-card` circular-progress cards with `.glass-premium` pill cards
    - Each pill: full-width or equal-width cell; large number + label + inline icon; subtle gradient border
    - Pending pill: amber `#f59e0b` accent; Overdue pill: red `#f43f5e` accent with `animate-pulse` dot when `overdue.length > 0`; Members pill: violet `#7c3aed` accent
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.2 Replace table-row payment items with `MemberCard` glass cards
    - Remove the overdue/pending `<table>` sections; render a flat list of `MemberCard` elements
    - Each `MemberCard` is a `.glass-premium` surface with: 44×44 circular avatar showing 1-2 uppercase initials derived via `getInitials(name)` (first letter of each word, truncate to 2 chars); avatar gradient from `AVATAR_GRADIENTS[sumCharCodes(name) % 6]`; name (bold), ride date (muted); amount in `text-[#06b6d4]`; status badge per `STATUS_STYLES` map
    - Admin-only "Mark Paid" button: `bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]`; for non-admin render "Pay Now" button instead; preserve `isAdmin &&` gate
    - Keep existing `setPaymentDialog` onClick wiring for both buttons
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 15.1, 15.3_

  - [x] 8.3 Replace empty state with animated SVG checkmark
    - When filtered list is empty, render: animated SVG checkmark with gradient stroke `#7c3aed → #06b6d4` using CSS `stroke-dasharray` + `stroke-dashoffset` animation; heading "All Clear!" with `gradient-text`; sub-label "Everyone is paid up"
    - Remove old `CheckCircle2` icon empty state
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 8.4 Write property tests for initials and avatar gradient (Properties 10 & 11)
    - **Property 10: Member Initials Derivation** — for any non-empty string, result is 1–2 uppercase characters from first letters of whitespace-delimited words
    - **Property 11: Avatar Gradient Index Stability** — `sumCharCodes(name) % 6` always in `[0, 5]`, same input always yields same output
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 8.5 Write property test for status badge correctness (Property 12)
    - **Property 12: Status Badge Class Correctness** — for each of {PAID, PENDING, OVERDUE, VERIFICATION}, badge applies exactly the `STATUS_STYLES` entry; no fallthrough to unstyled badge
    - **Validates: Requirements 8.6**

- [x] 9. Redesign `PaymentHistoryTab.tsx` — glass filter bar and styled table
  - [x] 9.1 Upgrade summary stat cards to `glass-premium`
    - Change all three summary cards from `bg-card` to `glass-premium rounded-2xl`; keep icon squares and labels; no sparklines on these cards
    - _Requirements: 10.7, 17.1, 17.2_

  - [x] 9.2 Restyle filter bar as glass pills
    - Search input: `rounded-full bg-white/[0.04] border border-white/[0.08]` glass pill
    - Member selector and date-range `<select>` elements: same `rounded-full` pill glass style
    - CSV button: `border border-[#7c3aed]/40 text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-full` outline glass style
    - JSON button: same outline glass style as CSV (remove existing gradient background)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 9.3 Upgrade table styling — sticky header, row accents, cyan amounts
    - Table wrapper: `overflow-hidden rounded-2xl glass-premium`
    - `<thead>` row: add `sticky top-0 backdrop-blur-xl bg-card/90 z-10`
    - Even rows: `bg-[rgba(255,255,255,0.02)]`; hover: `bg-[rgba(255,255,255,0.04)] border-l-2 border-[#7c3aed]`
    - Amount `<td>`: replace `text-success` with `text-[#06b6d4] font-semibold`
    - _Requirements: 10.4, 10.5, 10.6_

  - [x] 9.4 Replace empty state with animated rising-chart SVG
    - When filtered list is empty, render: animated rising-chart SVG with gradient stroke `#7c3aed → #06b6d4`; heading "No history yet" with `gradient-text` (violet → cyan)
    - _Requirements: 11.1, 11.2_

  - [ ]* 9.5 Write property test for cyan amount rendering (Property 13)
    - **Property 13: Currency Amounts Rendered in Cyan** — for any payment record rendered in the table, the amount cell class list includes `text-[#06b6d4]` and `font-semibold`
    - **Validates: Requirements 10.6**

- [x] 10. Redesign `RideHistoryTab.tsx` — timeline cards and empty state
  - [x] 10.1 Rebuild ride list as vertical timeline with `TimelineCard`
    - Keep outer `relative space-y-6` container and the vertical timeline line `absolute left-6 ... bg-gradient-to-b from-primary/30`
    - Replace each ride's inner `bg-card overflow-hidden rounded-2xl` collapsible with a non-collapsible `TimelineCard` layout:
      - Left: date badge (`rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-3 py-2 min-w-[52px]` with abbreviated month in `text-[10px] text-[#7c3aed] uppercase font-bold tracking-widest` and day number in `text-xl font-extrabold`)
      - Route label: parse `ride.notes` for `→` separator → `"From → To"`; fallback `"Home → MITE"`
      - Passenger chips: per attendee, render first word of `a.member.name` in `rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 text-[10px]`
      - Cost block (right): "per person" label → per-person cost in `text-[#06b6d4] font-bold`; total with violet bullet `●` in `text-[#7c3aed] font-semibold`
      - Keep ride status badge and expand/collapse for trip details + attendees section; keep admin-gated Delete and Duplicate buttons unchanged
    - Wrap `TimelineCard` outer div in `.glass-premium rounded-2xl`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 15.1, 15.4, 17.1_

  - [x] 10.2 Replace empty state with animated calendar SVG + admin CTA
    - When `rides.length === 0`, render: animated calendar SVG with gradient stroke `#7c3aed → #06b6d4`; heading "No rides yet" with gradient text violet → cyan
    - Render "Create First Ride" CTA button with `bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]` only when `isAdmin === true`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 15.1_

  - [ ]* 10.3 Write property tests for timeline card data rendering (Properties 14, 15, 16)
    - **Property 14: Timeline Date Badge Formatting** — for any valid `Date`, month abbreviation and day are non-empty, non-undefined strings
    - **Property 15: Route Parsing with Fallback** — notes with `→` parses correctly; absent or empty notes defaults to "Home → MITE"
    - **Property 16: TimelineCard Ride Data Rendering** — N attendees → N chips; per-person cost = totalCost/N in cyan; total cost includes violet `●`
    - **Validates: Requirements 12.2, 12.4, 12.5, 12.6, 12.7**

- [ ] 11. Final checkpoint — glass coverage and no old indigo remnants
  - Search all modified files for `#6366F1` and replace any remaining instances with `#7c3aed`
  - Verify every top-level content card in all four tabs carries `glass-premium` class
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP; property tests validate formal correctness properties from the design document
- Task 1 must be complete before any other tasks — all colour tokens flow from `globals.css`
- Tasks 4 and 5 (new chart components) are independent of each other and can be built in parallel
- The `indicatorStyle` position computation logic in `tab-router.tsx` is preserved unchanged — only the visual fill of the sliding element changes
- `getInitials` and `getAvatarGradient` are pure functions defined inline in `PendingPaymentsTab.tsx`; no shared utility file needed
- Recharts `PieChart`/`BarChart` are already in the bundle via `recharts@^3.8.1` — no bundle cost added
- All `isAdmin &&` conditional rendering expressions must be preserved verbatim across all modified components
- `MonthlyFuelChart.tsx` remains unchanged; `WeeklyEarningsBarChart.tsx` is a new file alongside it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "4.1", "5.1"] },
    { "id": 2, "tasks": ["4.2", "5.2", "6.1", "6.2"] },
    { "id": 3, "tasks": ["6.3", "6.4", "8.1", "9.1"] },
    { "id": 4, "tasks": ["8.2", "8.3", "9.2", "9.3", "9.4", "10.1"] },
    { "id": 5, "tasks": ["8.4", "8.5", "9.5", "10.2"] },
    { "id": 6, "tasks": ["10.3"] }
  ]
}
```
