
import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { parseSRT } from './utils/srtParser';
import { generateStandaloneHTML } from './utils/htmlGenerator';
import { Subtitle, AnimationSettings, AnimationType, CustomFont } from './types';
import { generatePremiereXML, generateDaVinciFusion } from './utils/exportGenerators';
import { Upload, Play, Pause, Download, FileText, RefreshCw, Move } from './components/Icons';
import ControlPanel from './components/ControlPanel';
import Timeline from './components/Timeline';
import Sequencer from './components/Sequencer';
import PropertiesPanel from './components/PropertiesPanel';
import { AnimatePresence, motion } from 'framer-motion';

const DEFAULT_SETTINGS: AnimationSettings = {
  backgroundColor: '#030712',
  textColor: '#ffffff',
  fontSize: '48px',
  fontFamily: 'Inter',
  animationType: 'slide',
  textAlign: 'center',
  x: 0,
  y: 0,
  scale: 1,
};

// Helper to detect external animations
const isExternal = (type: AnimationType) => {
  return ['rubberBand', 'wobble', 'jello', 'backInDown', 'rollIn', 'zoomInDown'].includes(type);
};

const isMotion = (type: AnimationType) => {
  return ['physics-pop', 'typewriter', 'word-stagger', 'flip-3d', 'focus-blur'].includes(type);
};

const MotionSubtitle: React.FC<{ subtitle: Subtitle, settings: AnimationSettings }> = ({ subtitle, settings }) => {
  const words = subtitle.text.split(/(\s+)/);
  const chars = subtitle.text.split('');

  // Inner container style for motion elements
  const containerStyle = {
    textAlign: settings.textAlign,
    color: settings.textColor,
    fontSize: settings.fontSize,
    fontWeight: 'bold' as const,
    lineHeight: 1.4,
    textShadow: settings.animationType !== 'neon' ? '2px 2px 4px rgba(0,0,0,0.3)' : undefined,
    whiteSpace: 'pre-wrap' as const, // Revert to pre-wrap to allow line breaks
    display: 'block',
    wordBreak: 'break-word' as const
  };

  if (settings.animationType === 'word-stagger') {
    return (
      <div style={containerStyle}>
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{ display: 'inline-block' }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    );
  }

  if (settings.animationType === 'typewriter') {
    return (
      <div style={{ ...containerStyle, display: 'inline-block' }}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05, duration: 0 }}
          >
            {char}
          </motion.span>
        ))}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{ borderRight: `3px solid ${settings.textColor}`, marginLeft: 2 }}
        />
      </div>
    );
  }

  if (settings.animationType === 'physics-pop') {
    return (
      <div style={containerStyle}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: i * 0.03 }}
            style={{ display: 'inline-block' }} // Removed whiteSpace: pre to inherit parent
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  }

  if (settings.animationType === 'focus-blur') {
    return (
      <div style={containerStyle}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ filter: 'blur(10px)', opacity: 0 }}
            animate={{ filter: 'blur(0px)', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: i * 0.02 }}
            style={{ display: 'inline-block' }} // Removed whiteSpace: pre to inherit parent
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  }

  if (settings.animationType === 'flip-3d') {
    return (
      <div style={{ ...containerStyle, perspective: 1000 }}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.6, delay: i * 0.04 }}
            style={{ display: 'inline-block', transformOrigin: 'bottom' }} // Removed whiteSpace: pre
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  }

  return null;
};

interface DraggedItem {
  id: string;
  initialX: number;
  initialY: number;
  initialScale: number;
}

