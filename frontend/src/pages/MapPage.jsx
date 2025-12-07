import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import MapView from '../components/MapView.jsx';
import IssueCard from '../components/IssueCard.jsx';
import { Link } from 'react-router-dom';

export default function MapPage() {
  const [bounds, setBounds] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [selectedIssue, setSelectedIssue] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['issues', 'map', bounds, filters],
    queryFn: async () => {
      const params = {
        page: 1,
        perPage: 100
      };

      if (bounds) {
        params.bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
      }

      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/issues', { params });
      return res.data;
    },
    enabled: !!bounds || Object.values(filters).some(v => v)
  });

  useEffect(() => {
    // Default to a reasonable viewport if no bounds set
    if (!bounds) {
      setBounds({
        minLng: -74.1,
        minLat: 40.6,
        maxLng: -73.9,
        maxLat: 40.8
      });
    }
  }, []);

  const handleBoundsChange = (newBounds) => {
    setBounds(newBounds);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col lg:flex-row gap-4">
      <div className="lg:w-1/3 flex flex-col">
        <div className="card mb-4">
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All</option>
                <option value="reported">Reported</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="input"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All</option>
                <option value="pothole">Pothole</option>
                <option value="garbage">Garbage</option>
                <option value="water_leak">Water Leak</option>
                <option value="streetlight">Streetlight</option>
                <option value="traffic">Traffic</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                className="input"
                placeholder="Search issues..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <Link to="/report/new" className="btn-primary w-full text-center block">
              Report New Issue
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading issues...</div>
          ) : data?.issues?.length > 0 ? (
            data.issues.map(issue => (
              <IssueCard
                key={issue._id}
                issue={issue}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No issues found in this area</div>
          )}
        </div>
      </div>

      <div className="lg:w-2/3 h-full">
        <MapView
          issues={data?.issues || []}
          center={[40.7128, -74.0060]}
          zoom={13}
          onBoundsChange={handleBoundsChange}
          onMarkerClick={setSelectedIssue}
          selectedIssueId={selectedIssue?._id}
        />
      </div>
    </div>
  );
}
