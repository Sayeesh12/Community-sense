import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { connectSocket, getSocket } from '../services/socket.js';
import StatusTimeline from '../components/StatusTimeline.jsx';
import CommentsList from '../components/CommentsList.jsx';
import IssueStatusUpdateForm from '../components/IssueStatusUpdateForm.jsx';
import { useNavigate } from 'react-router-dom';

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const deleteIssueMutation = useMutation({
    mutationFn: () => api.delete(`/issues/${id}`),
    onSuccess: () => {
      navigate('/dashboard');
    }
  });

  const handleDeleteIssue = () => {
    if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      deleteIssueMutation.mutate();
    }
  };

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
  const isClosed = issue.status === 'closed';
  const canChangeStatus = user && user.role === 'authority' && !isClosed;
  const isIssueOwner = user && (issue.author?._id === user.id || issue.author === user.id);
  const canCloseIssue = isIssueOwner && !isClosed;

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
              <span className={`px-2 py-1 rounded ${
                issue.status === 'closed' 
                  ? 'bg-gray-200 text-gray-700 font-semibold' 
                  : issue.status === 'resolved'
                  ? 'bg-green-100 text-green-800'
                  : issue.status === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : issue.status === 'acknowledged'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                Status: {issue.status.replace('_', ' ')}
              </span>
              {isClosed && (
                <span className="px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs font-medium">
                  Issue Closed - No further updates allowed
                </span>
              )}
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
              {isIssueOwner && (
                <button
                  onClick={handleDeleteIssue}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  disabled={deleteIssueMutation.isLoading}
                >
                  🗑️ Delete Issue
                </button>
              )}
            </>
          )}
        </div>

        {canChangeStatus && !showStatusForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <button
              onClick={() => setShowStatusForm(true)}
              className="btn-primary"
            >
              Update Status
            </button>
          </div>
        )}

        {canChangeStatus && showStatusForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <IssueStatusUpdateForm
              issueId={id}
              currentStatus={issue.status}
              onSuccess={(data) => {
                setShowStatusForm(false);
                queryClient.invalidateQueries(['issue', id]);
              }}
              onCancel={() => setShowStatusForm(false)}
            />
          </div>
        )}

        {canCloseIssue && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">As the issue reporter, you can close this issue when it's resolved.</p>
            <button
              onClick={() => {
                // Simple close - in production, might want a form for this too
                if (window.confirm('Close this issue?')) {
                  api.patch(`/issues/${id}/status`, { status: 'closed' })
                    .then(() => {
                      queryClient.invalidateQueries(['issue', id]);
                    })
                    .catch(err => alert(err.response?.data?.error || 'Failed to close issue'));
                }
              }}
              className="btn-primary"
            >
              Close Issue
            </button>
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
