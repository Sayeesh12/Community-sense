import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import IssueCard from '../components/IssueCard.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['userIssues', user?.id],
    queryFn: async () => {
      const res = await api.get('/users/me/issues');
      return res.data;
    },
    enabled: !!user
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Reports</h1>
        <Link to="/report/new" className="btn-primary">
          Report New Issue
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading your issues...</div>
      ) : data?.issues?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.issues.map(issue => (
            <IssueCard key={issue._id} issue={issue} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You haven't reported any issues yet.</p>
          <Link to="/report/new" className="btn-primary">
            Report Your First Issue
          </Link>
        </div>
      )}
    </div>
  );
}
