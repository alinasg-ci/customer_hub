# Product Requirements Document — Milestone 1

## Client Management Hub — MVP

**Version:** 2.1
**Date:** March 31, 2026
**Status:** Final — Ready for development

---

## 1. Product overview

### 1.1 Vision

A central hub for managing freelance client work — not a project management tool, but the single place where all client context lives. The system consolidates hours tracking, project planning, communication history, files, contacts, and tasks into one unified view per client.

### 1.2 Target user

An independent professional (market research, product marketing, applied AI) managing 5–7 active clients simultaneously. Works across Google Workspace (Gmail, Calendar, Drive), Toggl, Slack, and WhatsApp. Currently stitches together spreadsheets, Toggl reports, email search, and manual lists to maintain project awareness.

### 1.3 Core problem

No single place to answer: "Where do I stand with this client right now?" — across hours spent vs. budgeted, communication threads, deliverables, upcoming commitments, and open tasks. Context is scattered across 6+ tools and requires manual assembly.

### 1.4 Design principles

- **Push notifications — TBD.** Certain objects may warrant push notifications in future milestones. For M1, the system does not send any push notifications. In-hub notifications only. The notification model will be defined in a later milestone.
- **Always link to source.** Every AI-generated summary must include a direct link to the original email, message, or file. AI can hallucinate; the user must be able to verify. (Applies from M3 onward.)
- **Recommended action, never automatic.** Any action that modifies data (updating hours, changing scope, adding contacts) requires explicit user confirmation.
- **Interactive, not static.** Drag-and-drop, inline editing, reorderable tiles. The planning interface must feel like a workspace, not a report.
- **Parallel 360° view.** See everything about a client without switching tools or tabs.

### 1.5 Scale assumptions

- No hard limit on the number of active clients. The typical load is 5–7 active clients at any given time, but the system must not enforce a cap. No specialized infrastructure for high client volume is needed now, but the design should not introduce artificial constraints.
- No limit on total client count. Clients that are no longer active are moved to an archived/history section that is always accessible. The user must be able to browse, search, and re-open archived clients and their full project history at any time.
- 1–3 active projects per client.
- Single user (no multi-user or team features).

### 1.6 Currency

- **Base currency:** ILS (Israeli New Shekel). All monetary values are displayed and stored in ILS.
- **Foreign currency support:** USD and EUR. When a fee, rate, or expense is entered or extracted in USD or EUR, the system automatically converts it to ILS using the exchange rate on the proposal date.
- **Exchange rate source:** Bank of Israel daily published rates (free, no API key required).
- **Storage:** Every monetary value stores: `original_amount`, `original_currency`, `exchange_rate_used`, `exchange_rate_date`, `amount_ils`. The original values are preserved for audit and display. All calculations use `amount_ils`.

---

## 2. M1 scope — what this milestone delivers

### 2.1 What's in M1

- Client list with archive
- Three project types (project, retainer, hour bank with sub-projects)
- Two-layer planning (client-facing budget vs. internal plan with buffers)
- Interactive planning tiles (drag, reorder, inline edit, auto-recalculate)
- Notes and memos on all items
- Expense tracking with currency conversion
- Profitability calculations (per project type)
- Toggl integration (API sync + phase mapping via keyword matching)
- Dynamic project report (groupable, sortable, filterable)
- Over-budget flags and in-hub notifications
- Manual hour entry
- First-time setup flow
- Data migration: manual entry + Toggl full history pull

### 2.2 What's NOT in M1

- No AI / LLM integration (moved to M2/M3)
- No Google Drive connection (moved to M2)
- No document parsing / auto-extraction from proposals (moved to M2)
- No Google Calendar integration (M3 or later)
- No Gmail, Slack, or WhatsApp integration (M3+)
- No task management (M7)
- No push notifications
- No spreadsheet import

All project details (rates, hours, phases, client info) are entered manually in M1. AI extraction from uploaded documents will be added in M2 and will auto-fill the same fields the user enters manually in M1.

---

## 3. Features

### F1.1 Client list and archive

The main entry point. A list/grid of all active clients, plus an accessible archive of past clients.

**User stories:**
- As a user, I want to see all my active clients in one view so I can quickly navigate to any client.
- As a user, I want to see which clients have active projects at a glance so I can prioritize my day.
- As a user, I want to archive a client when the engagement ends so my active view stays clean.
- As a user, I want to access an archive/history section where I can browse all past clients and their full project history so nothing is ever lost.
- As a user, I want to re-activate an archived client so I can resume work if they come back.

**Definition of done:**
- Client list page loads and displays all active clients with name and active project count.
- Each client card shows a status indicator (active projects: green, pending: yellow, all closed: gray).
- Clicking a client navigates to the single client 360° view.
- Client can be added, edited (name, company), and archived.
- An "Archive" or "History" section is accessible from the main navigation — lists all archived clients with search and filter capability.
- Archived clients retain all project data, hours, and history — nothing is deleted.
- An archived client can be re-activated with one action, moving it back to the active list.
- No limit on the number of archived clients.

---

### F1.2 Project creation and types

Three project types per client, reflecting different engagement models.

**Project type definitions:**

**1. Project** — Time and cost constrained. Has a defined scope, fixed budget (hours and/or cost), and a deadline. May span several months. Work is tracked against phases and deliverables.

Example: "Honda competitive analysis — 50 hours at ₪200/hr, ₪10,000 project value, due June 30."

Required fields at creation: name, project rate (per hour), total scoped hours, total cost/fee (auto-calculated: rate × hours), deadline (optional), phase breakdown (optional — can be added later).

**2. Retainer** — Cost is set (monthly or periodic fee). Hours are tracked for efficiency. The user needs to understand how much time they're actually spending relative to what they're being paid, expressed as an effective hourly rate.

Example: "Modus monthly retainer — ₪8,000/month. If I work 40 hours, my effective rate is ₪200/hr. If I work 80 hours, it's ₪100/hr."

Required fields at creation: name, periodic fee amount (with currency), billing period (monthly/quarterly), start date.

Efficiency metric: `retainer efficiency = (retainer fee − expenses) / actual hours worked`. This gives the effective hourly rate. No target rate field — the user carries her own mental benchmark.

**3. Hour bank** — Time and cost are fixed (a pre-purchased block of hours). Can contain more than one sub-project or work stream within the same bank. Hours are drawn down across sub-projects.

