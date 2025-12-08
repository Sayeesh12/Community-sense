import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import { getIO } from '../utils/socket.js';
import { validationResult } from 'express-validator';

export const createIssue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, severity, location } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const issue = new Issue({
      title,
      description,
      category,
      severity: parseInt(severity) || 3,
      images,
      author: req.user._id,
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
      }
    });

    await issue.save();
    await issue.populate('author', 'name email');

    // Emit socket event
    const io = getIO();
    io.emit('issueCreated', {
      id: issue._id,
      title: issue.title,
      location: issue.location,
      category: issue.category
    });

    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
};

export const getIssues = async (req, res, next) => {
  try {
    const {
      status,
      category,
      author,
      near, // "lng,lat,radiusInKm"
      bbox, // "minLng,minLat,maxLng,maxLat"
      search,
      page = 1,
      perPage = 20,
      sort = '-createdAt'
    } = req.query;

    const query = { deleted: { $ne: true } }; // Exclude soft-deleted issues

    if (status) query.status = status;
    if (category) query.category = category;
    if (author) query.author = author;

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Geospatial queries
    if (near) {
      const [lng, lat, radius] = near.split(',').map(Number);
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1000 // convert km to meters
        }
      };
    } else if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      query.location = {
        $geoWithin: {
          $box: [[minLng, minLat], [maxLng, maxLat]]
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const limit = parseInt(perPage);

    const issues = await Issue.find(query)
      .populate('author', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Issue.countDocuments(query);

    res.json({
      issues,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total,
        pages: Math.ceil(total / parseInt(perPage))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, deleted: { $ne: true } })
      .populate('author', 'name email')
      .populate('upvotes', 'name')
      .populate('subscribers', 'name email');

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    next(error);
  }
};

export const updateIssueStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, status_description } = req.body;
    const statusImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    
    // Normalize status_description - handle empty strings
    const normalizedStatusDescription = status_description && status_description.trim() ? status_description.trim() : undefined;
    
    const issue = await Issue.findOne({ _id: req.params.id, deleted: { $ne: true } });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Once closed, issue status cannot be changed
    if (issue.status === 'closed') {
      return res.status(400).json({ error: 'Cannot update status of a closed issue. Once closed, the issue cannot be reopened or have its status changed.' });
    }

    // Authority cannot close issues - only original author can
    if (status === 'closed' && req.user.role === 'authority') {
      return res.status(403).json({ error: 'Authority users cannot close issues. Only the original reporter can close their issue.' });
    }

    // Users can only open (reported) or close issues
    if (req.user.role === 'user') {
      if (status !== 'reported' && status !== 'closed') {
        return res.status(403).json({ error: 'Users can only open (report) or close issues. Only authority can change status to acknowledged, in_progress, or resolved.' });
      }
      // Users can only close their own issues
      if (status === 'closed' && issue.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You can only close your own issues.' });
      }
    }

    // Require status_description for authority when changing status
    if (req.user.role === 'authority' && !normalizedStatusDescription) {
      return res.status(400).json({ error: 'Status description is required when authority updates issue status' });
    }

    const oldStatus = issue.status;
    issue.status = status;
    issue.statusHistory.push({
      status,
      changedBy: req.user._id,
      at: new Date(),
      note: `Status changed from ${oldStatus} to ${status}`,
      status_description: normalizedStatusDescription,
      status_images: statusImages.length > 0 ? statusImages : undefined
    });

    await issue.save();
    await issue.populate('author', 'name email');

    // Emit socket event
    const io = getIO();
    io.emit('statusChanged', {
      issueId: issue._id,
      status,
      changedBy: req.user._id,
      status_description: normalizedStatusDescription,
      status_images: statusImages
    });

    // Notify subscribers
    issue.subscribers.forEach(subId => {
      io.to(subId.toString()).emit('issueStatusUpdate', {
        issueId: issue._id,
        title: issue.title,
        status,
        status_description: normalizedStatusDescription
      });
    });

    res.json({
      success: true,
        activity: {
          id: issue.statusHistory[issue.statusHistory.length - 1]._id,
          issue_id: issue._id,
          status,
          status_description: normalizedStatusDescription,
          images: statusImages,
          updated_by: req.user._id,
          updated_at: new Date()
        },
      issue
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUpvote = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const userId = req.user._id;
    const upvoteIndex = issue.upvotes.indexOf(userId);

    if (upvoteIndex > -1) {
      issue.upvotes.splice(upvoteIndex, 1);
    } else {
      issue.upvotes.push(userId);
    }

    await issue.save();

    // Emit socket event
    const io = getIO();
    io.emit('upvoteChanged', {
      issueId: issue._id,
      upvotesCount: issue.upvotes.length
    });

    res.json({
      upvoted: upvoteIndex === -1,
      upvotesCount: issue.upvotes.length
    });
  } catch (error) {
    next(error);
  }
};

export const subscribeToIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const userId = req.user._id;
    const subscribeIndex = issue.subscribers.indexOf(userId);

    if (subscribeIndex > -1) {
      issue.subscribers.splice(subscribeIndex, 1);
    } else {
      issue.subscribers.push(userId);
    }

    await issue.save();

    res.json({
      subscribed: subscribeIndex === -1,
      subscribersCount: issue.subscribers.length
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const comment = new Comment({
      issueId: issue._id,
      author: req.user._id,
      text: req.body.text
    });

    await comment.save();
    await comment.populate('author', 'name email');

    issue.commentsCount += 1;
    await issue.save();

    // Emit socket event
    const io = getIO();
    io.emit('newComment', {
      issueId: issue._id,
      comment: {
        id: comment._id,
        text: comment.text,
        author: comment.author
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { page = 1, perPage = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(perPage);

    const comments = await Comment.find({ 
      issueId: req.params.id,
      deleted: { $ne: true }
    })
      .populate('author', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(perPage));

    const total = await Comment.countDocuments({ 
      issueId: req.params.id,
      deleted: { $ne: true }
    });

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total,
        pages: Math.ceil(total / parseInt(perPage))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOne({ 
      _id: req.params.id,
      deleted: { $ne: true }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Only the author can delete their issue
    if (issue.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own issues' });
    }

    // Soft delete
    issue.deleted = true;
    issue.deleted_by = req.user._id;
    issue.deleted_at = new Date();
    await issue.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getNearbyReports = async (req, res, next) => {
  try {
    const { lat, lng, radius_km = 5, category, status, sort = 'nearest' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const query = {
      deleted: { $ne: true },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius_km) * 1000 // convert km to meters
        }
      }
    };

    if (category) query.category = category;
    if (status) query.status = status;

    let sortOption = {};
    if (sort === 'nearest') {
      // Already sorted by distance via $near
      sortOption = {};
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'most_commented') {
      sortOption = { commentsCount: -1 };
    }

    const issues = await Issue.find(query)
      .populate('author', 'name email')
      .select('title description category status location images createdAt commentsCount')
      .sort(sortOption)
      .limit(100)
      .lean();

    // Calculate distances
    const reports = issues.map(issue => {
      const [issueLng, issueLat] = issue.location.coordinates;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        issueLat,
        issueLng
      );

      return {
        id: issue._id,
        title: issue.title,
        short_desc: issue.description.substring(0, 100) + (issue.description.length > 100 ? '...' : ''),
        category: issue.category,
        status: issue.status,
        lat: issueLat,
        lng: issueLng,
        distance_km: Math.round(distance * 10) / 10,
        thumbnails: issue.images?.slice(0, 2) || [],
        created_at: issue.createdAt
      };
    });

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
