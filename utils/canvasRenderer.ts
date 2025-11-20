
import { Subtitle, AnimationSettings } from '../types';

export const renderFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  subtitles: Subtitle[],
  time: number,
  settings: AnimationSettings
) => {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw Background if not transparent
  if (settings.backgroundColor !== 'transparent') {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Find active subtitles
  const activeSubs = subtitles.filter(s => time >= s.startTime && time <= s.endTime);

  if (activeSubs.length === 0) return;

  ctx.save();
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.textAlign = settings.textAlign;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = settings.textColor;
  
  // Parse Font Size
  let fontSizePx = 48;
  if (settings.fontSize.includes('px')) fontSizePx = parseInt(settings.fontSize);
  if (settings.fontSize.includes('vw')) fontSizePx = (width * parseInt(settings.fontSize)) / 100;
  
  ctx.font = `bold ${fontSizePx}px ${settings.fontFamily}`;

  const lineHeight = fontSizePx * 1.4;

  // Iterate through active subtitles and draw them INDEPENDENTLY (layered on Z-axis)
  
  activeSubs.forEach(sub => {
    const lines = sub.text.split('\n');
    const subBlockHeight = lines.length * lineHeight;
    
    // Center this specific block vertically
    const blockStartY = -(subBlockHeight / 2) + (lineHeight / 2);

    const duration = sub.endTime - sub.startTime;
    const elapsed = time - sub.startTime;
    const progress = elapsed / duration; // 0 to 1
    
    let opacity = 1;
    let scaleX = 1;
    let scaleY = 1;
    let translateX = 0;
    let translateY = 0;
    let blur = 0;
    let skewX = 0;
    let rotation = 0;
    
    const fadeDuration = 0.5;
    const entryProgress = Math.min(1, elapsed / fadeDuration);
    const exitProgress = Math.min(1, (sub.endTime - time) / fadeDuration);
    
    // Default Opacity Logic
    opacity = Math.min(entryProgress, exitProgress);

    // Easing Helper
    const easeOutElastic = (x: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    };

    const easeOutBack = (x: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    // Animation Logic Mapping
    switch (settings.animationType) {
        case 'fade': break;
        case 'slide':
             if (elapsed < fadeDuration) translateY += 50 * (1 - entryProgress);
             else if (time > sub.endTime - fadeDuration) translateY += -50 * (1 - exitProgress);
            break;
        case 'pop':
            if (elapsed < fadeDuration) {
                const s = 0.5 + (0.5 * entryProgress);
                scaleX = s; scaleY = s;
            } else if (time > sub.endTime - fadeDuration) {
                const s = 1 + (0.2 * (1 - exitProgress));
                scaleX = s; scaleY = s;
            }
            break;
        case 'blur':
             if (opacity < 1) {
                 blur = 20 * (1 - opacity);
                 const s = 1.1 - (0.1 * opacity);
                 scaleX = s; scaleY = s;
             }
             break;
        case 'cinema':
            const s = 1 + (0.15 * progress); 
            scaleX = s; scaleY = s;
            if (elapsed < fadeDuration) opacity = entryProgress;
            else if (time > sub.endTime - fadeDuration) opacity = exitProgress; 
            break;
        case 'neon':
            const pulse = Math.sin(progress * Math.PI * 6); 
            const glow = 15 + (15 * Math.abs(pulse));
            ctx.shadowColor = settings.textColor;
            ctx.shadowBlur = glow;
            break;
        case 'bounce':
            const bounceTime = 0.6;
            if (elapsed < bounceTime) {
                 const t = elapsed / bounceTime;
                 if (t < 0.4) translateY += -60 * (1 - (t/0.4));
                 else if (t < 0.7) translateY += 15 * (1 - ((t-0.4)/0.3));
                 else translateY += -5 * (1 - ((t-0.7)/0.3));
            } else if (time > sub.endTime - fadeDuration) {
                scaleX = exitProgress; scaleY = exitProgress;
            }
            break;
        case 'glitch':
            if (opacity > 0.5) {
                 const jitter = Math.floor(time * 15) % 10;
                 if (jitter === 0) skewX = 0.3;
                 if (jitter === 1) skewX = -0.3;
                 if (jitter === 2) scaleX = 1.05;
            }
            break;
            
        // External Package Simulations (Math-based)
        case 'rubberBand':
             if (elapsed < 1) {
                 const t = elapsed; 
                 if (t < 0.3) { scaleX = 1 + 0.25*(t/0.3); scaleY = 1 - 0.25*(t/0.3); }
                 else if (t < 0.4) { scaleX = 0.75; scaleY = 1.25; }
                 else if (t < 0.5) { scaleX = 1.15; scaleY = 0.85; }
                 else if (t < 0.65) { scaleX = 0.95; scaleY = 1.05; }
                 else if (t < 0.75) { scaleX = 1.05; scaleY = 0.95; }
                 else { scaleX = 1; scaleY = 1; }
             }
             opacity = elapsed < 0.1 ? elapsed * 10 : 1;
             if (time > sub.endTime - 0.3) opacity = Math.max(0, (sub.endTime - time)/0.3);
             break;
        case 'wobble':
             if (elapsed < 1) {
                 const t = elapsed;
                 translateX = Math.sin(t * Math.PI * 6) * (width * 0.15) * (1 - t);
                 rotation = Math.sin(t * Math.PI * 6) * 0.05 * (1 - t);
             }
             opacity = elapsed < 0.3 ? elapsed * 3.3 : 1;
             if (time > sub.endTime - 0.3) opacity = Math.max(0, (sub.endTime - time)/0.3);
             break;
        case 'jello':
             if (elapsed < 1) {
                 const t = elapsed;
                 skewX = Math.sin(t * Math.PI * 8) * 0.3 * (1 - t);
                 scaleX = 1 - Math.abs(Math.sin(t * Math.PI * 4) * 0.1 * (1 - t));
                 scaleY = 1 + Math.abs(Math.sin(t * Math.PI * 4) * 0.1 * (1 - t));
             }
             opacity = elapsed < 0.3 ? elapsed * 3.3 : 1;
             if (time > sub.endTime - 0.3) opacity = Math.max(0, (sub.endTime - time)/0.3);
             break;
        case 'rollIn':
             if (elapsed < 1) {
                 const t = Math.min(1, elapsed);
                 translateX = -width * (1 - easeOutBack(t));
                 rotation = -2 * Math.PI * (1 - easeOutBack(t));
                 opacity = t;
             }
             if (time > sub.endTime - 0.5) {
                 const t = (sub.endTime - time) / 0.5;
                 translateX = width * (1 - t); // roll out right
                 rotation = 2 * Math.PI * (1 - t);
                 opacity = t;
             }
             break;
        case 'zoomInDown':
             if (elapsed < 1) {
                 const t = easeOutElastic(Math.min(1, elapsed));
                 scaleX = t; scaleY = t;
                 translateY += -height * (1 - t);
                 opacity = Math.min(1, elapsed * 2);
             }
             if (time > sub.endTime - 0.5) {
                 const t = (sub.endTime - time) / 0.5;
                 opacity = t;
                 translateY += height * (1-t);
             }
             break;
        case 'backInDown':
             if (elapsed < 1) {
                 const t = easeOutBack(Math.min(1, elapsed));
                 translateY += -1200 * (1-t);
                 scaleX = 0.7 + (0.3 * t);
                 scaleY = 0.7 + (0.3 * t);
                 opacity = t;
             }
             if (time > sub.endTime - 0.5) {
                 opacity = (sub.endTime - time) / 0.5;
                 scaleX = opacity; scaleY = opacity;
             }
             break;
        
        // Motion FX Simulation
        case 'physics-pop':
             if (elapsed < 0.6) {
                 const t = elapsed / 0.6;
                 const eased = easeOutElastic(t);
                 scaleX = eased; scaleY = eased;
                 translateY += 50 * (1 - eased);
                 opacity = Math.min(1, t * 2);
             }
             break;
        case 'flip-3d':
             if (elapsed < 0.6) {
                 // Simple scaling to fake 3d flip on 2d canvas
                 scaleY = Math.sin((elapsed/0.6) * (Math.PI/2));
             }
             break;
    }

    // Special Handling for Typewriter in Canvas (rendering partial text)
    let textToDraw = sub.text;
    if (settings.animationType === 'typewriter') {
        const totalChars = sub.text.length;
        const charsToShow = Math.floor(Math.min(1, elapsed / (totalChars * 0.05)) * totalChars);
        textToDraw = sub.text.substring(0, charsToShow);
        opacity = 1; // Override fade
    }

    ctx.save();
    // Move to center of screen
    ctx.translate(centerX, centerY);
    
    // --- APPLY INDIVIDUAL TRANSFORM (X, Y, Scale) ---
    // x and y are percentages of width/height offset from center
    const x = sub.x || 0;
    const y = sub.y || 0;
    const scale = sub.scale || 1;

    const globalTranslateX = (width * x) / 100;
    const globalTranslateY = (height * y) / 100;
    
    ctx.translate(globalTranslateX, globalTranslateY);
    ctx.scale(scale, scale);
    
    // --------------------------------------------

    // ctx.translate(xOffset, 0); // Remove hardcoded offset
    
    ctx.globalAlpha = opacity;
    if (blur > 0) ctx.filter = `blur(${blur}px)`;
    
    // Apply transforms
    ctx.translate(translateX, translateY);
    ctx.rotate(rotation);
    ctx.transform(1, 0, skewX, 1, 0, 0);
    ctx.scale(scaleX, scaleY);
    
    lines.forEach((line, i) => {
        if (settings.animationType !== 'neon' && settings.backgroundColor === 'transparent') {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        ctx.fillText(line, 0, blockStartY + (i * lineHeight));
    });

    ctx.restore();
  });
  
  ctx.restore();
};
