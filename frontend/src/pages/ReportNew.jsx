import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReportForm from '../components/ReportForm.jsx';

export default function ReportNew() {
  const navigate = useNavigate();

  const handleSuccess = (issue) => {
    navigate(`/issues/${issue._id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Report New Issue</h1>
      <ReportForm onSuccess={handleSuccess} />
    </div>
  );
}
