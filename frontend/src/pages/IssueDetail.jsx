import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { connectSocket, getSocket } from '../services/socket.js';
import StatusTimeline from '../components/StatusTimeline.jsx';
import CommentsList from '../components/CommentsList.jsx';

const statusOptions = [
  { value: 'acknowledged', label: 'Acknowledge' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolve' },
  { value: 'closed', label: 'Close' }
];

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const res = await api.get(`/issues/${id}`);
      return res.data;
    }
  });

  const upvoteMutation = useMutation({
    mutationFn: () => api.patch(`/issues/${id}/upvote`),
    onSuccess: () => {
      queryClient.invalidateQueries(['issue', id]);
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: () => api.patch(`/issues/${id}/subscribe`),
    onSuccess: () => {
      queryClient.invalidateQueries(['issue', id]);
    }
  });

  const commentMutation = useMutation({
    mutationFn: (text) => api.post(`/issues/${id}/comments`, { text }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries(['issue', id]);
      queryClient.invalidateQueries(['comments', id]);
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status) => api.patch(`/issues/${id}/status`, { status }),
    onSuccess: () => {
      setNewStatus('');
      queryClient.invalidateQueries(['issue', id]);
    }
  });

  useEffect(() => {
    const socket = connectSocket();
    
    socket.on('statusChanged', (data) => {
      if (data.issueId === id) {
        queryClient.invalidateQueries(['issue', id]);
      }
    });

    socket.on('newComment', (data) => {
      if (data.issueId === id) {
        queryClient.invalidateQueries(['comments', id]);
      }
    });

    return () => {
      socket.off('statusChanged');
      socket.off('newComment');
    };
  }, [id, queryClient]);

  if (isLoading) {
    return <div className="text-center py-8">Loading issue...</div>;
  }

  if (!issue) {
    return <div className="text-center py-8">Issue not found</div>;
  }

  const isUpvoted = user && issue.upvotes?.some(u => u._id === user.id || u === user.id);
  const isSubscribed = user && issue.subscribers?.some(s => s._id === user.id || s === user.id);
  const canChangeStatus = user && (user.role === 'authority' || user.role === 'admin');

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/map" className="text-teal-600 hover:text-teal-700 mb-4 inline-block">
        ← Back to Map
      </Link>

      <div className="card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{issue.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded">
                {issue.category}
              </span>
              <span>Severity: {issue.severity}/5</span>
              <span>Status: {issue.status}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{issue.description}</p>

        {issue.images && issue.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {issue.images.map((img, idx) => {
              const imageUrl = img.startsWith('http') 
                ? img 
                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${img}`;
              return (
                <img
                  key={idx}
                  src={imageUrl}
                  alt={`Issue image ${idx + 1}`}
                  className="w-full h-48 object-cover rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          {user && (
            <>
              <button
                onClick={() => upvoteMutation.mutate()}
                className={`px-4 py-2 rounded-lg ${isUpvoted ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}
              >
                👍 Upvote ({issue.upvotes?.length || 0})
              </button>
              <button
                onClick={() => subscribeMutation.mutate()}
                className={`px-4 py-2 rounded-lg ${isSubscribed ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}
              >
                🔔 {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </>
          )}
        </div>

        {canChangeStatus && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium mb-2">Change Status</label>
            <div className="flex gap-2">
              <select
                className="input flex-1"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select status...</option>
                {statusOptions
                  .filter(opt => opt.value !== issue.status)
                  .map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
              </select>
              <button
                onClick={() => newStatus && statusMutation.mutate(newStatus)}
                className="btn-primary"
                disabled={!newStatus || statusMutation.isLoading}
              >
                Update
              </button>
            </div>
          </div>
        )}

        <StatusTimeline history={issue.statusHistory} />
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Comments ({issue.commentsCount || 0})</h2>
        
        {user && (
          <div className="mb-4">
            <textarea
              className="input mb-2"
              rows="3"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={() => newComment && commentMutation.mutate(newComment)}
              className="btn-primary"
              disabled={!newComment || commentMutation.isLoading}
            >
              Post Comment
            </button>
          </div>
        )}

        <CommentsList issueId={id} />
      </div>
    </div>
  );
}
