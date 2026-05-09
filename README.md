# DAY · DECK

A personal study platform for structured learning. Browse day-by-day roadmaps, Salesforce user story collections, and reference guides — all in one fast, keyboard-friendly viewer. Content is managed through a built-in admin panel and stored in MongoDB.

---

## What It Does

- **Viewer** — A three-panel layout (sidebar / content / detail) lets you browse any plan card by card, with Prev/Next navigation, deep-linkable URLs, and a live filter/search inside each plan.
- **Multiple card types** — Day-by-day roadmaps, Salesforce user stories with acceptance criteria, and rich reference guides (SLDS, API docs, tech concepts).
- **Admin panel** — Create, edit, reorder, and delete plans, phases, and cards through a protected dashboard. No rebuild needed — changes go live immediately.
- **Migration script** — Seed the database from your own HTML source files in one command.
- **Responsive** — Full three-column layout on desktop, right panel hides on tablets, sidebar becomes a slide-in drawer on mobile with a hamburger nav.
- **Dark / light theme** — Toggle persists across the session.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | MongoDB Atlas |
| Auth | NextAuth v4 (credentials) |
| Styling | CSS Modules + Tailwind v4 |
| Animation | Framer Motion |
| Deployment | Vercel |

---

## Project Structure

```
daydeck/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   ├── plans/                  # Plans CRUD (GET, POST, PUT, DELETE)
│   │   │   └── [id]/
│   │   ├── phases/                 # Phases CRUD
│   │   │   └── [id]/
│   │   └── cards/                  # Cards CRUD
│   │       └── [id]/
│   ├── admin/
│   │   ├── page.js                 # Login page
│   │   └── dashboard/page.js       # Admin panel (protected)
│   ├── plan/[slug]/
│   │   ├── page.js                 # Plan viewer (server component)
│   │   ├── layout.js               # Wraps TopNav around viewer
│   │   └── loading.js              # Skeleton shown while plan loads
│   ├── AuthProvider.js             # SessionProvider wrapper
│   ├── HomeView.js                 # Home page (client component)
│   ├── globals.css                 # CSS custom properties + resets
│   ├── home.module.css             # Home page styles
│   ├── layout.js                   # Root layout
│   └── page.js                     # Home page (server component)
│
├── components/
│   ├── shell/
│   │   ├── TopNav.js               # Persistent nav: logo, tab bar, theme toggle
│   │   └── TopNav.module.css
│   ├── plan/
│   │   ├── PlanView.js             # Orchestrates sidebar + content + detail panel
│   │   ├── PlanView.module.css
│   │   ├── Sidebar.js              # Card list, phase groups, search filter
│   │   ├── Sidebar.module.css
│   │   ├── DayContent.js           # Main content renderer (all card types)
│   │   ├── DayContent.module.css
│   │   ├── DetailPanel.js          # Right metadata panel
│   │   └── DetailPanel.module.css
│   └── admin/
│       ├── AdminShell.js           # Admin layout + tab switcher
│       ├── PlansManager.js         # Plans tab UI
│       ├── PhasesManager.js        # Phases tab UI
│       ├── CardsManager.js         # Cards tab UI
│       ├── AdminModal.js           # Shared modal for create/edit forms
│       └── LoginForm.js            # Login page form
│
├── hooks/
│   ├── useFetch.js                 # Data fetching with focus revalidation + AbortController
│   └── useMutation.js              # POST / PUT / DELETE wrapper
│
├── lib/
│   ├── mongodb.js                  # MongoClient singleton (dev HMR + serverless safe)
│   ├── authOptions.js              # NextAuth config, timing-safe password check
│   ├── apiHelpers.js               # ok(), fail(), requireAuth() shared by all routes
│   ├── cardSchema.js               # PLAN_REGISTRY + CARD_FIELDS definitions
│   └── data.js                     # Server-side DB fetchers (used by server components)
│
├── scripts/
│   └── migrate.js                  # One-shot HTML → MongoDB seeder
│
├── styles/
│   └── theme.css                   # Global CSS variables (colors, spacing, fonts)
│
├── migration-source/               # Your source HTML files (git-ignored)
├── middleware.js                   # Auth guard for /admin/dashboard
├── next.config.mjs
├── postcss.config.mjs
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18.17 or higher
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account — the free M0 cluster works fine

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/daydeck.git
cd daydeck
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/daydeck?retryWrites=true&w=majority
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_password_here
```

