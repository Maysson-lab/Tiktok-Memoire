import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Link as LinkIcon, Loader2, Database, AlertCircle, CheckCircle2, History, Video, Clock, Search, Star, Edit3, Save, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

type SummaryStatus = 'idle' | 'fetching' | 'success' | 'error';

interface SummaryData {
  id?: string;
  tiktok_url: string;
  video_id: string;
  author: string;
  title: string;
  transcription: string;
  summary: string;
  tags?: string[];
  tools?: string[];
  books?: string[];
  actions?: string[];
  is_favorite?: boolean;
  notes?: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'capture' | 'chat'>('capture');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string, sources?: any[]}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Editing state for transcription/notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const json = await res.json();
      if (json.history) {
        setHistory(json.history);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const updateVideo = async (id: string, updates: Partial<SummaryData>) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const result = await res.json();
      if (result.success) {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        if (data && data.id === id) {
          setData(prev => prev ? { ...prev, ...updates } : null);
        }
      }
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavorite = (item: SummaryData) => {
    if (!item.id) return;
    updateVideo(item.id, { is_favorite: !item.is_favorite });
  };

  const saveNotes = () => {
    if (!data?.id) return;
    updateVideo(data.id, { notes: notesDraft });
    setIsEditingNotes(false);
  };

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(lowerQ));
    return (
      tagMatch ||
      item.title?.toLowerCase().includes(lowerQ) ||
      item.author?.toLowerCase().includes(lowerQ) ||
      item.summary?.toLowerCase().includes(lowerQ) ||
      item.transcription?.toLowerCase().includes(lowerQ) ||
      item.notes?.toLowerCase().includes(lowerQ)
    );
  });

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const query = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: query }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setChatMessages(prev => [...prev, { role: 'ai', text: json.response, sources: json.sources }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Erreur: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'url' && (!url.trim() || !url.includes('tiktok.com'))) {
      setErrorMsg('Veuillez entrer une URL TikTok valide');
      setStatus('error');
      return;
    }
    if (inputMode === 'file' && !file) {
      setErrorMsg('Veuillez sélectionner un fichier vidéo');
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
        throw new Error(result.error || 'Échec du traitement de la vidéo');
      }

      setData(result.data);
      setHistory((prev) => [result.data, ...prev]);
      setStatus('success');
      if (inputMode === 'url') setUrl('');
      else setFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur inattendue est survenue');
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
            <h1 className="text-lg font-bold tracking-tight text-white">Résumé<span className="text-[#25f4ee]">AI</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Second Cerveau pour Vidéos Courtes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex">
            <button 
              onClick={() => setViewMode('capture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'capture' ? 'bg-[#25f4ee]/20 text-[#25f4ee]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Capture
            </button>
            <button 
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'chat' ? 'bg-[#fe2c55]/20 text-[#fe2c55]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Chat (Cerveau)
            </button>
          </div>
          <div className="bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">Gemini 2.5 : Actif</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full flex-grow flex flex-col">
        {viewMode === 'chat' ? (
          <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-4 relative">
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-6">
               {chatMessages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                   <BrainCircuit className="w-16 h-16 text-[#fe2c55] mb-4" />
                   <h2 className="text-xl font-bold">Votre Second Cerveau est à l'écoute</h2>
                   <p className="text-sm max-w-sm mt-2">Posez-moi une question sur les vidéos que vous avez enregistrées ("Quels sont les outils d'IA mentionnés le mois dernier ?", etc.)</p>
                 </div>
               ) : (
                 chatMessages.map((msg, i) => (
                   <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                     <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#fe2c55] text-white' : 'bg-slate-800 text-slate-200'}`}>
                       <div className="prose prose-invert prose-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                     </div>
                     {msg.sources && msg.sources.length > 0 && (
                       <div className="mt-2 flex flex-wrap gap-2">
                         {msg.sources.map((s, idx) => (
                           <span key={idx} className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-400">
                             Source: {s.title}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 ))
               )}
               {isChatLoading && (
                 <div className="flex items-start">
                   <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3 text-slate-400">
                     <Loader2 className="w-5 h-5 animate-spin" /> Je recherche dans vos données...
                   </div>
                 </div>
               )}
            </div>
            
            <form onSubmit={handleChatSubmit} className="mt-4 shrink-0 relative">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Posez une question à votre Second Cerveau..."
                disabled={isChatLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-6 pr-16 text-slate-200 focus:outline-none focus:border-[#fe2c55] transition-colors"
                required
              />
              <button 
                type="submit"
                disabled={isChatLoading}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-[#fe2c55] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setInputMode('url'); setStatus('idle'); setErrorMsg(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${inputMode === 'url' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Lien URL
            </button>
            <button
              onClick={() => { setInputMode('file'); setStatus('idle'); setErrorMsg(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${inputMode === 'file' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Uploader MP4
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative group">
            {inputMode === 'url' ? (
              <input
                key="url-input"
                type="url"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#fe2c55]/50 transition-colors shadow-2xl pr-36"
                placeholder="Collez l'URL TikTok ici..."
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
              {status === 'fetching' ? 'Traitement en cours' : 'Résumer'}
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
                  <div className="absolute top-2 right-2 z-20">
                    <button 
                      onClick={() => toggleFavorite(data)}
                      disabled={isSaving}
                      className={`p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition ${isSaving ? 'opacity-50' : ''}`}
                    >
                      <Star className={`w-4 h-4 ${data.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-10">
                     <Video className="w-4 h-4 text-white" />
                  </div>
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3C/svg%3E" className="absolute inset-0 w-full h-full object-cover" alt="placeholder" />
                </div>
                <div className="space-y-1 relative z-10">
                  <h2 className="text-sm font-bold text-white leading-tight truncate">{data.title || "Vidéo sans titre"}</h2>
                  <p className="text-xs text-slate-500">@{data.author}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto relative z-10">
                   <span className="px-2 py-1 bg-[#fe2c55]/10 text-[#fe2c55] rounded-md text-[10px] font-bold uppercase">Traité</span>
                   {data.tags?.map((tag, i) => (
                     <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                       <Tag className="w-3 h-3 text-slate-400" /> {tag}
                     </span>
                   ))}
                </div>
              </div>

              {/* Box 2: Summary */}
              <div className="md:col-span-5 md:row-span-6 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-4 min-h-[300px]">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Résumé Exécutif IA</h3>
                   <span className="text-[10px] bg-[#25f4ee]/10 text-[#25f4ee] px-2 py-0.5 rounded-full font-bold">Gemini 2.5</span>
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

                   {/* Structured Extractions */}
                   <div className="mt-4 flex gap-4 flex-wrap text-[10px]">
                     {data.tools && data.tools.length > 0 && (
                       <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex-1 min-w-[120px]">
                         <span className="font-bold uppercase tracking-wider text-slate-300 block mb-2">🛠️ Outils</span>
                         <ul className="space-y-1">
                           {data.tools.map((t, idx) => <li key={idx} className="text-slate-400">• {t}</li>)}
                         </ul>
                       </div>
                     )}
                     {data.books && data.books.length > 0 && (
                       <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex-1 min-w-[120px]">
                         <span className="font-bold uppercase tracking-wider text-slate-300 block mb-2">📚 Livres</span>
                         <ul className="space-y-1">
                           {data.books.map((b, idx) => <li key={idx} className="text-slate-400">• {b}</li>)}
                         </ul>
                       </div>
                     )}
                     {data.actions && data.actions.length > 0 && (
                       <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex-1 min-w-[120px]">
                         <span className="font-bold uppercase tracking-wider text-slate-300 block mb-2">✅ Actions</span>
                         <ul className="space-y-1">
                           {data.actions.map((a, idx) => <li key={idx} className="text-slate-400">• {a}</li>)}
                         </ul>
                       </div>
                     )}
                   </div>

                </div>
                <div className="mt-auto flex gap-3 pt-2 shrink-0">
                   <button 
                     onClick={() => {
                       const md = `# ${data.title}\n\n**Auteur:** @${data.author}\n**Tags:** ${data.tags?.join(', ')}\n\n## Résumé\n${data.summary}\n\n${data.tools?.length ? `## Outils\n${data.tools.map(t=>`- ${t}`).join('\n')}\n\n` : ''}${data.books?.length ? `## Livres\n${data.books.map(b=>`- ${b}`).join('\n')}\n\n` : ''}${data.actions?.length ? `## Actions\n${data.actions.map(a=>`- [ ] ${a}`).join('\n')}\n\n` : ''}## Notes\n${data.notes || ''}`;
                       navigator.clipboard.writeText(md);
                       alert("Markdown copié ! Prêt pour Obsidian / Notion.");
                     }}
                     className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition"
                   >
                     Exporter Markdown (Obsidian / Notion)
                   </button>
                </div>
              </div>

              {/* Box 4: Transcript / Notes */}
              <div className="md:col-span-4 md:row-span-3 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col gap-3 min-h-[250px]">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-4">
                    <h3 className={`text-xs font-bold uppercase tracking-wider cursor-pointer transition ${!isEditingNotes ? 'text-white' : 'text-slate-500'}`} onClick={() => { setIsEditingNotes(false); }}>Transcription</h3>
                    <h3 className={`text-xs font-bold uppercase tracking-wider cursor-pointer transition ${isEditingNotes ? 'text-white' : 'text-slate-500'}`} onClick={() => { setNotesDraft(data.notes || ''); setIsEditingNotes(true); }}>Mes Notes</h3>
                  </div>
                  {isEditingNotes && (
                    <button 
                      onClick={saveNotes}
                      disabled={isSaving}
                      className="px-3 py-1 bg-[#25f4ee]/20 text-[#25f4ee] hover:bg-[#25f4ee]/30 transition rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" /> Enregistrer
                    </button>
                  )}
                </div>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 h-0">
                   {!isEditingNotes ? (
                     <p className="text-xs text-slate-500 leading-relaxed font-mono whitespace-pre-wrap">{data.transcription}</p>
                   ) : (
                     <textarea
                       className="w-full h-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-[#25f4ee] resize-none"
                       placeholder="Ajoutez vos notes personnelles, idées ou tâches relatives à cette vidéo..."
                       value={notesDraft}
                       onChange={(e) => setNotesDraft(e.target.value)}
                     />
                   )}
                </div>
                
                {!isEditingNotes && (
                  <div className="mt-auto grid grid-cols-2 gap-4 shrink-0 pt-2">
                     <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Statut</p>
                       <p className="text-sm font-bold text-[#25f4ee]">Terminé</p>
                     </div>
                     <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                       <p className="text-[10px] text-slate-500 font-bold uppercase">ID Source</p>
                       <p className="text-sm font-bold text-white truncate">#{data.video_id}</p>
                     </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="md:col-span-9 md:row-span-6 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-4 items-center justify-center text-center min-h-[400px]">
              <Sparkles className="w-12 h-12 text-[#25f4ee]/20 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Prêt à Analyser</h2>
              <p className="text-sm text-slate-500 max-w-md">Collez une URL TikTok dans le champ de saisie ou uploadez un fichier vidéo pour extraire l'audio, le transcrire et générer un résumé structuré.</p>
            </div>
          )}

          {/* Box 3: History */}
          <div className="md:col-span-3 md:row-span-6 bg-slate-900/40 rounded-3xl border border-slate-800/50 p-5 flex flex-col gap-4 min-h-[300px]">
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bibliothèque Récente</h3>
             </div>
             <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Rechercher des tags, sujets..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 focus:outline-none focus:border-[#25f4ee]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="space-y-3 overflow-y-auto custom-scrollbar flex-grow h-0 pr-1">
               {filteredHistory.length === 0 ? (
                 <p className="text-xs text-slate-500 text-center py-4">Aucune vidéo correspondante.</p>
               ) : (
                 filteredHistory.map((item, idx) => (
                   <div key={idx} className="group p-3 bg-slate-900 border border-slate-800 rounded-xl flex gap-3 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => { setData(item); setStatus('success'); }}>
                      <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center group-hover:bg-[#fe2c55]/10 transition-colors relative">
                        {item.is_favorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 absolute -top-1 -right-1 drop-shadow-md" />}
                        <Video className="w-4 h-4 text-slate-500 group-hover:text-[#fe2c55]" />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                         <p className="text-xs font-bold text-white truncate leading-tight mb-0.5">{item.title || "Vidéo sans titre"}</p>
                         <p className="text-[10px] text-slate-500 truncate">@{item.author || "inconnu"}</p>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>

        </div>
        </>
        )}
      </main>

      <footer className="w-full max-w-6xl mx-auto mt-6 flex justify-between items-center text-[10px] text-slate-600 font-medium pb-2">
        <p>© 2024 RésuméAI • Propulsé par Gemini & Supabase</p>
        <div className="flex gap-4 hidden sm:flex">
           <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-600"></span>Connecté à Supabase</span>
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
