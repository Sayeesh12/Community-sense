# CivicSolve - Quick Start Guide

## 🚀 Fastest Way to Get Started

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Community-sense

# 2. Set up environment variables
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# 3. Start all services
docker-compose up --build

# 4. Seed the database (in a new terminal)
docker-compose exec backend node seed/seed.js

# Access the app:
# Frontend: http://localhost:80
# Backend API: http://localhost:5000
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your MongoDB URI

# Start MongoDB (if not running)
# On macOS with Homebrew: brew services start mongodb-community
# On Linux: sudo systemctl start mongod
# Or use MongoDB Atlas (cloud)

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp env.example .env

# Start development server
npm run dev
```

## 📝 Demo Credentials

After running the seed script, you can login with:

- **Admin:** `admin@civicsolve.test` / `AdminPass123!`
- **Authority:** `authority@civicsolve.test` / `AuthPass123!`
- **User:** `alice@civicsolve.test` / `UserPass123!`

## 🧪 Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` or check service status
- For Docker: MongoDB starts automatically with `docker-compose up`
- Check `MONGO_URI` in `.env` matches your setup

### Port Already in Use
- Backend default: 5000
- Frontend default: 5173 (dev) or 80 (Docker)
- Change ports in `.env` or `docker-compose.yml`

### Image Upload Issues
- Ensure `backend/uploads` directory exists and is writable
- Check file size limits (default: 5MB per file, max 5 files)

## 📚 Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Check [resume_bullets.md](./resume_bullets.md) for project highlights
3. Explore the codebase and customize for your needs



