import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import userRoutes from './routes/users.js';
import noticeRoutes from './routes/notices.js';
import reportRoutes from './routes/reports.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createApp() {
  const app = express();

  const allowedOrigins = [
    "http://localhost:5173",
    "https://community-sense-frontend.onrender.com"
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      // Allow non-browser clients (curl/postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true
  };

  // Helmet CSP fix: allow API/fetch requests
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: [
            "'self'",
            "https://community-sense-frontend.onrender.com",
            "http://localhost:5173"
          ]
        }
      }
    })
  );

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // 🔥 Fixes preflight CORS errors

  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Allow uploaded images from CDN/server
  app.use(
    "/uploads",
    (req, res, next) => {
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
      }
      next();
    },
    express.static(path.join(__dirname, "..", "uploads"))
  );

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
    console.log("health check passed");
  });

  // ROUTES
  app.use("/api/auth", authRoutes);
  app.use("/api/issues", issueRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/notices", noticeRoutes);
  app.use("/api/reports", reportRoutes);

  app.use(errorHandler);

  return app;
}
