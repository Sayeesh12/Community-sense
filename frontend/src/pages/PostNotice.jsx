import React from 'react';
import { useNavigate } from 'react-router-dom';
import NoticeForm from '../components/NoticeForm.jsx';

export default function PostNotice() {
  const navigate = useNavigate();

  const handleSuccess = (notice) => {
    navigate('/notices');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Post Notice</h1>
      <p className="text-gray-600 mb-6">
        Post important notices for the community. These notices will be visible to users in the nearby region.
      </p>
      <NoticeForm onSuccess={handleSuccess} onCancel={() => navigate('/authority')} />
    </div>
  );
}