Example: "Alma — 80 hour bank at ₪180/hr, ₪14,400 total. Used for strategy (allocated 30hrs), content (allocated 30hrs), and ad hoc requests (allocated 20hrs)."

Required fields at creation: name, total hours in bank, rate per hour, total cost (auto-calculated: rate × hours).

Sub-projects: each sub-project within an hour bank can optionally have its own hour allocation (carved from the bank total). These allocations are informal agreements with the client — not from the proposal. Default: `billed_hours = allocated_hours`. User can manually adjust billed hours in the 1% case where overage is negotiated.

Effectiveness per sub-project: `effectiveness = billed_hours / actual_hours`. Displayed as a percentage. Above 100% = efficient. Below 100% = over-invested.

Flags: at sub-project level (approaching/exceeding allocated hours) AND at bank level (total consumed approaching bank total — signal to flag to client).

**User stories:**
- As a user, I want to create a project (time + cost constrained) for scoped client work so I can track progress against a defined budget and deadline.
- As a user, I want to create a retainer for clients on periodic agreements so I can monitor my efficiency against the fixed fee.
- As a user, I want to create an hour bank for clients who pre-purchase hours so I can track drawdown across multiple work streams within the same bank.
- As a user, I want to set a project status (active, pending, closed) so the system knows which engagements are current.
- As a user, I want to have multiple projects per client, including parallel active projects, so I can reflect real-world client relationships.

**Definition of done:**
- User can create a project of type "project", "retainer", or "hour bank" under any client.
- All required fields per type are enforced (see definitions above).
- Auto-calculations work: project value = rate × hours; retainer efficiency recalculates on every Toggl sync; hour bank sub-project effectiveness recalculates on every Toggl sync.
- Currency input supports ILS (default), USD, EUR. Non-ILS amounts are converted on save using Bank of Israel rate for the specified date.
- Project status can be set to active, pending, or closed.
- Multiple projects can exist per client, including multiple active projects simultaneously.
- Closed projects remain visible in the client view (history) and are visually de-emphasized.
- Hour bank sub-projects: user can add, edit, remove sub-projects. Each sub-project has optional allocated hours. Total allocated across sub-projects cannot exceed bank total (validation warning, not hard block — user may want to leave some hours unallocated).

---

### F1.3 Two-layer planning, notes, expenses & profitability

The user maintains two views of the budget: what was quoted to the client (from the proposal) and an internal plan with buffers and realistic time estimates. On top of this, the user can attach notes to any item, track expenses, and monitor profitability in real time.

**User stories:**
- As a user, I want to enter the client-facing budget breakdown (phases and hours per phase from the proposal) so the system knows what I committed to.
- As a user, I want to create an internal plan with different hour allocations (including buffers) so I can plan realistically without exposing my padding to the client.
- As a user, I want to see both views side by side so I can compare my real progress against both the commitment and my internal plan.
- As a user, I want to add notes and memos to any planning item (phase, sub-task) and any execution item (time entry, expense) so I can capture context, decisions, and reminders in place.
- As a user, I want to track expenses — both general project expenses and specific line items — so I know my true cost, not just hours.
- As a user, I want to see profitability in real time so I always know whether a project is making or losing money.
- As a user, I want to see a profitability warning when my actual hours exceed the scoped hours so I can catch margin erosion early.

**Profitability calculations by project type:**

