import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  at: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  }
}, { _id: false });

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['pothole', 'garbage', 'water_leak', 'streetlight', 'traffic', 'other'],
    default: 'other'
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  images: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentsCount: {
    type: Number,
    default: 0
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    default: 'reported',
    index: true
  },
  statusHistory: [statusHistorySchema],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90; // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ author: 1, createdAt: -1 });

// Initialize status history on creation
issueSchema.pre('save', function(next) {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.author,
      at: new Date(),
      note: 'Issue created'
    });
  }
  next();
});

export default mongoose.model('Issue', issueSchema);
