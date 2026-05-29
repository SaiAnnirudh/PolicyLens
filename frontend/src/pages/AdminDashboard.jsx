import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await axios.get('http://localhost:8000/admin/claims');
      setClaims(res.data.claims);
    } catch (err) {
      console.error('Failed to fetch claims', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (claimId, newStatus) => {
    try {
      await axios.post(`http://localhost:8000/admin/claims/${claimId}/status`, {
        status: newStatus
      });
      fetchClaims();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Error updating claim. You might not be an admin.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]">Loading Admin Dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 mt-1">Manage and review all submitted claims.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">User Email</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Claim Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Amount (₹)</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">AI Risk Score</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-700">{claim.user_email}</td>
                <td className="px-6 py-4 text-sm text-slate-700 capitalize">{claim.claim_type}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">₹{claim.claimed_amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    claim.predicted_approval_score >= 80 ? 'bg-green-100 text-green-700' :
                    claim.predicted_approval_score >= 50 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {claim.predicted_approval_score}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                    claim.status === 'denied' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {claim.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {claim.status === 'filed' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(claim.id, 'approved')}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(claim.id, 'denied')}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deny"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No claims found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