**Project type:**
- `project value = project rate × scoped hours`
- If actual hours ≤ scoped hours: `actual income = actual hours × project rate`
- If actual hours > scoped hours: `actual income = project value` (capped — she can't bill more than the project value unless scope is expanded)
- `effective rate = actual income / actual hours` (drops when hours exceed scope)
- `net project income = actual income − expenses`
- `profit margin = net project income / project value × 100`

**Retainer type:**
- `retainer efficiency = (retainer fee − expenses) / actual hours worked`
- This gives an effective hourly rate. No formal target — the user knows her benchmark.
- Displayed prominently: effective rate per period.

**Hour bank type (bank level):**
- `bank value = rate × total bank hours`
- `total consumed = sum of actual hours across all sub-projects`
- `remaining hours = total bank hours − total consumed`
- `net bank income = bank value − total expenses`

**Hour bank type (sub-project level):**
- `effectiveness = billed hours / actual hours × 100` (default: billed = allocated)
- `effective rate = (billed hours × bank rate − sub-project expenses) / actual hours`

**Definition of done:**
- Each project has a "client budget" layer (phases + hours from proposal) and an "internal plan" layer (phases + hours with buffers).
- Both layers are editable independently.
- A comparison view shows: phase name, client-quoted hours, internal-planned hours, actual hours (from Toggl), and delta.
- Over-budget phases are visually flagged (red/warning indicator).
- Notes/memos can be added to any phase, sub-task, time entry, or expense. Notes support free text and are timestamped.
- **Expenses layer:** user can add expenses per project with: description, amount, currency (ILS/USD/EUR), date, category (software, outsourcing, travel, other), and optional attachment/link. Expenses can be flagged as general (not tied to a phase) or phase-specific. Non-ILS expenses are auto-converted to ILS using the exchange rate for the expense date.
- **Profitability view:** real-time calculation per project type (see formulas above). Displayed at project level and (where applicable) at phase/sub-project level.
- Profitability warning triggers when actual hours exceed scoped hours — showing: effective rate drop, unbilled hours count, and cost of unbilled work.

---

### F1.4 Interactive planning tiles

The planning interface uses draggable, editable tiles — not a static table. Each tile represents a phase or sub-task with associated hours.

**User stories:**
- As a user, I want to drag and reorder phases so I can adjust my plan as priorities shift.
- As a user, I want to edit phase names and hours inline (click to edit) so I don't need a separate form.
- As a user, I want to add new phases or sub-tasks at any point so I can adapt when scope evolves.
- As a user, I want the system to automatically recalculate totals when I change any value so I always see accurate numbers.

**Definition of done:**
- Each phase/sub-task is a tile that can be dragged to reorder.
- Tile text (phase name) and hours are editable inline with a click.
- "Add phase" and "add sub-task" buttons are available at any position.
- Totals (hours, cost, profitability) recalculate in real time on any change.
- Tiles show a visual indicator when their hours exceed the client-quoted allocation.
- Changes are auto-saved (no manual save button required).

---

### F1.5 Toggl integration

Sync actual worked hours from Toggl via API. Hours are matched to clients and projects based on Toggl's project/client structure. Time entries are matched to phases via a keyword mapping system.

**Toggl API approach:**

| API | Usage in M1 | Plan required |
|-----|-------------|---------------|
| **Track API v9** (primary) | Fetch individual time entries by date range. All fields: description, tags, billable, project, duration. | Free |
| **Reports API v3** (optional enhancement) | Server-side grouped reports. Better performance for the dynamic report screen. | Starter ($9/mo) — user is already on this plan |
| **Webhooks** | Not used in M1. Deferred to later iteration. | — |

Key constraints: Track API v9 limits queries to a 3-month window and 1,000 entries per request. For the initial history pull (3 months of business data), a single call suffices. For ongoing sync, queries are filtered to entries since last sync. Rate limit: 30 req/hr (free) or 240 req/hr (Starter).

**Phase mapping via keyword matching:**

Toggl has projects but not phases. The hub maps Toggl entries to phases using a keyword-to-phase mapping system:

1. When the user creates a phase, she can optionally enter keywords that she uses in Toggl descriptions for that phase (e.g., phase "Research" → keywords: "competitive analysis", "market scan", "desk research").
2. On Toggl sync, each entry's description is scanned against the keyword mapping table. If a keyword match is found, the entry is auto-assigned to that phase.
3. Entries with no match appear as "unassigned" in the project view.
4. The user can manually assign unassigned entries to phases. When she does, the system offers: "Always assign entries containing '[keyword]' to [phase]?" If confirmed, the keyword is added to the mapping table — the system learns over time.
5. The user can correct wrong auto-assignments. Corrections update the mapping.

This is a lightweight, user-trained keyword classifier — no LLM needed. The mapping improves organically as the user works.

**User stories:**
- As a user, I want the system to pull my actual hours from Toggl so I don't need to manually enter time.
- As a user, I want to see billable vs. non-billable hours separated so I can track what's chargeable.
- As a user, I want to see the description of each time block from Toggl so I understand what work each entry represents.
- As a user, I want Toggl data to refresh automatically when I open a project so I always see current numbers.
- As a user, I want Toggl entries auto-assigned to phases based on keywords in the description so I don't have to manually sort every entry.
- As a user, I want to correct wrong phase assignments and have the system learn from my corrections so it gets better over time.
- As a user, I want to see a detailed project report — a full breakdown of all individual tasks done, not just total hours or phase-level summaries — so I can understand exactly where time went.
- As a user, I want the report to be a dynamic, interactive screen where I can group entries by phase, by date, by description, or by billable status, and see subtotals for each grouping, so I can slice the data the way I need it at any given moment.

**Definition of done:**
- System connects to Toggl API using user's API token.
- Toggl projects/clients are mapped to hub clients/projects (manual mapping during setup, remembered thereafter).
- Actual hours are pulled and displayed per project with: total hours, billable/non-billable split, and per-entry detail (date, duration, description, billable flag).
- Data refreshes on project view load (no manual sync button needed; optional manual refresh available).
- Hours from Toggl are read-only in the hub (no editing Toggl data from the hub).
- Phase mapping: keywords-to-phase table is functional. Auto-assignment on sync. Unassigned queue visible. Manual assignment with learning prompt. Correction flow.
- Initial history pull: on first Toggl connection, pull all available history (up to 3 months).
- **Project report screen:** a dynamic, interactive view that lists every individual time entry for the project. The report supports:
  - Grouping by: phase, date, description/task name, billable status — user can switch grouping on the fly.
  - Subtotals per group (hours and cost).
  - Sorting by any column (date, duration, description).
  - Filtering by: date range, phase, billable/non-billable.
  - An "add up selected" function: user can select arbitrary entries and see a custom subtotal.
  - Export capability (CSV) for external use.

---

### F1.6 Over-budget flag, notification, and manual entry

Clear visual indicators and user notifications when a project or phase exceeds its budget, plus the ability to manually log hours that aren't tracked in Toggl.

**User stories:**
- As a user, I want to see a clear warning when I'm approaching or have exceeded the quoted hours on any phase so I can adjust or flag it to the client.
- As a user, I want to be notified inside the hub when budget thresholds are crossed so I don't discover it too late.
- As a user, I want to manually add hours for work not tracked in Toggl so my totals are complete.

**Definition of done:**
- Any phase where actual hours exceed quoted hours shows a red/warning flag.
- Project-level summary shows total actual vs. total quoted with a progress bar that changes color at thresholds (green < 80%, yellow 80–100%, red > 100%).
- **Over-budget notification:** when a project, phase, or sub-project crosses a budget threshold (80% and 100%), the system generates an in-hub notification visible on next login. The notification includes: project/phase/sub-project name, percentage consumed, hours remaining or exceeded, and a direct link to the project view. Notifications are displayed in a notification center within the hub — not as push notifications (push TBD for a later milestone).
- **Hour bank specific:** bank-level notification when total consumed hours cross 80% and 100% of the bank total. Sub-project-level notification when allocated hours are approaching/exceeded.
- Manual hour entry form: date, hours, description, billable flag, phase assignment, and optional note.
- Manual entries are visually distinguished from Toggl entries (different icon or label).

---

### F1.7 First-time setup flow

What happens when the user opens the hub for the very first time.

**Flow:**

1. **First launch:** Empty state with a large centered "+" button and a message: "Create your first client to get started."
2. **Create client:** User enters client name and company. Client card appears.
3. **Create project:** User clicks into the client, creates a project (selects type: project/retainer/hour bank), enters required fields manually (rate, hours, fee, phases, etc.).
4. **Connect Toggl:** Accessible from a global settings area or prompted after first project creation. Flow:
   - Secure input field for Toggl API token (masked input, stored encrypted).
   - System validates the token against Toggl API.
   - On success: user selects which Toggl workspace to use.
   - System lists Toggl projects/clients from that workspace.
   - User maps Toggl projects to hub projects (dropdown matching).
   - System pulls full history (up to 3 months) on first sync.
5. **Done.** No wizard, no guided tour. The system is usable after step 3 (Toggl connection is optional — manual hours work without it).

**User stories:**
- As a user, I want the first screen to clearly show me how to get started so I'm not confused by an empty system.
- As a user, I want to connect Toggl with just my API token so the setup is fast.
- As a user, I want to map my Toggl projects to hub projects during setup so the sync works correctly from the start.
- As a user, I want to pull my full Toggl history on first connection so I have my existing data immediately.

**Definition of done:**
- First launch shows empty state with "+" and guidance text.
- Client creation works from empty state.
- Project creation works with all three types and their required fields.
- Toggl connection flow: token input (masked), validation, workspace selection, project mapping.
- Toggl validation: if token is invalid, clear error message ("Invalid API token. You can find your token in Toggl under Profile Settings.").
- Full history pull on first connection (up to 3 months, single API call).
- All fields that will later be auto-filled by AI extraction (M2) are manually editable from M1. No blocked fields.

---

## 4. Technical architecture — M1

### 4.1 Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React (SPA) | The system requires drag-and-drop tiles, inline editing, real-time recalculation on every change, dynamic report grouping/sorting/filtering, and a notification system — all within a single-page app. React provides component state management, efficient re-rendering, and a mature ecosystem for these patterns (dnd-kit for drag-and-drop, established form/list patterns). Plain HTML/CSS/JS would require manually managing DOM updates and state synchronization — essentially building a framework. React is the standard for this type of interactive application. Deployed on Vercel as static site. |
| Backend | Vercel serverless functions (API routes) | Matches deployment platform. Sufficient for single-user load. |
| Database | Supabase (PostgreSQL) | Hosted PostgreSQL with built-in auth, encryption at rest, daily backups. |
| Auth | Supabase Auth | Single-user login. Handles session management, token refresh, logout. 30-day session. |
| Deployment | Vercel | HTTPS, preview deployments per branch, serverless compute. Two environments: production + preview. |
| Currency rates | Bank of Israel API | Free, no API key. Daily USD/ILS and EUR/ILS rates. |

### 4.2 Data model

```
Client
├── id (uuid, PK)
├── name (text, required)
├── company (text)
├── status (enum: active | archived)
├── created_at (timestamp)
├── archived_at (timestamp, nullable)
└── user_id (uuid, FK — included for future multi-user, references Supabase auth.users)

Project
├── id (uuid, PK)
├── client_id (uuid, FK → Client)
├── name (text, required)
├── type (enum: project | retainer | hour_bank)
├── status (enum: active | pending | closed)
├── rate_per_hour (decimal) — the project rate
├── rate_currency (enum: ILS | USD | EUR, default ILS)
├── rate_exchange_rate (decimal, nullable) — rate used if non-ILS
├── rate_per_hour_ils (decimal) — converted rate
├── total_scoped_hours (decimal, nullable) — for project + hour_bank
├── total_fee (decimal) — auto-calculated or manually entered
├── total_fee_currency (enum: ILS | USD | EUR)
├── total_fee_ils (decimal)
├── deadline (date, nullable)
├── billing_period (enum: monthly | quarterly, nullable) — for retainer
├── retainer_fee (decimal, nullable) — periodic fee for retainer
├── retainer_fee_currency (enum: ILS | USD | EUR)
├── retainer_fee_ils (decimal, nullable)
├── start_date (date, nullable)
├── created_at (timestamp)
└── user_id (uuid, FK)

SubProject (for hour_bank type only)
├── id (uuid, PK)
├── project_id (uuid, FK → Project)
├── name (text, required)
├── description (text)
├── allocated_hours (decimal, nullable) — informal agreement with client
├── billed_hours (decimal, nullable) — defaults to allocated_hours
└── created_at (timestamp)

Phase
├── id (uuid, PK)
├── project_id (uuid, FK → Project)
├── sub_project_id (uuid, FK → SubProject, nullable)
├── name (text, required)
├── display_order (integer)
├── quoted_hours (decimal) — client-facing layer
├── internal_planned_hours (decimal) — internal layer with buffers
├── layer (enum: client | internal)
└── created_at (timestamp)

PhaseKeyword (keyword-to-phase mapping for Toggl)
├── id (uuid, PK)
├── phase_id (uuid, FK → Phase)
├── keyword (text, required) — e.g., "competitive analysis"
├── created_at (timestamp)
└── source (enum: user_entered | learned_from_correction)

Note
├── id (uuid, PK)
├── parent_type (enum: phase | time_entry | expense | project | sub_project)
├── parent_id (uuid)
├── text (text, required)
└── created_at (timestamp)

Expense
├── id (uuid, PK)
├── project_id (uuid, FK → Project)
├── phase_id (uuid, FK → Phase, nullable)
├── sub_project_id (uuid, FK → SubProject, nullable)
├── description (text, required)
├── amount (decimal, required)
├── currency (enum: ILS | USD | EUR)
├── exchange_rate_used (decimal, nullable)
├── exchange_rate_date (date, nullable)
├── amount_ils (decimal) — converted amount
├── date (date, required)
├── category (enum: software | outsourcing | travel | other)
├── attachment_link (text, nullable)
└── created_at (timestamp)

ManualTimeEntry
├── id (uuid, PK)
├── project_id (uuid, FK → Project)
├── phase_id (uuid, FK → Phase, nullable)
├── sub_project_id (uuid, FK → SubProject, nullable)
├── date (date, required)
├── hours (decimal, required)
├── description (text)
├── billable (boolean, default true)
├── note (text, nullable)
└── created_at (timestamp)

TogglConnection
├── id (uuid, PK)
├── api_token_encrypted (text) — AES-256 encrypted
├── workspace_id (text)
├── workspace_name (text)
├── status (enum: active | disconnected | error)
├── last_sync_at (timestamp)
├── user_id (uuid, FK)
└── created_at (timestamp)

TogglMapping
├── id (uuid, PK)
├── project_id (uuid, FK → Project)
├── toggl_project_id (bigint)
├── toggl_project_name (text)
└── created_at (timestamp)

TogglCachedEntry
├── id (uuid, PK)
├── toggl_entry_id (bigint, unique)
├── toggl_project_id (bigint)
├── project_id (uuid, FK → Project, nullable) — mapped hub project
├── phase_id (uuid, FK → Phase, nullable) — auto or manually assigned
├── phase_assignment_type (enum: auto_keyword | manual | unassigned)
├── description (text)
├── start_time (timestamp)
├── stop_time (timestamp)
├── duration_seconds (integer)
├── duration_hours (decimal) — computed: duration_seconds / 3600
├── billable (boolean)
├── tags (text[]) — array of Toggl tags
├── fetched_at (timestamp)
└── user_id (uuid, FK)

Notification
├── id (uuid, PK)
├── type (enum: over_budget_warning | over_budget_exceeded | bank_depleting | bank_depleted)
├── project_id (uuid, FK → Project)
├── phase_id (uuid, FK → Phase, nullable)
├── sub_project_id (uuid, FK → SubProject, nullable)
├── message (text)
├── threshold_percent (integer) — 80 or 100
├── link (text) — deep link to project view
├── is_read (boolean, default false)
├── created_at (timestamp)
└── user_id (uuid, FK)
```

### 4.3 Profitability calculation logic

**Project type:**
```
project_value = rate_per_hour_ils × total_scoped_hours
total_expenses_ils = SUM(expenses.amount_ils) WHERE project_id = this

IF actual_hours ≤ total_scoped_hours:
    actual_income = actual_hours × rate_per_hour_ils
ELSE:
    actual_income = project_value  (capped at project value)

effective_rate = actual_income / actual_hours
net_income = actual_income − total_expenses_ils
profit_margin = net_income / project_value × 100
unbilled_hours = MAX(0, actual_hours − total_scoped_hours)
unbilled_cost = unbilled_hours × rate_per_hour_ils
```

**Retainer type:**
```
retainer_efficiency = (retainer_fee_ils − period_expenses_ils) / actual_hours_in_period
// Result is effective hourly rate. User compares mentally to her benchmark.
```

**Hour bank — bank level:**
```
bank_value = rate_per_hour_ils × total_scoped_hours (total bank)
total_consumed = SUM(actual_hours across all sub-projects)
remaining_hours = total_scoped_hours − total_consumed
total_expenses_ils = SUM(expenses.amount_ils) WHERE project_id = this
net_bank_income = bank_value − total_expenses_ils
```

**Hour bank — sub-project level:**
```
effectiveness = billed_hours / actual_hours × 100
effective_rate = (billed_hours × rate_per_hour_ils − sub_project_expenses_ils) / actual_hours
```

### 4.4 Notification trigger logic

On every Toggl sync or manual hour entry, the system recalculates budget consumption:

```
FOR each project:
    consumption_percent = (actual_hours / total_scoped_hours) × 100

    IF consumption_percent ≥ 80 AND no existing notification for this project at 80%:
        CREATE notification (type: over_budget_warning, threshold: 80)

    IF consumption_percent ≥ 100 AND no existing notification for this project at 100%:
        CREATE notification (type: over_budget_exceeded, threshold: 100)

FOR each phase:
    phase_consumption = (phase_actual_hours / phase_quoted_hours) × 100
    // Same threshold logic as project level

FOR each hour bank:
    bank_consumption = (total_consumed / total_bank_hours) × 100

    IF bank_consumption ≥ 80:
        CREATE notification (type: bank_depleting, threshold: 80)

    IF bank_consumption ≥ 100:
        CREATE notification (type: bank_depleted, threshold: 100)

FOR each sub-project with allocated_hours:
    sub_consumption = (actual_hours / allocated_hours) × 100
    // Same threshold logic
```

Notifications are displayed in a notification center. Read = dismissed from badge count, not deleted.

### 4.5 Toggl integration details

**Authentication:** Basic Auth with API token. Token stored AES-256 encrypted in `TogglConnection.api_token_encrypted`.

**Sync flow:**
```
1. On project view load (or manual refresh):
2. Decrypt API token
3. GET /api/v9/me/time_entries?start_date={last_sync - 1 day}&end_date={now}
4. For each entry:
   a. Upsert into TogglCachedEntry (by toggl_entry_id)
   b. Match toggl_project_id → hub project via TogglMapping
   c. Scan description against PhaseKeyword table
   d. If keyword match found → set phase_id, phase_assignment_type = auto_keyword
   e. If no match → phase_assignment_type = unassigned
5. Update TogglConnection.last_sync_at
6. Recalculate all project/phase totals
7. Run notification trigger logic
```

**Initial sync (first connection):** Pull up to 3 months of history. Single API call (within the 3-month window limit and 1,000 entry limit — sufficient for a 3-month-old business).

**Rate limits:** Cache responses locally. Sync only on project view load (not on a timer). Stay well within 30 req/hr (free) or 240 req/hr (Starter).

**Optional enhancement:** If user is on Toggl Starter plan, additionally use Reports API v3 for the dynamic report screen (server-side grouping). This is an optimization, not a requirement — the report works with client-side grouping of cached entries.

### 4.6 Currency conversion

**Source:** Bank of Israel XML feed (https://www.boi.org.il/currency.xml) — provides daily USD/ILS and EUR/ILS rates.

**Logic:**
```
1. When user enters a non-ILS amount with a date:
2. Fetch Bank of Israel rate for that date
3. If rate not available for exact date (weekend/holiday), use most recent available rate
4. Store: original_amount, original_currency, exchange_rate_used, exchange_rate_date, amount_ils
5. All calculations use amount_ils
6. Display shows both: "₪2,700 (converted from $750 at 3.60 on March 15, 2026)"
```

**Caching:** Cache exchange rates locally in a simple `ExchangeRate` table (date, currency, rate). Fetch from BOI only when a rate for a specific date is not yet cached.

```
ExchangeRate
├── date (date, PK component)
├── currency (enum: USD | EUR, PK component)
├── rate_to_ils (decimal)
└── fetched_at (timestamp)
```

### 4.7 Log documentation

Structured logging to understand errors, debug issues, and trace problems back to their source. Logs must answer: "what happened, when, where in the code, and what data was involved (without exposing sensitive content)."

**Log levels:**

| Level | When to use | Example |
|-------|-------------|---------|
| `ERROR` | Something failed and needs attention. User-facing impact. | Toggl API returned 500. Currency rate fetch failed. Database write failed. |
| `WARN` | Something unexpected but handled gracefully. No user-facing impact yet, but may indicate a developing problem. | Toggl rate limit approaching (>80% quota used). PhaseKeyword match was ambiguous (multiple phases matched). Exchange rate not available for exact date, fell back to nearest. |
| `INFO` | Normal operations worth recording for audit trail. | Toggl sync completed: 47 entries fetched, 3 new, 2 updated. Client created. Project status changed. Notification triggered. |
| `DEBUG` | Detailed data for troubleshooting. Disabled in production by default; enabled temporarily when investigating an issue. | Full Toggl API response payload (sanitized). Keyword matching trace: "competitive analysis" matched phase "Research" via keyword "competitive". Profitability calculation breakdown step by step. |

**Log format (structured JSON):**

```json
{
  "timestamp": "2026-03-27T14:32:01.123Z",
  "level": "ERROR",
  "service": "toggl-sync",
  "action": "fetch_time_entries",
  "message": "Toggl API returned 429 (rate limited)",
  "context": {
    "project_id": "uuid-here",
    "http_status": 429,
    "retry_after_seconds": 60,
    "quota_remaining": 0
  },
  "error": {
    "code": "TOGGL_RATE_LIMITED",
    "stack": "..."
  }
}
```

**What to log per domain:**

| Domain | Log events |
|--------|-----------|
| Auth | Login success/failure, logout, session refresh, failed attempts (with IP) |
| Toggl sync | Sync start, entries fetched count, new/updated/unchanged counts, phase mapping results (assigned/unassigned counts), sync duration, errors |
| Phase keyword matching | Match attempts, matches found, ambiguous matches, no-match entries, user corrections (old phase → new phase, keyword learned) |
| Profitability calculation | Only on ERROR — when a calculation produces unexpected results (negative hours, NaN, division by zero). In DEBUG mode: full step-by-step breakdown |
| Currency conversion | Rate fetched, fallback to nearest date, conversion performed. ERROR if rate source unavailable |
| Notifications | Notification created (type, threshold, project), notification read, notification dismissed |
| Client/Project CRUD | Create, update, archive, re-activate, delete — with entity type and ID, never with names or financial data |

**What NEVER goes in logs:**
- Client names, project names, or company names
- Financial amounts, rates, fees, or profitability numbers
- Toggl API token (even partially)
- Email addresses, phone numbers, or contact details
- File contents or document text
- Toggl entry descriptions (may contain client-sensitive work details)

**Log storage:** Use Vercel's built-in logging (Vercel Logs) for serverless function output. For longer retention or search capability, forward to a log aggregator (e.g., Axiom — free tier, integrates with Vercel in one click) if needed. Minimum retention: 7 days for production logs.

**Error tracking:** Log all unhandled exceptions with full stack trace, request context (route, method, user_id), and a unique error ID. The error ID is returned to the UI in error messages so the user can reference it when reporting issues (e.g., "Something went wrong. Error ID: err_a3f8b2").

### 4.8 Modularity layer

The codebase is structured as independent, replaceable modules. Each module owns its data, logic, and UI components. Modules communicate through defined interfaces, not by reaching into each other's internals. This matters because: (a) future milestones add new modules (Drive, Gmail, Slack, Tasks) that must plug in without rewriting existing code; (b) the Toggl module will eventually be replaced by the native time tracking module (M7) — this must be a swap, not a rewrite.

**Module structure:**

```
src/
├── modules/
│   ├── clients/           — Client list, archive, CRUD
│   │   ├── components/    — React components (ClientList, ClientCard, Archive)
│   │   ├── hooks/         — useClients(), useArchive()
│   │   ├── api/           — Supabase queries for clients
│   │   ├── types.ts       — Client, ClientStatus types
│   │   └── index.ts       — Public exports (only what other modules need)
│   │
│   ├── projects/          — Project creation, types, status
│   │   ├── components/    — ProjectCard, ProjectForm, SubProjectList
│   │   ├── hooks/         — useProject(), useSubProjects()
│   │   ├── api/
│   │   ├── types.ts       — Project, SubProject, ProjectType types
│   │   └── index.ts
│   │
│   ├── planning/          — Two-layer planning, interactive tiles
│   │   ├── components/    — PlanningBoard, PhaseTile, ComparisonView
│   │   ├── hooks/         — usePlanning(), useTiles()
│   │   ├── api/
│   │   ├── types.ts       — Phase, PlanningLayer types
│   │   └── index.ts
│   │
│   ├── time-tracking/     — Toggl integration (M1), native timer (M7)
│   │   ├── components/    — TimeEntryList, PhaseAssignment, UnassignedQueue
│   │   ├── hooks/         — useTimeEntries(), usePhaseMapping()
│   │   ├── api/
│   │   │   ├── toggl.ts   — Toggl API client (M1)
│   │   │   └── native.ts  — Native time store (M7, empty placeholder for now)
│   │   ├── types.ts       — TimeEntry, TogglMapping, PhaseKeyword types
│   │   ├── adapter.ts     — INTERFACE: getTimeEntries(), syncTime()
│   │   │                    M1: adapter calls toggl.ts
│   │   │                    M7: adapter switches to native.ts
│   │   └── index.ts
│   │
│   ├── profitability/     — Calculations, profitability views
│   │   ├── components/    — ProfitabilityCard, EfficiencyBadge, WarningBanner
│   │   ├── hooks/         — useProfitability()
│   │   ├── calculations.ts — Pure functions: all formulas (easy to unit test)
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── expenses/          — Expense tracking, currency conversion
│   │   ├── components/    — ExpenseForm, ExpenseList
│   │   ├── hooks/         — useExpenses()
│   │   ├── api/
│   │   ├── currency.ts    — Bank of Israel rate fetching + conversion logic
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── reports/           — Dynamic project report
│   │   ├── components/    — ReportTable, GroupSelector, FilterBar, ExportButton
│   │   ├── hooks/         — useReport()
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── notifications/     — In-hub notification center
│   │   ├── components/    — NotificationCenter, NotificationBadge, NotificationCard
│   │   ├── hooks/         — useNotifications()
│   │   ├── triggers.ts    — Threshold detection logic
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── notes/             — Notes and memos (used across modules)
│       ├── components/    — NoteEditor, NoteList
│       ├── hooks/         — useNotes()
│       ├── types.ts
│       └── index.ts
│
├── shared/                — Cross-cutting utilities
│   ├── ui/                — Shared UI components (buttons, inputs, modals, badges)
│   ├── hooks/             — Shared hooks (useAuth, useSupabase)
│   ├── types/             — Global types (Currency, MoneyAmount)
│   └── utils/             — Date formatting, number formatting, validators
│
├── api/                   — Vercel serverless functions (API routes)
│   ├── toggl/             — Toggl proxy endpoints (keeps API token server-side)
│   ├── currency/          — Bank of Israel rate proxy
│   └── auth/              — Auth endpoints
│
└── app/                   — Next.js / React Router pages
    ├── layout.tsx         — Global layout (nav, notification badge, timer)
    ├── clients/           — Client list and archive pages
    ├── client/[id]/       — Client 360° view
    └── settings/          — Toggl connection, user settings
```

**Module communication rules:**

1. **Modules import from each other's `index.ts` only.** Never reach into another module's internal components, hooks, or API layer. If module A needs data from module B, module B must export it explicitly.

2. **Shared data flows through hooks, not props drilling.** Each module provides React hooks that other modules can call. Example: the profitability module calls `useTimeEntries()` from the time-tracking module — it doesn't accept time entries as props from 5 levels up.

3. **The time-tracking adapter pattern is the template for all future integrations.** The `adapter.ts` file defines the interface (`getTimeEntries()`, `syncTime()`, etc.). M1 implements it with Toggl. M7 implements it with native storage. The rest of the system calls the adapter, never the implementation directly. When M7 ships, the switch is: change one import in `adapter.ts`. No other module changes.

4. **Calculation logic lives in pure functions, separate from UI.** The `profitability/calculations.ts` file contains every formula — project profitability, retainer efficiency, hour bank effectiveness, currency conversion. These functions take inputs and return outputs with no side effects. They are trivially unit-testable. The UI components call these functions; they don't contain inline math.

5. **Future modules plug in, they don't require rewiring.** When M2 adds Google Drive, it becomes `modules/drive/`. When M3 adds Gmail, it becomes `modules/communication/`. These new modules can import from existing modules (e.g., `communication` imports from `clients` to know which domain belongs to which client) but existing modules never import from future modules. Dependencies flow forward in the milestone sequence.

---

## 5. UX automated checklist — M1

The following checks must pass in the system's automated test suite before M1 is considered complete.

| # | Rule | Automated check |
|---|------|-----------------|
| 1 | Client list loads in under 2 seconds | Page load time < 2000ms with 10 clients |
| 2 | Client → project view navigation in under 1 second | Route transition time < 1000ms |
| 3 | All interactive tiles respond to drag initiation within 150ms | Measure drag-start event to visual feedback |
| 4 | Inline edit activation (click-to-edit) responds within 100ms | Measure click to cursor-in-field |
| 5 | Total recalculation on any tile edit completes within 200ms | Measure value change to updated total render |
| 6 | Auto-save triggers within 1 second of last edit | Measure last keystroke/drop to save confirmation |
| 7 | Over-budget flag appears immediately when hours exceed quota | Flag renders in the same render cycle as the value change |
| 8 | Profitability numbers update in real time with every edit | No stale values visible after any interaction |
| 9 | No horizontal scrolling required on viewport ≥ 1280px | Content fits within viewport width |
| 10 | All clickable elements have a minimum touch target of 44×44px | Automated scan of interactive element dimensions |
| 11 | Toggl sync completes within 5 seconds for up to 500 entries | API call + render time < 5000ms |
| 12 | Project report grouping/sorting switches within 300ms | Measure interaction to re-rendered list |
| 13 | Empty states provide clear guidance (no blank screens) | Every list/view has an empty-state message when no data exists |
| 14 | Error states are user-readable (no raw error codes or stack traces) | All API error responses mapped to user-friendly messages |
| 15 | Keyboard navigation works for all primary actions | Tab order covers: client list, project list, tiles, report filters |
| 16 | Over-budget notification appears in notification center when threshold is crossed | Notification created when consumption passes 80% and 100%; visible on next login |
| 17 | Notification center shows unread count badge | Badge renders when unread notifications > 0; clears when all are read |
| 18 | Currency conversion displays both original and converted amounts | All non-ILS amounts show "₪X (converted from $Y at Z)" format |
| 19 | Toggl phase auto-assignment produces no false positives on exact keyword matches | Test suite with known keyword-description pairs returns 100% precision |
| 20 | Archive section is accessible and lists all archived clients | Navigation element present; archived clients render with full history |

---

## 6. Security — M1

### 6.1 Encryption

| Data type | At rest | In transit |
|-----------|---------|------------|
| Toggl API token | AES-256 encrypted in Supabase. Encryption key in Vercel env vars, never in code. | HTTPS only (TLS 1.2+) |
| User password | Managed by Supabase Auth (bcrypt hash). | HTTPS only |
| Client/project data | Supabase PostgreSQL with encrypted connections (SSL required). Encryption at rest enabled by default. | HTTPS only |

### 6.2 Secrets management

- All secrets (API keys, encryption keys, database credentials) stored in Vercel environment variables.
- Separate secrets per environment (production vs. preview).
- No secrets in client-side code. All Toggl API calls go through server-side functions.
- `.env` files in `.gitignore` — never committed.

### 6.3 API security

- All hub API endpoints require authentication (Supabase Auth session). No unauthenticated endpoints except login.
- CSRF protection on all state-changing requests.
- Rate limiting on login endpoint (max 5 attempts per minute).
- Parameterized queries only — no string concatenation in SQL.
- No sensitive data in URL parameters.

### 6.4 Session security

- Managed by Supabase Auth.
- 30-day session expiry. Single-user system — aggressive timeout is unnecessary friction.
- Manual logout always available, invalidates session server-side.
- If multi-user is ever added, revisit with shorter expiry.

### 6.5 Data isolation

- `user_id` foreign key on all tables from day one, even with a single user. Prevents costly migration if multi-user is ever needed.
- Database connections use a dedicated Supabase service role, not the superuser.
- Row Level Security (RLS) policies enabled on all tables: `WHERE user_id = auth.uid()`. Even with one user, this is defense-in-depth.

### 6.6 Logging

- Log all authentication events (login, logout, failed attempts).
- Log all Toggl sync events (success, failure, entries synced — never log the API token).
- No client data in logs (no project names, amounts, or contact info).
- Structured JSON logging.

### 6.7 Backup and recovery

- Supabase automated daily backups.
- Backup retention: minimum 7 days (Supabase Pro). Enable Point-in-Time Recovery for 30-day retention.
- If the hub goes down, no data is permanently lost — Toggl retains its own data. Manual entries and project configurations are the primary data at risk, covered by database backups.

### 6.8 Dependency security

- `npm audit` on every PR.
- No production dependencies with known critical vulnerabilities.
- Dependency versions pinned in lockfile.

---

## 7. QA loops

Quality assurance for a single-user private product. No QA team, no formal test cycles — but the system handles financial calculations, external API integration, and will eventually have AI making recommendations on client data. A wrong profitability number or a silent Toggl sync failure can go unnoticed and lead to bad decisions. Three layers, calibrated to the project's scale.

### 7.1 Layer 1: Automated tests (runs on every deploy)

These run automatically in CI (Vercel build pipeline or GitHub Actions). They cost nothing after setup and catch regressions instantly.

**Unit tests (pure functions):**

| Module | What to test | Why it matters |
|--------|-------------|----------------|
| `profitability/calculations.ts` | Every formula: project income, retainer efficiency, hour bank effectiveness, effective rate, margin, unbilled hours | A wrong number here means wrong business decisions. These are pure functions — easy to test, high consequence if wrong. |
| `expenses/currency.ts` | ILS/USD/EUR conversion at historical rates, fallback to nearest date, edge cases (weekend dates, missing rates) | Currency bugs are silent — the number looks plausible but is wrong. |
| `notifications/triggers.ts` | Threshold detection at 80% and 100% for projects, phases, sub-projects, and hour banks. No duplicate notifications. | A missed budget alert defeats the purpose of the notification system. |
| `time-tracking/adapter.ts` | Phase keyword matching: exact matches, partial matches, no matches, ambiguous matches, case sensitivity | Wrong phase assignment cascades into wrong per-phase profitability numbers. |

**Target: 100% coverage on calculation functions. These are the non-negotiable tests.**

**Integration tests (API layer):**

| What to test | How |
|-------------|-----|
| Toggl sync flow | Mock Toggl API responses. Verify entries are correctly upserted, mapped to projects, and assigned to phases. Verify rate limit handling (429 response → backoff). |
| Currency rate fetch | Mock Bank of Israel API. Verify rate caching, fallback to nearest date, error handling when API is unavailable. |
| CRUD operations | Test client create/archive/re-activate, project create with each type (project/retainer/hour_bank), phase create/reorder, expense create with currency conversion. |
| Auth | Verify unauthenticated requests are rejected. Verify session management (login, logout, session persistence). |

**UX automated checklist (section 5):**
The 20 checks in section 5 are also automated tests — performance thresholds, accessibility checks, and UI state validations.

### 7.2 Layer 2: Smoke test with real data (developer does this)

Before marking any feature complete, the developer runs through real scenarios using actual data — real Toggl entries, real client numbers, real exchange rates. Not a formal test plan. The goal is to catch integration issues that mocked unit tests miss.

**Smoke test checklist per feature:**

- Create a client and project using real numbers from an actual proposal. Do the profitability numbers match a manual calculation (spreadsheet or calculator)?
- Connect Toggl with the real API token. Do the synced hours match what Toggl shows? Are the right entries assigned to the right phases?
- Enter an expense in USD. Does the converted ILS amount match the Bank of Israel rate for that date (check manually on the BOI website)?
- Push a project past 80% budget consumption. Does the notification appear? Does it appear only once (not on every page load)?
- Open the dynamic report. Group by phase, then by date, then by billable status. Do the subtotals add up to the total?

**When to run:** After completing each feature (F1.1 through F1.7), not just at the end of M1. Finding a bug in F1.3 (profitability) is cheap if found during F1.3 development. It's expensive if found during F1.6 (notifications that depend on profitability numbers).

### 7.3 Layer 3: User acceptance per milestone (user does this)

At the end of each milestone, the user works with the system using real client data for real work before the milestone is marked done. This isn't testing buttons — it's testing whether the system actually answers "where do I stand with this client?" faster and more reliably than the current workflow.

**Acceptance criteria for M1:**

- [ ] All current active clients are entered and have accurate project data
- [ ] Toggl is connected and syncing correctly for all clients
- [ ] Profitability view matches user's mental model for at least 3 real projects (cross-check with existing spreadsheets)
- [ ] Phase keyword mapping is working for the most common task descriptions (check unassigned queue is manageable, not overwhelming)
- [ ] The user can answer "where am I on [client]?" by looking at the hub in under 30 seconds — faster than the current Toggl-report-plus-spreadsheet method
- [ ] No incorrect numbers spotted during 2-3 days of real use

**What this layer catches that layers 1 and 2 don't:**
- Data model assumptions that don't match real-world engagement structures (e.g., "this client's arrangement doesn't fit any of the three project types")
- UX friction that only appears with real cognitive load (e.g., "I can see the number but it takes me too long to find it")
- Toggl description patterns that the keyword matcher doesn't handle well
- Currency edge cases specific to the user's actual invoicing patterns

---

## 8. Milestone roadmap update (revised)

The AI and integration layers are moved earlier in the roadmap:

```
M1  MVP: Hours management, planning, Toggl         ← THIS DOCUMENT
 │  (manual data entry, no AI)
 ▼
M2  Google Drive + AI extraction from documents
 │  (Claude reads proposals, auto-fills project fields)
 ▼
M3  Google Calendar + Gmail + communication summary    ← IN PROGRESS (Gmail slice)
 │  (reserved hours, email scanning, AI summaries)
 │
 │  Gmail slice (shipping ahead of the full M3):
 │    - Read-only Gmail (polled every 5 min via Vercel cron)
 │    - Auto-routing: domain → contact → learned rule → LLM fallback
 │    - Per-client + per-project Emails tab; thread grouping
 │    - LLM hours extraction → notification → prefilled ManualEntryForm
 │    - Learned routing rules (mirrors phase_keywords pattern)
 │    - Security: AES-256 email bodies + refresh tokens; sanitized LLM input; no email content in logs
 ▼
M4  Contacts management
 │  (primary + secondary contacts, auto-suggest from email)
 ▼
M5  Slack & WhatsApp
 │  (same communication model as M3)
 ▼
M6  Task management
 │  (message → task, cross-channel)
 ▼
M7  Native time tracking (replace Toggl)
 │  (built-in timer, drop external dependency)
 ▼
 ?  Agent creation (scope TBD)
```

**Key change from previous roadmap:** M2 is now Drive + AI extraction (previously M5). This moves document parsing forward so the manual entry burden from M1 is relieved as soon as possible. Gmail/Calendar are combined into M3 since they share Google OAuth and complement each other (email context + scheduled meeting hours).
