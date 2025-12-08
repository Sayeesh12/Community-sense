import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api.js';

const statusOptions = [
  { value: 'acknowledged', label: 'Acknowledge' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolve' }
  // Note: 'closed' is not available for authority - only users can close their own issues
];

const validationSchema = Yup.object({
  status: Yup.string()
    .oneOf(statusOptions.map(s => s.value), 'Invalid status')
    .required('Status is required'),
  status_description: Yup.string()
    .min(10, 'Work description must be at least 10 characters')
    .required('Work description is required')
});

export default function IssueStatusUpdateForm({ issueId, currentStatus, onSuccess, onCancel }) {
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      status: '',
      status_description: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('status', values.status);
        formData.append('status_description', values.status_description);
        
        images.forEach((image) => {
          formData.append('status_images', image);
        });

        const res = await api.patch(`/issues/${issueId}/status`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (onSuccess) {
          onSuccess(res.data);
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert(error.response?.data?.error || 'Failed to update status');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Filter out current status from options
  const availableStatuses = statusOptions.filter(opt => opt.value !== currentStatus);

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" aria-label="Update issue status form">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          New Status *
        </label>
        <select
          id="status"
          name="status"
          className="input"
          onChange={formik.handleChange}
          value={formik.values.status}
          aria-required="true"
        >
          <option value="">Select status...</option>
          {availableStatuses.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {formik.touched.status && formik.errors.status && (
          <p className="mt-1 text-sm text-red-600" role="alert">{formik.errors.status}</p>
        )}
      </div>

      <div>
        <label htmlFor="status_description" className="block text-sm font-medium text-gray-700 mb-1">
          Work Performed / Description *
        </label>
        <textarea
          id="status_description"
          name="status_description"
          rows="4"
          className="input"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.status_description}
          placeholder="Describe the work performed, actions taken, or updates made..."
          aria-required="true"
        />
        {formik.touched.status_description && formik.errors.status_description && (
          <p className="mt-1 text-sm text-red-600" role="alert">{formik.errors.status_description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Minimum 10 characters required</p>
      </div>

      <div>
        <label htmlFor="status_images" className="block text-sm font-medium text-gray-700 mb-1">
          Before/After Photos (optional, up to 4)
        </label>
        <input
          id="status_images"
          name="status_images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="input"
        />
        {imagePreviews.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  aria-label={`Remove image ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !formik.isValid}
          className="btn-primary"
          aria-busy={submitting}
        >
          {submitting ? 'Updating...' : 'Update Status'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
