import React from 'react';
import { ShieldCheck, AlertTriangle, FileWarning, DollarSign } from 'lucide-react';

export default function PolicyAnalysis({ data }) {
  if (!data) return null;

  const getRiskColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="glass-panel p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            {data.insurer || "Unknown"} Policy Analysis
          </h2>
          <p className="text-sm text-slate-500 capitalize">{data.policy_type} Insurance</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${getRiskColor(data.risk_score || 85)}`}>
          <span className="font-bold">Risk Score: {data.risk_score || 85}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">Coverage Limit</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 ml-8">
            ₹{data.coverage_amount?.toLocaleString() || "Not found"}
          </p>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">Deductible</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 ml-8">
            ₹{data.deductible?.toLocaleString() || "0"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <FileWarning className="w-5 h-5 text-red-400" />
          Key Exclusions
        </h3>
        {data.exclusions && data.exclusions.length > 0 ? (
          <ul className="space-y-2">
            {data.exclusions.map((exclusion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                <span className="text-red-500 mt-0.5">•</span>
                {exclusion}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 italic">No specific exclusions identified.</p>
        )}
      </div>
    </div>
  );
}
