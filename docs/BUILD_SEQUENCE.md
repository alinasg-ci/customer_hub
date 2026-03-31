# Build Sequence — Milestone 1

Step-by-step feature build order. Complete each step and verify the checkpoint before moving to the next. Reference the PRD (`/docs/PRD.md`) for detailed specs on each feature.

---

## Step 0: Project setup

**What to build:**
- Initialize Next.js project with TypeScript
- Configure Tailwind CSS
- Set up Supabase project (database + auth)
- Configure Vercel deployment (connect repo, set environment variables)
- Create the module directory structure (see CLAUDE.md)
- Set up Supabase Auth with email/password login
- Create the app layout: sidebar navigation + main content area + notification badge placeholder

**PRD reference:** Section 4.1 (Stack), Section 4.8 (Modularity layer), Section 6 (Security)

**Checkpoint:**
- [ ] `npm run dev` works locally
- [ ] Deployed to Vercel (preview URL works)
- [ ] Login/logout works with Supabase Auth
- [ ] Empty app shell with navigation renders after login
- [ ] Unauthenticated access redirected to login
- [ ] All environment variables configured in Vercel

---

## Step 1: Client CRUD + archive

**What to build:**
- Supabase migration: `Client` table (see PRD section 4.2)
- RLS policy: `WHERE user_id = auth.uid()`
- `modules/clients/`: components, hooks, API layer
- Client list page (main screen)
- Create client form (name, company)
- Edit client
- Archive client (soft delete — set status to archived)
- Archive section (separate view, search + filter)
- Re-activate archived client
- Empty state: big "+" button with guidance text (see PRD F1.7)

**PRD reference:** Section F1.1, Section F1.7 (first-time setup), Section 4.2 (Client entity)

**Checkpoint:**
- [ ] Create a client → appears in list
- [ ] Edit client name → updates immediately
- [ ] Archive client → disappears from active list, appears in archive
- [ ] Re-activate archived client → moves back to active list
- [ ] Empty state shows "+" and guidance on first launch
- [ ] RLS prevents accessing other users' data (test by querying Supabase directly with a different user)

---

## Step 2: Project creation (all 3 types)

**What to build:**
- Supabase migrations: `Project`, `SubProject` tables
- `modules/projects/`: components, hooks, API layer
- Project creation form with type selector (project / retainer / hour_bank)
- Type-specific required fields:
  - **Project:** name, rate, scoped hours, fee (auto-calc), deadline
  - **Retainer:** name, periodic fee, billing period, start date
  - **Hour bank:** name, total hours, rate, total cost (auto-calc)
- Sub-project CRUD within hour banks (name, allocated hours, billed hours)
- Project status management (active / pending / closed)
- Currency input (ILS default, USD/EUR option) — just the input fields for now, conversion logic comes in Step 8
- Client 360° view page: shows all projects for a client

**PRD reference:** Section F1.2, Section 4.2 (Project, SubProject entities)

**Checkpoint:**
- [ ] Create one of each project type with all required fields → saved correctly
- [ ] Project type "project": fee auto-calculates as rate × hours
- [ ] Project type "hour_bank": total cost auto-calculates as rate × hours
- [ ] Create sub-projects within an hour bank → hours display alongside bank total
- [ ] Validation: sub-project allocated hours show warning if they exceed bank total
- [ ] Change project status → visual indicator updates
- [ ] Closed projects appear de-emphasized but visible
- [ ] Client 360° view shows all projects for that client

---

## Step 3: Planning tiles (two-layer)

**What to build:**
- Supabase migration: `Phase` table
- `modules/planning/`: components, hooks, API layer
- Phase creation within a project (name, quoted hours, internal planned hours)
- Interactive tile UI:
  - Drag-and-drop reordering (@dnd-kit)
  - Inline text editing (click to edit phase name)
  - Inline number editing (click to edit hours)
  - Auto-recalculate totals on every change
  - Auto-save on every change
