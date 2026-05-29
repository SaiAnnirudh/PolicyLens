import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">PolicyLens</span>
              </div>
              <div className="flex space-x-6 items-center">
                <Link to="/" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Dashboard</Link>
                <button className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Sign Out</button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Additional routes for Auth, Policy details, etc. can go here */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
