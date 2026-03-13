# GPBM Virtual Style Studio

Production-ready full-stack AI fashion platform for **Go Planet** and **Brand Mark**.

## Features

- Virtual Try-On placeholder pipeline (pose detection → segmentation → overlay → render)
- Two app modes from single codebase:
  - `/kiosk` Store Mirror Mode
  - `/studio` Website Mode
- Admin dashboard `/admin` with garment upload pipeline and analytics
- Inventory-aware product visibility (hide stock=0, low-stock warnings)
- Complete-the-look recommendations
- Wedding look builder `/wedding-builder`
- Compare looks `/compare`
- Style scanner placeholder API
- Reservation APIs and flows

## Tech Stack

- Next.js App Router + TypeScript + TailwindCSS + Framer Motion
- PostgreSQL + Prisma
- Local uploads via `uploads/`

## Setup

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Install dependencies:

```bash
npm install
```

3. Migrate and seed:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

4. Run app:

```bash
npm run dev
```

Open: http://localhost:3000

## Important Routes

- `/` Homepage
- `/studio` Customer mode
- `/kiosk` Store kiosk mode
- `/admin` Admin dashboard
- `/wedding-builder` Wedding look builder
- `/compare` Side-by-side outfit comparison
