import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { SummaryData } from '../App';

export default function GraphView({ history, onSelect }: { history: SummaryData[], onSelect: (item: SummaryData) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphRef = useRef<any>(null);

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

      links.push({
        source: videoId,
        target: entityId,
        color: 'rgba(255, 255, 255, 0.15)'
      });
    };

    history.forEach(video => {
      const videoId = `video-${video.id}`;
      // Add video node
      nodes.push({
        id: videoId,
        name: video.title || 'Vidéo',
        group: 'video',
        val: 5,
        color: '#fe2c55', // TikTok Red
        videoData: video
      });

      (video.tags || []).forEach(tag => addEntity('tag', tag, videoId, '#25f4ee')); // Cyan
      (video.tools || []).forEach(tool => addEntity('tool', tool.name || tool, videoId, '#faa307')); // Yellow
      (video.books || []).forEach(book => addEntity('book', book.title || book, videoId, '#b5179e')); // Purple
      (video.actions || []).forEach(action => addEntity('action', action.text || action, videoId, '#06d6a0')); // Green
    });

    entityMap.forEach(node => {
      nodes.push(node);
    });

    return { nodes, links };
  }, [history]);

  const handleNodeClick = useCallback((node: any) => {
    if (node.group === 'video' && node.videoData) {
      onSelect(node.videoData);
    }
  }, [onSelect]);

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
          nodeLabel="name"
          nodeColor="color"
          nodeRelSize={4}
          linkColor="color"
          linkWidth={1}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.005}
          d3VelocityDecay={0.5}
          onNodeClick={handleNodeClick}
          backgroundColor="#09090b"
          nodeCanvasObject={(node: any, ctx, globalScale) => {
             const label = node.name;
             const fontSize = 12/globalScale;
             ctx.font = `${fontSize}px Inter, Sans-Serif`;
             
             // Effet de glow (néon)
             ctx.shadowColor = node.color;
             ctx.shadowBlur = 10 * globalScale;
             
             ctx.fillStyle = node.color;
             ctx.beginPath();
             ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
             ctx.fill();

             // Remise à zéro du shadow pour le texte
             ctx.shadowBlur = 0;

             // Affichage du label si on zoome assez ou si le nœud est gros
             if (globalScale > 1.2 || node.val > 4) {
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
               ctx.fillText(label, node.x, node.y + node.val + (fontSize * 1.2));
             }
          }}
        />
      )}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl px-5 py-4 rounded-2xl text-xs text-white border border-white/10 pointer-events-none z-10 shadow-2xl">
        <h3 className="font-bold mb-1 tracking-wider text-slate-200 uppercase flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Cartographie Interactive
        </h3>
        <p className="text-[10px] text-slate-400 mb-4 border-b border-white/5 pb-2">Découvrez les liens cachés de votre second cerveau.</p>
        <div className="flex flex-col gap-2.5">
          <span className="flex items-center gap-2.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#fe2c55] shadow-[0_0_8px_#fe2c55]"></span> Vidéos</span>
          <span className="flex items-center gap-2.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#25f4ee] shadow-[0_0_8px_#25f4ee]"></span> Tags Sémantiques</span>
          <span className="flex items-center gap-2.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#faa307] shadow-[0_0_8px_#faa307]"></span> Outils Mentionnés</span>
          <span className="flex items-center gap-2.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#b5179e] shadow-[0_0_8px_#b5179e]"></span> Livres & Ressources</span>
          <span className="flex items-center gap-2.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#06d6a0] shadow-[0_0_8px_#06d6a0]"></span> Actions à réaliser</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-4 italic">Cliquez sur une vidéo pour l'ouvrir.</p>
      </div>
    </div>
  );
}
