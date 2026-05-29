import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-xl font-semibold text-slate-900 tracking-tight">PolicySimplifier</span>
              </div>
              <div className="flex space-x-4">
                <Link to="/" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Dashboard</Link>
                <button className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Other routes will go here */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
