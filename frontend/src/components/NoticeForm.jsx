import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api.js';
import LocationInput from './LocationInput.jsx';

const categories = [
  { value: 'water', label: 'Water' },
  { value: 'road', label: 'Road' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'other', label: 'Other' }
];

const validationSchema = Yup.object({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .required('Title is required'),
  message: Yup.string()
    .min(10, 'Message must be at least 10 characters')
    .required('Message is required'),
  category: Yup.string()
    .oneOf(categories.map(c => c.value), 'Invalid category')
    .required('Category is required'),
  location: Yup.object({
    lat: Yup.number().required('Location is required'),
    lng: Yup.number().required('Location is required')
  }).required('Location is required'),
  start_time: Yup.date().nullable(),
  end_time: Yup.date()
    .nullable()
    .min(Yup.ref('start_time'), 'End time must be after start time')
});

export default function NoticeForm({ initialValues: propInitialValues, noticeId, onSuccess, onCancel }) {
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const defaultInitialValues = {
    title: '',
    message: '',
    category: 'other',
    location: { lat: null, lng: null },
    start_time: '',
    end_time: ''
  };

  const formik = useFormik({
    initialValues: propInitialValues || defaultInitialValues,
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('message', values.message);
        formData.append('category', values.category);
        formData.append('location[lat]', values.location.lat);
        formData.append('location[lng]', values.location.lng);
        if (values.start_time) formData.append('start_time', new Date(values.start_time).toISOString());
        if (values.end_time) formData.append('end_time', new Date(values.end_time).toISOString());
        
        // Only append images if new ones are selected (for editing, only update images if new ones are provided)
        if (images.length > 0) {
          images.forEach((image) => {
            formData.append('images', image);
          });
        }

        let res;
        if (noticeId) {
          // Update existing notice
          res = await api.patch(`/notices/${noticeId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          // Create new notice
          res = await api.post('/notices', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        if (onSuccess) {
          onSuccess(res.data.notice);
        }
      } catch (error) {
        console.error('Error creating notice:', error);
        alert(error.response?.data?.error || 'Failed to create notice');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
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

  if (previewMode) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Preview Notice</h3>
        <div className="space-y-4">
          <div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">NOTICE</span>
            <h4 className="text-lg font-semibold mt-2">{formik.values.title}</h4>
            <p className="text-gray-600 mt-1">{formik.values.message}</p>
            <div className="mt-2 text-sm text-gray-500">
              Category: {categories.find(c => c.value === formik.values.category)?.label}
            </div>
            {formik.values.location?.lat && formik.values.location?.lng && (
              <div className="text-sm text-gray-500">
                Location: {formik.values.location.lat.toFixed(6)}, {formik.values.location.lng.toFixed(6)}
              </div>
            )}
            {formik.values.start_time && (
              <div className="text-sm text-gray-500">
                Start: {new Date(formik.values.start_time).toLocaleString()}
              </div>
            )}
            {formik.values.end_time && (
              <div className="text-sm text-gray-500">
                End: {new Date(formik.values.end_time).toLocaleString()}
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {imagePreviews.map((preview, idx) => (
                  <img key={idx} src={preview} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="btn-secondary"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={formik.handleSubmit}
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post Notice'}
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
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6" aria-label="Create notice form">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="input"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.title}
          aria-required="true"
        />
        {formik.touched.title && formik.errors.title && (
          <p className="mt-1 text-sm text-red-600" role="alert">{formik.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows="6"
          className="input"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.message}
          aria-required="true"
        />
        {formik.touched.message && formik.errors.message && (
          <p className="mt-1 text-sm text-red-600" role="alert">{formik.errors.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          id="category"
          name="category"
          className="input"
          onChange={formik.handleChange}
          value={formik.values.category}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location * (Where is this notice relevant?)
        </label>
        <LocationInput
          value={formik.values.location}
          onChange={(location) => formik.setFieldValue('location', location)}
          error={formik.errors.location}
          touched={formik.touched.location}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time (optional)
          </label>
          <input
            id="start_time"
            name="start_time"
            type="datetime-local"
            className="input"
            onChange={formik.handleChange}
            value={formik.values.start_time}
          />
        </div>

        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
            End Time (optional)
          </label>
          <input
            id="end_time"
            name="end_time"
            type="datetime-local"
            className="input"
            onChange={formik.handleChange}
            value={formik.values.end_time}
          />
          {formik.touched.end_time && formik.errors.end_time && (
            <p className="mt-1 text-sm text-red-600" role="alert">{formik.errors.end_time}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
          Images (up to 5)
        </label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="input"
        />
        {imagePreviews.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
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
          type="button"
          onClick={() => setPreviewMode(true)}
          className="btn-secondary"
          disabled={!formik.isValid}
        >
          Preview
        </button>
        <button
          type="submit"
          disabled={submitting || !formik.isValid}
          className="btn-primary"
          aria-busy={submitting}
        >
          {submitting ? (noticeId ? 'Updating...' : 'Posting...') : (noticeId ? 'Update Notice' : 'Post Notice')}
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
