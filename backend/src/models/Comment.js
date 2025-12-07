import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment must not exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for fetching comments by issue
commentSchema.index({ issueId: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
