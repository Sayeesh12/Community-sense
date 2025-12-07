import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label="Login form">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password *
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mb-4"
          aria-busy={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-teal-600 hover:text-teal-700">
          Register here
        </Link>
      </p>
    </div>
  );
}
