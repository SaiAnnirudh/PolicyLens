import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function ClaimsWizard({ policyId, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ claim_type: 'hospitalization', amount: '' });
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    if (!formData.amount) return;
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/claims/predict', {
        policy_id: policyId,
        claim_type: formData.claim_type,
        amount: parseFloat(formData.amount)
      });
      setPrediction(response.data.prediction);
      setStep(2);
    } catch (err) {
      console.error("Prediction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClaim = async () => {
    setIsLoading(true);
    try {
      await axios.post('http://localhost:8000/claims/file', {
        policy_id: policyId,
        claim_type: formData.claim_type,
        amount: parseFloat(formData.amount)
      });
      setStep(3);
    } catch (err) {
      console.error("Filing failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">File a Claim</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Claim Type</label>
                <select 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.claim_type}
                  onChange={e => setFormData({...formData, claim_type: e.target.value})}
                >
                  <option value="hospitalization">Hospitalization</option>
                  <option value="dental">Dental</option>
                  <option value="outpatient">Outpatient Consultation</option>
                  <option value="pharmacy">Pharmacy / Medicine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Claim Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 50000"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && prediction && (
            <div className="space-y-6">
              <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="text-lg font-medium text-slate-600 mb-2">Approval Probability</h3>
                <div className="text-4xl font-bold text-brand-600 mb-2">{prediction.approval_probability}%</div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700">
                  Risk Category: {prediction.risk_category}
                </div>
              </div>

              {prediction.missing_documents?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-5 h-5" /> Recommended Documents to Attach
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                    {prediction.missing_documents.map((doc, i) => (
                      <li key={i}>{doc.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-amber-100 transition-colors">
                      <Upload className="w-4 h-4" /> Upload Docs
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center h-full py-12 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Claim Filed Successfully</h3>
              <p className="text-slate-500 max-w-sm">We've sent the details to your insurer. You can track the status from your dashboard.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div></div>}
          
          {step === 1 && (
            <button onClick={handlePredict} disabled={isLoading || !formData.amount} className="btn-primary flex items-center gap-2">
              {isLoading ? "Analyzing..." : "Check Probability"} <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {step === 2 && (
            <button onClick={handleFileClaim} disabled={isLoading} className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-500">
              {isLoading ? "Submitting..." : "Submit Claim"} <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {step === 3 && (
            <button onClick={onClose} className="btn-secondary">
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
