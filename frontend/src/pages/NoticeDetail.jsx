import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function NoticeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn: async () => {
      const res = await api.get(`/notices/${id}`);
      return res.data;
    }
  });

  const upvoteMutation = useMutation({
    mutationFn: () => api.patch(`/notices/${id}/upvote`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notice', id]);
      queryClient.invalidateQueries(['notices']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/notices/${id}`),
    onSuccess: () => {
      navigate('/notices');
    }
  });

  const isUpvoted = user && notice?.upvotes?.some(u => u._id === user.id || u === user.id);
  const isNoticeOwner = user && notice && (notice.created_by?._id === user.id || notice.created_by === user.id);
  const canEdit = isNoticeOwner && user?.role === 'authority';

  if (isLoading) {
    return <div className="text-center py-8">Loading notice...</div>;
  }

  if (!notice) {
    return <div className="text-center py-8">Notice not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/notices" className="text-teal-600 hover:text-teal-700 mb-4 inline-block">
        ← Back to Notices
      </Link>

      <div className="card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                NOTICE
              </span>
              <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-sm">
                {notice.category}
              </span>
              {notice.distance_km && (
                <span className="text-sm text-gray-500">
                  {notice.distance_km} km away
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{notice.title}</h1>
            <div className="text-sm text-gray-600">
              Posted by: {notice.created_by?.name || 'Authority'} • {new Date(notice.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{notice.message}</p>

        {(notice.start_time || notice.end_time) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Timing</h3>
            {notice.start_time && (
              <div className="text-sm text-gray-700">
                <strong>Start:</strong> {new Date(notice.start_time).toLocaleString()}
              </div>
            )}
            {notice.end_time && (
              <div className="text-sm text-gray-700">
                <strong>End:</strong> {new Date(notice.end_time).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {notice.images && notice.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {notice.images.map((img, idx) => {
              const imageUrl = img.startsWith('http') 
                ? img 
                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${img}`;
              return (
                <img
                  key={idx}
                  src={imageUrl}
                  alt={`Notice image ${idx + 1}`}
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
            <button
              onClick={() => upvoteMutation.mutate()}
              className={`px-4 py-2 rounded-lg ${isUpvoted ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}
              disabled={upvoteMutation.isLoading}
            >
              👍 Upvote ({notice.upvotes?.length || 0})
            </button>
          )}
          {canEdit && (
            <>
              <Link
                to={`/notices/${id}/edit`}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Edit Notice
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete Notice
              </button>
            </>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 rounded-lg mb-4">
            <p className="text-red-800 mb-2">Are you sure you want to delete this notice?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

