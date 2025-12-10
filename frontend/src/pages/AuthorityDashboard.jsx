import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import IssueCard from '../components/IssueCard.jsx';
import IssueStatusUpdateForm from '../components/IssueStatusUpdateForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('reported');
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'notices'
  const [updatingIssueId, setUpdatingIssueId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['issues', 'authority', statusFilter],
    queryFn: async () => {
      const res = await api.get('/issues', {
        params: { status: statusFilter, page: 1, perPage: 50 }
      });
      return res.data;
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ issueId, formData }) => api.patch(`/issues/${issueId}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['issues', 'authority']);
      setUpdatingIssueId(null);
    }
  });

  const { data: myNotices, isLoading: noticesLoading } = useQuery({
    queryKey: ['notices', 'my', user?.id],
    queryFn: async () => {
      const res = await api.get('/notices/my', {
        params: { page: 1, perPage: 100 }
      });
      return res.data.notices; // Extract the notices array from the response
    },
    enabled: !!user && activeTab === 'notices'
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: (noticeId) => api.delete(`/notices/${noticeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notices']);
    }
  });

  const handleStatusChange = (issueId) => {
    setUpdatingIssueId(issueId);
  };

  const handleStatusUpdateSuccess = (updatedIssue) => {
    // The mutation onSuccess will handle closing the form and invalidating queries
  };

  const handleCancelStatusUpdate = () => {
    setUpdatingIssueId(null);
  };

  const handleDeleteNotice = (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      deleteNoticeMutation.mutate(noticeId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Authority Dashboard</h1>
        <Link to="/post-notice" className="btn-primary">
          Post Notice
        </Link>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'issues'
              ? 'border-b-2 border-teal-600 text-teal-600'
              : 'text-gray-600 hover:text-teal-600'
          }`}
        >
          Issues
        </button>
        <button
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'notices'
              ? 'border-b-2 border-teal-600 text-teal-600'
              : 'text-gray-600 hover:text-teal-600'
          }`}
        >
          My Notices
        </button>
      </div>

      {activeTab === 'issues' && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Filter by Status</label>
            <select
              className="input w-64"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="reported">Reported</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading issues...</div>
          ) : data?.issues?.length > 0 ? (
            <div className="space-y-4">
              {data.issues.map(issue => (
                <div key={issue._id} className="card">
                  <IssueCard issue={issue} />
                  <div className="mt-4">
                    {updatingIssueId === issue._id ? (
                      <IssueStatusUpdateForm
                        issueId={issue._id}
                        currentStatus={issue.status}
                        onSuccess={handleStatusUpdateSuccess}
                        onCancel={handleCancelStatusUpdate}
                      />
                    ) : (
                      <div className="flex gap-2">
                        {issue.status === 'reported' && (
                          <button
                            onClick={() => handleStatusChange(issue._id)}
                            className="btn-primary text-sm"
                          >
                            Update Status
                          </button>
                        )}
                        {issue.status === 'acknowledged' && (
                          <button
                            onClick={() => handleStatusChange(issue._id)}
                            className="btn-primary text-sm"
                          >
                            Update Status
                          </button>
                        )}
                        {issue.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(issue._id)}
                            className="btn-primary text-sm"
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No issues found</div>
          )}
        </>
      )}

      {activeTab === 'notices' && (
        <>
          {noticesLoading ? (
            <div className="text-center py-8">Loading notices...</div>
          ) : myNotices?.length > 0 ? (
            <div className="space-y-4">
              {myNotices.map(notice => (
                <div key={notice._id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        NOTICE
                      </span>
                      <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs">
                        {notice.category}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{notice.title}</h3>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap line-clamp-3">{notice.message}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      👍 {notice.upvotes?.length || 0} upvotes
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/notices/${notice._id}`}
                        className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                      >
                        View
                      </Link>
                      <Link
                        to={`/notices/${notice._id}/edit`}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteNotice(notice._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        disabled={deleteNoticeMutation.isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No notices posted yet. <Link to="/post-notice" className="text-teal-600 hover:underline">Post your first notice</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
