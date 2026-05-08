# DayDeck

A personal study platform for structured learning plans. Browse day-by-day roadmaps, reference guides, and user story collections — all managed through a built-in admin panel.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | MongoDB Atlas |
| Auth | NextAuth v4 (credentials) |
| Styling | Tailwind v4 + CSS Modules |
| Animation | Framer Motion |
| Deployment | Vercel |

---

## Project Structure

```
daydeck/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── plans/                # Plans CRUD
│   │   ├── phases/               # Phases CRUD
│   │   └── cards/                # Cards CRUD
│   ├── admin/                    # Login page
│   ├── admin/dashboard/          # Admin panel (protected)
│   ├── plan/[slug]/              # Study plan viewer
│   └── layout.js / page.js
├── components/
│   ├── shell/                    # TopNav
│   ├── plan/                     # PlanView, Sidebar, DayContent
│   └── admin/                    # AdminShell, managers, modal
├── hooks/
│   ├── useFetch.js               # Data fetching with focus revalidation
│   └── useMutation.js            # POST / PUT / DELETE wrapper
├── lib/
│   ├── mongodb.js                # MongoClient singleton
│   ├── authOptions.js            # NextAuth config
│   ├── apiHelpers.js             # ok(), fail(), requireAuth()
│   ├── cardSchema.js             # PLAN_REGISTRY + CARD_FIELDS
│   └── data.js                   # Server-side DB fetchers
├── scripts/
│   └── migrate.js                # One-shot HTML → MongoDB seeder
├── migration-source/             # Source HTML files (git-ignored)
└── middleware.js                 # Auth guard for /admin/dashboard
```

---

## Getting Started

### Prerequisites

- Node.js 18.17 or higher
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free M0 cluster works)

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

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and fill in every value:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/daydeck?retryWrites=true&w=majority
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password_here
```

Generate a secure `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 4. Add source HTML files

Place your study plan HTML files into `migration-source/`. Each file must have a matching entry in `lib/cardSchema.js` under `PLAN_REGISTRY` — see [Adding New Plans](#adding-new-plans) below.

### 5. Run the migration

```bash
npm run migrate
```

This seeds all plans, phases, and cards into MongoDB. It is safe to re-run — it drops and rebuilds all collections each time.

### 6. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Admin Panel

The admin panel lives at `/admin/dashboard` and is protected by NextAuth. Log in with the credentials you set in `.env.local`.

From the admin panel you can:
- Create, edit, delete, and reorder **plans**
- Create, edit, delete, and reorder **phases** within each plan
- Create, edit, and delete **cards** within each phase

Changes are reflected in the viewer immediately — no rebuild needed.

---

## Adding New Plans

Two steps:

**1. Add a registry entry in `lib/cardSchema.js`**

```js
"your-file.html": {
  slug:      "your-plan-slug",
  title:     "Short Title",
  fullTitle: "Full Plan Title",
  emoji:     "📚",
  color:     "#60A5FA",
  tabLabel:  "📚 Short Title",
  cardType:  CARD_TYPES.DAY_PLAN,  // or STORIES / REFERENCE
  order:     12,                    // controls tab position
},
```

**2. Drop the HTML file into `migration-source/` and re-run**

```bash
npm run migrate
```

> ⚠️ Migration drops and recreates all collections. Any manual edits made via the admin panel will be lost. Use the admin panel for edits, and migration only for the initial seed or a full reset.

---

## Card Types

| Type | Used For |
|---|---|
| `day-plan` | Day-by-day learning roadmaps (topics, practice tasks, gains, sources) |
| `stories` | Salesforce user stories (story ID, acceptance criteria) |
| `reference` | Reference guides — SLDS, API docs, tech concepts |

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel dashboard under **Settings → Environment Variables**
4. Deploy — Vercel picks up Next.js automatically

> Make sure `NEXTAUTH_URL` is set to your production URL (e.g. `https://daydeck.vercel.app`) in the Vercel environment variables.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | Full public URL of the app |
| `ADMIN_USERNAME` | ✅ | Admin login username |
| `ADMIN_PASSWORD` | ✅ | Admin login password |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run migrate` | Seed MongoDB from `migration-source/` HTML files |