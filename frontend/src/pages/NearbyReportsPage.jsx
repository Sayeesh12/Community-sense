import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import IssueCard from '../components/IssueCard.jsx';
import MapView from '../components/MapView.jsx';

const radiusOptions = [
  { value: 1, label: '1 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' }
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'pothole', label: 'Pothole' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'water_leak', label: 'Water Leak' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'other', label: 'Other' }
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'reported', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' }
];

const sortOptions = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_commented', label: 'Most Commented' }
];

export default function NearbyReportsPage() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const [filters, setFilters] = useState({
    radius_km: 5,
    category: '',
    status: '',
    sort: 'nearest'
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

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

  const handleManualLocation = () => {
    // Simple geocoding - in production, use a proper geocoding service
    // For now, just show an alert
    alert('Manual location search requires a geocoding service. Please allow geolocation access or use the map to find reports.');
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['nearbyReports', location, filters],
    queryFn: async () => {
      if (!location) return { reports: [] };
      
      const params = {
        lat: location.lat,
        lng: location.lng,
        radius_km: filters.radius_km,
        sort: filters.sort
      };
      
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const res = await api.get('/reports/nearby', { params });
      return res.data;
    },
    enabled: !!location
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (locationError && !location) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Nearby Reports</h1>
        <div className="card">
          <p className="text-red-600 mb-4">Unable to get your location: {locationError}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search by Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Enter city or locality..."
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                />
                <button
                  onClick={handleManualLocation}
                  className="btn-primary"
                >
                  Use This Location
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Or enable location access in your browser settings and refresh the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nearby Reports</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'map' ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}
          >
            Map
          </button>
        </div>
      </div>

      {location && (
        <div className="text-sm text-gray-600 mb-4">
          Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </div>
      )}

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sort By</label>
            <select
              className="input"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading nearby reports...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">Error loading reports: {error.message}</div>
      ) : viewMode === 'list' ? (
        <div>
          {data?.reports?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.reports.map(report => (
                <div key={report.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-teal-600">
                      {report.distance_km} km away
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{report.short_desc}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded">
                      {report.category}
                    </span>
                    <span>💬 {report.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No reports found in this area. Try adjusting your filters or radius.
            </div>
          )}
        </div>
      ) : (
        <div className="h-[600px]">
          <MapView
            issues={data?.reports?.map(r => ({
              _id: r.id,
              title: r.title,
              category: r.category,
              status: r.status,
              location: { coordinates: [r.lat, r.lng] }
            })) || []}
            center={location ? [location.lat, location.lng] : [40.7128, -74.0060]}
            zoom={13}
          />
        </div>
      )}
    </div>
  );
}
