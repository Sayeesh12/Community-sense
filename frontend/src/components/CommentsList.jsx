import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

export default function CommentsList({ issueId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['comments', issueId],
    queryFn: async () => {
      const res = await api.get(`/issues/${issueId}/comments`);
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  if (!data?.comments || data.comments.length === 0) {
    return <div className="text-center py-4 text-gray-500">No comments yet</div>;
  }

  return (
    <div className="space-y-4">
      {data.comments.map(comment => (
        <div key={comment._id} className="border-b pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">
              {comment.author?.name || 'Anonymous'}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-700">{comment.text}</p>
        </div>
      ))}
    </div>
  );
}