- Two layers: client budget view vs. internal plan view
- Side-by-side comparison view (phase | quoted hours | internal hours | delta)
- Visual flag when a phase's hours exceed the quoted allocation
- "Add phase" and "add sub-task" buttons

**PRD reference:** Section F1.3, Section F1.4, Section 4.2 (Phase entity)

**Checkpoint:**
- [ ] Create phases → appear as tiles
- [ ] Drag a tile → order updates and persists after page reload
- [ ] Click phase name → edit inline → auto-saves
- [ ] Click hours → edit inline → totals recalculate instantly
- [ ] Add a new phase in the middle of the list → inserted at correct position
- [ ] Comparison view shows both layers side by side with deltas
- [ ] Phase with internal hours > quoted hours shows a visual flag
- [ ] Total hours recalculate correctly across all phases

---

## Step 4: Notes and expenses

**What to build:**
- Supabase migrations: `Note`, `Expense` tables
- `modules/notes/`: components, hooks, API layer
- `modules/expenses/`: components, hooks, API layer
- Note editor: add note to any phase, project, or sub-project. Free text, timestamped.
- Note list: display notes on the relevant entity
- Expense creation form: description, amount, currency, date, category, optional phase/sub-project assignment, optional attachment link
- Expense list per project (filterable by category, phase)
- General vs. phase-specific expense flag

**PRD reference:** Section F1.3 (notes and expenses portion), Section 4.2 (Note, Expense entities)

**Checkpoint:**
- [ ] Add a note to a phase → displays with timestamp
- [ ] Add a note to a project → displays in project view
- [ ] Create an expense in ILS → appears in expense list
- [ ] Create an expense assigned to a specific phase → shows under that phase
- [ ] Create a general expense (no phase) → shows at project level
- [ ] Expense list filters by category work correctly

---

## Step 5: Toggl connection + sync

**What to build:**
- Supabase migrations: `TogglConnection`, `TogglMapping`, `TogglCachedEntry` tables
- `modules/time-tracking/`: components, hooks, API layer
- API route: `/api/toggl/validate` — validates API token against Toggl
- API route: `/api/toggl/workspaces` — lists workspaces for the token
- API route: `/api/toggl/projects` — lists Toggl projects for a workspace
- API route: `/api/toggl/sync` — fetches time entries (proxies Toggl API, keeps token server-side)
- Settings page: Toggl connection flow
  1. Masked input for API token
  2. Token validation (call Toggl API)
  3. Workspace selection dropdown
  4. Project mapping UI (Toggl project → hub project, dropdown matching)
- Sync logic:
  - On project view load: fetch entries since last sync
  - Initial sync: pull up to 3 months of history
  - Upsert entries into `TogglCachedEntry`
  - Map entries to hub projects via `TogglMapping`
- Time entry list per project (date, duration, description, billable flag)
- Billable vs. non-billable split display
- `time-tracking/adapter.ts`: the interface layer (getTimeEntries, syncTime)

**PRD reference:** Section F1.5, Section F1.7 (Toggl connection flow), Section 4.5 (Toggl integration details)

**Checkpoint:**
- [ ] Enter a real Toggl API token → validates successfully
- [ ] Select workspace → Toggl projects load
- [ ] Map a Toggl project to a hub project → mapping saved
- [ ] Initial sync pulls history → entries appear in the project view
- [ ] Entries show: date, duration, description, billable flag
- [ ] Billable/non-billable totals are correct (cross-check with Toggl UI)
- [ ] Subsequent page load syncs only new entries (check `last_sync_at` updates)
- [ ] Invalid API token shows clear error message
- [ ] API token is never visible in browser network tab (all calls go through server-side routes)

---

## Step 6: Phase keyword mapping

