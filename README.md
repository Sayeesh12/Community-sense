# CivicSolve

CivicSolve is a MERN stack Community Issue Reporting System that lets residents report civic problems (potholes, garbage, water leaks), track complaint status, upvote, comment, and enables municipal staff to manage and resolve issues with geolocation, analytics, and real-time notifications.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [UI/UX & Design Guidance](#5-uiux--design-guidance)
6. [Data Models (MongoDB / Mongoose)](#6-data-models-mongodb--mongoose)
7. [API Routes (Backend)](#7-api-routes-backend)
8. [Frontend Routes & Components](#8-frontend-routes--components)
9. [Auth & Security](#9-auth--security)
10. [Dev Setup (local) — step-by-step](#10-dev-setup-local--step-by-step)
11. [Docker & Deployment](#11-docker--deployment)
12. [Testing & CI](#12-testing--ci)
13. [Performance, Accessibility & Security Notes](#13-performance-accessibility--security-notes)
14. [Analytics & Logging](#14-analytics--logging)
15. [Seed Data & Demo Users](#15-seed-data--demo-users)
16. [How to Demo Interactively](#16-how-to-demo-interactively)
17. [Resume Bullets (copy-ready)](#17-resume-bullets-copy-ready)
18. [Contribution & License](#18-contribution--license)
19. [Appendix — `.env.example`](#19-appendix--envexample)
20. [Quick Implementation Checklist](#20-quick-implementation-checklist)

---

## 1) Project Overview

**Problem:** Reporting civic issues is often manual and slow.

**Solution:** CivicSolve — an easy-to-use web platform for reporting, tracking, and managing civic issues with map-based discovery and real-time updates.

---

## 2) Key Features

* Register / login with JWT.
* Roles: `user`, `authority` (two roles only).
* Create issue with images, category, severity, and geolocation.
* Map discovery with clustering and nearby filtering.
* Complaint lifecycle and status history.
* Upvotes, comments, subscriptions, real-time notifications.
* Authority dashboard for managing issues.
* Dockerized; seed script for demo data.

---

## 3) Tech Stack

**Frontend:** Vite, React (JSX), TailwindCSS, React Router v6, React Query, Leaflet, Socket.io-client, Recharts, Formik + Yup.

**Backend:** Node.js, Express, Mongoose, MongoDB, Socket.io, multer, bcrypt, jsonwebtoken.

**Dev/Ops:** Docker, docker-compose, GitHub Actions (CI), optional Cloudinary.

---

## 4) System Architecture

```
[React Client] <--> [Express API + Socket.io] <--> [MongoDB]

                              |
                         [Cloudinary]
```

* Client communicates with REST API and Socket.io.
* Issues stored with `location: { type: 'Point', coordinates: [lng, lat] }` and `2dsphere` index.

---

## 5) UI/UX & Design Guidance

* TailwindCSS, consistent spacing, rounded cards, soft shadows.
* Colors: neutral background, teal/blue accent.
* Responsive layout: map + filter pane on desktop, collapsible bottom sheet on mobile.
* Accessible: aria-labels, keyboard navigation, alt text, skip links.

---

## 6) Data Models (Mongoose schemas — summary)

### User

```js
{
  _id, name, email, passwordHash, role: 'user'|'authority',
  location?: { type: 'Point', coordinates: [lng, lat] }, createdAt
}
```

### Issue

```js
{
  _id, title, description, category, severity (1-5),
  images: [string], author: ObjectId, upvotes: [ObjectId],
  commentsCount, subscribers: [ObjectId],
  status: 'reported'|'acknowledged'|'in_progress'|'resolved'|'closed',
  statusHistory: [{status, changedBy, at, note}],
  location: { type: 'Point', coordinates: [lng, lat] }, createdAt, updatedAt
}
```

### Comment

```js
{ _id, issueId, author, text, createdAt }
```

---

## 7) API Routes (summary)

**Auth**

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/auth/me`

**Issues**

* `POST /api/issues` (multipart/form-data images)
* `GET /api/issues` (filters: status, category, bbox/near, page, perPage)
* `GET /api/issues/:id`
* `PATCH /api/issues/:id/status` (authority can acknowledge/in_progress/resolve; users can only open/close their own issues)
* `PATCH /api/issues/:id/upvote`
* `POST /api/issues/:id/comments`
* `GET /api/issues/:id/comments`

**Reports**

* `GET /api/reports/nearby` (filter nearby issues by location and radius)

**WebSocket events**

* `issueCreated`, `statusChanged`, `newComment`, `upvoteChanged`.

---

## 8) Frontend Routes & Components

**Routes**

* `/` — Landing & discover
* `/map` — Map & filters (with nearby filtering option)
* `/report/new` — Create report
* `/issues/:id` — Issue detail
* `/dashboard` — My reports
* `/authority` — Authority dashboard
* `/auth/login`, `/auth/register`

**Key components**

* `MapView.jsx`, `IssueCard.jsx`, `ReportForm.jsx`, `StatusTimeline.jsx`, `CommentsList.jsx`, `ProtectedRoute.jsx`.

---

## 9) Auth & Security

* Passwords hashed with `bcrypt`.
* JWT access token with expiry.
* Input validation with `express-validator` or `joi`.
* Use `helmet`, CORS, and rate-limiting.
* Validate image MIME types and size; optionally upload to Cloudinary.

---

## 10) Dev Setup (local) — Quickstart

### Prerequisites

* Node.js >= 18, npm, Docker & docker-compose (optional).

### Using Docker (recommended)

1. Copy `.env.example` → `.env` and fill secrets.
2. `docker-compose up --build`
3. Frontend: [http://localhost:80](http://localhost:80), Backend: [http://localhost:5000](http://localhost:5000)

### Manual (without Docker)

**Backend**

```bash
cd backend
cp .env.example .env
npm install
node seed/seed.js   # optional
npm run dev
```

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## 11) Docker & Deployment

* `backend/Dockerfile`: multi-stage build exposing 5000.
* `frontend/Dockerfile`: build static assets, serve with nginx.
* `docker-compose.yml` includes `mongo`, `backend`, `frontend`.
* Deploy frontend to Vercel/Netlify and backend to Heroku/DigitalOcean or full container deploy on VPS.

---

## 12) Testing & CI

**Backend:** Jest + Supertest + `mongodb-memory-server`.

**Frontend:** Vitest + React Testing Library + MSW.

**CI:** GitHub Actions workflow to run linters, backend tests, frontend tests, and builds.

---

## 13) Performance, Accessibility & Security Notes

* Optimize images, lazy-load, code-split.
* Use ARIA attributes, keyboard support, contrast checks.
* Secure headers, sanitize inputs, and store secrets in env only.

---

## 14) Analytics & Logging

* Use `morgan` for request logging.
* Geospatial queries enable nearby issue filtering and map-based discovery.

---

## 15) Seed Data & Demo Users

**Demo credentials (local)**

* Authority: `authority@civicsolve.test` / `AuthPass123!`
* User: `alice@civicsolve.test` / `UserPass123!`

`seed/seed.js` creates 20 issues across categories with randomized locations inside a defined bounding box.

---

## 16) How to Demo Interactively

1. Login as `alice` (user) → create issue using map pin or geolocation.
2. Login as `authority` (incognito) → acknowledge and change status to `in_progress`, then resolve.
3. See real-time notification in Alice's session (Socket.io).
4. Login as `alice` → close the resolved issue.
5. Use the Map page with "Show Nearby Issues" filter to find issues near your location.

---

## 17) Resume Bullets (copy-ready)

**CivicSolve — Community Issue Reporting System (MERN, JavaScript)**

* Built a full-stack MERN application to enable citizens to report and track civic issues with geolocation, image uploads, and real-time notifications using **React (Vite), Node.js (Express), MongoDB, and Socket.io**.

* Implemented role-based access (user/authority), complaint lifecycle management, and status history logging to streamline municipal response workflows. Users can open and close issues, while authority can acknowledge, mark in progress, resolve, and request user closure.

* Designed a responsive, accessible UI with **TailwindCSS** and interactive maps (Leaflet), plus heatmap analytics and clustering for spatial insights.

* Engineered backend with JWT authentication, secure file uploads, geospatial queries (2dsphere), pagination, and nearby issue filtering; containerized the app with Docker and provided CI skeleton.

* Added seed scripts, unit/integration tests (Jest + Supertest), and frontend tests (Vitest + RTL), improving reliability and demo readiness.

---

## 18) Contribution & License

* Contributing: open issue/PR, follow code style, add tests.
* License: MIT.

---

## 19) Appendix: `.env.example`

```
# Backend
PORT=5000
MONGO_URI=mongodb://mongo:27017/civicsolve
JWT_SECRET=change_this_to_a_strong_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
UPLOADS_DIR=./uploads

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=
```

---

## 20) Quick Implementation Checklist

* [x] Backend scaffolding (`src/index.js`, `src/app.js`), models, auth middleware.
* [x] Image upload route (multer), optional Cloudinary.
* [x] Issue CRUD, geospatial filters, status updates, upvotes, comments.
* [x] Socket.io events & client integration.
* [x] Frontend scaffolding (`main.jsx`, `App.jsx`), Tailwind, React Query, Leaflet map.
* [x] Report form (Formik + Yup) with image previews and location picker.
* [x] Authority dashboard for managing issues.
* [x] Dockerfiles, docker-compose, `.env.example`, seed script.
* [x] Tests skeleton and GitHub Actions CI.

---

## Quick Start Commands

```bash
# Using Docker (recommended)
docker-compose up --build

# Manual setup
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev

# Run tests
cd backend && npm test
cd frontend && npm test
```





