import Comment from '../models/Comment.js';
import Issue from '../models/Issue.js';
import { getIO } from '../utils/socket.js';

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      deleted: { $ne: true }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only the author can delete their comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Soft delete
    comment.deleted = true;
    comment.deleted_by = req.user._id;
    comment.deleted_at = new Date();
    await comment.save();

    // Update issue comment count
    const issue = await Issue.findById(comment.issueId);
    if (issue) {
      issue.commentsCount = Math.max(0, issue.commentsCount - 1);
      await issue.save();
    }

    // Emit socket event
    const io = getIO();
    io.emit('commentDeleted', {
      commentId: comment._id,
      issueId: comment.issueId
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
