# 🏙️ Community-Sense
### Community Issue Reporting System — MERN Stack

> A full-stack web platform where citizens can report civic issues (potholes, garbage, water leaks), track complaint status in real time, and engage with their local community — while municipal authorities manage and resolve reports through a dedicated dashboard.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-blue)](https://vitejs.dev)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)](https://mongodb.com)

---

## ✨ Key Features

- 🗺️ **Map-Based Discovery** — Report and browse civic issues on an interactive Leaflet map with geolocation and clustering
- 📋 **Complaint Lifecycle** — Full status tracking: `Reported → Acknowledged → In Progress → Resolved → Closed`
- 👥 **Role-Based Access** — Separate flows for `citizens` and `municipal authority` staff
- 💬 **Community Engagement** — Upvote, comment, and subscribe to issues
- 🔔 **Real-Time Notifications** — Live updates via Socket.io when statuses change
- 📊 **Authority Dashboard** — Admins can manage, update, and resolve all incoming reports
- 📷 **Image Uploads** — Attach photos to reports (multer + optional Cloudinary)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), TailwindCSS, React Query, Leaflet, Recharts |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB, Mongoose (Geospatial / 2dsphere indexing) |
| Auth | JWT, bcrypt |
| DevOps | Docker, docker-compose, GitHub Actions (CI) |

---

## 🚀 Quick Start

### Using Docker *(recommended)*

```bash
# 1. Clone the repo
git clone https://github.com/Sayeesh12/Community-sense.git
cd Community-sense

# 2. Set up environment variables
cp .env.example .env   # Fill in your secrets

# 3. Start everything
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:5000 |

### Manual Setup

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Authority | authority@civicsolve.test | AuthPass123! |
| Citizen | alice@civicsolve.test | UserPass123! |

> Run `node seed/seed.js` to populate 20 sample issues across categories.

---

## 📁 Project Structure

```
Community-sense/
├── frontend/          # React (Vite) + TailwindCSS
│   └── src/
│       ├── components/    # MapView, IssueCard, ReportForm, StatusTimeline
│       └── pages/         # Map, Dashboard, Authority Panel, Auth
├── backend/           # Node.js + Express + Socket.io
│   ├── models/            # User, Issue, Comment (Mongoose)
│   ├── routes/            # Auth, Issues, Reports
│   └── seed/              # Demo data generator
└── docker-compose.yml
```

---

## 📄 License

MIT © [Sayeesh](https://github.com/Sayeesh12)
