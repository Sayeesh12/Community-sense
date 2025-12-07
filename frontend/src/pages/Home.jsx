import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import IssueCard from '../components/IssueCard.jsx';

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['issues', 'recent'],
    queryFn: async () => {
      const res = await api.get('/issues', {
        params: { page: 1, perPage: 6, sort: '-createdAt' }
      });
      return res.data;
    }
  });

  return (
    <div>
      <section className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">Report Civic Issues</h1>
        <p className="text-xl mb-6">
          Help improve your community by reporting issues like potholes, garbage, water leaks, and more.
        </p>
        <div className="flex gap-4">
          <Link to="/map" className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            View Map
          </Link>
          <Link to="/report/new" className="bg-teal-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-900 transition-colors">
            Report Issue
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Issues</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading issues...</div>
        ) : data?.issues?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.issues.map(issue => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No issues found</div>
        )}
      </section>
    </div>
  );
}
