import Notice from '../models/Notice.js';
import { validationResult } from 'express-validator';
import { getIO } from '../utils/socket.js';

// ---------------- CREATE NOTICE ----------------
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
      location: location
        ? {
            type: 'Point',
            coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
          }
        : undefined,
      created_by: req.user._id,
    });

    await notice.save();
    await notice.populate('created_by', 'name email');

    // Emit socket event
    const io = getIO();
    io.emit('noticeCreated', {
      id: notice._id,
      title: notice.title,
      category: notice.category,
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
        created_at: notice.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- GET ALL NOTICES ----------------
// ---------------- GET ALL NOTICES ----------------
export const getNotices = async (req, res, next) => {
  try {
    const {
      category,
      lat,
      lng,
      radius_km = 25,
      page = 1,
      perPage = 20,
      sort = '-createdAt',
    } = req.query;

    const now = new Date();

    // ----------- GEOSPATIAL QUERY (if lat/lng provided) -----------
    if (lat && lng) {
      const matchQuery = {
        location: { $exists: true },
        // NOTE: start_time is intentionally NOT checked here so notices appear immediately after creation.
        // We only exclude notices whose end_time is strictly in the past.
        $or: [
          { end_time: { $exists: false } },
          { end_time: { $gte: now } }
        ],
      };

      if (category) matchQuery.category = category;

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            distanceField: 'distance',
            maxDistance: parseFloat(radius_km) * 1000,
            spherical: true,
            query: matchQuery,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'created_by',
          },
        },
        { $unwind: { path: '$created_by', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'upvotes',
            foreignField: '_id',
            as: 'upvotes',
          },
        },
        {
          $project: {
            'created_by.passwordHash': 0,
            'upvotes.passwordHash': 0,
          },
        },
        { $sort: sort === '-createdAt' ? { createdAt: -1 } : { createdAt: 1 } },
      ];

      const [notices, totalResult] = await Promise.all([
        Notice.aggregate([
          ...pipeline,
          { $skip: (parseInt(page) - 1) * parseInt(perPage) },
          { $limit: parseInt(perPage) },
        ]),
        Notice.aggregate([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)],
              },
              distanceField: 'distance',
              maxDistance: parseFloat(radius_km) * 1000,
              spherical: true,
              query: matchQuery,
            },
          },
          { $count: 'total' },
        ]),
      ]);

      const total = totalResult[0]?.total || 0;

      const noticesWithDistance = notices.map(notice => {
        const obj = {
          ...notice,
          _id: notice._id,
          distance_km: notice.distance ? Math.round((notice.distance / 1000) * 10) / 10 : undefined,
        };

        if (Array.isArray(obj.created_by) && obj.created_by.length > 0) {
          obj.created_by = obj.created_by[0];
        }

        return obj;
      });

      return res.json({
        notices: noticesWithDistance,
        pagination: {
          page: parseInt(page),
          perPage: parseInt(perPage),
          total,
          pages: Math.ceil(total / parseInt(perPage)),
        },
      });
    }

    // ----------- NORMAL QUERY (no geolocation) -----------
    const query = {
      location: { $exists: true },
      // Only require that end_time is not in the past. Do NOT filter by start_time so newly-created notices appear immediately.
      $or: [
        { end_time: { $exists: false } },
        { end_time: { $gte: now } }
      ],
    };

    if (category) query.category = category;

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
        pages: Math.ceil(total / parseInt(perPage)),
      },
    });
  } catch (error) {
    console.error('Error in getNotices:', error);
    next(error);
  }
};


// ---------------- GET MY NOTICES ----------------
export const getMyNotices = async (req, res, next) => {
  try {
    const { page = 1, perPage = 20, sort = '-createdAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const limit = parseInt(perPage);

    const notices = await Notice.find({ created_by: req.user._id })
      .populate('created_by', 'name email')
      .populate('upvotes', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Notice.countDocuments({ created_by: req.user._id });

    res.json({
      notices,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total,
        pages: Math.ceil(total / parseInt(perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- GET SINGLE NOTICE ----------------
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

// ---------------- UPDATE NOTICE ----------------
export const updateNotice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ error: 'Notice not found' });

    // Only creator can update
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
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
      };
    }

    if (req.files && req.files.length > 0) {
      notice.images = images;
    }

    await notice.save();
    await notice.populate('created_by', 'name email');

    const io = getIO();
    io.emit('noticeUpdated', { id: notice._id, title: notice.title });

    res.json({ success: true, notice });
  } catch (error) {
    next(error);
  }
};

// ---------------- DELETE NOTICE ----------------
export const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ error: 'Notice not found' });

    // Only creator can delete
    if (notice.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own notices' });
    }

    await Notice.findByIdAndDelete(req.params.id);

    const io = getIO();
    io.emit('noticeDeleted', { id: notice._id });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ---------------- TOGGLE UPVOTE ----------------
export const toggleUpvote = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ error: 'Notice not found' });

    const userId = req.user._id;
    const index = notice.upvotes.indexOf(userId);

    if (index > -1) {
      notice.upvotes.splice(index, 1);
    } else {
      notice.upvotes.push(userId);
    }

    await notice.save();

    const io = getIO();
    io.emit('noticeUpvoteChanged', {
      noticeId: notice._id,
      upvotesCount: notice.upvotes.length,
    });

    res.json({
      upvoted: index === -1,
      upvotesCount: notice.upvotes.length,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- HELPER: DISTANCE ----------------
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
