import express from 'express';
import { getStats, getHeatmap } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/heatmap', getHeatmap);

export default router;
