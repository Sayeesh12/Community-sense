import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const radiusOptions = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' }
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'water', label: 'Water' },
  { value: 'road', label: 'Road' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'other', label: 'Other' }
];

export default function NoticesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [filters, setFilters] = useState({
    radius_km: 25,
    category: ''
  });

  useEffect(() => {
    // Request geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError(error.message);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notices', 'nearby', location, filters],
    queryFn: async () => {
      if (!location) return { notices: [] };

      const params = {
        lat: location.lat,
        lng: location.lng,
        radius_km: filters.radius_km,
        page: 1,
        perPage: 50
      };

      if (filters.category) params.category = filters.category;

      const res = await api.get('/notices', { params });
      return res.data;
    },
    enabled: !!location,
    // Refetch every 30 seconds to show notices that become active
    refetchInterval: 30000,
    refetchIntervalInBackground: false
  });

  const upvoteMutation = useMutation({
    mutationFn: (noticeId) => api.patch(`/notices/${noticeId}/upvote`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notices']);
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUpvote = (e, noticeId) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      upvoteMutation.mutate(noticeId);
    }
  };

  if (locationError && !location) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Community Notices</h1>
        <div className="card">
          <p className="text-red-600 mb-4">Unable to get your location: {locationError}</p>
          <p className="text-sm text-gray-600">
            Please enable location access in your browser settings and refresh the page to view nearby notices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Notices</h1>
      </div>

      {location && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Radius</label>
              <select
                className="input"
                value={filters.radius_km}
                onChange={(e) => handleFilterChange('radius_km', parseInt(e.target.value))}
              >
                {radiusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="input"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading notices...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">Error loading notices: {error.message}</div>
      ) : data?.notices?.length > 0 ? (
        <div className="space-y-4">
          {data.notices.map(notice => {
            const isUpvoted = user && notice.upvotes?.some(u => u._id === user.id || u === user.id);
            return (
              <Link
                key={notice._id}
                to={`/notices/${notice._id}`}
                className="card block hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      NOTICE
                    </span>
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs">
                      {notice.category}
                    </span>
                    {notice.distance_km && (
                      <span className="text-xs text-gray-500">
                        {notice.distance_km} km away
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{notice.title}</h3>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap line-clamp-3">{notice.message}</p>
              
              {(notice.start_time || notice.end_time) && (
                <div className="text-sm text-gray-600 mb-3">
                  {notice.start_time && (
                    <div>Start: {new Date(notice.start_time).toLocaleString()}</div>
                  )}
                  {notice.end_time && (
                    <div>End: {new Date(notice.end_time).toLocaleString()}</div>
                  )}
                </div>
              )}

              {notice.images && notice.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {notice.images.map((img, idx) => {
                    const imageUrl = img.startsWith('http') 
                      ? img 
                      : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${img}`;
                    return (
                      <img
                        key={idx}
                        src={imageUrl}
                        alt={`Notice image ${idx + 1}`}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    );
                  })}
                </div>
              )}

                <div className="flex items-center justify-between mt-3">
                  {notice.created_by && (
                    <div className="text-xs text-gray-500">
                      Posted by: {notice.created_by.name || 'Authority'}
                    </div>
                  )}
                  {user && (
                    <button
                      onClick={(e) => handleUpvote(e, notice._id)}
                      className={`px-3 py-1 rounded text-sm ${
                        isUpvoted ? 'bg-teal-600 text-white' : 'bg-gray-200'
                      }`}
                      disabled={upvoteMutation.isLoading}
                    >
                      👍 {notice.upvotes?.length || 0}
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {location 
            ? 'No notices found in your area. Try adjusting your filters or radius.'
            : 'Loading location...'}
        </div>
      )}
    </div>
  );
}

