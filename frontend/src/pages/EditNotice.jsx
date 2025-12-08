import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import NoticeForm from '../components/NoticeForm.jsx';

export default function EditNotice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn: async () => {
      const res = await api.get(`/notices/${id}`);
      return res.data;
    }
  });

  const handleSuccess = (updatedNotice) => {
    navigate(`/notices/${id}`);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading notice...</div>;
  }

  if (!notice) {
    return <div className="text-center py-8">Notice not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Notice</h1>
      <NoticeForm
        initialValues={{
          title: notice.title,
          message: notice.message,
          category: notice.category,
          location: {
            lat: notice.location?.coordinates[1],
            lng: notice.location?.coordinates[0]
          },
          start_time: notice.start_time ? new Date(notice.start_time).toISOString().slice(0, 16) : '',
          end_time: notice.end_time ? new Date(notice.end_time).toISOString().slice(0, 16) : ''
        }}
        noticeId={id}
        onSuccess={handleSuccess}
        onCancel={() => navigate(`/notices/${id}`)}
      />
    </div>
  );
}

