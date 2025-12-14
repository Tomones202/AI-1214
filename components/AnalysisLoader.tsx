
import React, { useEffect, useRef, useState } from 'react';

const MATH_SYMBOLS = [
  '∑', '∫', 'π', '∞', '√', '≈', '≠', '∆', 'Ω',
  '🌸', '🦁', '🌿', '🦋', '🧬', '🪐',
  '⚛️', '🎬', '🎯', '🛒', '📦', '✨'
];

const WORDS = ["IMAGINE", "CREATE", "RENDER", "LIGHT", "COLOR", "TIKTOK", "VIRAL", "MAGIC"];

interface Props {
  mode?: 'analysis' | 'generation'; // Analysis = Math/Scan, Generation = Words/Particles
  variant?: 'fullscreen' | 'contained'; // Fullscreen overlay or Contained in a div
}

export const AnalysisLoader: React.FC<Props> = ({ mode = 'analysis', variant = 'fullscreen' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");

  const ANALYSIS_MSGS = [
    "正在扫描多维特征...",
    "调用 Gemini 3.0 神经元...",
    "构思病毒式营销钩子...",
    "规划运镜与视觉张力...",
    "计算情感共鸣指数...",
    "生成分镜矩阵..."
  ];

  const GEN_MSGS = [
    "正在构建高保真场景...",
    "光子追踪渲染中...",
    "优化材质与纹理...",
    "生成最终视觉资产...",
  ];

  useEffect(() => {
    const msgs = mode === 'analysis' ? ANALYSIS_MSGS : GEN_MSGS;
    setCurrentMessage(msgs[0]);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98;
        const increment = prev > 80 ? 0.5 : 1.5;
        return prev + increment;
      });
    }, 100);

    const msgInterval = setInterval(() => {
      setCurrentMessage(prev => {
        const idx = msgs.indexOf(prev);
        return msgs[(idx + 1) % msgs.length];
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
    };
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationId: number;

    const resize = () => {
        if (variant === 'fullscreen') {
            width = window.innerWidth;
            height = window.innerHeight;
        } else {
             width = containerRef.current?.parentElement?.clientWidth || 300;
             height = containerRef.current?.parentElement?.clientHeight || 300;
        }
        canvas.width = width;
        canvas.height = height;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (containerRef.current?.parentElement) {
        resizeObserver.observe(containerRef.current.parentElement);
    }
    window.addEventListener('resize', resize);

    const isGeneration = mode === 'generation';
    const particleCount = variant === 'contained' 
        ? (isGeneration ? 80 : 40)
        : (isGeneration ? 300 : 150);
        
    const particles: Particle[] = [];
    const focalLength = variant === 'contained' ? 200 : 400;

    class Particle {
      x: number;
      y: number;
      z: number;
      text: string;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      isWord: boolean;
      speedZ: number;

      constructor() {
        this.x = (Math.random() - 0.5) * width * 3;
        this.y = (Math.random() - 0.5) * height * 3;
        this.z = Math.random() * 2000;
        
        this.isWord = isGeneration && Math.random() > 0.8;
        this.text = this.isWord 
            ? WORDS[Math.floor(Math.random() * WORDS.length)]
            : MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)];

        // Neon / Cyber colors
        const genColors = ['#7c3aed', '#2dd4bf', '#f43f5e', '#ffffff'];
        const analysisColors = ['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa', '#ffffff'];
        const colors = isGeneration ? genColors : analysisColors;

        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        const baseSize = variant === 'contained' ? 12 : 24;
        this.size = this.isWord ? baseSize * 1.5 : (baseSize/2) + Math.random() * baseSize;
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.speedZ = isGeneration ? 15 + Math.random() * 20 : 8; 
      }

      move() {
        this.z -= this.speedZ;
        
        if (mode === 'analysis') {
            const angle = 0.002;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const nx = this.x * cos - this.y * sin;
            const ny = this.x * sin + this.y * cos;
            this.x = nx;
            this.y = ny;
        } 
        
        if (isGeneration && variant === 'contained') {
             const angle = 0.05; 
             const cos = Math.cos(angle);
             const sin = Math.sin(angle);
             const nx = this.x * cos - this.y * sin;
             const ny = this.x * sin + this.y * cos;
             this.x = nx;
             this.y = ny;
        }

        this.rotation += this.rotationSpeed;

        if (this.z <= 0) {
          this.z = 2000;
          this.x = (Math.random() - 0.5) * width * 3;
          this.y = (Math.random() - 0.5) * height * 3;
          if (isGeneration) {
             this.isWord = Math.random() > 0.8;
             this.text = this.isWord ? WORDS[Math.floor(Math.random() * WORDS.length)] : MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)];
          }
        }
      }

      draw() {
        if (!ctx) return;
        const scale = focalLength / (focalLength + this.z);
        const x2d = this.x * scale + width / 2;
        const y2d = this.y * scale + height / 2;
        
        const alpha = Math.min(1, (1 - this.z / 2000) * 1.5) * (this.z < 100 ? this.z/100 : 1);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x2d, y2d);
        ctx.rotate(this.rotation);
        
        ctx.font = this.isWord ? `bold ${this.size * scale}px Arial` : `${this.size * scale}px monospace`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowBlur = (this.isWord ? 20 : 10) * scale; 
        ctx.shadowColor = this.color;
        
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height); 
      if (variant === 'contained') {
          ctx.fillStyle = isGeneration ? 'rgba(5,5,5,0.95)' : 'rgba(2, 6, 23, 0.95)';
          ctx.fillRect(0,0,width,height);
      } else {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
          ctx.fillRect(0, 0, width, height);
      }
      
      particles.forEach(p => { p.move(); p.draw(); });
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      resizeObserver.disconnect();
    };
  }, [mode, variant]);

  if (variant === 'contained') {
      return (
          <div ref={containerRef} className="absolute inset-0 z-20 overflow-hidden rounded-sm border border-neon-primary/20">
              <canvas ref={canvasRef} className="w-full h-full block" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className={`font-bold text-xs animate-pulse tracking-widest ${mode === 'generation' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-neon-secondary'}`}>
                    {currentMessage}
                 </span>
              </div>
          </div>
      )
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-void-950">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      <div className="relative z-10 w-full max-w-md p-10 bg-void-900/60 backdrop-blur-xl rounded-sm border border-white/10 shadow-[0_0_100px_rgba(124,58,237,0.2)] flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-neon-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="w-24 h-24 bg-void-800 rounded-full border border-neon-primary/50 flex items-center justify-center shadow-lg relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-b from-neon-primary/20 to-transparent opacity-50 animate-[scan_2s_linear_infinite]"></div>
             {mode === 'analysis' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-neon-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 12v.01"/><path d="M12 16v.01"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-neon-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
             )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-[0.2em] uppercase">
          {mode === 'analysis' ? '神经元分析中' : '资产渲染中'}
        </h2>
        
        <div className="h-8 mb-8 flex items-center justify-center">
            <span className="text-neon-secondary font-mono text-xs animate-pulse tracking-widest">
            {currentMessage}
            </span>
        </div>

        <div className="w-full bg-void-800 h-1 mb-4 overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-neon-primary to-neon-secondary transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/50 blur-[4px]"></div>
          </div>
        </div>
      </div>
       <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};
