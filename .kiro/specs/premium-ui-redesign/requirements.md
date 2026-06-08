# Requirements Document

## Introduction

This document captures the formal requirements for the premium UI/UX redesign of the MITE Ride Manager web app. The redesign is a purely presentational upgrade that shifts the existing indigo-primary design system to an electric violet + cyan dual-accent palette on a near-black base, elevates all surfaces to true glassmorphism cards with backdrop blur, and upgrades each tab's information architecture to match a premium dark SaaS interface. No server actions, Prisma schema, data shapes, or TypeScript interfaces are changed.

## Glossary

- **Design_System**: The CSS token layer and utility classes defined in `globals.css` that drive all visual styling across the application.
- **AppShell**: The top-level shell component (`AppShell.tsx`) that renders the ambient background, header, and wraps all tab content.
- **TabRouter**: The navigation component (`tab-router.tsx`) that renders the glass pill nav bar with a sliding active indicator.
- **DashboardTab**: The main overview tab component (`DashboardTab.tsx`) showing the hero card, stat grid, and charts.
- **PendingPaymentsTab**: The tab component (`PendingPaymentsTab.tsx`) listing member payment cards for outstanding amounts.
- **PaymentHistoryTab**: The tab component (`PaymentHistoryTab.tsx`) showing the filter bar and paginated payment history table.
- **RideHistoryTab**: The tab component (`RideHistoryTab.tsx`) showing the ride timeline.
- **StatCard**: A reusable glassmorphism card component rendering a metric value, label, trend badge, and sparkline.
- **HeroCard**: The full-bleed gradient vehicle banner at the top of DashboardTab.
- **WeeklyEarningsBarChart**: A new Recharts `BarChart` component displaying the last 6 months of fuel spend.
- **CollectionRateDonutChart**: A new Recharts `PieChart`/donut component displaying collected vs pending amounts.
- **SparklineChart**: The existing small inline chart component used within StatCards.
- **MemberCard**: A glass card component in PendingPaymentsTab representing one member's pending payment.
- **TimelineCard**: A card component in RideHistoryTab representing one ride in a vertical timeline layout.
- **Glass_Surface**: Any card or container styled with `glass-premium` class — `backdrop-filter: blur(20px)`, `background: rgba(255,255,255,0.04)`, and a subtle white border.
- **CSS_Token**: A CSS custom property (e.g. `--primary`, `--cyan`) defined in `globals.css` and consumed by all components.
- **AnimatedCounter**: A client-side `requestAnimationFrame` hook that counts a displayed number up from 0 to its target value over 800 ms.
- **EmptyState**: An in-tab placeholder rendered when a data list is empty, consisting of an animated SVG illustration and gradient text.
- **Admin**: A user for whom the `isAdmin` prop is `true`; only Admins see Create Ride, Settings, Mark Paid, and Delete Ride controls.

---

## Requirements

### Requirement 1: Design Token System Upgrade

**User Story:** As a developer, I want all visual tokens updated to the new violet + cyan palette, so that every component inherits the premium colour scheme without per-component colour overrides.

#### Acceptance Criteria

1. THE Design_System SHALL define `--primary` as `#7c3aed` (electric violet) in both `:root` and `.dark` selectors, replacing the previous indigo `#6366F1` value.
2. THE Design_System SHALL define `--primary-glow` as `#6d28d9` (purple) in both `:root` and `.dark` selectors.
3. THE Design_System SHALL define a new `--cyan` token as `#06b6d4` in both `:root` and `.dark` selectors.
4. THE Design_System SHALL define `--background` as `#08090d`, `--card` as `#0f1117`, and `--surface-2` as `#161922`.
5. THE Design_System SHALL define `--border` as `rgba(255,255,255,0.08)`.
6. THE Design_System SHALL define `.glass-premium` with `background: rgba(255,255,255,0.04)`, `backdrop-filter: blur(20px)`, `-webkit-backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.08)`, and `box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06)`.
7. THE Design_System SHALL define a `::-webkit-scrollbar` rule setting `width: 4px` and `height: 4px`, with a thumb using a `linear-gradient(to bottom, #7c3aed, #6d28d9)` and `border-radius: 999px`.
8. THE Design_System SHALL define `@keyframes count-up` for the AnimatedCounter number entrance animation.
9. THE Design_System SHALL define `@keyframes gradient-shift` for use on the HeroCard background animation.
10. IF any modified file retains the colour value `#6366F1`, THEN THE Design_System SHALL be considered non-compliant and the value SHALL be replaced.

---

### Requirement 2: AppShell Ambient Background

