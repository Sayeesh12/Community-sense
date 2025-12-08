import express from 'express';
import { body } from 'express-validator';
import {
  createIssue,
  getIssues,
  getIssue,
  updateIssueStatus,
  toggleUpvote,
  subscribeToIssue,
  addComment,
  getComments,
  deleteIssue
} from '../controllers/issueController.js';
import { deleteComment } from '../controllers/commentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const createIssueValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isIn(['pothole', 'garbage', 'water_leak', 'streetlight', 'traffic', 'other']).withMessage('Invalid category'),
  body('severity').optional().isInt({ min: 1, max: 5 }).withMessage('Severity must be 1-5'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required')
];

const updateStatusValidation = [
  body('status').isIn(['reported', 'acknowledged', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('status_description')
    .optional()
    .custom((value) => {
      // If provided, must be at least 10 characters after trimming
      if (value !== undefined && value !== null && String(value).trim().length > 0) {
        if (String(value).trim().length < 10) {
          throw new Error('Status description must be at least 10 characters when provided');
        }
      }
      return true;
    })
];

const commentValidation = [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters')
];

// Public routes
router.get('/', getIssues);
router.get('/:id', getIssue);
router.get('/:id/comments', getComments);

// Authenticated routes
router.post('/', authenticate, upload.array('images', 5), createIssueValidation, createIssue);
router.patch('/:id/upvote', authenticate, toggleUpvote);
router.patch('/:id/subscribe', authenticate, subscribeToIssue);
router.post('/:id/comments', authenticate, commentValidation, addComment);
router.delete('/:id', authenticate, deleteIssue);
router.delete('/:issueId/comments/:id', authenticate, deleteComment);

// Authority routes - status update with required description and optional images
// Users can also update status but only to 'reported' or 'closed' (handled in controller)
router.patch('/:id/status', authenticate, upload.array('status_images', 4), updateStatusValidation, updateIssueStatus);

export default router;