**What to build:**
- Supabase migration: `PhaseKeyword` table
- Keyword input during phase creation (optional — "What do you call this in Toggl?")
- Auto-assignment logic: on Toggl sync, scan entry descriptions against PhaseKeyword table
- Unassigned entries queue: list of Toggl entries that didn't match any keyword
- Manual assignment UI: user selects a phase for an unassigned entry
- Learning prompt: after manual assignment, offer "Always assign entries containing '[keyword]' to [phase]?" → if confirmed, add to PhaseKeyword table
- Correction flow: user can change an auto-assigned entry's phase → prompt to update the mapping
- Phase-level hour totals now reflect Toggl entries (auto-assigned + manually assigned)

**PRD reference:** Section F1.5 (phase mapping subsection), Section 4.2 (PhaseKeyword entity), Section 4.5 (sync flow steps 4c-4e)

**Checkpoint:**
- [ ] Create a phase with keywords → Toggl entries matching those keywords auto-assign to the phase
- [ ] Entries with no keyword match appear in "unassigned" queue
- [ ] Manually assign an unassigned entry → learning prompt appears
- [ ] Confirm the learning prompt → keyword saved, future entries auto-assign
- [ ] Correct a wrong auto-assignment → prompt to update mapping
- [ ] Phase-level hours include both auto-assigned and manually assigned entries
- [ ] Keyword matching is case-insensitive
- [ ] Multiple keywords per phase work (entry matches any one of them)

---

## Step 7: Profitability calculations

**What to build:**
- `modules/profitability/`: components, hooks, `calculations.ts`
- Pure calculation functions (see PRD section 4.3):
  - Project: project value, actual income (capped at project value if over scope), effective rate, net income, profit margin, unbilled hours/cost
  - Retainer: retainer efficiency (effective hourly rate per period)
  - Hour bank (bank level): total consumed, remaining hours, net bank income
  - Hour bank (sub-project level): effectiveness percentage, effective rate
- Profitability card component: displays per project type
- Efficiency badge for retainers
- Effectiveness percentage for hour bank sub-projects
- Warning banner when actual hours exceed scoped hours (showing effective rate drop and unbilled cost)
- **Unit tests for every calculation function** — this is the highest-priority test target in the entire project

**PRD reference:** Section F1.3 (profitability portion), Section 4.3 (Profitability calculation logic)

**Checkpoint:**
- [ ] Project type: create a project with 50hrs at ₪200/hr. Log 40hrs → income shows ₪8,000, margin shows 80%. Log 60hrs → income caps at ₪10,000 (project value), effective rate drops to ₪166.67, unbilled hours warning shows 10hrs
- [ ] Retainer type: ₪8,000/month retainer. Log 40hrs → efficiency shows ₪200/hr. Log 80hrs → efficiency shows ₪100/hr
- [ ] Hour bank: 80hr bank at ₪180/hr. Sub-project allocated 30hrs, actual 20hrs → effectiveness 150%. Sub-project allocated 30hrs, actual 45hrs → effectiveness 67%
- [ ] Expenses reduce net income correctly for all types
- [ ] All calculation functions have passing unit tests
- [ ] Profitability updates in real time when time entries or expenses change

---

## Step 8: Currency conversion

**What to build:**
- `modules/expenses/currency.ts`: conversion logic
- API route: `/api/currency/rate` — fetches Bank of Israel rate for a date, caches in `ExchangeRate` table
- Supabase migration: `ExchangeRate` table
- Conversion on expense/fee save: if currency is USD or EUR, fetch rate for the specified date, compute ILS amount
- Fallback: if rate not available for exact date (weekend/holiday), use most recent available rate
- Display format: "₪2,700 (converted from $750 at 3.60 on March 15, 2026)"
- Retrofit: apply conversion to all money input fields in project creation (project fee, retainer fee, bank cost, rate)
- Unit tests for conversion logic and fallback behavior

**PRD reference:** Section 1.6 (Currency), Section 4.6 (Currency conversion), Section 4.2 (Expense fields, ExchangeRate entity)

