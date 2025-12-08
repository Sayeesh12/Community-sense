import Notice from '../models/Notice.js';
import { validationResult } from 'express-validator';
import { getIO } from '../utils/socket.js';

export const createNotice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, category, start_time, end_time, location } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const notice = new Notice({
      title,
      message,
      category,
      start_time: start_time || undefined,
      end_time: end_time || undefined,
      images,
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
      },
      created_by: req.user._id
    });

    await notice.save();
    await notice.populate('created_by', 'name email');

    // Emit socket event
    const io = getIO();
    io.emit('noticeCreated', {
      id: notice._id,
      title: notice.title,
      category: notice.category
    });

    res.status(201).json({
      success: true,
      notice: {
        id: notice._id,
        title: notice.title,
        message: notice.message,
        category: notice.category,
        start_time: notice.start_time,
        end_time: notice.end_time,
        images: notice.images,
        created_by: notice.created_by,
        created_at: notice.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getNotices = async (req, res, next) => {
  try {
    const {
      category,
      lat,
      lng,
      radius_km = 25,
      page = 1,
      perPage = 20,
      sort = '-createdAt'
    } = req.query;

    const now = new Date();

    // Geospatial query for nearby notices
    if (lat && lng) {
      // Build match query for filters
      const matchQuery = {
        location: { $exists: true }
      };
      if (category) matchQuery.category = category;

      // Time-based filtering
      matchQuery.$and = [
        {
          $or: [
            { start_time: { $exists: false } },
            { start_time: { $lte: now } }
          ]
        },
        {
          $or: [
            { end_time: { $exists: false } },
            { end_time: { $gte: now } }
          ]
        }
      ];

      // Use aggregation pipeline for geospatial queries with filters
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance',
            maxDistance: parseFloat(radius_km) * 1000, // convert km to meters
            spherical: true,
            query: matchQuery
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'created_by'
          }
        },
        {
          $unwind: {
            path: '$created_by',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'upvotes',
            foreignField: '_id',
            as: 'upvotes'
          }
        },
        {
          $project: {
            'created_by.passwordHash': 0,
            'upvotes.passwordHash': 0
          }
        },
        {
          $sort: sort === '-createdAt' ? { createdAt: -1 } : { createdAt: 1 }
        }
      ];

      const [notices, totalResult] = await Promise.all([
        Notice.aggregate([
          ...pipeline,
          { $skip: (parseInt(page) - 1) * parseInt(perPage) },
          { $limit: parseInt(perPage) }
        ]),
        Notice.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              distanceField: 'distance',
              maxDistance: parseFloat(radius_km) * 1000,
              spherical: true,
              query: matchQuery
            }
          },
          { $count: 'total' }
        ])
      ]);

      const total = totalResult[0]?.total || 0;

      // Transform aggregation results and calculate distance
      const noticesWithDistance = notices.map(notice => {
        const noticeObj = {
          ...notice,
          _id: notice._id,
          distance_km: Math.round((notice.distance / 1000) * 10) / 10
        };
        // Convert created_by array to object if needed
        if (Array.isArray(noticeObj.created_by) && noticeObj.created_by.length > 0) {
          noticeObj.created_by = noticeObj.created_by[0];
        }
        return noticeObj;
      });

      return res.json({
        notices: noticesWithDistance,
        pagination: {
          page: parseInt(page),
          perPage: parseInt(perPage),
          total,
          pages: Math.ceil(total / parseInt(perPage))
        }
      });
    }

    // Regular query without geospatial filtering
    const query = {
      location: { $exists: true }
    };
    if (category) query.category = category;

    // Time-based filtering
    query.$and = [
      {
        $or: [
          { start_time: { $exists: false } },
          { start_time: { $lte: now } }
        ]
      },
      {
        $or: [
          { end_time: { $exists: false } },
          { end_time: { $gte: now } }
        ]
      }
    ];

    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const limit = parseInt(perPage);

    const notices = await Notice.find(query)
      .populate('created_by', 'name email')
      .populate('upvotes', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notice.countDocuments(query);

    res.json({
      notices,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total,
        pages: Math.ceil(total / parseInt(perPage))
      }
    });
  } catch (error) {
    console.error('Error in getNotices:', error);
    next(error);
  }
};

export const getNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('created_by', 'name email')
      .populate('upvotes', 'name');

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(notice);
  } catch (error) {
    next(error);
  }
};

export const updateNotice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Only the creator can update
    if (notice.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own notices' });
    }

    const { title, message, category, start_time, end_time, location } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    if (title) notice.title = title;
    if (message) notice.message = message;
    if (category) notice.category = category;
    if (start_time !== undefined) notice.start_time = start_time || undefined;
    if (end_time !== undefined) notice.end_time = end_time || undefined;
    if (location) {
      notice.location = {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
      };
    }
    // Only update images if new ones are provided
    if (req.files && req.files.length > 0) {
      notice.images = images;
    }

    await notice.save();
    await notice.populate('created_by', 'name email');

    // Emit socket event
    const io = getIO();
    io.emit('noticeUpdated', {
      id: notice._id,
      title: notice.title
    });

    res.json({
      success: true,
      notice
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Only the creator can delete
    if (notice.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own notices' });
    }

    await Notice.findByIdAndDelete(req.params.id);

    // Emit socket event
    const io = getIO();
    io.emit('noticeDeleted', {
      id: notice._id
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const toggleUpvote = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const userId = req.user._id;
    const upvoteIndex = notice.upvotes.indexOf(userId);

    if (upvoteIndex > -1) {
      notice.upvotes.splice(upvoteIndex, 1);
    } else {
      notice.upvotes.push(userId);
    }

    await notice.save();

    // Emit socket event
    const io = getIO();
    io.emit('noticeUpvoteChanged', {
      noticeId: notice._id,
      upvotesCount: notice.upvotes.length
    });

    res.json({
      upvoted: upvoteIndex === -1,
      upvotesCount: notice.upvotes.length
    });
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
