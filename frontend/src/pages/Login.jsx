import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, Shield } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    
    try {
      if (mode === 'signup') {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await axios.post(`${API_URL}/auth/signup`, { email, password });
        localStorage.setItem('token', res.data.access_token);
        navigate('/');
      } else if (mode === 'login') {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.access_token);
        navigate('/');
      } else if (mode === 'otp') {
        if (!otp) {
          // Request OTP
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          await axios.post(`${API_URL}/auth/request-otp`, { email });
          setMsg('OTP sent to your email!');
        } else {
          // Verify OTP
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, code: otp });
          localStorage.setItem('token', res.data.access_token);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
      <div className="glass-panel p-8 w-full max-w-md animate-fade-in relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Passwordless Login'}
          </h2>
          <p className="text-slate-500 text-sm mt-1 text-center">
            {mode === 'otp' ? 'Login instantly with a secure email code.' : 'Enter your credentials to continue.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50/50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6 relative z-10">
            {error}
          </div>
        )}
        
        {msg && (
          <div className="bg-emerald-50/50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl mb-6 relative z-10">
            {msg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/50 backdrop-blur-sm transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {mode !== 'otp' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/50 backdrop-blur-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}
          
          {mode === 'otp' && msg && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-700 mb-1">6-Digit Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/50 backdrop-blur-sm transition-all text-center tracking-widest font-mono text-lg"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex justify-center items-center gap-2 py-2.5 text-base"
          >
            {loading ? 'Processing...' : mode === 'otp' && !msg ? 'Send OTP' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 relative z-10">
          <div className="flex justify-between text-sm">
            <button 
              onClick={() => { setMode('login'); setError(''); setMsg(''); }}
              className={`font-medium transition-colors ${mode === 'login' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(''); setMsg(''); }}
              className={`font-medium transition-colors ${mode === 'signup' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Sign Up
            </button>
            <button 
              onClick={() => { setMode('otp'); setError(''); setMsg(''); }}
              className={`font-medium transition-colors ${mode === 'otp' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Email OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
