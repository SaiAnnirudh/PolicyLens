import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import PDFUploader from '../components/PDFUploader';
import PolicyAnalysis from '../components/PolicyAnalysis';
import ChatBot from '../components/ChatBot';
import ClaimsWizard from '../components/ClaimsWizard';
import { Activity, FileText, CheckCircle2, Clock, ChevronDown } from 'lucide-react';

export default function Dashboard() {
  const [showWizard, setShowWizard] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  useEffect(() => {
    fetchPolicies();
    
    // Setup WebSocket
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            const userId = decoded.id;
            const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
            const ws = new WebSocket(`${WS_URL}/ws/notifications/${userId}`);
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'CLAIM_STATUS_UPDATED') {
                    setNotification(data.message);
                    // Hide after 5 seconds
                    setTimeout(() => setNotification(null), 5000);
                }
            };
            
            return () => ws.close();
        } catch (e) {
            console.error("Failed to decode token for WebSocket", e);
        }
    }
  }, []);

  const fetchPolicies = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.get(`${API_URL}/policies/mine`);
      setPolicies(res.data);
      if (res.data.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch policies', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (id) => {
    setSelectedPolicyId(id);
    fetchPolicies();
  };

  const activePolicy = policies.find(p => p.id === selectedPolicyId) || null;

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]">Loading your dashboard...</div>;
  }

  return (
    <div className="animate-fade-in relative">
      {notification && (
        <div className="fixed top-24 right-8 bg-brand-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-brand-100" />
          <p className="font-medium">{notification}</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your policies and predict claim outcomes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {policies.length > 0 && (
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium cursor-pointer shadow-sm hover:border-brand-300 transition-colors"
                value={selectedPolicyId || ''}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
              >
                {policies.map((p, idx) => {
                  const name = p.extracted_data?.insurer || p.extracted_data?.policy_type ? 
                    `${p.extracted_data?.insurer || ''} ${p.extracted_data?.policy_type || ''}`.trim() : 
                    `Policy ${idx + 1}`;
                  return (
                    <option key={p.id} value={p.id}>
                      {name} ({new Date(p.uploaded_at).toLocaleDateString()})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          )}
          <button onClick={() => setShowWizard(true)} className="btn-primary shadow-lg shadow-brand-500/20" disabled={!activePolicy}>
            File New Claim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Navigation Sidebar for Stats */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
          <div className="glass-panel p-5 hover:border-brand-200 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Policies</p>
                <h3 className="text-xl font-bold text-slate-900">{policies.length}</h3>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-5 hover:border-emerald-200 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Claims</p>
                <h3 className="text-xl font-bold text-slate-900">0</h3>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-5 hover:border-amber-200 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Claims</p>
                <h3 className="text-xl font-bold text-slate-900">0</h3>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-5 hover:border-brand-200 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-100 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recovered</p>
                <h3 className="text-xl font-bold text-slate-900">₹0</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-8">
              {activePolicy ? (
                <PolicyAnalysis data={activePolicy.extracted_data} />
              ) : (
                <div className="glass-panel p-12 text-center border-dashed border-2 border-slate-300">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Policies Found</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">Upload a health insurance policy PDF to extract key insights and get started.</p>
                  <PDFUploader onUploadSuccess={handleUploadSuccess} />
                </div>
              )}
              
              {activePolicy && (
                <div className="glass-panel p-6 border-dashed border-2 border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    Upload Another Policy
                  </h3>
                  <PDFUploader onUploadSuccess={handleUploadSuccess} />
                </div>
              )}
            </div>

            <div>
              {activePolicy ? (
                <ChatBot policyId={selectedPolicyId} />
              ) : (
                <div className="glass-panel p-8 text-center text-slate-500 flex flex-col items-center justify-center h-[500px]">
                  <Activity className="w-12 h-12 text-slate-300 mb-4" />
                  <p>Upload a policy first to use the AI ChatBot.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showWizard && activePolicy && (
        <ClaimsWizard policyId={selectedPolicyId} onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}
