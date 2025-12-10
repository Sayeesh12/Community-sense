import express from 'express';
import { body } from 'express-validator';
import { createNotice, getNotices, getMyNotices, getNotice, updateNotice, deleteNotice, toggleUpvote } from '../controllers/noticeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const createNoticeValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('category').isIn(['water', 'road', 'electricity', 'sanitation', 'other']).withMessage('Invalid category'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('start_time').optional().isISO8601().withMessage('Invalid start_time format'),
  body('end_time').optional().isISO8601().withMessage('Invalid end_time format')
];

const updateNoticeValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('message').optional().trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('category').optional().isIn(['water', 'road', 'electricity', 'sanitation', 'other']).withMessage('Invalid category'),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('start_time').optional().isISO8601().withMessage('Invalid start_time format'),
  body('end_time').optional().isISO8601().withMessage('Invalid end_time format')
];

// Public routes - anyone can view notices
router.get('/', getNotices);
router.get('/my', authenticate, authorize('authority'), getMyNotices);
router.get('/:id', getNotice);

// Authenticated routes
router.patch('/:id/upvote', authenticate, toggleUpvote);

// Authority only - create, update, delete notices
router.post('/', authenticate, authorize('authority'), upload.array('images', 5), createNoticeValidation, createNotice);
router.patch('/:id', authenticate, authorize('authority'), upload.array('images', 5), updateNoticeValidation, updateNotice);
router.delete('/:id', authenticate, authorize('authority'), deleteNotice);

export default router;