**User Story:** As a user, I want a visually immersive dark ambient background with coloured glow blobs, so that the app feels premium even before interacting with any content.

#### Acceptance Criteria

1. THE AppShell SHALL render four ambient glow blobs at fixed positions: top-left (violet `#7c3aed` at 10% opacity, 500 px, blur-120), top-right (purple `#6d28d9` at 10% opacity, 400 px, blur-100), bottom-right (cyan `#06b6d4` at 10% opacity, 300 px, blur-80), and bottom-left (violet `#7c3aed` at 5% opacity, 600 px, blur-150).
2. THE AppShell SHALL render a fixed top accent bar using a `linear-gradient` from `#7c3aed` via `#6d28d9` to `#7c3aed`.
3. THE AppShell header SHALL apply the `.glass-premium` style using the updated token values.
4. WHILE the app is running, THE AppShell SHALL preserve the existing "System Online" footer indicator using the success-green colour unchanged.

---

### Requirement 3: Glass Pill Navigation Bar

**User Story:** As a user, I want a glass pill navigation bar with a smoothly animated active indicator, so that switching tabs feels fluid and premium.

#### Acceptance Criteria

1. THE TabRouter SHALL render the outer nav container as a `.glass-premium` surface.
2. THE TabRouter SHALL render an active tab sliding indicator with `background: linear-gradient(to right, #7c3aed, #6d28d9)` and `box-shadow: 0 0 20px rgba(124,58,237,0.4)`.
3. WHEN a user clicks a tab, THE TabRouter SHALL animate the sliding indicator to the new tab position using a CSS transition of 400 ms with cubic-bezier(0.34, 1.56, 0.64, 1).
4. WHEN a tab is active, THE TabRouter SHALL apply a `drop-shadow` filter of `0 0 8px rgba(124,58,237,0.6)` to its icon.
5. WHEN a tab is inactive, THE TabRouter SHALL render its icon and label at `text-white/30` opacity, transitioning to `text-white/60` on hover.
6. THE TabRouter SHALL preserve the `indicatorStyle.left` and `indicatorStyle.width` computation via `tabRefs` unchanged; only the gradient fill of the indicator element changes.
7. THE TabRouter SHALL apply per-tab glow colours on the active icon: Dashboard and History tabs use violet `rgba(124,58,237,0.6)`, Create Ride uses emerald `rgba(16,185,129,0.6)`, Pending uses amber `rgba(245,158,11,0.6)`, Rides uses cyan `rgba(6,182,212,0.6)`, and Settings uses slate `rgba(100,116,139,0.6)`.
8. WHILE the viewport is mobile-sized, THE TabRouter SHALL preserve horizontal scrolling on the tab bar without layout breakage.

---

### Requirement 4: Dashboard Hero Vehicle Card

**User Story:** As a user, I want a visually striking hero card showing vehicle stats and the live fuel price, so that the most important daily context is immediately visible at the top of the dashboard.

#### Acceptance Criteria

1. THE HeroCard SHALL render a full-bleed gradient banner with background gradient from `#1a0533` (deep purple) to `#0a1628` (dark navy).
2. THE HeroCard SHALL display the `car-hero.png` image right-aligned with a violet rim-light `box-shadow` of `0 0 60px rgba(124,58,237,0.3), 0 0 120px rgba(109,40,217,0.15), inset 0 0 40px rgba(124,58,237,0.05)`.
3. THE HeroCard SHALL display a live fuel price badge containing a pulsing green status dot, the `todayPetrolPrice` value formatted as `₹{price}/L`, and the label "Live".
4. THE HeroCard SHALL display a 2×2 spec grid inside a frosted panel showing: Active Mileage (km/L), Route Distance (km), Fuel Required (L), and Est. Trip Cost (₹) with the cost value rendered in the `--primary` violet colour.
5. THE HeroCard SHALL apply the `@keyframes gradient-shift` animation to its background.
6. THE HeroCard SHALL render with `border-radius: 1.5rem` (`rounded-3xl`) and `overflow: hidden`.

---

### Requirement 5: Dashboard Stat Cards with Sparklines

**User Story:** As a user, I want four metric stat cards with animated counters, trend badges, and sparklines, so that I can quickly assess financial health at a glance.

#### Acceptance Criteria

