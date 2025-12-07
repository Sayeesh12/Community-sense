import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    }
  });

  const { data: heatmap } = useQuery({
    queryKey: ['admin', 'heatmap'],
    queryFn: async () => {
      const res = await api.get('/admin/heatmap');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const statusData = stats?.issues?.byStatus ? Object.entries(stats.issues.byStatus).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  })) : [];

  const categoryData = stats?.issues?.byCategory ? Object.entries(stats.issues.byCategory).map(([name, value]) => ({
    name,
    value
  })) : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Issues</h3>
          <p className="text-3xl font-bold text-teal-600">{stats?.issues?.total || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-teal-600">{stats?.users?.total || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Recent Issues (7d)</h3>
          <p className="text-3xl font-bold text-teal-600">{stats?.issues?.recent || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Issues by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Issues by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4">Heatmap Data</h3>
        <p className="text-gray-600">
          {heatmap?.totalPoints || 0} issue locations loaded for heatmap visualization.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Heatmap visualization can be integrated with Leaflet heatmap plugin on the map page.
        </p>
      </div>
    </div>
  );
}
