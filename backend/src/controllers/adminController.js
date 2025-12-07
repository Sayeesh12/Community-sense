import Issue from '../models/Issue.js';
import User from '../models/User.js';

export const getStats = async (req, res, next) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const issuesByStatus = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const issuesByCategory = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const issuesBySeverity = await Issue.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentIssues = await Issue.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      issues: {
        total: totalIssues,
        byStatus: issuesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byCategory: issuesByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        bySeverity: issuesBySeverity.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recent: recentIssues
      },
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getHeatmap = async (req, res, next) => {
  try {
    const { bbox } = req.query; // "minLng,minLat,maxLng,maxLat"
    
    let query = {};
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      query.location = {
        $geoWithin: {
          $box: [[minLng, minLat], [maxLng, maxLat]]
        }
      };
    }

    // Get all issues with locations for heatmap
    const issues = await Issue.find(query)
      .select('location status category')
      .lean();

    // Group by grid cells for heatmap (simplified - you might want to use a proper heatmap library)
    const gridSize = 0.01; // ~1km at equator
    const heatmapData = {};

    issues.forEach(issue => {
      if (issue.location && issue.location.coordinates) {
        const [lng, lat] = issue.location.coordinates;
        const gridLng = Math.floor(lng / gridSize) * gridSize;
        const gridLat = Math.floor(lat / gridSize) * gridSize;
        const key = `${gridLng},${gridLat}`;
        
        if (!heatmapData[key]) {
          heatmapData[key] = { lng: gridLng, lat: gridLat, count: 0 };
        }
        heatmapData[key].count += 1;
      }
    });

    res.json({
      heatmap: Object.values(heatmapData),
      totalPoints: issues.length
    });
  } catch (error) {
    next(error);
  }
};