1. THE DashboardTab SHALL render exactly four StatCards: Today's Fuel Cost (violet accent `#7c3aed`), Total Pending (amber accent `#f59e0b`), Total Collected (cyan accent `#06b6d4`), and Collection Rate (green accent `#10b981`).
2. WHEN DashboardTab data loads, THE StatCard SHALL animate its numeric value from 0 to the target value using the AnimatedCounter over 800 ms with an ease-out cubic easing curve.
3. THE StatCard SHALL display the metric label in `font-size: 11px`, `text-transform: uppercase`, and `letter-spacing: 0.1em`.
4. THE StatCard SHALL display the metric value in `font-size: 36–40px` and `font-weight: 300`.
5. THE StatCard SHALL display an icon in a 44×44 px coloured square using the card's accent colour at 10% opacity as background and 100% opacity as icon colour.
6. THE StatCard SHALL include a trend badge showing the delta percentage versus the prior period, rendered as a rounded-full pill in green (`bg-success/15 text-success`) for a positive trend and red (`bg-destructive/15 text-destructive`) for a negative trend, with an ArrowUpRight or ArrowDownRight icon.
7. THE StatCard SHALL render a SparklineChart at the bottom of the card using the card's accent colour.
8. WHEN a user hovers a StatCard, THE StatCard SHALL apply `translateY(-2px)` transform and `box-shadow: 0 0 20px rgba(124,58,237,0.15)`.
9. THE DashboardTab SHALL compute `collectionRate` as `totalCollected / (totalPending + totalCollected) * 100` client-side from the existing DashboardData shape.

---

### Requirement 6: Dashboard Charts

**User Story:** As a user, I want a bar chart and a donut chart on the dashboard, so that I can understand weekly earnings trends and the collection rate visually.

#### Acceptance Criteria

1. THE DashboardTab SHALL render a WeeklyEarningsBarChart and a CollectionRateDonutChart in a side-by-side row, with the bar chart spanning two thirds and the donut chart spanning one third on large screens.
2. THE WeeklyEarningsBarChart SHALL use Recharts `BarChart` with `ResponsiveContainer`, and fill bars using a `linearGradient` SVG definition from `#7c3aed` to `#6d28d9`.
3. THE WeeklyEarningsBarChart SHALL render X-axis labels as short month names and the Y-axis in ₹ amounts, sourced from the `monthlyFuelSpend` array in DashboardData.
4. THE CollectionRateDonutChart SHALL use Recharts `PieChart` with `Pie` set to `innerRadius={55}` and `outerRadius={85}` to create a donut shape.
5. THE CollectionRateDonutChart SHALL render the collected segment in cyan `#06b6d4` and the pending segment in amber `#f59e0b`.
6. THE CollectionRateDonutChart SHALL display the collection rate percentage as a centred label inside the donut ring.
7. THE CollectionRateDonutChart SHALL render "Collected" and "Pending" pill legend labels below the chart.
8. THE WeeklyEarningsBarChart SHALL display a glass-styled custom tooltip consistent with the existing tooltip pattern in the codebase.
9. THE DashboardTab SHALL compute donut chart data client-side as `[{ name: "Collected", value: totalCollected }, { name: "Pending", value: totalPending }]` from the existing DashboardData shape without any server action changes.

---

### Requirement 7: Pending Payments Tab — Summary Pills

**User Story:** As a user, I want three summary stat pills at the top of the Pending tab showing counts at a glance, so that I can immediately see how many payments are pending, overdue, or total members.

#### Acceptance Criteria

1. THE PendingPaymentsTab SHALL render three summary stat pills: Pending count (amber `#f59e0b` accent), Overdue count (red `#f43f5e` accent), and Members count (violet `#7c3aed` accent).
2. THE PendingPaymentsTab SHALL render each summary pill as a `.glass-premium` surface with a subtle gradient border and an inline icon, large number, and label.
3. WHEN the overdue count is greater than zero, THE PendingPaymentsTab SHALL render an `animate-pulse` indicator on the overdue pill's dot.

---

### Requirement 8: Pending Payments Tab — Member Avatar Cards

**User Story:** As a user, I want each pending payment shown as a glass card with the member's avatar initials, so that I can scan who owes what at a glance.

#### Acceptance Criteria

