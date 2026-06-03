<div align="center">
<h1>রক্তBD — RaktaBD</h1>
<p><strong>A comprehensive Blood Donor Finder platform for Bangladesh, connecting people in need of blood with registered donors and hospital directory services.</strong></p>
</div>

---

## Overview

RaktaBD is a free, open-source blood donor network for Bangladesh. It bridges blood donors and patients in need through a transparent, broker-free platform. Users can search donors by blood group, location, and compatibility; post emergency blood requests; browse hospital blood bank directories; and track donation statistics — all from a single dashboard.

## Key Features

### Donor Discovery
- **Advanced donor search** with filters for blood group, division, district, and thana
- **Blood compatibility engine** — automatically finds donors whose blood type can safely donate to a requested group (e.g., O- donors for any patient)
- **Availability tracking** — only shows donors who are currently eligible (respects the mandatory 90-day donation cooldown)
- **Donor badges & medals** — Life Saver (10+), 5x, 3x, and 1st donation recognitions
- **Direct phone contact reveal** — connect instantly with matching donors

### Blood Request Board
- **Real-time emergency bulletin** — post blood needs with urgency levels: Critical, Urgent, and Normal
- **Anonymous posting** — anyone can post a blood request without registration
- **7-day auto-expiry** — old requests are automatically filtered out
- **Pinned critical requests** — the most urgent appeals are always displayed first
- **Fulfillment tracking** — mark requests as saved/fulfilled

### Hospital Directory
- **30 pre-seeded hospitals** across all 8 divisions of Bangladesh
- **Search by name, address, or thana**
- **Blood bank availability status** per hospital
- **One-tap calling** to hospital helplines

### Dashboard & Analytics
- **Live statistics** — total donors, available now, active requests, fulfilled saves, districts covered
- **Donor distribution by blood group** (donut chart)
- **Top 10 districts by donor count** (bar chart)
- **30-day request activity timeline** (line chart)
- **Leaderboard** — top donors by donation count
- **Most demanded blood groups** — based on active unfulfilled requests

### User & Donor Management
- **Secure signup/login** with token-based authentication
- **Donor registration** with automatic eligibility calculation
- **Donation logging** — record when and where you donated
- **Availability toggle** — donors can go available/unavailable
- **Profile editing** — update name, blood group, phone, and location

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Animation | Framer Motion (`motion` package) |
| Charts | Recharts |
| Icons | Lucide React |
| Server | Express.js |
| Build Tool | Vite 6, esbuild |
| Database | JSON file-based (`database.json`) |
| Dev Runtime | tsx |

## Project Structure

```
RoktoBD/
├── server.ts              # Express server with all API routes
├── server/
│   └── db.ts              # Database read/write, seeding, and password hashing
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Root component with routing and auth state
│   ├── types.ts           # TypeScript interfaces, blood compatibility map, Bangladesh geography
│   ├── index.css          # Tailwind + custom styles
│   ├── pages/
│   │   ├── LandingPage.tsx      # Hero section, stats, critical requests
│   │   ├── SearchPage.tsx       # Donor search with advanced filters
│   │   ├── RequestBoard.tsx     # Blood request bulletin board
│   │   ├── PostRequestPage.tsx  # Form to post a new blood request
│   │   ├── DonorRegisterPage.tsx # Donor registration form
│   │   ├── DashboardPage.tsx    # Analytics, charts, leaderboard
│   │   ├── HospitalPage.tsx     # Hospital directory
│   │   ├── ProfilePage.tsx      # User profile & donation history
│   │   └── AuthPage.tsx         # Login / Signup
│   └── components/
│       ├── Navbar.tsx           # Navigation bar
│       ├── DashboardCharts.tsx  # Recharts visualizations
│       ├── DonationModal.tsx    # Log donation modal
│       └── HistoryTimeline.tsx  # Donation history timeline
├── database.json          # JSON database (auto-seeded on first run)
├── metadata.json          # App metadata
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── .env                   # Environment variables
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive a token |
| GET | `/api/auth/me` | Get current user, donor profile, and history |

### Donors
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/donor/register` | Register as a blood donor |
| POST | `/api/donor/toggle-availability` | Toggle donor availability status |
| POST | `/api/donor/log-donation` | Log a completed donation |
| GET | `/api/donors` | Search donors with filters (blood_group, division, district, compatible, available_only, sort) |

### Blood Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/request/new` | Post a new blood request (anonymous allowed) |
| GET | `/api/requests` | Get active requests with filters (blood_group, district, urgency, division) |
| POST | `/api/requests/:id/fulfill` | Mark a request as fulfilled |

### Statistics & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Live counters summary |
| GET | `/api/donor-count` | Donor distribution by blood group |
| GET | `/api/district-donors` | Top 10 districts by donor count |
| GET | `/api/requests-timeline` | Request activity over the last 30 days |

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospitals` | Search hospital directory (search, district filters) |

## Blood Compatibility Reference

| Donor Group | Can Donate To |
|-------------|---------------|
| O- | O-, O+, A-, A+, B-, B+, AB-, AB+ |
| O+ | O+, A+, B+, AB+ |
| A- | A-, A+, AB-, AB+ |
| A+ | A+, AB+ |
| B- | B-, B+, AB-, AB+ |
| B+ | B+, AB+ |
| AB- | AB-, AB+ |
| AB+ | AB+ |

## Geography

The app covers all **8 administrative divisions** and **64 districts** of Bangladesh:
- Dhaka, Chittagong, Rajshahi, Khulna, Sylhet, Barisal, Rangpur, Mymensingh

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with tsx |
| `npm run build` | Build frontend and bundle server for production |
| `npm start` | Run production server |
| `npm run clean` | Remove dist directory |
| `npm run lint` | Type-check with TypeScript |

## Database Seeding

On first launch, the database is automatically seeded with:
- **10 sample users** (7 are registered donors)
- **50 donors** distributed across all divisions
- **Donation history** records for eligible donors
- **15 blood requests** with varying urgency levels
- **30 hospitals** from across Bangladesh

## License

Apache-2.0

## Acknowledgments

Built to save lives across Bangladesh — 100% free, no brokerages, no middlemen.
