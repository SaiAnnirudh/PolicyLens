import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function PDFUploader({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setStatus('error');
      return;
    }
    setFile(selectedFile);
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      // Assuming backend is running on 8000
      const response = await axios.post('http://localhost:8000/policies/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('processing');
      // In a real app, we would poll or listen to websockets here
      setTimeout(() => {
        setStatus('complete');
        if (onUploadSuccess && response.data.policy_id) {
          onUploadSuccess(response.data.policy_id);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Insurance Policy</h2>
        <p className="text-slate-500">We'll extract all the complex clauses into simple terms.</p>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ease-in-out
          ${dragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'}
          ${status === 'complete' ? 'border-green-500 bg-green-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleChange}
        />

        {status === 'idle' && !file && (
          <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => inputRef.current?.click()}>
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-600">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700">Click or drag PDF to upload</p>
              <p className="text-sm text-slate-500 mt-1">Maximum file size 50MB</p>
            </div>
          </div>
        )}

        {file && (status === 'idle' || status === 'error') && (
          <div className="flex flex-col items-center gap-4">
            <FileText className="w-12 h-12 text-brand-500" />
            <div>
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {status === 'error' && <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Upload failed or invalid format</p>}
            <button onClick={uploadFile} className="btn-primary mt-4 w-full">
              Analyze Policy
            </button>
            <button onClick={() => {setFile(null); setStatus('idle');}} className="text-sm text-slate-500 hover:text-slate-700 mt-2">
              Cancel
            </button>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
            <p className="font-medium text-slate-900">
              {status === 'uploading' ? 'Uploading document...' : 'AI is analyzing policy...'}
            </p>
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2 mt-4">
              <div className="bg-brand-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-xl font-medium text-slate-900">Analysis Complete!</p>
            <p className="text-slate-500">Your policy data has been successfully extracted.</p>
            <button onClick={() => {setFile(null); setStatus('idle');}} className="btn-secondary mt-4">
              Upload Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