1. THE PendingPaymentsTab SHALL render each pending payment item as a MemberCard — a `.glass-premium` surface — replacing any previous table-row or list-item rendering.
2. THE MemberCard SHALL display a 44×44 px circular avatar with the member's initials derived by taking the first letter of each word in `memberName`, uppercased, and truncated to two characters.
3. THE MemberCard SHALL assign an avatar background gradient deterministically from the array `["from-violet-500 to-purple-600", "from-cyan-500 to-blue-600", "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-emerald-500 to-teal-600", "from-indigo-500 to-violet-600"]` using the index `sum_of_char_codes(memberName) % 6`.
4. THE MemberCard SHALL display the `amount` value in cyan `text-[#06b6d4]`.
5. THE MemberCard SHALL display the member's name in bold and the ride date in muted text.
6. THE MemberCard SHALL display a status badge using the styles: PAID → `bg-success/10 text-success border-success/20`, PENDING → `bg-warning/10 text-warning border-warning/20`, OVERDUE → `bg-destructive/10 text-destructive border-destructive/20`, VERIFICATION → `bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20`.
7. WHERE the `isAdmin` prop is `true`, THE MemberCard SHALL display a "Mark Paid" CTA button with `background: linear-gradient(to right, #7c3aed, #6d28d9)`.
8. WHERE the `isAdmin` prop is `false`, THE MemberCard SHALL hide the "Mark Paid" button and render a "Pay Now" button instead for non-admin users.

---

### Requirement 9: Pending Payments Tab — Empty State

**User Story:** As a user, I want an animated empty state when all payments are settled, so that the cleared state feels rewarding and polished.

#### Acceptance Criteria

1. WHEN the pending payments list is empty, THE PendingPaymentsTab SHALL render an animated SVG checkmark with a gradient stroke transitioning from `#7c3aed` to `#06b6d4`.
2. WHEN the pending payments list is empty, THE PendingPaymentsTab SHALL display the heading "All Clear!" with a gradient text style from violet to cyan.
3. WHEN the pending payments list is empty, THE PendingPaymentsTab SHALL display the sub-label "Everyone is paid up".
4. THE PendingPaymentsTab SHALL animate the SVG checkmark using `stroke-dasharray` and `stroke-dashoffset` CSS animation, not a third-party library.

---

### Requirement 10: Payment History Tab — Filter Bar and Table

**User Story:** As a user, I want a glass pill filter bar and a styled table with sticky header, so that I can quickly search and review payment history with clear visual hierarchy.

#### Acceptance Criteria

1. THE PaymentHistoryTab SHALL render a filter bar at the top containing a search pill, a member selector dropdown, a time-range dropdown, a CSV export button, and a JSON export button.
2. THE PaymentHistoryTab SHALL style all filter inputs as `rounded-full` pill shapes with `bg-white/[0.04] border border-white/[0.08]` glass styling.
3. THE PaymentHistoryTab SHALL style the export buttons with `border border-[#7c3aed]/40 text-[#7c3aed]` and on hover apply `hover:bg-[#7c3aed]/10`.
4. THE PaymentHistoryTab SHALL render the table with a sticky header using `backdrop-blur-xl` and `bg-card/90`.
5. THE PaymentHistoryTab SHALL render even table rows with `background: rgba(255,255,255,0.02)` and apply `background: rgba(255,255,255,0.04)` with a left violet border accent on row hover.
6. THE PaymentHistoryTab SHALL display all currency amount values using `text-[#06b6d4]` (cyan) and `font-semibold`.
7. THE PaymentHistoryTab SHALL render three summary stat cards above the filter bar — Total Collected (green icon), Avg Payment (violet icon), and Records count (cyan icon) — as static `.glass-premium` cards without sparklines.

---

### Requirement 11: Payment History Tab — Empty State

**User Story:** As a user, I want an animated empty state in the history tab when no records exist, so that the tab remains visually cohesive rather than showing a blank space.

#### Acceptance Criteria

1. WHEN the payment history list is empty, THE PaymentHistoryTab SHALL render an animated rising-chart SVG illustration with a gradient stroke from `#7c3aed` to `#06b6d4`.
2. WHEN the payment history list is empty, THE PaymentHistoryTab SHALL display the heading "No history yet" with gradient text from violet to cyan.

---

### Requirement 12: Ride History Tab — Timeline Cards

**User Story:** As a user, I want each ride displayed as a timeline card with a date badge, route display, passenger chips, and per-person cost, so that I can quickly scan the full ride history in a structured format.

#### Acceptance Criteria

1. THE RideHistoryTab SHALL render each ride as a TimelineCard in a vertical timeline layout connected by a vertical line between cards.
2. THE TimelineCard SHALL display a date badge on the left containing the abbreviated month in uppercase violet text (`text-[10px] text-[#7c3aed] uppercase font-bold tracking-widest`) and the numeric day in large bold white text (`text-xl font-extrabold`).
3. THE TimelineCard date badge SHALL be styled as `rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-3 py-2 min-w-[52px]`.
4. THE TimelineCard SHALL display a route label in "From → To" format, defaulting to "Home → MITE" when no route information is present in `ride.notes`, and parsing the `→` separator from `ride.notes` when present.
5. THE TimelineCard SHALL display passenger chips for each attendee, rendering the first word of the member name in a `rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 text-[10px]` chip.
6. THE TimelineCard SHALL display the per-person cost (`ride.totalCost / ride.attendees.length`) in cyan `text-[#06b6d4] font-bold` with a "per person" label above and the total cost in muted text below.
7. THE TimelineCard SHALL display the total ride cost with a violet bullet `●` rendered in `text-[#7c3aed] font-semibold`.

