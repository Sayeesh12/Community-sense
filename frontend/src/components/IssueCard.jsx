import React from 'react';
import { Link } from 'react-router-dom';

const categoryLabels = {
  pothole: 'Pothole',
  garbage: 'Garbage',
  water_leak: 'Water Leak',
  streetlight: 'Streetlight',
  traffic: 'Traffic',
  other: 'Other'
};

const statusColors = {
  reported: 'bg-gray-100 text-gray-800',
  acknowledged: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-200 text-gray-700'
};

export default function IssueCard({ issue }) {
  return (
    <Link
      to={`/issues/${issue._id}`}
      className="card hover:shadow-lg transition-shadow block"
      aria-label={`View issue: ${issue.title}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {issue.title}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[issue.status]}`}>
          {issue.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {issue.description}
      </p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded">
            {categoryLabels[issue.category] || issue.category}
          </span>
          <span>Severity: {issue.severity}/5</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👍 {issue.upvotes?.length || 0}</span>
          <span>💬 {issue.commentsCount || 0}</span>
        </div>
      </div>
      
      {issue.author && (
        <div className="mt-3 text-xs text-gray-400">
          By {issue.author.name} • {new Date(issue.createdAt).toLocaleDateString()}
        </div>
      )}
    </Link>
  );
}
