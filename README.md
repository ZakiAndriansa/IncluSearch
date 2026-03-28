# IncluSearch

Platform terpercaya menghubungkan orang tua, guru, dan dosen dengan **pakar ortopedagogik** untuk mendukung Anak Berkebutuhan Khusus (ABK).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 |
| Payments | Midtrans |
| File Storage | Vercel Blob |
| Deployment | Vercel (ap-southeast-1) |

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd ortoconnect
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. Required:
- `DATABASE_URL` — Neon pooled connection URL
- `DIRECT_URL` — Neon direct connection URL
- `NEXTAUTH_SECRET` — Random 32+ char string (`openssl rand -hex 32`)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY` — From Midtrans Dashboard

### 3. Database Setup

```bash
# Push schema to Neon
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**
- Admin: `admin@ortoconnect.id` / `Admin@123456`
- Expert: `siti.rahayu@ortoconnect.id` / `Expert@123456`

---

## Deployment to Vercel

### 1. Connect to Vercel

```bash
npx vercel
```

### 2. Add Neon PostgreSQL

In Vercel Dashboard → Storage → Add Neon Database.
This automatically sets `DATABASE_URL` and `DIRECT_URL`.

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

### 4. Deploy

```bash
npx vercel --prod
```

### 5. Run Migrations on Production

```bash
npx vercel env pull .env.production.local
DATABASE_URL=<direct-url> npx prisma db push
```

---

## Project Structure

```
├── app/
│   ├── (auth)/           # Login, Register pages
│   ├── (dashboard)/      # Protected app pages
│   │   ├── page.tsx      # Home dashboard
│   │   ├── cari-pakar/   # Expert search + matching
│   │   ├── knowledge-hub/ # Content library (ISR)
│   │   ├── konsultasi/   # Chat rooms
│   │   ├── forum/        # Community directory
│   │   └── profil/       # User profile + assessments
│   └── api/              # Route handlers
├── components/
│   ├── ui/               # shadcn base components
│   ├── shared/           # Navbar, Sidebar, BottomNav
│   ├── experts/          # ExpertCard, MatchBadge, Search
│   ├── consultation/     # ChatRoom, QuotaStatus
│   ├── knowledge/        # ContentGrid, Filters
│   ├── assessment/       # AssessmentForm, CTA
│   └── forum/            # CommunityDirectory
├── lib/
│   ├── prisma.ts         # DB client singleton
│   ├── auth.ts           # NextAuth config
│   ├── matching-algorithm.ts  # Expert matching logic
│   ├── quota-checker.ts  # Consultation quota rules
│   ├── payments.ts       # Midtrans integration
│   └── utils.ts          # Shared utilities
└── prisma/
    ├── schema.prisma     # Full database schema
    └── seed.ts           # Demo data seeder
```

---

## Key Business Rules

### Consultation Quota (Free Users)
- **1 consultation per 20-day rolling window**
- Quota does NOT accumulate (max always 1)
- Displayed as countdown timer in dashboard
- Premium users: **unlimited consultations**

### Assessment Limits
- **Free**: 1 active assessment at a time
- **Premium**: Up to 3 simultaneous active assessments

### Matching Algorithm
Scores experts against assessments using 5 weighted factors:
```
Total = Specialization(40) + ChallengeType(30) + Availability(15) + Rating(10) + Location(5)
```

### Premium Features
- Smart matching with score percentage
- Up to 3 assessments
- Unlimited consultations
- Full access to video content

---

## Midtrans Webhook Setup

Configure in Midtrans Dashboard → Settings → Configuration:
```
Notification URL: https://your-domain.vercel.app/api/payments/webhook
```

---

## Color Palette

```css
--color-forest:     rgb(25, 53, 12)    /* Primary brand */
--color-olive:      rgb(104, 125, 49)  /* Secondary actions */
--color-sand:       rgb(213, 211, 204) /* Backgrounds */
--color-teal-dark:  rgb(64, 103, 104)  /* Accents */
--color-teal-light: rgb(111, 169, 187) /* Highlights */
```

---

## License

MIT © 2026 IncluSearch