Generate a secure `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 4. Add your source HTML files

Place your study plan HTML files into `migration-source/`. Each file must have a matching entry in `lib/cardSchema.js` under `PLAN_REGISTRY`. See [Adding a New Plan](#adding-a-new-plan) below.

### 5. Run the migration

```bash
npm run migrate
```

This parses all HTML files, extracts plan/phase/card data, and seeds MongoDB. Safe to re-run — it drops and rebuilds all three collections each time.

> ⚠️ Re-running migration erases any manual edits made through the admin panel. Use migration for the initial seed or a full reset only.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret used to sign JWTs |
| `NEXTAUTH_URL` | ✅ | Full public URL of the app |
| `ADMIN_USERNAME` | ✅ | Admin login username |
| `ADMIN_PASSWORD` | ✅ | Admin login password |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start the production build |
| `npm run lint` | Run ESLint |
| `npm run migrate` | Seed MongoDB from `migration-source/` HTML files |

---

## Admin Panel

Visit `/admin` and log in with the credentials from `.env.local`.

From the dashboard you can:

- **Plans tab** — Create new plans, edit title/slug/emoji/color/order, delete plans (cascades to all phases and cards)
- **Phases tab** — Select a plan, then add/edit/reorder/delete its phases
- **Cards tab** — Select a plan, then add/edit/delete cards. Card fields shown depend on the plan's `cardType`

All changes are live immediately — no rebuild or restart needed.

---

## Card Types

| Type | Constant | Used For |
|---|---|---|
| Day plan | `CARD_TYPES.DAY_PLAN` | Day-by-day roadmaps — topics, practice tasks, gains, sources |
| Stories | `CARD_TYPES.STORIES` | Salesforce user stories with story ID and acceptance criteria |
| Reference | `CARD_TYPES.REFERENCE` | SLDS docs, API guides, tech concept cards |

The card type is set per plan in `PLAN_REGISTRY` and controls which fields are shown in the viewer and which form fields appear in the admin panel.

---

## Adding a New Plan

Two steps:

**Step 1 — Register the plan in `lib/cardSchema.js`**

```js
"your-file.html": {
  slug:      "your-plan-slug",        // used in the URL: /plan/your-plan-slug
  title:     "Short Title",
  fullTitle: "Full Plan Title",
  emoji:     "📚",
  color:     "#60A5FA",               // accent color for tabs and cards
  tabLabel:  "📚 Short Title",        // label shown in the top nav tab
  cardType:  CARD_TYPES.DAY_PLAN,     // DAY_PLAN | STORIES | REFERENCE
  order:     12,                      // controls tab position left to right
},
```

**Step 2 — Drop the HTML file into `migration-source/` and re-run**

```bash
npm run migrate
```

---

## Responsiveness

| Screen width | Layout |
|---|---|
| > 1024px | Full three-column: sidebar + content + detail panel |
| 768px – 1024px | Two-column: sidebar + content (detail panel hidden) |
| < 768px | Single column: content only, sidebar becomes a slide-in drawer, nav becomes a hamburger dropdown |

Between 768px and 1200px the sidebar and detail panel widths shrink proportionally using `clamp()`.

---

## Security Notes

- Passwords are compared using a timing-safe HMAC comparison via the Web Crypto API — no timing attack surface.
- Failed login attempts have a 600ms artificial delay to slow brute-force attempts.
- All API routes (`/api/plans`, `/api/phases`, `/api/cards`) require a valid JWT via `requireAuth()` before any database access.
- The `/admin/dashboard` route is double-guarded by both `middleware.js` (edge-level redirect) and `getServerSession` inside the page component.

---

## Deployment on Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all five environment variables under **Settings → Environment Variables**
4. Set `NEXTAUTH_URL` to your production URL (e.g. `https://daydeck.vercel.app`)
5. Deploy — Vercel detects Next.js automatically

> The MongoDB Atlas connection string must allow connections from Vercel's IP range. In Atlas, go to **Network Access** and add `0.0.0.0/0` (allow from anywhere) or add Vercel's IP list specifically.

---

## Known Limitations

- **Single admin user** — credentials are stored as environment variables. Multi-user auth is not supported.
- **No rate limiting** — the 600ms login delay helps but there is no hard request cap on the auth endpoint.
- **Denormalized card/phase counters** — `totalCards` and `totalPhases` on each plan are incremented/decremented in separate operations and can drift if the server crashes mid-request. They are cosmetic only and do not affect data integrity.
- **Migration is destructive** — re-running `npm run migrate` drops and recreates all three MongoDB collections. Any admin panel edits will be lost.