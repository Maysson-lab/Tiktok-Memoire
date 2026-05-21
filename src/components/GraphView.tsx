import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { SummaryData } from '../App';

export default function GraphView({ history, onSelect }: { history: SummaryData[], onSelect: (item: SummaryData) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphRef = useRef<any>(null);

  const [hoverNode, setHoverNode] = useState<any>(null);
  const [visibleGroups, setVisibleGroups] = useState({
    video: true,
    tag: true,
    tool: true,
    book: true,
    action: true
  });

  const [lastClickTime, setLastClickTime] = useState<number>(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      // Configuration personnalisée de la physique pour ressembler à un réseau de neurones
      graphRef.current.d3Force('charge').strength(-300);
      graphRef.current.d3Force('link').distance(50);
    }
  }, [history]);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const entityMap = new Map();

    const addEntity = (type: string, name: string, videoId: string, color: string) => {
      if (!visibleGroups[type as keyof typeof visibleGroups]) return;
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName) return;
      const entityId = `${type}-${normalizedName}`;
      
      if (!entityMap.has(entityId)) {
        entityMap.set(entityId, {
          id: entityId,
          name: name,
          group: type,
          val: 2.5,
          color: color,
          linksCount: 1
        });
      } else {
        const current = entityMap.get(entityId);
        current.val = Math.min(12, current.val + 0.8);
        current.linksCount += 1;
      }

      if (visibleGroups.video) {
        links.push({
          source: videoId,
          target: entityId,
          color: 'rgba(255, 255, 255, 0.15)'
        });
      }
    };

    history.forEach(video => {
      const videoId = `video-${video.id}`;
      // Add video node
      if (visibleGroups.video) {
        nodes.push({
          id: videoId,
          name: video.title || 'Vidéo',
          group: 'video',
          val: 5,
          color: '#fe2c55', // TikTok Red
          videoData: video
        });
      }

      (video.tags || []).forEach(tag => addEntity('tag', tag, videoId, '#25f4ee')); // Cyan
      (video.tools || []).forEach(tool => addEntity('tool', tool.name || tool, videoId, '#faa307')); // Yellow
      (video.books || []).forEach(book => addEntity('book', book.title || book, videoId, '#b5179e')); // Purple
      (video.actions || []).forEach(action => addEntity('action', action.text || action, videoId, '#06d6a0')); // Green
    });

    entityMap.forEach(node => {
      nodes.push(node);
    });

    return { nodes, links };
  }, [history, visibleGroups]);

  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

  const handleNodeClick = useCallback((node: any) => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      // Double click
      graphRef.current?.centerAt(node.x, node.y, 1000);
      graphRef.current?.zoom(4, 1000); // Zoom in on double click
    } else {
      // Single click
      if (node.group === 'video' && node.videoData) {
        onSelect(node.videoData);
      }
    }
    setLastClickTime(now);
  }, [onSelect, lastClickTime]);

  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node || null);
    
    if (node) {
      const hNodes = new Set();
      const hLinks = new Set();
      hNodes.add(node);
      
      graphData.links.forEach((link: any) => {
        const source = link.source.id ? link.source : graphData.nodes.find(n => n.id === link.source);
        const target = link.target.id ? link.target : graphData.nodes.find(n => n.id === link.target);

        if (source && target && (source.id === node.id || target.id === node.id)) {
          hLinks.add(link);
          hNodes.add(source);
          hNodes.add(target);
        }
      });
      setHighlightNodes(hNodes);
      setHighlightLinks(hLinks);
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [graphData]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative min-h-[400px]">
      {graphData.nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-500">
          Capturez des vidéos pour créer la cartographie des connaissances.
        </div>
      ) : (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={() => ''} // Disable default tooltip to use our HTML one
          nodeColor="color"
          nodeRelSize={4}
          linkColor={(link: any) => highlightLinks.has(link) ? link.color : (hoverNode ? 'rgba(255,255,255,0.02)' : link.color)}
          linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 1}
          linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 3 : 0} // Only show particles for hovered links
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.005}
          d3VelocityDecay={0.5}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          backgroundColor="#09090b"
          nodeCanvasObject={(node: any, ctx, globalScale) => {
             const label = node.name;
             const fontSize = 12/globalScale;
             ctx.font = `${fontSize}px Inter, Sans-Serif`;
             
             const isDimmed = hoverNode && !highlightNodes.has(node);
             ctx.globalAlpha = isDimmed ? 0.2 : 1;

             // Effet de glow (néon)
             ctx.shadowColor = node.color;
             ctx.shadowBlur = (highlightNodes.has(node) ? 20 : 10) * globalScale;
             
             ctx.fillStyle = node.color;
             ctx.beginPath();
             ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
             ctx.fill();

             // Remise à zéro du shadow pour le texte
             ctx.shadowBlur = 0;

             // Affichage du label si on zoome assez ou si le nœud est gros ou mis en évidence
             if (globalScale > 1.2 || node.val > 4 || highlightNodes.has(node)) {
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               ctx.fillStyle = `rgba(255, 255, 255, ${isDimmed ? 0.3 : 0.9})`;
               ctx.fillText(label, node.x, node.y + node.val + (fontSize * 1.2));
             }
             
             ctx.globalAlpha = 1; // restore
          }}
        />
      )}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl px-5 py-4 rounded-2xl text-xs text-white border border-white/10 pointer-events-auto z-10 shadow-2xl">
        <h3 className="font-bold mb-1 tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Cartographie Interactive
        </h3>
        <p className="text-[10px] text-slate-400 mb-4 border-b border-white/5 pb-2">Découvrez les liens cachés de votre second cerveau.</p>
        <div className="flex flex-col gap-2.5">
          <span className={`flex items-center gap-2.5 font-medium cursor-pointer transition-opacity hover:opacity-80 ${visibleGroups.video ? 'opacity-100' : 'opacity-40'}`} onClick={() => toggleGroup('video')}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#fe2c55] shadow-[0_0_8px_#fe2c55]"></span> Vidéos
          </span>
          <span className={`flex items-center gap-2.5 font-medium cursor-pointer transition-opacity hover:opacity-80 ${visibleGroups.tag ? 'opacity-100' : 'opacity-40'}`} onClick={() => toggleGroup('tag')}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#25f4ee] shadow-[0_0_8px_#25f4ee]"></span> Tags Sémantiques
          </span>
          <span className={`flex items-center gap-2.5 font-medium cursor-pointer transition-opacity hover:opacity-80 ${visibleGroups.tool ? 'opacity-100' : 'opacity-40'}`} onClick={() => toggleGroup('tool')}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#faa307] shadow-[0_0_8px_#faa307]"></span> Outils Mentionnés
          </span>
          <span className={`flex items-center gap-2.5 font-medium cursor-pointer transition-opacity hover:opacity-80 ${visibleGroups.book ? 'opacity-100' : 'opacity-40'}`} onClick={() => toggleGroup('book')}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#b5179e] shadow-[0_0_8px_#b5179e]"></span> Livres & Ressources
          </span>
          <span className={`flex items-center gap-2.5 font-medium cursor-pointer transition-opacity hover:opacity-80 ${visibleGroups.action ? 'opacity-100' : 'opacity-40'}`} onClick={() => toggleGroup('action')}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#06d6a0] shadow-[0_0_8px_#06d6a0]"></span> Actions à réaliser
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-4 italic">Cliquez sur un filtre pour l'activer.</p>
      </div>

      {hoverNode && hoverNode.group === 'video' && hoverNode.videoData && (
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 w-72 shadow-2xl z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
               <svg className="w-5 h-5 text-[#fe2c55]" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
               <h4 className="text-sm font-bold text-slate-100 truncate">{hoverNode.videoData.title || hoverNode.name}</h4>
               <p className="text-xs text-slate-400 truncate">@{hoverNode.videoData.author || 'Auteur inconnu'}</p>
            </div>
          </div>
          {hoverNode.videoData.summary && (
             <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed border-t border-slate-800 pt-3">{hoverNode.videoData.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