---

### Requirement 13: Ride History Tab — Empty State

**User Story:** As a user, I want an animated empty state in the rides tab when no rides exist, so that first-time users and empty states feel intentional and premium.

#### Acceptance Criteria

1. WHEN the ride list is empty, THE RideHistoryTab SHALL render an animated calendar SVG illustration with a gradient stroke from `#7c3aed` to `#06b6d4`.
2. WHEN the ride list is empty, THE RideHistoryTab SHALL display the heading "No rides yet" with gradient text from violet to cyan.
3. WHEN the ride list is empty AND `isAdmin` is `true`, THE RideHistoryTab SHALL render a "Create First Ride" CTA button with `background: linear-gradient(to right, #7c3aed, #6d28d9)`.
4. WHEN the ride list is empty AND `isAdmin` is `false`, THE RideHistoryTab SHALL NOT render the "Create First Ride" CTA button.

---

### Requirement 14: Responsive Mobile Layout

**User Story:** As a mobile user, I want the redesigned interface to remain fully usable on small screens, so that the premium visual upgrade does not break the existing mobile experience.

#### Acceptance Criteria

1. WHILE the viewport width is below the `sm` breakpoint, THE DashboardTab stat card grid SHALL collapse to a single-column layout.
2. WHILE the viewport width is below the `sm` breakpoint, THE TabRouter SHALL preserve horizontal scrolling on the nav bar without layout overflow.
3. WHILE the viewport width is below the `sm` breakpoint, THE HeroCard SHALL stack its text content and car image vertically.
4. WHILE the viewport width is below the `lg` breakpoint, THE DashboardTab chart row SHALL stack the WeeklyEarningsBarChart and CollectionRateDonutChart vertically to full width.

---

### Requirement 15: Admin Gating Preservation

**User Story:** As a system, I want all admin-only controls to remain gated behind the `isAdmin` prop, so that the visual redesign does not accidentally expose restricted features to non-admin users.

#### Acceptance Criteria

1. THE DashboardTab, PendingPaymentsTab, RideHistoryTab, and TabRouter SHALL preserve all existing `isAdmin &&` conditional rendering expressions unchanged; only the visual styling of the gated elements changes.
2. WHEN `isAdmin` is `false`, THE TabRouter SHALL not render the Create Ride tab and the Settings tab.
3. WHEN `isAdmin` is `false`, THE PendingPaymentsTab SHALL not render "Mark Paid" buttons on MemberCards.
4. WHEN `isAdmin` is `false`, THE RideHistoryTab SHALL not render "Delete Ride" controls on TimelineCards.

---

### Requirement 16: TypeScript Interface and Dependency Stability

**User Story:** As a developer, I want the redesign to introduce no new npm packages and preserve all existing TypeScript interfaces, so that the change is safe to merge without dependency audits or type-system churn.

#### Acceptance Criteria

1. THE implementation SHALL not add any new entries to the `dependencies` or `devDependencies` sections of `package.json`.
2. THE implementation SHALL not modify the `DashboardData`, `PendingItem`, `PaymentRecord`, or `Ride` TypeScript interfaces.
3. THE implementation SHALL not modify any server action file under `app/actions/`.
4. THE implementation SHALL not modify the Prisma schema at `prisma/schema.prisma`.
5. THE WeeklyEarningsBarChart and CollectionRateDonutChart components SHALL import only from packages already present in `package.json` (`recharts`, `lucide-react`, `tailwindcss`, `clsx`).

---

### Requirement 17: Glass Surface Coverage

**User Story:** As a user, I want every major content card in the app to use the glassmorphism surface style, so that the visual language is consistent throughout all tabs.

#### Acceptance Criteria

1. THE DashboardTab, PendingPaymentsTab, PaymentHistoryTab, and RideHistoryTab SHALL render every top-level content card (stat cards, member cards, timeline cards, summary cards) as a `.glass-premium` surface.
2. THE implementation SHALL not leave any component that previously used `bg-card` as a top-level card surface without upgrading it to `glass-premium`.
3. WHEN a `.glass-premium` card is rendered, THE card SHALL apply `backdrop-filter: blur(20px)` and `background: rgba(255,255,255,0.04)` as defined in the Design_System.
