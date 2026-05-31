# Smart Veg Logistics — Frontend

Next.js 14 + TypeScript + Material UI frontend for Smart Veg Logistics platform.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Admin login |
| `/dashboard` | Overview stats & charts |
| `/stocks` | Stock management (CRUD) |
| `/farmers` | Farmer registration (CRUD) |
| `/vehicles` | Vehicle fleet (CRUD) |
| `/deliveries` | Delivery management (CRUD) |

## Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── dashboard/
│   ├── stocks/
│   ├── farmers/
│   ├── vehicles/
│   └── deliveries/
├── components/
│   ├── layout/        # Sidebar, AppLayout
│   └── ui/            # StatCard, StatusChip
├── hooks/             # useAuth context
├── services/          # API service layer (axios)
└── theme/             # MUI theme config
```

## Tech Stack

- **Next.js 14** — App Router, TypeScript
- **Material UI v5** — Component library
- **Recharts** — Dashboard charts
- **Axios** — HTTP client
- **js-cookie** — JWT token storage
