import express from 'express';
import { getNearbyReports } from '../controllers/issueController.js';

const router = express.Router();

// Public route - nearby reports with geolocation filtering
// GET /api/reports/nearby?lat=...&lng=...&radius_km=5&category=...&status=...&sort=...
router.get('/nearby', getNearbyReports);

export default router;
