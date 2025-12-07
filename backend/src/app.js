import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createApp() {
  const app = express();
  
  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  };
  
  // Security middleware - configure helmet to allow images
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http://localhost:5000", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    }
  }));
  
  app.use(cors(corsOptions));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve uploaded files with CORS headers
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', corsOptions.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  }, express.static(path.join(__dirname, '..', 'uploads')));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);

  // Error handling
  app.use(errorHandler);
  
  return app;
}
