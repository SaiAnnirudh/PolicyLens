import React, { useState } from 'react';
import PDFUploader from '../components/PDFUploader';
import PolicyAnalysis from '../components/PolicyAnalysis';
import ChatBot from '../components/ChatBot';
import ClaimsWizard from '../components/ClaimsWizard';
import { Activity, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function Dashboard() {
  const [showWizard, setShowWizard] = useState(false);
  
  // Mock data for MVP display
  const mockPolicyData = {
    coverage_amount: 500000,
    deductible: 5000,
    exclusions: ["Pre-existing conditions for 24 months", "Cosmetic dental procedures", "Adventure sports injuries"],
    policy_type: "health",
    insurer: "HDFC Ergo",
    risk_score: 82
  };
  
  const mockPolicyId = "12345-mock-uuid";

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, User</h1>
          <p className="text-slate-500 mt-1">Manage your policies and predict claim outcomes.</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary">File New Claim</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Policies</p>
              <h3 className="text-2xl font-bold text-slate-900">1</h3>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Approved Claims</p>
              <h3 className="text-2xl font-bold text-slate-900">0</h3>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Claims</p>
              <h3 className="text-2xl font-bold text-slate-900">0</h3>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Recovered</p>
              <h3 className="text-2xl font-bold text-slate-900">₹0</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <PolicyAnalysis data={mockPolicyData} />
          {/* Below is the uploader, typically shown only if no policy is active, but keeping for demo */}
          <PDFUploader />
        </div>
        <div className="lg:col-span-1">
          <ChatBot policyId={mockPolicyId} />
        </div>
      </div>
      
      {showWizard && <ClaimsWizard policyId={mockPolicyId} onClose={() => setShowWizard(false)} />}
    </div>
  );
}
