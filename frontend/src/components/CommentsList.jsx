import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CommentsList({ issueId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deletedComments, setDeletedComments] = useState({});
  const [undoTimeouts, setUndoTimeouts] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['comments', issueId],
    queryFn: async () => {
      const res = await api.get(`/issues/${issueId}/comments`);
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/issues/${issueId}/comments/${commentId}`),
    onSuccess: (_, commentId) => {
      // Set up undo timeout
      const timeoutId = setTimeout(() => {
        // Permanently delete after 5 seconds
        setDeletedComments(prev => {
          const newState = { ...prev };
          delete newState[commentId];
          return newState;
        });
        setUndoTimeouts(prev => {
          const newState = { ...prev };
          delete newState[commentId];
          return newState;
        });
        queryClient.invalidateQueries(['comments', issueId]);
      }, 5000);

      setDeletedComments(prev => ({ ...prev, [commentId]: true }));
      setUndoTimeouts(prev => ({ ...prev, [commentId]: timeoutId }));
      queryClient.invalidateQueries(['comments', issueId]);
    }
  });

  const handleUndo = (commentId) => {
    // Cancel the timeout
    if (undoTimeouts[commentId]) {
      clearTimeout(undoTimeouts[commentId]);
      setUndoTimeouts(prev => {
        const newState = { ...prev };
        delete newState[commentId];
        return newState;
      });
    }
    
    // Remove from deleted list
    setDeletedComments(prev => {
      const newState = { ...prev };
      delete newState[commentId];
      return newState;
    });
    
    // Refresh comments
    queryClient.invalidateQueries(['comments', issueId]);
  };

  const handleDelete = (commentId) => {
    deleteMutation.mutate(commentId);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  if (!data?.comments || data.comments.length === 0) {
    return <div className="text-center py-4 text-gray-500">No comments yet</div>;
  }

  return (
    <div className="space-y-4">
      {data.comments.map(comment => {
        const isDeleted = deletedComments[comment._id];
        const isOwner = user && (comment.author?._id === user.id || comment.author === user.id);

        if (isDeleted) {
          return (
            <div key={comment._id} className="border-b pb-4 bg-gray-50 p-3 rounded">
              <p className="text-gray-500 italic mb-2">Comment deleted</p>
              <button
                onClick={() => handleUndo(comment._id)}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Undo
              </button>
            </div>
          );
        }

        return (
          <div key={comment._id} className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {comment.author?.name || 'Anonymous'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                  aria-label="Delete comment"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
            <p className="text-gray-700">{comment.text}</p>
          </div>
        );
      })}
    </div>
  );
}
