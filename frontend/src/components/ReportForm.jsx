import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api.js';
import { useNavigate } from 'react-router-dom';

const categories = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'water_leak', label: 'Water Leak' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'other', label: 'Other' }
];

const validationSchema = Yup.object({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .required('Title is required'),
  description: Yup.string()
    .min(10, 'Description must be at least 10 characters')
    .required('Description is required'),
  category: Yup.string()
    .oneOf(categories.map(c => c.value), 'Invalid category')
    .required('Category is required'),
  severity: Yup.number()
    .min(1, 'Severity must be at least 1')
    .max(5, 'Severity must be at most 5')
    .required('Severity is required'),
  location: Yup.object({
    lat: Yup.number().required('Location is required'),
    lng: Yup.number().required('Location is required')
  }).required('Location is required')
});

export default function ReportForm({ initialLocation, onSuccess }) {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      category: 'other',
      severity: 3,
      location: initialLocation || { lat: null, lng: null }
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('category', values.category);
        formData.append('severity', values.severity);
        formData.append('location[lat]', values.location.lat);
        formData.append('location[lng]', values.location.lng);
        
        images.forEach((image) => {
          formData.append('images', image);
        });

        const res = await api.post('/issues', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (onSuccess) {
          onSuccess(res.data);
        } else {
          navigate(`/issues/${res.data._id}`);
        }
      } catch (error) {
        console.error('Error creating issue:', error);
        alert(error.response?.data?.error || 'Failed to create issue');
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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          formik.setFieldValue('location', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          alert('Unable to get your location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6" aria-label="Report issue form">
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
          aria-invalid={formik.touched.title && formik.errors.title ? 'true' : 'false'}
        />
        {formik.touched.title && formik.errors.title && (
          <p className="mt-1 text-sm text-red-600" role="alert">{formik.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows="4"
          className="input"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.description}
          aria-required="true"
          aria-invalid={formik.touched.description && formik.errors.description ? 'true' : 'false'}
        />
        {formik.touched.description && formik.errors.description && (
          <p className="mt-1 text-sm text-red-600" role="alert">{formik.errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            aria-required="true"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
            Severity (1-5) *
          </label>
          <input
            id="severity"
            name="severity"
            type="number"
            min="1"
            max="5"
            className="input"
            onChange={formik.handleChange}
            value={formik.values.severity}
            aria-required="true"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location *
        </label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="btn-secondary text-sm"
          >
            Use My Location
          </button>
          {formik.values.location.lat && (
            <span className="text-sm text-gray-600 self-center">
              Lat: {formik.values.location.lat.toFixed(4)}, 
              Lng: {formik.values.location.lng.toFixed(4)}
            </span>
          )}
        </div>
        {formik.touched.location && formik.errors.location && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {typeof formik.errors.location === 'string' 
              ? formik.errors.location 
              : 'Location is required'}
          </p>
        )}
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

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full"
        aria-busy={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}
