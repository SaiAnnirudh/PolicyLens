import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Shield, UserCircle, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import './index.css';

// Intercept axios requests to add token
import axios from 'axios';
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function Navigation({ handleLogout }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-brand-700 transition-colors">PolicyLens</span>
          </div>
          {token && (
            <div className="flex space-x-2 sm:space-x-4 items-center">
              <Link to="/admin" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">Admin Panel</Link>
              <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">Dashboard</Link>
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navigation handleLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
