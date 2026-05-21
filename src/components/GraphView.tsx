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
    // slight delay to ensure container is fully rendered
    setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const tagMap = new Map();

    history.forEach(video => {
      const videoId = `video-${video.id}`;
      // Add video node
      nodes.push({
        id: videoId,
        name: video.title || 'Vidéo',
        group: 'video',
        val: 4,
        color: '#fe2c55', // TikTok Red
        videoData: video
      });

      const tags = (video.tags || []).filter(t => t);
      
      tags.forEach(tag => {
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) return;
        const tagId = `tag-${normalizedTag}`;
        
        if (!tagMap.has(tagId)) {
          tagMap.set(tagId, {
            id: tagId,
            name: tag,
            group: 'tag',
            val: 2,
            color: '#25f4ee', // TikTok Cyan
            linksCount: 1
          });
        } else {
          const current = tagMap.get(tagId);
          current.val = Math.min(10, current.val + 0.5); // Grow tag size slightly per connection, cap at 10
          current.linksCount += 1;
        }

        // Link video to tag
        links.push({
          source: videoId,
          target: tagId,
          color: 'rgba(255,255,255,0.1)'
        });
      });
    });

    tagMap.forEach(tagNode => {
      nodes.push(tagNode);
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
          onNodeClick={handleNodeClick}
          backgroundColor="#09090b"
          nodeCanvasObject={(node: any, ctx, globalScale) => {
             const label = node.name;
             const fontSize = 12/globalScale;
             ctx.font = `${fontSize}px Sans-Serif`;
             
             ctx.fillStyle = node.group === 'video' ? '#fe2c55' : '#25f4ee';
             ctx.beginPath();
             ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
             ctx.fill();

             // Draw labels if sufficiently zoomed in, or if it's a big tag
             if (globalScale > 1.2 || node.val > 3) {
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
               ctx.fillText(label, node.x, node.y + node.val + fontSize);
             }
          }}
        />
      )}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-white border border-white/10 pointer-events-none z-10">
        <h3 className="font-bold mb-1 tracking-wider text-slate-300 uppercase">Cartographie Sémantique</h3>
        <p className="text-[10px] text-slate-400 mb-2">Cliquez sur une bulle vidéo pour ouvrir.</p>
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fe2c55]"></span> Vidéos</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#25f4ee]"></span> Tags</span>
        </div>
      </div>
    </div>
  );
}
