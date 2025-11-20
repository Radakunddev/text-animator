import React, { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Subtitle } from '../types';
import { Clock, Edit3 } from 'lucide-react';

interface TimelineProps {
  subtitles: Subtitle[];
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateSubtitle: (id: string, newText: string) => void;
  selectedIds: string[];
  onSelect: (id: string, meta: { shift: boolean; ctrl: boolean }) => void;
  onDeselectAll: () => void;
}

const formatTimeShort = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const Timeline: React.FC<TimelineProps> = ({ subtitles, currentTime, onSeek, onUpdateSubtitle, selectedIds, onSelect }) => {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Identify all active subtitle IDs
  const activeIds = subtitles
    .filter(s => currentTime >= s.startTime && currentTime <= s.endTime)
    .map(s => s.id);

  // Scroll to the FIRST active one
  const firstActiveId = activeIds[0];

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeRef.current;
      
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elemTop = element.offsetTop;
      const elemBottom = elemTop + element.clientHeight;

      // Only scroll if element is out of view
      if (elemTop < containerTop || elemBottom > containerBottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [firstActiveId]);

  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
      <div className="h-10 flex-shrink-0 px-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Clock size={12} /> Text Editor
        </h3>
        <span className="text-[10px] text-gray-600">{subtitles.length}</span>
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 space-y-1 scroll-smooth custom-scrollbar">
        {subtitles.map((sub, index) => {
          const isActive = activeIds.includes(sub.id);
          const isFirstActive = sub.id === firstActiveId;
          const isSelected = selectedIds.includes(sub.id);
          
          return (
            <div 
              key={sub.id}
              ref={isFirstActive ? activeRef : null}
              onClick={(e) => {
                onSeek(sub.startTime);
                onSelect(sub.id, { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey });
              }}
              className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-950/70 border-blue-500/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  : isActive 
                    ? 'bg-blue-950/40 border-blue-500/40' 
                    : 'bg-transparent border-transparent hover:bg-gray-900 border-b-gray-800/50'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                    <span className={`font-mono text-[9px] font-bold opacity-70 ${isActive || isSelected ? 'text-blue-400' : 'text-gray-500'}`}>
                        {formatTimeShort(sub.startTime)}
                    </span>
                     {(isActive || isSelected) && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                </div>

                <div className="relative">
                  <textarea
                    value={sub.text}
                    onChange={(e) => onUpdateSubtitle(sub.id, e.target.value)}
                    className={`w-full bg-transparent resize-none outline-none text-xs font-medium leading-relaxed transition-colors ${
                      isActive || isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                    }`}
                    rows={Math.max(1, sub.text.split('\n').length)}
                    spellCheck={false}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Edit3 
                    size={10} 
                    className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity ${isActive || isSelected ? 'text-blue-500' : 'text-gray-600'}`} 
                  />
                </div>
              </div>
            </div>
          );
        })}
        
        {subtitles.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 text-xs p-8">
                No subtitles loaded
            </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
