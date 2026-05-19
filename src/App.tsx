import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Link as LinkIcon, Loader2, Database, AlertCircle, CheckCircle2, History, Video, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

type SummaryStatus = 'idle' | 'fetching' | 'success' | 'error';

interface SummaryData {
  tiktok_url: string;
  video_id: string;
  author: string;
  title: string;
  transcription: string;
  summary: string;
  created_at: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState<SummaryStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<SummaryData | null>(null);
  const [history, setHistory] = useState<SummaryData[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'url' && (!url.trim() || !url.includes('tiktok.com'))) {
      setErrorMsg('Please enter a valid TikTok URL');
      setStatus('error');
      return;
    }
    if (inputMode === 'file' && !file) {
      setErrorMsg('Please select a video file');
      setStatus('error');
      return;
    }

    setStatus('fetching');
    setErrorMsg('');
    setData(null);

    try {
      const formData = new FormData();
      if (inputMode === 'url') {
        formData.append('url', url);
      } else if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process video');
      }

      setData(result.data);
      setHistory((prev) => [result.data, ...prev]);
      setStatus('success');
      if (inputMode === 'url') setUrl('');
      else setFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-[#fe2c55]/30 flex flex-col p-4 md:p-6 select-none overflow-x-hidden">
      <nav className="flex justify-between items-center mb-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#fe2c55] to-[#25f4ee] rounded-xl flex items-center justify-center">
             <BrainCircuit className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Summarizer<span className="text-[#25f4ee]">AI</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Second Brain for Short-form</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">Whisper Local: Active</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hidden sm:block"></div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full flex-grow flex flex-col">
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setInputMode('url'); setStatus('idle'); setErrorMsg(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${inputMode === 'url' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              URL Link
            </button>
            <button
              onClick={() => { setInputMode('file'); setStatus('idle'); setErrorMsg(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${inputMode === 'file' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Upload MP4
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative group">
            {inputMode === 'url' ? (
              <input
                key="url-input"
                type="url"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#fe2c55]/50 transition-colors shadow-2xl pr-36"
                placeholder="Paste TikTok URL here..."
                value={url || ''}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === 'fetching'}
                required
              />
            ) : (
              <input
                key="file-input"
                type="file"
                accept="video/mp4,video/*"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 focus:outline-none focus:border-[#fe2c55]/50 transition-colors shadow-2xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#fe2c55]/10 file:text-[#fe2c55] hover:file:bg-[#fe2c55]/20 pr-36"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={status === 'fetching'}
                required
              />
            )}
            
            <button
              type="submit"
              disabled={status === 'fetching'}
              className="absolute right-2 top-2 bottom-2 px-4 sm:px-6 bg-[#fe2c55] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base"
            >
              {status === 'fetching' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {status === 'fetching' ? 'Processing' : 'Summarize'}
            </button>
          </form>
        </div>

        {status === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </motion.div>
        )}

        <div className="flex-grow grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4">
          
          {/* Analyze Area */}
          {status === 'success' && data ? (
            <>
              {/* Box 1: Video details */}
              <div className="md:col-span-4 md:row-span-3 bg-slate-900 rounded-3xl border border-slate-800 p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className="relative aspect-video rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-10">
                     <Video className="w-4 h-4 text-white" />
                  </div>
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3C/svg%3E" className="absolute inset-0 w-full h-full object-cover" alt="placeholder" />
                </div>
                <div className="space-y-1 relative z-10">
                  <h2 className="text-sm font-bold text-white leading-tight truncate">{data.title || "Untitled Video"}</h2>
                  <p className="text-xs text-slate-500">@{data.author}</p>
                </div>
                <div className="flex gap-2 mt-auto relative z-10">
                   <span className="px-2 py-1 bg-[#fe2c55]/10 text-[#fe2c55] rounded-md text-[10px] font-bold uppercase">Processed</span>
                </div>
              </div>

              {/* Box 2: Summary */}
              <div className="md:col-span-5 md:row-span-6 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-4 min-h-[300px]">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Executive Summary</h3>
                   <span className="text-[10px] bg-[#25f4ee]/10 text-[#25f4ee] px-2 py-0.5 rounded-full font-bold">GPT-4o Mini</span>
                </div>
                <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2 h-0">
                   <div className="prose prose-invert prose-sm text-slate-400 leading-relaxed">
                     {(typeof data.summary === 'string' ? data.summary : String(data.summary)).split('\n').filter(l => l.trim()).map((line, i) => {
                       const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
                       const cleanLine = isBullet ? line.trim().substring(1).trim() : line;
                       return (
                        <p key={i} className={isBullet ? "flex items-start gap-2 mb-2" : "mb-3 text-slate-300 font-medium"}>
                          {isBullet && <span className="w-1.5 h-1.5 rounded-full bg-[#fe2c55] mt-1.5 shrink-0"></span>}
                          <span>{cleanLine}</span>
                        </p>
                       );
                     })}
                   </div>
                </div>
                <div className="mt-auto flex gap-3 pt-2 shrink-0">
                   <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition">Copy Markdown</button>
                </div>
              </div>

              {/* Box 4 (replacing knowledge map): Transcript */}
              <div className="md:col-span-4 md:row-span-3 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col gap-3 min-h-[250px]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Transcript</h3>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 h-0">
                   <p className="text-xs text-slate-500 leading-relaxed font-mono whitespace-pre-wrap">{data.transcription}</p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-4 shrink-0 pt-2">
                   <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                     <p className="text-[10px] text-slate-500 font-bold uppercase">Status</p>
                     <p className="text-sm font-bold text-[#25f4ee]">Complete</p>
                   </div>
                   <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                     <p className="text-[10px] text-slate-500 font-bold uppercase">Source ID</p>
                     <p className="text-sm font-bold text-white truncate">#{data.video_id}</p>
                   </div>
                </div>
              </div>
            </>
          ) : (
            <div className="md:col-span-9 md:row-span-6 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-4 items-center justify-center text-center min-h-[400px]">
              <Sparkles className="w-12 h-12 text-[#25f4ee]/20 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Ready to Analyze</h2>
              <p className="text-sm text-slate-500 max-w-md">Paste a TikTok URL in the input field to extract the audio, transcribe it, and generate a structured executive summary.</p>
            </div>
          )}

          {/* Box 3: History */}
          <div className="md:col-span-3 md:row-span-6 bg-slate-900/40 rounded-3xl border border-slate-800/50 p-5 flex flex-col gap-4 min-h-[300px]">
             <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Library</h3>
             <div className="space-y-3 overflow-y-auto custom-scrollbar flex-grow h-0 pr-1">
               {history.length === 0 ? (
                 <p className="text-xs text-slate-500 text-center py-4">No recent history.</p>
               ) : (
                 history.map((item, idx) => (
                   <div key={idx} className="group p-3 bg-slate-900 border border-slate-800 rounded-xl flex gap-3 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => { setData(item); setStatus('success'); }}>
                      <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center group-hover:bg-[#fe2c55]/10 transition-colors">
                        <Video className="w-4 h-4 text-slate-500 group-hover:text-[#fe2c55]" />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                         <p className="text-xs font-bold text-white truncate leading-tight mb-0.5">{item.title || "Untitled Video"}</p>
                         <p className="text-[10px] text-slate-500">@{item.author || "unknown"}</p>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>

        </div>

      </main>

      <footer className="w-full max-w-6xl mx-auto mt-6 flex justify-between items-center text-[10px] text-slate-600 font-medium pb-2">
        <p>© 2024 SummarizerAI • Powered by Whisper Local & OpenRouter</p>
        <div className="flex gap-4 hidden sm:flex">
           <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-600"></span>Supabase Connected</span>
           <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#25f4ee]"></span>V0.8.2-Alpha</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
