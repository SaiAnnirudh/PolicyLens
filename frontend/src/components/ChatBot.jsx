import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function ChatBot({ policyId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Policy Assistant. Ask me anything about your policy, like 'Am I covered for dental?'" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !policyId) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/qa/ask`, {
        policy_id: policyId,
        question: userMsg
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.answer,
        sources: response.data.sources
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error trying to analyze your policy. Please ensure the GEMINI_API_KEY is configured." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!policyId) return null;

  return (
    <div className="glass-panel flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white rounded-t-2xl flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">AI Policy Assistant</h3>
          <p className="text-xs text-slate-500">Powered by Gemini & Advanced RAG</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-brand-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-brand-50 text-slate-800 rounded-tl-none border border-brand-100'}`}>
              <div className="prose prose-sm prose-slate max-w-none">
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-200/50">
                  <details className="group cursor-pointer">
                    <summary className="text-xs font-semibold text-brand-700 flex items-center gap-1 select-none">
                      <span className="group-open:hidden">▶</span>
                      <span className="hidden group-open:inline">▼</span>
                      View {msg.sources.length} sources retrieved from policy
                    </summary>
                    <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4 mt-2">
                      {msg.sources.map((src, i) => <li key={i}>{src}</li>)}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-brand-50 rounded-2xl rounded-tl-none p-3 border border-brand-100">
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white/50 rounded-b-2xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your coverage..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-1 top-1 p-2 bg-brand-600 text-white rounded-full hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
