import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['water', 'road', 'electricity', 'sanitation', 'other'],
    default: 'other'
  },
  start_time: {
    type: Date
  },
  end_time: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!this.start_time || !value) return true;
        return value > this.start_time;
      },
      message: 'End time must be after start time'
    }
  },
  images: [{
    type: String,
    trim: true
  }],
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
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
noticeSchema.index({ location: '2dsphere' });

// Index for filtering
noticeSchema.index({ category: 1, createdAt: -1 });
noticeSchema.index({ created_by: 1, createdAt: -1 });

export default mongoose.model('Notice', noticeSchema);
