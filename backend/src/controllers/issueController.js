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

    const query = {};

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
    const issue = await Issue.findById(req.params.id)
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

    const { status, note } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const oldStatus = issue.status;
    issue.status = status;
    issue.statusHistory.push({
      status,
      changedBy: req.user._id,
      at: new Date(),
      note: note || `Status changed from ${oldStatus} to ${status}`
    });

    await issue.save();
    await issue.populate('author', 'name email');

    // Emit socket event
    const io = getIO();
    io.emit('statusChanged', {
      issueId: issue._id,
      status,
      changedBy: req.user._id
    });

    // Notify subscribers
    issue.subscribers.forEach(subId => {
      io.to(subId.toString()).emit('issueStatusUpdate', {
        issueId: issue._id,
        title: issue.title,
        status
      });
    });

    res.json(issue);
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

    const comments = await Comment.find({ issueId: req.params.id })
      .populate('author', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(perPage));

    const total = await Comment.countDocuments({ issueId: req.params.id });

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
