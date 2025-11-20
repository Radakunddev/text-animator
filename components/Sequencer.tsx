
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Subtitle } from '../types';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

interface SequencerProps {
  subtitles: Subtitle[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateTiming: (id: string, startTime: number, endTime: number) => void;
}

const MIN_ZOOM = 10; // pixels per second
const MAX_ZOOM = 200;

const Sequencer: React.FC<SequencerProps> = ({ 
  subtitles, 
  duration, 
  currentTime, 
  onSeek, 
  onUpdateTiming 
}) => {
  const [zoom, setZoom] = useState(60); // px per second
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    type: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    originalStart: number;
    originalEnd: number;
  } | null>(null);

  // Calculate lanes to prevent overlaps
  const lanes = useMemo(() => {
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    const computedLanes: Subtitle[][] = [];

    sorted.forEach(sub => {
      let placed = false;
      // Try to fit in existing lane
      for (let i = 0; i < computedLanes.length; i++) {
        const lastInLane = computedLanes[i][computedLanes[i].length - 1];
        // Reduced buffer from 0.5 to 0.05 to allow tight cuts/overlaps on same lane if user really wants
        if (lastInLane.endTime + 0.05 < sub.startTime) { 
          computedLanes[i].push(sub);
          placed = true;
          break;
        }
      }
      // Create new lane
      if (!placed) {
        computedLanes.push([sub]);
      }
    });
    return computedLanes;
  }, [subtitles]);

  const handleMouseDown = (e: React.MouseEvent, sub: Subtitle, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    setDragState({
      id: sub.id,
      type,
      startX: e.clientX,
      originalStart: sub.startTime,
      originalEnd: sub.endTime,
    });
  };

  const handleRulerClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, clickX / zoom);
    onSeek(newTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const deltaPx = e.clientX - dragState.startX;
      const deltaTime = deltaPx / zoom;

      let newStart = dragState.originalStart;
      let newEnd = dragState.originalEnd;

      if (dragState.type === 'move') {
        newStart += deltaTime;
        newEnd += deltaTime;
      } else if (dragState.type === 'resize-left') {
        newStart += deltaTime;
      } else if (dragState.type === 'resize-right') {
        newEnd += deltaTime;
      }

      // Constraints
      if (newStart < 0) newStart = 0;
      if (newEnd - newStart < 0.1) { // Min duration 0.1s
        if (dragState.type === 'resize-left') newStart = newEnd - 0.1;
        else newEnd = newStart + 0.1;
      }

      onUpdateTiming(dragState.id, newStart, newEnd);
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, onUpdateTiming]);

  // Auto-scroll during playback
  useEffect(() => {
    if (containerRef.current && !dragState) {
        const playheadPos = currentTime * zoom;
        const center = containerRef.current.clientWidth / 2;
        // Only scroll if playhead pushes past center
        if (playheadPos > containerRef.current.scrollLeft + center || playheadPos < containerRef.current.scrollLeft) {
            containerRef.current.scrollLeft = playheadPos - center;
        }
    }
  }, [currentTime, zoom, dragState]); 

  const totalWidth = Math.max(duration * zoom + 500, window.innerWidth);

  return (
    <div className="h-full bg-gray-900 border-t border-gray-800 flex flex-col select-none">
      {/* Toolbar */}
      <div className="h-10 bg-gray-950 border-b border-gray-800 flex items-center px-4 justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sequencer</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ZoomOut size={14} className="text-gray-500" />
            <input 
              type="range" 
              min={MIN_ZOOM} 
              max={MAX_ZOOM} 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))} 
              className="w-24 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <ZoomIn size={14} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Timeline Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar"
        style={{ willChange: 'scroll-position' }}
      >
        <div style={{ width: totalWidth, height: '100%' }} className="relative">
          
          {/* Ruler */}
          <div 
            className="h-6 bg-gray-950 border-b border-gray-800 relative cursor-pointer sticky top-0 z-20"
            onClick={handleRulerClick}
          >
            {Array.from({ length: Math.ceil(duration + 10) }).map((_, i) => (
              <div 
                key={i} 
                className="absolute top-0 bottom-0 border-l border-gray-800 flex items-center pl-1"
                style={{ left: i * zoom, width: zoom }}
              >
                <span className="text-[9px] text-gray-600 font-mono">{i}s</span>
              </div>
            ))}
          </div>

          {/* Lanes */}
          <div className="p-4 space-y-2 relative min-h-[200px]">
            
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: Math.ceil(duration + 10) }).map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute top-0 bottom-0 border-l border-gray-800/30"
                        style={{ left: i * zoom }}
                    />
                ))}
            </div>

            {lanes.map((lane, laneIndex) => (
              <div key={laneIndex} className="relative h-12 w-full">
                {lane.map(sub => (
                  <div
                    key={sub.id}
                    className={`absolute top-0 height-full h-10 rounded-md overflow-hidden text-[10px] 
                      flex flex-col justify-center px-2 cursor-move border shadow-sm transition-colors
                      ${dragState?.id === sub.id 
                        ? 'bg-blue-600 border-blue-400 z-30 opacity-90' 
                        : 'bg-blue-900/40 border-blue-700/50 hover:bg-blue-800/60 hover:border-blue-500 text-blue-100'
                      }`}
                    style={{
                      left: sub.startTime * zoom,
                      width: (sub.endTime - sub.startTime) * zoom,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, sub, 'move')}
                  >
                    {/* Resize Handle Left */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize bg-blue-500/0 hover:bg-blue-400/50 transition-colors z-10"
                      onMouseDown={(e) => handleMouseDown(e, sub, 'resize-left')}
                    />
                    
                    {/* Content */}
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis font-medium pointer-events-none">
                      {sub.text}
                    </div>
                    <div className="opacity-50 text-[9px] pointer-events-none">
                      {(sub.endTime - sub.startTime).toFixed(1)}s
                    </div>

                    {/* Resize Handle Right */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-blue-500/0 hover:bg-blue-400/50 transition-colors z-10"
                      onMouseDown={(e) => handleMouseDown(e, sub, 'resize-right')}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.8)]"
            style={{ left: currentTime * zoom }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 transform rotate-45"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sequencer;
