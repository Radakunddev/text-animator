
export interface Subtitle {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  x?: number; // Percentage -100 to 100
  y?: number; // Percentage -100 to 100
  scale?: number; // Multiplier 0.1 to 5
}

export type AnimationType = 
  // Native (CSS)
  | 'fade' | 'slide' | 'pop' | 'blur' | 'cinema' | 'neon' | 'bounce' | 'glitch'
  // External (Animate.css)
  | 'rubberBand' | 'wobble' | 'jello' | 'backInDown' | 'rollIn' | 'zoomInDown'
  // Motion FX (React/Framer)
  | 'physics-pop' | 'typewriter' | 'word-stagger' | 'flip-3d' | 'focus-blur';

export interface CustomFont {
    name: string;
    data: string; // Base64 string
    type: string; // mime type (e.g., font/ttf)
}

export interface AnimationSettings {
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  fontFamily: string;
  animationType: AnimationType;
  textAlign: 'center' | 'left' | 'right';
  x: number; // Percentage -100 to 100
  y: number; // Percentage -100 to 100
  scale: number; // Multiplier 0.1 to 5
}
