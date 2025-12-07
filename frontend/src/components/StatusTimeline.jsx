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

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Status History</h3>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
