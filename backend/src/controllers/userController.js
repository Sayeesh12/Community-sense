import User from '../models/User.js';
import Issue from '../models/Issue.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, perPage = 50 } = req.query;
    const query = role ? { role } : {};

    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(perPage));

    const total = await User.countDocuments(query);

    res.json({
      users,
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

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'authority'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

export const getUserIssues = async (req, res, next) => {
  try {
    // For /me/issues route, use the authenticated user's ID
    // For /:id/issues route, use the param ID (if user is authority)
    const userId = req.params.id || req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { page = 1, perPage = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(perPage);

    const issues = await Issue.find({ author: userId })
      .populate('author', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(perPage));

    const total = await Issue.countDocuments({ author: userId });

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
    console.error('Error in getUserIssues:', error);
    next(error);
  }
};
