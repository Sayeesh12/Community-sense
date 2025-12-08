import express from 'express';
import { getUsers, updateUserRole, getUserIssues } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User's own issues - must come before /:id/issues to avoid matching 'me' as an ID
router.get('/me/issues', getUserIssues);
router.get('/:id/issues', getUserIssues);

export default router;
