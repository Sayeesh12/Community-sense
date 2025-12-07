import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import MapPage from './pages/MapPage.jsx';
import IssueDetail from './pages/IssueDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AuthorityDashboard from './pages/AuthorityDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ReportNew from './pages/ReportNew.jsx';

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-teal-600 hover:text-teal-700">
              CivicSolve
            </Link>
            <nav className="flex items-center gap-4" aria-label="Main navigation">
              <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
              <Link to="/map" className="hover:text-teal-600 transition-colors">Map</Link>
              
              {user ? (
                <>
                  <Link to="/dashboard" className="hover:text-teal-600 transition-colors">My Reports</Link>
                  {user.role === 'authority' && (
                    <Link to="/authority" className="hover:text-teal-600 transition-colors">Authority</Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="hover:text-teal-600 transition-colors">Admin</Link>
                  )}
                  <span className="text-gray-600">Hello, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-sm"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="hover:text-teal-600 transition-colors">Login</Link>
                  <Link to="/auth/register" className="btn-primary text-sm">Register</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/issues/:id" element={<IssueDetail />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          
          <Route
            path="/report/new"
            element={
              <ProtectedRoute>
                <ReportNew />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/authority"
            element={
              <ProtectedRoute roles={['authority', 'admin']}>
                <AuthorityDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; 2024 CivicSolve. Community Issue Reporting System.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