**Checkpoint:**
- [ ] Enter a USD expense → ILS conversion appears with rate and date displayed
- [ ] Enter an expense on a Saturday → system falls back to Friday's rate
- [ ] Conversion rate matches Bank of Israel published rate (check manually on boi.org.il)
- [ ] Create a project with rate in USD → rate_per_hour_ils is correctly converted
- [ ] ExchangeRate cache table has entries (rates aren't re-fetched for the same date)
- [ ] BOI API failure → user sees a clear error, not a crash

---

## Step 9: Notifications

**What to build:**
- `modules/notifications/`: components, hooks, `triggers.ts`
- Notification trigger logic (see PRD section 4.4):
  - On every Toggl sync and manual hour entry: recalculate budget consumption
  - Thresholds: 80% (warning) and 100% (exceeded) for projects, phases, sub-projects, hour banks
  - No duplicate notifications for the same threshold
- Supabase migration: `Notification` table
- Notification center component (accessible from global nav)
- Notification badge (unread count)
- Notification card: message, threshold, link to project view
- Mark as read / dismiss
- Unit tests for trigger logic (especially: no duplicates, correct threshold detection)

**PRD reference:** Section F1.6, Section 4.4 (Notification trigger logic), Section 4.2 (Notification entity)

**Checkpoint:**
- [ ] Push a project to 80% consumption → notification created
- [ ] Push the same project to 85% → no duplicate notification
- [ ] Push to 100% → second notification created (exceeded)
- [ ] Notification badge shows correct unread count
- [ ] Click notification → navigates to the project view
- [ ] Mark as read → badge count decreases
- [ ] Hour bank at 80% → bank-level notification fires
- [ ] Sub-project at 100% → sub-project-level notification fires

---

## Step 10: Dynamic project report

**What to build:**
- `modules/reports/`: components, hooks
- Report table showing all time entries for a project (Toggl + manual)
- Grouping: by phase, by date, by description, by billable status — user switches on the fly
- Subtotals per group (hours and cost)
- Sorting: by any column (date, duration, description)
- Filtering: by date range, phase, billable/non-billable
- "Add up selected": user selects arbitrary entries → custom subtotal displayed
- CSV export
- Manual hour entry form (date, hours, description, billable, phase, note) — can be accessed from the report screen

**PRD reference:** Section F1.5 (report portion), Section F1.6 (manual entry)

**Checkpoint:**
- [ ] Report loads all entries (Toggl + manual) for a project
- [ ] Switch grouping → data re-renders within 300ms
- [ ] Group by phase → subtotals match phase-level totals in planning view
- [ ] Filter by date range → only matching entries shown, subtotals recalculate
- [ ] Filter by billable → correct split
- [ ] Select 3 entries → custom subtotal shows sum of those 3
- [ ] CSV export downloads → file opens correctly in Excel/Sheets with all columns
- [ ] Add manual entry from report screen → appears immediately in the list
- [ ] Manual entries visually distinguished from Toggl entries

---

## Step 11: Final QA pass

**What to build:** Nothing new. This step is testing and fixing.

**Run through:**
1. All automated tests pass (`npm test`)
2. UX automated checklist (PRD section 5) — all 20 checks
3. Smoke test with real data (PRD section 7.2):
   - Create clients using real client names and project numbers
   - Connect real Toggl account
   - Verify profitability matches hand-calculated values
   - Test currency conversion against BOI website
   - Verify phase mapping catches common Toggl descriptions
4. User acceptance (PRD section 7.3):
   - All current active clients entered
   - Toggl syncing correctly
   - "Where am I on [client]?" answerable in under 30 seconds

**Checkpoint:**
- [ ] Zero failing tests
- [ ] All 20 UX checks pass
- [ ] Profitability numbers verified for at least 3 real projects
- [ ] No unhandled errors in Vercel logs during 2-3 days of use
- [ ] M1 is done. Move to M2.
