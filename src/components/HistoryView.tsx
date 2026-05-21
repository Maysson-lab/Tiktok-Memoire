import React, { useState } from 'react';
import { Search, Star, Video, Clock, Bookmark, ChevronRight } from 'lucide-react';
import { SummaryData } from '../App';

interface HistoryViewProps {
  history: SummaryData[];
  onSelect: (item: SummaryData) => void;
}

export default function HistoryView({ history, onSelect }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');

  const filteredHistory = history.filter(item => {
    if (filterType === 'favorites' && !item.is_favorite) return false;
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    const matchTags = item.tags?.some(tag => tag.toLowerCase().includes(lowerQ));
    const matchTools = item.tools?.some(tool => tool.toLowerCase().includes(lowerQ));
    return (
      matchTags ||
      matchTools ||
      item.title?.toLowerCase().includes(lowerQ) ||
      item.author?.toLowerCase().includes(lowerQ) ||
      item.summary?.toLowerCase().includes(lowerQ)
    );
  });

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-[calc(100vh-140px)] relative">
      <div className="p-6 border-b border-slate-800 shrink-0">
        <h2 className="text-xl font-bold text-white mb-2">Votre Bibliothèque</h2>
        <p className="text-sm text-slate-500 mb-6">Retrouvez toutes vos vidéos résumées et extractions d'outils/livres.</p>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-grow max-w-xl">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher par titre, tag, outil ou concept..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-300 focus:outline-none focus:border-[#25f4ee] transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
               Tout
            </button>
            <button 
              onClick={() => setFilterType('favorites')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filterType === 'favorites' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
               <Star className="w-4 h-4" /> Favoris
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
         {filteredHistory.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
             <Bookmark className="w-16 h-16 text-slate-600 mb-4" />
             <h3 className="text-lg font-bold text-slate-300">Aucun résultat</h3>
             <p className="text-sm text-slate-500 mt-2">Aucune vidéo ne correspond à votre recherche.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredHistory.map((item, idx) => (
               <div 
                 key={idx} 
                 onClick={() => onSelect(item)}
                 className="group bg-slate-950 border border-slate-800 hover:border-[#fe2c55]/50 transition-colors rounded-2xl p-4 flex flex-col cursor-pointer relative"
               >
                  {item.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute top-4 right-4 z-10" />}
                  
                  <div className="flex gap-4 items-start mb-4 relative z-0 pr-8">
                     <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:bg-[#fe2c55]/10 group-hover:border-[#fe2c55]/20 transition-colors">
                        <Video className="w-5 h-5 text-slate-500 group-hover:text-[#fe2c55] transition-colors" />
                     </div>
                     <div>
                       <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.title || "Vidéo sans titre"}</h3>
                       <p className="text-xs text-slate-500 mt-1">@{item.author || "inconnu"}</p>
                     </div>
                  </div>
                  
                  <div className="flex-grow">
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed font-medium">
                      {item.summary}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="bg-slate-900 text-slate-400 px-2 py-1 rounded-md uppercase font-bold tracking-wider">{tag}</span>
                      ))}
                      {(item.tags?.length || 0) > 2 && (
                        <span className="bg-slate-900 text-slate-500 px-2 py-1 rounded-md uppercase font-bold tracking-wider">+{item.tags!.length - 2}</span>
                      )}
                    </div>
                    <div className="text-slate-600 flex items-center gap-1 font-mono font-medium">
                       <Clock className="w-3 h-3" />
                       {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
