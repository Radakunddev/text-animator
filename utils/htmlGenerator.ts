
import { Subtitle, AnimationSettings, AnimationType, CustomFont } from '../types';

// Helper to check if animation is external
const isExternal = (type: AnimationType) => {
    return ['rubberBand', 'wobble', 'jello', 'backInDown', 'rollIn', 'zoomInDown'].includes(type);
};

const isMotion = (type: AnimationType) => {
    return ['physics-pop', 'typewriter', 'word-stagger', 'flip-3d', 'focus-blur'].includes(type);
};

export const generateStandaloneHTML = (subtitles: Subtitle[], settings: AnimationSettings, customFonts: CustomFont[] = []): string => {
  const totalDuration = subtitles.length > 0 ? subtitles[subtitles.length - 1].endTime + 2 : 10;
  const isExt = isExternal(settings.animationType);
  const isMot = isMotion(settings.animationType);

  // Map internal types to Animate.css classes
  const getAnimateClass = (type: AnimationType) => {
    switch(type) {
        case 'rubberBand': return 'animate__rubberBand';
        case 'wobble': return 'animate__wobble';
        case 'jello': return 'animate__jello';
        case 'backInDown': return 'animate__backInDown';
        case 'rollIn': return 'animate__rollIn';
        case 'zoomInDown': return 'animate__zoomInDown';
        default: return '';
    }
  };

  const animateClass = getAnimateClass(settings.animationType);

  // Generate @font-face rules for custom fonts
  const customFontCSS = customFonts.map(font => `
    @font-face {
        font-family: '${font.name}';
        src: url('${font.data}') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
  `).join('\n');

  // Special CSS for Motion FX
  let motionCSS = '';
  if (isMot) {
      switch(settings.animationType) {
          case 'physics-pop':
              motionCSS = `
                .char { opacity: 0; animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; animation-delay: calc(var(--i) * 0.05s); }
                @keyframes popIn { from { opacity: 0; transform: translateY(50px) scale(0.5); } to { opacity: 1; transform: translateY(0) scale(1); } }
              `;
              break;
          case 'typewriter':
              motionCSS = `
                .char { opacity: 0; animation: type 0.01s forwards; animation-delay: calc(var(--i) * 0.05s); }
                .subtitle { border-right: 4px solid ${settings.textColor}; animation: blink 1s infinite; width: fit-content; }
                @keyframes type { to { opacity: 1; } }
                @keyframes blink { 50% { border-color: transparent; } }
              `;
              break;
          case 'word-stagger':
              motionCSS = `
                .word { opacity: 0; transform: translateY(20px); animation: slideUp 0.5s ease-out forwards; animation-delay: calc(var(--i) * 0.1s); }
                @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
              `;
              break;
          case 'flip-3d':
              motionCSS = `
                .subtitle { perspective: 1000px; }
                .char { opacity: 0; animation: flip 0.6s ease-out forwards; animation-delay: calc(var(--i) * 0.05s); transform-style: preserve-3d; transform-origin: center bottom; }
                @keyframes flip { from { opacity: 0; transform: rotateX(-90deg); } to { opacity: 1; transform: rotateX(0); } }
              `;
              break;
          case 'focus-blur':
              motionCSS = `
                .char { opacity: 0; filter: blur(10px); animation: blurIn 0.8s ease-out forwards; animation-delay: calc(var(--i) * 0.03s); }
                @keyframes blurIn { to { opacity: 1; filter: blur(0); } }
              `;
              break;
      }
  }

  // Logic for Native Keyframes
  const keyframes = subtitles.map((sub, index) => {
    if (isExt || isMot) return ''; 

    const startPercent = (sub.startTime / totalDuration) * 100;
    const endPercent = (sub.endTime / totalDuration) * 100;
    const entryStart = Math.max(0, startPercent - 0.5);
    const exitStart = Math.min(100, endPercent + 0.5);
    let specificKeyframes = '';

    switch (settings.animationType) {
      case 'fade':
        specificKeyframes = `
            ${entryStart}% { opacity: 0; }
            ${startPercent}% { opacity: 1; }
            ${endPercent}% { opacity: 1; }
            ${exitStart}% { opacity: 0; }
        `;
        break;
      case 'slide':
        specificKeyframes = `
            ${Math.max(0, startPercent - 1)}% { opacity: 0; transform: translateY(30px); }
            ${startPercent}% { opacity: 1; transform: translateY(0); }
            ${endPercent}% { opacity: 1; transform: translateY(0); }
            ${Math.min(100, endPercent + 1)}% { opacity: 0; transform: translateY(-30px); }
        `;
        break;
      case 'pop':
        specificKeyframes = `
            ${Math.max(0, startPercent - 0.5)}% { opacity: 0; transform: scale(0.5); }
            ${startPercent}% { opacity: 1; transform: scale(1); }
            ${endPercent}% { opacity: 1; transform: scale(1); }
            ${Math.min(100, endPercent + 0.5)}% { opacity: 0; transform: scale(1.2); }
        `;
        break;
      case 'blur':
        specificKeyframes = `
            ${Math.max(0, startPercent - 1)}% { opacity: 0; filter: blur(10px); transform: scale(1.1); }
            ${startPercent}% { opacity: 1; filter: blur(0px); transform: scale(1); }
            ${endPercent}% { opacity: 1; filter: blur(0px); transform: scale(1); }
            ${Math.min(100, endPercent + 1)}% { opacity: 0; filter: blur(10px); transform: scale(0.9); }
        `;
        break;
      case 'cinema':
        specificKeyframes = `
            ${entryStart}% { opacity: 0; transform: scale(1); }
            ${startPercent}% { opacity: 1; transform: scale(1); }
            ${endPercent}% { opacity: 1; transform: scale(1.15); }
            ${Math.min(100, endPercent + 0.5)}% { opacity: 0; transform: scale(1.2); }
        `;
        break;
      case 'neon':
        specificKeyframes = `
            ${entryStart}% { opacity: 0; text-shadow: none; }
            ${startPercent}% { opacity: 1; text-shadow: 0 0 10px ${settings.textColor}, 0 0 20px ${settings.textColor}; }
            ${startPercent + (endPercent-startPercent)/2}% { opacity: 1; text-shadow: 0 0 20px ${settings.textColor}, 0 0 40px ${settings.textColor}; }
            ${endPercent}% { opacity: 1; text-shadow: 0 0 10px ${settings.textColor}, 0 0 20px ${settings.textColor}; }
            ${exitStart}% { opacity: 0; text-shadow: none; }
        `;
        break;
      case 'bounce':
        specificKeyframes = `
            ${Math.max(0, startPercent - 1)}% { opacity: 0; transform: translateY(-50px); }
            ${startPercent}% { opacity: 1; transform: translateY(0); }
            ${startPercent + 0.5}% { transform: translateY(-10px); }
            ${startPercent + 1}% { transform: translateY(0); }
            ${endPercent}% { opacity: 1; transform: translateY(0); }
            ${Math.min(100, endPercent + 1)}% { opacity: 0; transform: scale(0); }
        `;
        break;
      case 'glitch':
        specificKeyframes = `
            ${entryStart}% { opacity: 0; transform: skew(0deg); }
            ${startPercent}% { opacity: 1; transform: skew(0deg); }
            ${startPercent + 0.2}% { transform: skew(-20deg); }
            ${startPercent + 0.4}% { transform: skew(20deg); }
            ${startPercent + 0.6}% { transform: skew(0deg); }
            ${endPercent}% { opacity: 1; transform: skew(0deg); }
            ${exitStart}% { opacity: 0; transform: skew(90deg); }
        `;
        break;
    }

    return `
      @keyframes anim-${index} {
        0% { opacity: 0; }
        ${specificKeyframes}
        100% { opacity: 0; }
      }
    `;
  }).join('\n');

  // We apply the individual transforms to each subtitle class
  const styles = subtitles.map((sub, index) => {
    if (isExt || isMot) return '';
    return `
      .subtitle-${index} {
        animation: anim-${index} ${totalDuration}s linear infinite;
        left: ${50 + (sub.x || 0)}%;
        top: ${50 + (sub.y || 0)}%;
        transform: translate(-50%, -50%) scale(${sub.scale || 1});
      }
    `;
  }).join('\n');

  // Updated JS Logic to handle complex Motion HTML injection and Z-index Layering
  const jsLogic = (isExt || isMot) ? `
    const subtitles = ${JSON.stringify(subtitles.map(s => ({...s, id: s.id, text: s.text.replace(/\n/g, '<br/>') })))};
    const container = document.querySelector('.container');
    const subtitleWrapper = document.querySelector('.subtitle-wrapper');
    const animateClass = '${animateClass}';
    const isMotion = ${isMot};
    const motionType = '${settings.animationType}';
    
    function splitText(text, type) {
        if (type === 'word-stagger') {
            return text.split(/(\\s+)/).map((word, i) => {
                if(word.match(/^\\s+$/)) return word;
                return \`<span class="word" style="--i: \${i}; display: inline-block;">\${word}</span>\`;
            }).join('');
        }
        if (['typewriter','focus-blur','physics-pop','flip-3d'].includes(type)) {
            return text.split('').map((char, i) => {
                const content = char === ' ' ? '&nbsp;' : char;
                return \`<span class="char" style="--i: \${i}; display: inline-block;">\${content}</span>\`;
            }).join('');
        }
        return text;
    }
    
    function startPlayback() {
        const startTime = Date.now();
        
        function update() {
            const elapsed = (Date.now() - startTime) / 1000;
            const totalDur = ${totalDuration};
            const currentLoopTime = elapsed % totalDur;
            
            // Find all active subtitles for overlapping layers
            const activeSubs = subtitles.filter(s => currentLoopTime >= s.startTime && currentLoopTime <= s.endTime);
            
            // We need to reconcile the DOM with active subs
            const currentElements = Array.from(subtitleWrapper.children);
            const activeIds = activeSubs.map(s => s.id);
            
            // Remove inactive
            currentElements.forEach(el => {
                const id = el.getAttribute('data-id');
                if (!activeIds.includes(id)) {
                    el.remove();
                }
            });
            
            // Add new
            activeSubs.forEach((sub, index) => {
                let el = subtitleWrapper.querySelector(\`[data-id="\${sub.id}"]\`);
                if (!el) {
                    el = document.createElement('div');
                    el.className = 'subtitle ' + (animateClass ? 'animate__animated ' + animateClass : '');
                    el.setAttribute('data-id', sub.id);
                    el.style.zIndex = index + 10; 
                    
                    // Individual Transform
                    const x = sub.x || 0;
                    const y = sub.y || 0;
                    const scale = sub.scale || 1;
                    el.style.left = (50 + x) + '%';
                    el.style.top = (50 + y) + '%';
                    el.style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
                    
                    if (isMotion) {
                        el.innerHTML = splitText(sub.text, motionType);
                    } else {
                        el.innerHTML = sub.text;
                    }

                    if (animateClass) el.style.setProperty('--animate-duration', '0.8s'); 
                    subtitleWrapper.appendChild(el);
                }
            });
            
            // Update progress
            const prog = document.querySelector('.progress-bar');
            if(prog) prog.style.width = (currentLoopTime / totalDur * 100) + '%';

            requestAnimationFrame(update);
        }
        update();
    }
    startPlayback();
  ` : '';

  const htmlContent = (!isExt && !isMot) ? subtitles.map((sub, index) => {
    const formattedText = sub.text.replace(/\n/g, '<br/>');
    return `<div class="subtitle subtitle-${index}">${formattedText}</div>`;
  }).join('\n') : ''; 

  const nativeProgressBar = (!isExt && !isMot) ? `
        /* Progress Bar */
        .progress-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            height: 4px;
            background: ${settings.textColor};
            opacity: 0.3;
            width: 0%;
            animation: progress ${totalDuration}s linear infinite;
        }
        @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
        }
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SRT Animation</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Bangers&family=Cinzel:wght@700&family=Orbitron:wght@700&family=Permanent+Marker&family=Anton&family=Lobster&family=Playfair+Display:wght@700&family=Press+Start+2P&family=Monoton&family=Creepster&display=swap" rel="stylesheet">
    ${isExt ? '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />' : ''}
    <style>
        ${customFontCSS}

        body {
            margin: 0;
            padding: 0;
            background-color: ${settings.backgroundColor};
            color: ${settings.textColor};
            font-family: '${settings.fontFamily}', sans-serif;
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            position: relative;
        }
        
        .container {
            width: 100%;
            height: 100%;
            position: relative;
        }
        
        .subtitle-wrapper {
            position: absolute;
            width: 100%;
            height: 100%;
        }

        .subtitle {
            position: absolute;
            /* Default centering anchor */
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            
            width: max-content;
            max-width: 90%;
            
            text-align: ${settings.textAlign};
            font-size: ${settings.fontSize};
            font-weight: bold;
            opacity: ${isExt || isMot ? '1' : '0'};
            will-change: opacity, transform;
            line-height: 1.4;
            display: flex;
            flex-direction: column;
            justify-content: center;
            white-space: pre-wrap; /* Changed from pre to allow wrapping */
            word-break: break-word;
            ${settings.animationType !== 'neon' && settings.backgroundColor === 'transparent' ? 'text-shadow: 2px 2px 4px rgba(0,0,0,0.5);' : ''}
            ${settings.animationType !== 'neon' && settings.backgroundColor !== 'transparent' ? 'text-shadow: 2px 2px 4px rgba(0,0,0,0.3);' : ''}
        }

        ${motionCSS}
        ${nativeProgressBar}
        ${keyframes}
        ${styles}
    </style>
</head>
<body>
    <div class="container">
        <div class="subtitle-wrapper">
            ${htmlContent}
        </div>
    </div>
    <div class="progress-bar"></div>
    <script>
        ${jsLogic}
    </script>
</body>
</html>
  `;
};
