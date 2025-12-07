import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import IssueCard from '../components/IssueCard.jsx';

export default function AuthorityDashboard() {
  const [statusFilter, setStatusFilter] = useState('reported');
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
    mutationFn: ({ issueId, status }) => api.patch(`/issues/${issueId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['issues', 'authority']);
    }
  });

  const handleStatusChange = (issueId, newStatus) => {
    statusMutation.mutate({ issueId, status: newStatus });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Authority Dashboard</h1>

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
              <div className="mt-4 flex gap-2">
                {issue.status === 'reported' && (
                  <button
                    onClick={() => handleStatusChange(issue._id, 'acknowledged')}
                    className="btn-primary text-sm"
                  >
                    Acknowledge
                  </button>
                )}
                {issue.status === 'acknowledged' && (
                  <button
                    onClick={() => handleStatusChange(issue._id, 'in_progress')}
                    className="btn-primary text-sm"
                  >
                    Start Work
                  </button>
                )}
                {issue.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange(issue._id, 'resolved')}
                    className="btn-primary text-sm"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">No issues found</div>
      )}
    </div>
  );
}
