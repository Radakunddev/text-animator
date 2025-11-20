
import React, { useRef } from 'react';
import { AnimationSettings, AnimationType, CustomFont } from '../types';
import { Star, Zap, Type, Upload, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  settings: AnimationSettings;
  onSettingsChange: (newSettings: AnimationSettings) => void;
  customFonts: CustomFont[];
  onFontUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const NATIVE_ANIMATIONS: AnimationType[] = [
    'fade', 'slide', 'pop', 'blur', 'cinema', 'neon', 'bounce', 'glitch'
];

const EXTERNAL_ANIMATIONS: AnimationType[] = [
    'rubberBand', 'wobble', 'jello', 'backInDown', 'rollIn', 'zoomInDown'
];

const MOTION_ANIMATIONS: AnimationType[] = [
    'physics-pop', 'typewriter', 'word-stagger', 'flip-3d', 'focus-blur'
];

const STANDARD_FONTS = [
    { name: 'Modern (Inter)', value: 'Inter' },
    { name: 'Serif (Playfair)', value: 'Playfair Display' },
    { name: 'Bold (Anton)', value: 'Anton' },
];

const SPECTACULAR_FONTS = [
    { name: 'Comic (Bangers)', value: 'Bangers' },
    { name: 'Cinema (Cinzel)', value: 'Cinzel' },
    { name: 'Sci-Fi (Orbitron)', value: 'Orbitron' },
    { name: 'Marker (Permanent)', value: 'Permanent Marker' },
    { name: 'Fancy (Lobster)', value: 'Lobster' },
    { name: 'Pixel (Press Start)', value: 'Press Start 2P' },
    { name: 'Neon (Monoton)', value: 'Monoton' },
    { name: 'Horror (Creepster)', value: 'Creepster' },
];

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange, customFonts, onFontUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof AnimationSettings, value: string) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const isTransparent = settings.backgroundColor === 'transparent';

  return (
    <div className="bg-gray-900 p-4 space-y-4 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Zap size={12} className="text-yellow-500" />
        Effects & Design
      </h3>
      
      {/* Color Section */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Background</label>
            <button 
                onClick={() => handleChange('backgroundColor', isTransparent ? '#030712' : 'transparent')}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                    isTransparent 
                    ? 'bg-green-500/20 border-green-500 text-green-400' 
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white'
                }`}
            >
                {isTransparent ? 'TRANSPARENT' : 'SET ALPHA'}
            </button>
          </div>
          
          <div className={`flex items-center space-x-2 bg-gray-800 p-1.5 rounded border transition-colors ${isTransparent ? 'border-gray-700 opacity-50 pointer-events-none' : 'border-gray-700'}`}>
            <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-gray-600">
                <input 
                type="color" 
                value={isTransparent ? '#000000' : settings.backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                className="absolute -top-1 -left-1 w-8 h-8 cursor-pointer"
                disabled={isTransparent}
                />
            </div>
            <span className="text-gray-500 text-xs">#</span>
            <input 
              type="text" 
              value={isTransparent ? '------' : settings.backgroundColor.replace('#', '')}
              onChange={(e) => handleChange('backgroundColor', `#${e.target.value}`)}
              maxLength={6}
              disabled={isTransparent}
              className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none uppercase"
              placeholder="000000"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-gray-500 uppercase">Text Color</label>
          <div className="flex items-center space-x-2 bg-gray-800 p-1.5 rounded border border-gray-700">
            <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-gray-600">
                <input 
                type="color" 
                value={settings.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="absolute -top-1 -left-1 w-8 h-8 cursor-pointer"
                />
            </div>
            <span className="text-gray-500 text-xs">#</span>
            <input 
              type="text" 
              value={settings.textColor.replace('#', '')}
              onChange={(e) => handleChange('textColor', `#${e.target.value}`)}
              maxLength={6}
              className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none uppercase"
              placeholder="FFFFFF"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-800" />

      {/* Typography */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Size</label>
            <select 
                value={settings.fontSize}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
                <option value="24px">Small</option>
                <option value="32px">Medium</option>
                <option value="48px">Large</option>
                <option value="64px">X-Large</option>
                <option value="80px">Massive</option>
                <option value="5vw">Responsive</option>
            </select>
        </div>

        <div className="space-y-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase flex justify-between">
                <span>Font</span>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                >
                    <Upload size={8} /> Upload
                </button>
            </label>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".ttf,.otf,.woff,.woff2"
                onChange={onFontUpload}
            />
            <select 
                value={settings.fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
                <optgroup label="Standard">
                    {STANDARD_FONTS.map(f => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                    ))}
                </optgroup>
                <optgroup label="Spectacular">
                    {SPECTACULAR_FONTS.map(f => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                    ))}
                </optgroup>
                {customFonts.length > 0 && (
                    <optgroup label="My Fonts">
                        {customFonts.map(f => (
                            <option key={f.name} value={f.name}>{f.name}</option>
                        ))}
                    </optgroup>
                )}
            </select>
        </div>
      </div>

      <div className="h-px bg-gray-800" />

       {/* Motion FX Animations */}
       <div className="space-y-1">
        <label className="text-[10px] font-medium text-purple-400 uppercase flex justify-between items-center">
            <span className="flex items-center gap-1"><Sparkles size={10} /> Motion FX</span>
            <span className="text-[9px] bg-purple-500/10 px-1 rounded text-purple-400 border border-purple-500/20">PRO</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
            {MOTION_ANIMATIONS.map((type) => (
                <button
                    key={type}
                    onClick={() => handleChange('animationType', type)}
                    className={`py-1.5 text-[10px] font-medium rounded border transition-all relative overflow-hidden group ${
                        settings.animationType === type 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-pink-500 text-white shadow-sm' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-purple-500/50 hover:text-purple-200'
                    }`}
                >
                    <span className="relative z-10">{type.replace('-', ' ')}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Native Animations */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-gray-500 uppercase flex justify-between">
            <span>Standard</span>
            <span className="text-[9px] bg-gray-800 px-1 rounded text-gray-500">CSS</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
            {NATIVE_ANIMATIONS.map((type) => (
                <button
                    key={type}
                    onClick={() => handleChange('animationType', type)}
                    className={`py-1.5 text-[10px] font-medium rounded border transition-all relative overflow-hidden group ${
                        settings.animationType === type 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                >
                    <span className="relative z-10">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </button>
            ))}
        </div>
      </div>

      {/* External Animations */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-yellow-500 uppercase flex justify-between items-center">
            <span className="flex items-center gap-1"><Star size={10} /> Pack</span>
            <span className="text-[9px] bg-yellow-500/10 px-1 rounded text-yellow-500 border border-yellow-500/20">ANIMATE.CSS</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
            {EXTERNAL_ANIMATIONS.map((type) => (
                <button
                    key={type}
                    onClick={() => handleChange('animationType', type)}
                    className={`py-1.5 text-[10px] font-medium rounded border transition-all relative overflow-hidden group ${
                        settings.animationType === type 
                            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 border-orange-500 text-white shadow-sm' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-200'
                    }`}
                >
                    <span className="relative z-10">{type}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-gray-500 uppercase">Alignment</label>
        <div className="flex bg-gray-800 rounded p-0.5 border border-gray-700">
            {['left', 'center', 'right'].map((align) => (
                <button
                    key={align}
                    onClick={() => handleChange('textAlign', align)}
                    className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${
                        settings.textAlign === align 
                            ? 'bg-gray-600 text-white shadow-sm' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
