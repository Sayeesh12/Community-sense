import React from 'react';

export default function StatusTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return null;
  }

  const statusLabels = {
    reported: 'Reported',
    acknowledged: 'Acknowledged',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed'
  };

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
      <div className="space-y-4">
        {history.map((entry, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-3 h-3 rounded-full bg-teal-600 mt-2"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{statusLabels[entry.status] || entry.status}</span>
                <span className="text-sm text-gray-500">
                  {new Date(entry.at).toLocaleString()}
                </span>
              </div>
              {entry.note && (
                <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
              )}
              {entry.status_description && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Work Performed:</p>
                  <p className="text-sm text-gray-600">{entry.status_description}</p>
                </div>
              )}
              {entry.status_images && entry.status_images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {entry.status_images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.startsWith('http') ? img : `${API_URL}${img}`}
                      alt={`Status update image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
