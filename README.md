# ⚡ ChargePointX — Intelligent EV Charging Station Locator & Booking Platform

> A hackathon-winning, production-ready EV smart mobility platform built for India.

![ChargePointX Banner](https://via.placeholder.com/1280x400/060b18/22d3ee?text=ChargePointX+%E2%80%93+Smart+EV+Charging+Platform)

## 🚀 Tech Stack

### Frontend
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** (custom dark glassmorphism design system)
- **Framer Motion** (page transitions, micro-animations)
- **Recharts** (admin analytics charts)
- **Zustand** (global state with persistence)
- **Axios** (API client with JWT interceptors)
- **Socket.IO Client** (real-time slot updates)
- **React Hot Toast** (notifications)

### Backend
- **Node.js + Express.js**
- **MongoDB + Mongoose** (geospatial indexing)
- **Socket.IO** (real-time updates)
- **JWT** (authentication)
- **Razorpay** (payment gateway)
- **Cloudinary** (station image hosting)
- **express-rate-limit**, **helmet**, **cors** (security)

---

## 📁 Project Structure

```
EV Charging Station/
├── frontend/              # Next.js 15 App
│   └── src/
│       ├── app/           # All pages (App Router)
│       │   ├── page.tsx           # Landing page
│       │   ├── auth/login/        # Login
│       │   ├── auth/register/     # Register
│       │   ├── dashboard/         # User dashboard
│       │   ├── stations/          # Browse stations
│       │   ├── stations/[id]/     # Station detail + booking
│       │   ├── bookings/          # Booking history
│       │   ├── profile/           # Account settings
│       │   └── admin/             # Admin panel
│       ├── components/    # Navbar, Footer, etc.
│       ├── lib/           # API client (axios)
│       └── store/         # Zustand global store
│
├── backend/               # Express.js API
│   ├── src/
│   │   ├── config/        # DB, Cloudinary
│   │   ├── models/        # Mongoose schemas
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middleware/     # Auth, error handler
│   │   └── utils/         # Token generation
│   └── server.js          # Entry point + Socket.IO
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Razorpay sandbox account
- Cloudinary account

### 1. Clone & Install

```bash
# Install backend deps
cd backend
npm install

# Install frontend deps
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** — copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
# Fill in: MONGODB_URI, JWT_SECRET, RAZORPAY keys, CLOUDINARY keys
```

**Frontend** — already created at `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

Open **two terminals**:

```bash
# Terminal 1: Backend
cd backend
npm run dev       # Starts on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev       # Starts on http://localhost:3000
```

### 4. Create Admin User

Use the API directly or MongoDB Compass to set a user's role to `admin`:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 🔑 Key Features

| Feature | Status |
|---------|--------|
| User Registration/Login (JWT) | ✅ |
| GPS-powered station locator | ✅ |
| Real-time slot availability (Socket.IO) | ✅ |
| Slot booking with conflict detection | ✅ |
| Razorpay payment integration | ✅ |
| Admin dashboard with Recharts analytics | ✅ |
| Station CRUD (admin) | ✅ |
| Booking management | ✅ |
| User notifications | ✅ |
| Favorites & profile settings | ✅ |
| Carbon savings tracker | ✅ |
| Dark glassmorphism UI | ✅ |
| Responsive mobile design | ✅ |
| Docker deployment | ✅ |

---

## 🌐 API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/stations` | Public |
| GET | `/api/stations/nearby?lat=&lng=` | Public |
| GET | `/api/stations/:id` | Public |
| POST | `/api/bookings` | User |
| GET | `/api/bookings/my` | User |
| PUT | `/api/bookings/:id/cancel` | User |
| POST | `/api/payments/create-order` | User |
| POST | `/api/payments/verify` | User |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/analytics/revenue` | Admin |
| POST | `/api/stations` | Admin |
| PUT | `/api/stations/:id` | Admin |
| DELETE | `/api/stations/:id` | Admin |

---

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up --build

# Or deploy frontend to Vercel + backend to Render
```

---

## 🏆 Hackathon Highlights

- **Real-time updates** via Socket.IO
- **Geospatial search** with MongoDB 2dsphere index
- **Conflict-free booking** with overlap detection
- **Razorpay** sandbox payment flow
- **CO₂ savings tracking** per session
- **Role-based access control** (user/admin/superadmin)
- **Premium dark UI** with glassmorphism + Framer Motion

---

## 📄 License
MIT © 2025 ChargePointX Team