const App: React.FC = () => {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [settings, setSettings] = useState<AnimationSettings>(DEFAULT_SETTINGS);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePremiereExport = () => {
    const xml = generatePremiereXML(subtitles, settings, fileName.replace('.srt', ''));
    downloadFile(xml, fileName.replace('.srt', '') + '_premiere.xml', 'text/xml');
  };

  const handleDaVinciExport = () => {
    const fusion = generateDaVinciFusion(subtitles, settings);
    downloadFile(fusion, fileName.replace('.srt', '') + '_fusion.setting', 'text/plain');
  };

  // Load sample subtitles for testing if empty
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('export') === 'true' && subtitles.length === 0) {
      const sampleSrt = `1
00:00:00,500 --> 00:00:02,000
Hello World!

2
00:00:02,500 --> 00:00:04,000
This is a test animation.

3
00:00:04,500 --> 00:00:06,000
Exported with Puppeteer.`;
      setSubtitles(parseSRT(sampleSrt));
    }
  }, []);

  // Transform Tool State
  const [isTransformMode, setIsTransformMode] = useState(false);
  const [selectedSubtitleIds, setSelectedSubtitleIds] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  // Track which subtitle we are actively dragging
  const [dragState, setDragState] = useState<{
    mode: 'move' | 'scale',
    startX: number,
    y: number,
    items: DraggedItem[],
    centerX: number,
    centerY: number
  } | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (subtitles.length > 0) {
      const lastSub = subtitles.reduce((prev, current) => (prev.endTime > current.endTime) ? prev : current);
      setDuration(lastSub.endTime + 5); // Add more buffer at end
    }
  }, [subtitles]);

  // Expose methods for Puppeteer
  useEffect(() => {
    (window as any).seekTo = (time: number) => {
      setCurrentTime(time);
      // Force a small delay or check if we can hook into render completion?
      // For now, React state update is async but usually fast enough for the next event loop tick
      return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    };

    (window as any).getDuration = () => duration;
  }, [duration]);

  // Generate styles for Native Animations Only
  const previewStyles = useMemo(() => {
    if (isExternal(settings.animationType) || isMotion(settings.animationType)) return '';

    const { animationType, textColor } = settings;
    let kf = '';
    switch (animationType) {
      case 'fade':
        kf = `@keyframes previewAnim { 0% { opacity: 0; } 100% { opacity: 1; } }`;
        break;
      case 'slide':
        kf = `@keyframes previewAnim { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }`;
        break;
      case 'pop':
        kf = `@keyframes previewAnim { 0% { opacity: 0; transform: scale(0.5); } 80% { transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }`;
        break;
      case 'blur':
        kf = `@keyframes previewAnim { 0% { opacity: 0; filter: blur(10px); transform: scale(1.1); } 100% { opacity: 1; filter: blur(0); transform: scale(1); } }`;
        break;
      case 'cinema':
        kf = `@keyframes previewAnim { 0% { opacity: 0; transform: scale(1); } 20% { opacity: 1; } 100% { opacity: 1; transform: scale(1.1); } }`;
        break;
      case 'neon':
        kf = `@keyframes previewAnim { 
                0% { opacity: 0; text-shadow: none; } 
                50% { opacity: 1; text-shadow: 0 0 20px ${textColor}, 0 0 40px ${textColor}; }
                100% { opacity: 1; text-shadow: 0 0 10px ${textColor}, 0 0 20px ${textColor}; } 
            }`;
        break;
      case 'bounce':
        kf = `@keyframes previewAnim { 
                0% { opacity: 0; transform: translateY(-50px); } 
                60% { opacity: 1; transform: translateY(10px); } 
                80% { transform: translateY(-5px); } 
                100% { opacity: 1; transform: translateY(0); } 
            }`;
        break;
      case 'glitch':
        kf = `@keyframes previewAnim {
                0% { opacity: 0; transform: skew(0deg); }
                20% { opacity: 1; transform: skew(-20deg); }
                40% { transform: skew(20deg); }
                60% { transform: skew(-10deg); }
                80% { transform: skew(10deg); }
                100% { opacity: 1; transform: skew(0deg); }
            }`;
        break;
    }

    return `
        ${kf}
        .preview-animate-entry {
            animation: previewAnim 0.6s ease-out forwards;
            ${animationType === 'cinema' ? 'animation-duration: 4s; animation-timing-function: linear;' : ''}
        }
     `;
  }, [settings]);

  const startPlayback = () => {
    setIsPlaying(true);
    startTimeRef.current = performance.now() - lastPauseTimeRef.current * 1000;
    animationRef.current = requestAnimationFrame(animate);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    lastPauseTimeRef.current = currentTime;
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setCurrentTime(0);
    lastPauseTimeRef.current = 0;
  };

  const animate = (timestamp: number) => {
    const elapsedSeconds = (timestamp - startTimeRef.current) / 1000;

    if (elapsedSeconds >= duration) {
      resetPlayback();
      return;
    }

    setCurrentTime(elapsedSeconds);
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleSeek = (time: number) => {
    if (isPlaying) pausePlayback();
    setCurrentTime(time);
    lastPauseTimeRef.current = time;
  };

  const handleUpdateSubtitle = (id: string, newText: string) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, text: newText } : s));
  };

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string, meta: { shift: boolean, ctrl: boolean }) => {
    setLastSelectedId(id);

    if (meta.ctrl) {
      // Toggle selection
      setSelectedSubtitleIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else if (meta.shift && lastSelectedId) {
      // Select range
      const lastIndex = subtitles.findIndex(s => s.id === lastSelectedId);
      const currentIndex = subtitles.findIndex(s => s.id === id);
      if (lastIndex === -1 || currentIndex === -1) {
        setSelectedSubtitleIds([id]);
        return;
      }

      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const rangeIds = subtitles.slice(start, end + 1).map(s => s.id);
      setSelectedSubtitleIds(rangeIds);
    } else {
      // Normal click
      setSelectedSubtitleIds([id]);
    }
  };

  const handleTimingUpdate = (id: string, newStart: number, newEnd: number) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, startTime: newStart, endTime: newEnd } : s));
  };

  const handlePropertyChange = (property: keyof Subtitle, value: any) => {
    if (selectedSubtitleIds.length === 0) return;
    setSubtitles(prev =>
      prev.map(s =>
        selectedSubtitleIds.includes(s.id)
          ? { ...s, [property]: value }
          : s
      )
    );
  };

  const handleDeselectAll = () => {
    setSelectedSubtitleIds([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = parseSRT(content);
        setSubtitles(parsed);
        resetPlayback();
      } catch (error) {
        console.error("Error parsing SRT", error);
        alert("Invalid SRT file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleFontUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;

      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      const fontFace = new FontFace(fontName, `url(${result})`);

      fontFace.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
        setCustomFonts(prev => [...prev, {
          name: fontName,
          data: result,
          type: file.type
        }]);
        setSettings(prev => ({ ...prev, fontFamily: fontName }));
      }).catch(err => {
        console.error("Font loading failed", err);
        alert("Failed to load font. Please use a standard TTF/OTF/WOFF file.");
      });
    };
    reader.readAsDataURL(file);
  };

  const activeSubtitles = useMemo(() => {
    return subtitles.filter(sub =>
      currentTime >= sub.startTime && currentTime <= sub.endTime
    );
  }, [currentTime, subtitles]);

  // Auto-select active subtitle if nothing is selected, or maintain selection
  /* useEffect(() => {
    if (activeSubtitles.length > 0) {
        // If we have a selection, check if it's still active. If not, or if nothing selected, update
        const isCurrentSelectedActive = activeSubtitles.some(s => s.id === selectedSubtitleId);
        if (!isCurrentSelectedActive && !isTransformMode) {
             // Only auto-switch selection if user isn't busy transforming
             setSelectedSubtitleId(activeSubtitles[activeSubtitles.length - 1].id);
        }
    }
  }, [activeSubtitles, selectedSubtitleId, isTransformMode]); */


  const handleHTMLDownload = () => {
    const htmlContent = generateStandaloneHTML(subtitles, settings, customFonts);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.srt', '') + '_animated.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVideoExport = async () => {
    if (!exportCanvasRef.current || !previewContainerRef.current) return;

    const exportElement = previewContainerRef.current;
    const canvas = exportCanvasRef.current;

    // Set canvas dimensions based on the preview element for 1:1 rendering
    canvas.width = exportElement.offsetWidth;
    canvas.height = exportElement.offsetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsExporting(true);
    setExportProgress(0);
    pausePlayback();

    // Store original time to revert back
    const originalTime = currentTime;
    setCurrentTime(0); // Start from beginning

    const stream = canvas.captureStream(30);

    let mimeType = 'video/webm';
    let fileExtension = '.webm';

    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
      fileExtension = '.mp4';
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 8000000 // Increased bit rate for better quality
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.srt', '') + (settings.backgroundColor === 'transparent' ? `_transparent${fileExtension}` : `_video${fileExtension}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setCurrentTime(originalTime); // Revert to original time
    };

    mediaRecorder.start();

    const fps = 30;
    const totalFrames = Math.ceil(duration * fps);

    for (let i = 0; i <= totalFrames; i++) {
      const renderTime = i / fps;

      // Update state and wait for next frame to ensure DOM is updated
      setCurrentTime(renderTime);
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Capture the DOM element
      const capturedCanvas = await html2canvas(exportElement, {
        backgroundColor: null, // Use transparent background for capture
        allowTaint: true,
        useCORS: true,
        logging: false,
        // Match canvas dimensions to avoid scaling issues
        width: canvas.width,
        height: canvas.height,
        scale: 1
      });

      // Draw captured image onto our main export canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(capturedCanvas, 0, 0, canvas.width, canvas.height);

      // Update progress (throttled)
      if (i % 5 === 0) {
        setExportProgress(Math.round((i / totalFrames) * 100));
      }
    }

    mediaRecorder.stop();
  };

  // --- Transform Tool Handlers ---
  const handleGizmoMouseDown = (e: React.MouseEvent, subId: string, mode: 'move' | 'scale') => {
    if (!isTransformMode || !previewContainerRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const target = (e.currentTarget as HTMLElement).closest('.gizmo-container');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const itemsToDrag = subtitles
      .filter(s => selectedSubtitleIds.includes(s.id))
      .map(s => ({
        id: s.id,
        initialX: s.x ?? 0,
        initialY: s.y ?? 0,
        initialScale: s.scale ?? 1,
      }));

    if (itemsToDrag.length === 0) return;

    setDragState({
      mode,
      startX: e.clientX,
      y: e.clientY,
      items: itemsToDrag,
      centerX,
      centerY
    });
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragState || !previewContainerRef.current) return;

      const containerWidth = previewContainerRef.current.offsetWidth;
      const containerHeight = previewContainerRef.current.offsetHeight;

      if (dragState.mode === 'move') {
        const deltaX = (e.clientX - dragState.startX) / containerWidth * 100;
        const deltaY = (e.clientY - dragState.y) / containerHeight * 100;

        setSubtitles(prev =>
          prev.map(s => {
            const dragItem = dragState.items.find(item => item.id === s.id);
            if (dragItem) {
              return {
                ...s,
                x: dragItem.initialX + deltaX,
                y: dragItem.initialY + deltaY,
              };
            }
            return s;
          })
        );
      } else if (dragState.mode === 'scale') {
        const currentDist = Math.hypot(e.clientX - dragState.centerX, e.clientY - dragState.centerY);
        const startDist = Math.hypot(dragState.startX - dragState.centerX, dragState.y - dragState.centerY);

        if (startDist === 0) return;

        const scaleFactor = currentDist / startDist;

        setSubtitles(prev =>
          prev.map(s => {
            const dragItem = dragState.items.find(item => item.id === s.id);
            if (dragItem) {
              return { ...s, scale: Math.max(0.1, dragItem.initialScale * scaleFactor) };
            }
            return s;
          })
        );
      }
    };

    const handleWindowMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState]);

  const [clipboard, setClipboard] = useState<{ type: 'subtitle-properties', properties: Partial<Omit<Subtitle, 'id' | 'text' | 'startTime' | 'endTime'>> } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            e.preventDefault();
            setSelectedSubtitleIds(subtitles.map(s => s.id));
            break;
          case 'd':
            e.preventDefault();
            handleDeselectAll();
            break;
          case 'c':
            e.preventDefault();
            const lastSelected = subtitles.find(s => s.id === lastSelectedId);
            if (lastSelected) {
              const { x, y, scale } = lastSelected;
              setClipboard({
                type: 'subtitle-properties',
                properties: { x, y, scale }
              });
            }
            break;
          case 'v':
            e.preventDefault();
            if (clipboard && clipboard.type === 'subtitle-properties' && selectedSubtitleIds.length > 0) {
              setSubtitles(prev =>
                prev.map(s =>
                  selectedSubtitleIds.includes(s.id)
                    ? { ...s, ...clipboard.properties }
                    : s
                )
              );
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [subtitles, lastSelectedId, clipboard, selectedSubtitleIds, handleDeselectAll]);



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getAspectRatioStyles = (ratio: '16:9' | '9:16' | '1:1') => {
    switch (ratio) {
      case '16:9': return 'w-full max-w-3xl aspect-video';
      case '9:16': return 'h-full aspect-[9/16]';
      case '1:1': return 'h-full aspect-square';
    }
  };

  const getPreviewClass = () => {
    if (isExternal(settings.animationType)) {
      return `animate__animated animate__${settings.animationType}`;
    }
    return 'preview-animate-entry';
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-white font-sans selection:bg-blue-500 selection:text-white flex flex-col overflow-hidden">
      <canvas ref={exportCanvasRef} className="hidden fixed pointer-events-none" />
      <style>{previewStyles}</style>

      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-64 space-y-4">
            <div className="flex justify-between text-sm font-medium text-gray-300">
              <span>Rendering Video...</span>
              <span>{exportProgress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${exportProgress}%` }} />
            </div>
            <p className="text-xs text-gray-500 text-center animate-pulse">Processing visual effects & transparency...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-800 bg-gray-950 z-10 h-14">
        <div className="w-full px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              SRT Animator <span className="text-[10px] font-normal text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded ml-2">PRO</span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-700">
              <Upload size={14} />
              <span>{fileName ? 'Change' : 'Upload'}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".srt" className="hidden" />

            {subtitles.length > 0 && (
              <>
                <button onClick={handleHTMLDownload} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium transition-all">
                  <FileText size={14} className="text-blue-400" />
                  <span>HTML</span>
                </button>
                <button onClick={() => setShowExportOptions(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-xs font-medium transition-all shadow-lg shadow-blue-900/20">
                  <Download size={14} />
                  <span>Export</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 relative">
        {showExportOptions && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowExportOptions(false)}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Export Options</h3>
              <div className="space-y-3">
                <button onClick={() => { setShowExportOptions(false); handleVideoExport(); }} className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                      <Download size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">Render Video</div>
                      <div className="text-xs text-gray-400">MP4 / WebM</div>
                    </div>
                  </div>
                </button>

                <button onClick={() => { setShowExportOptions(false); handlePremiereExport(); }} className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 group-hover:text-purple-300">
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">Premiere Pro</div>
                      <div className="text-xs text-gray-400">FCP7 XML Preset</div>
                    </div>
                  </div>
                </button>

                <button onClick={() => { setShowExportOptions(false); handleDaVinciExport(); }} className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 group-hover:text-orange-300">
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">DaVinci Resolve</div>
                      <div className="text-xs text-gray-400">Fusion Macro (.setting)</div>
                    </div>
                  </div>
                </button>
              </div>
              <button onClick={() => setShowExportOptions(false)} className="mt-6 w-full py-2 text-sm text-gray-500 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
        {subtitles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-gray-800 m-8 rounded-3xl bg-gray-900/20">
            <div className="w-24 h-24 bg-gray-800/50 rounded-3xl flex items-center justify-center mb-4 ring-1 ring-gray-700">
              <Upload size={48} className="text-gray-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Start Creating</h2>
              <p className="text-gray-400 max-w-md mx-auto">Upload your subtitle file to access the studio tools, effects, and animation controls.</p>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-transform hover:scale-105 shadow-xl shadow-white/5">
              Select .SRT File
            </button>
          </div>
        ) : (
          <div className="flex flex-1 h-full min-h-0">

            {/* LEFT SIDEBAR: Text Editor Timeline */}
            <div className="w-80 border-r border-gray-800 bg-gray-950/50 flex flex-col z-10">
              <Timeline
                subtitles={subtitles}
                currentTime={currentTime}
                onSeek={handleSeek}
                onUpdateSubtitle={handleUpdateSubtitle}
                selectedIds={selectedSubtitleIds}
                onSelect={handleSelect}
                onDeselectAll={handleDeselectAll}
              />
            </div>

            {/* CENTER: Preview & Bottom Sequencer */}
            <div className="flex-1 flex flex-col min-w-0">

              {/* Upper Area: Preview + Right Settings */}
              <div className="flex-1 flex min-h-0">

                {/* Preview Stage */}
                <div className="flex-1 bg-black/50 flex flex-col relative p-6 items-center justify-center overflow-hidden select-none">
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                    {(['16:9', '9:16', '1:1'] as const).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${aspectRatio === ratio ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 font-mono text-xs text-blue-400 bg-blue-950/30 border border-blue-500/20 px-2 py-0.5 rounded-full z-20">
                    {formatTime(currentTime)}
                  </div>

                  {/* Wrapper for aspect ratio */}
                  <div
                    ref={previewContainerRef}
                    className={`bg-black rounded-xl border border-gray-800 relative overflow-hidden flex items-center justify-center shadow-2xl shrink-0 group ${getAspectRatioStyles(aspectRatio)}`}
                    style={{
                      backgroundColor: settings.backgroundColor === 'transparent' ? 'transparent' : settings.backgroundColor,
                      fontFamily: settings.fontFamily
                    }}>

                    <div className="absolute inset-0 pointer-events-none -z-10"
                      style={{
                        backgroundImage: 'conic-gradient(#1f2937 0 90deg, #111827 90deg 180deg, #1f2937 180deg 270deg, #111827 270deg)',
                        backgroundSize: '20px 20px',
                        opacity: settings.backgroundColor === 'transparent' ? 1 : 0
                      }}>
                    </div>

                    {/* Subtitle Layers */}
                    <AnimatePresence>
                      {activeSubtitles.map((subtitle, index) => {
                        const isSelected = selectedSubtitleIds.includes(subtitle.id);
                        const x = subtitle.x !== undefined ? subtitle.x : 0;
                        const y = subtitle.y !== undefined ? subtitle.y : 0;
                        const scale = subtitle.scale !== undefined ? subtitle.scale : 1;

                        return (
                          <motion.div
                            key={subtitle.id}
                            layout={false}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`gizmo-container absolute flex justify-center items-center origin-center`}
                            style={{
                              // IMPORTANT: We set the transform here via STYLE, not via Framer animate prop
                              // to prevent Framer from overwriting the translate(-50%, -50%) needed for centering.
                              left: `${50 + x}%`,
                              top: `${50 + y}%`,
                              transform: `translate(-50%, -50%) scale(${scale})`,
                              width: 'max-content', // Shrink wrap text
                              maxWidth: '90%',
                              zIndex: isSelected ? 100 : index + 10
                            }}
                            onClick={(e) => {
                              if (isTransformMode) {
                                e.stopPropagation();
                                handleSelect(subtitle.id, { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey });
                              }
                            }}
                          >
                            {/* GIZMO / TRANSFORM BOX (Only if selected) */}
                            {isTransformMode && isSelected && !isExporting && (
                              <div
                                className="absolute -inset-4 border-2 border-blue-500 border-dashed rounded z-50 cursor-move hover:bg-blue-500/5 transition-colors"
                                onMouseDown={(e) => handleGizmoMouseDown(e, subtitle.id, 'move')}
                              >
                                {/* Corner Handles */}
                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize" onMouseDown={(e) => handleGizmoMouseDown(e, subtitle.id, 'scale')} />
                                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize" onMouseDown={(e) => handleGizmoMouseDown(e, subtitle.id, 'scale')} />
                                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize" onMouseDown={(e) => handleGizmoMouseDown(e, subtitle.id, 'scale')} />
                                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 cursor-se-resize" onMouseDown={(e) => handleGizmoMouseDown(e, subtitle.id, 'scale')} />
                              </div>
                            )}

                            {/* INNER CONTENT: Handles the slide-up animation without affecting positioning */}
                            <motion.div
                              initial={{ y: 20 }}
                              animate={{ y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="w-full"
                            >
                              {isMotion(settings.animationType) ? (
                                <MotionSubtitle subtitle={subtitle} settings={settings} />
                              ) : (
                                <div
                                  className={`w-full ${getPreviewClass()}`}
                                  style={{
                                    color: settings.textColor,
                                    fontSize: settings.fontSize,
                                    fontWeight: 'bold',
                                    lineHeight: 1.4,
                                    textAlign: settings.textAlign,
                                    textShadow: settings.animationType !== 'neon' ? '2px 2px 4px rgba(0,0,0,0.3)' : undefined,
                                    whiteSpace: 'pre-wrap', // Revert to pre-wrap to allow line breaks
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {subtitle.text}
                                </div>
                              )}
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Playback Controls Overlay */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur px-6 py-2 rounded-full border border-gray-800 z-30">
                    <button
                      onClick={() => setIsTransformMode(!isTransformMode)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isTransformMode ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      title="Move & Scale Tool"
                    >
                      <Move size={14} />
                    </button>
                    <div className="w-px h-4 bg-gray-700 mx-1"></div>
                    <button onClick={resetPlayback} className="text-gray-400 hover:text-white transition-colors">
                      <RefreshCw size={16} />
                    </button>
                    <button onClick={isPlaying ? pausePlayback : startPlayback} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-white/10 active:scale-95">
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Right Sidebar: Settings */}
                <div className="w-80 border-l border-gray-800 bg-gray-900 overflow-hidden flex flex-col">
                  <ControlPanel
                    settings={settings}
                    onSettingsChange={setSettings}
                    customFonts={customFonts}
                    onFontUpload={handleFontUpload}
                  />
                  <PropertiesPanel
                    subtitles={subtitles}
                    selectedSubtitleIds={selectedSubtitleIds}
                    onPropertyChange={handlePropertyChange}
                  />
                </div>

              </div>

              {/* Bottom: Sequencer Timeline */}
              <div className="h-64 border-t border-gray-800 z-20 relative flex-shrink-0">
                <Sequencer
                  subtitles={subtitles}
                  duration={duration}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  onUpdateTiming={handleTimingUpdate}
                />
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

