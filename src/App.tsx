import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { loadMandalaData, mapCodonToMandala } from './logic/mappingEngine';
import { serializeState, deserializeState } from './logic/hashService';
import { getGeminiInterpretation } from './logic/geminiService';
import { CosmicTube } from './components/CosmicTube';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Share2, Sparkles, Send, Info, Loader2, Maximize, Minimize, Orbit, ChevronLeft, ChevronRight, Expand, Shrink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';

export default function App() {
  const [data, setData] = useState<any>(null);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [params, setParams] = useState({ 
    flow: 1, 
    chaos: 0.2, 
    resonance: 432,
    trailLength: 0.5,
    trailIntensity: 0.8,
    density: 3,
    pulsationSpeed: 1,
    neurographicMode: false
  });
  const [query, setQuery] = useState('');
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [onboarding, setOnboarding] = useState(true);

  // Load Data
  useEffect(() => {
    loadMandalaData()
      .then(setData)
      .catch(err => {
        console.error("Failed to load mandala data:", err);
        // Fallback to empty data to prevent infinite loading
        setData({ codons: [], trigrams: [] });
      });
    
    // Hydrate from Hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      const state = deserializeState(hash);
      if (state) {
        setActiveIndices(state.activeIndices);
        setParams(prev => ({
          ...prev,
          ...state.params
        }));
        setOnboarding(false);
      }
    }
  }, []);

  // Update Hash
  useEffect(() => {
    if (activeIndices.length > 0) {
      const hash = serializeState(activeIndices, params);
      window.history.replaceState(null, '', `#${hash}`);
    }
  }, [activeIndices, params]);

  const activeCodons = useMemo(() => {
    if (!data) return [];
    return data.codons
      .filter((c: any) => activeIndices.includes(c.index))
      .map((c: any) => mapCodonToMandala(c, data.trigrams));
  }, [data, activeIndices]);

  const handleOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;
    
    // Use name and dob to seed the initial state (deterministic randomness)
    const seed = (name + dob).length || 42;
    const randoms = Array.from({ length: 12 }, (_, i) => ((seed * (i + 1)) % 64) + 1);
    
    setActiveIndices(randoms);
    setOnboarding(false);
  };

  const handleInterpret = async () => {
    if (!query) return;
    setLoading(true);
    const text = await getGeminiInterpretation(activeCodons, query);
    setInterpretation(text);
    setLoading(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Cosmic Link copied to clipboard!");
  };

  if (!data) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white font-mono">Initializing Bio-Algorithm...</div>;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative text-white font-sans selection:bg-emerald-500/30">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: false, stencil: false, depth: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 20]} />
          <OrbitControls 
            enablePan={false} 
            maxDistance={100} 
            minDistance={2} 
            maxPolarAngle={Math.PI} 
            minPolarAngle={0}
          />
            <CosmicTube 
              activeCodons={activeCodons} 
              chaos={params.chaos} 
              flow={params.flow} 
              trailLength={params.trailLength}
              trailIntensity={params.trailIntensity}
              density={params.density}
              pulsationSpeed={params.pulsationSpeed}
              neurographicMode={params.neurographicMode}
            />
          <EffectComposer>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AnimatePresence>
          {onboarding && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 pointer-events-auto"
            >
              <form onSubmit={handleOnboard} className="max-w-md w-full space-y-10 text-center">
                <div className="space-y-4">
                  <motion.h1 
                    initial={{ y: 20 }} animate={{ y: 0 }}
                    className="text-6xl font-light tracking-tighter italic font-serif text-emerald-400"
                  >
                    DNA Mandala
                  </motion.h1>
                  <p className="text-zinc-500 text-xs uppercase tracking-[0.4em]">Cosmic Map & Gene Keys</p>
                </div>
                
                <div className="space-y-4">
                  <input 
                    name="name" type="text" required placeholder="Ваше Имя" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-emerald-500 transition-all text-center text-lg text-white"
                  />
                  <input 
                    name="dob" type="date" required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-emerald-500 transition-all text-center text-lg text-white"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 text-black font-bold rounded-2xl py-5 hover:bg-emerald-400 transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  >
                    АКТИВИРОВАТЬ МАНДАЛУ
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {showUI && !onboarding && (
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {/* Sidebar Settings */}
              <motion.div 
                initial={{ x: -300, opacity: 0 }} 
                animate={{ x: showSidebar ? 0 : -320, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 w-80 bg-black/60 backdrop-blur-3xl border-r border-white/10 p-8 flex flex-col gap-8 pointer-events-auto z-50 overflow-y-auto custom-scrollbar"
              >
                {/* Sidebar Toggle Button */}
                <button 
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="absolute -right-12 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-r-2xl hover:bg-emerald-500/20 transition-all text-white"
                >
                  {showSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Settings className="text-emerald-400" size={20} />
                  </div>
                  <h2 className="text-xl font-serif italic">Настройки</h2>
                </div>

                <div className="space-y-8">
                  {/* Core Parameters */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <span>Энтропия (Хаос)</span>
                          <div className="group relative">
                            <Info size={10} className="cursor-help text-zinc-500" />
                            <div className="absolute left-0 top-4 w-64 p-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl text-[11px] leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] shadow-2xl">
                              <p className="text-pink-400 mb-1 font-bold uppercase tracking-tighter">Энтропия (Хаос)</p>
                              Энтропия определяет степень непредсказуемости и хаотичности движения пульсаров. Чем выше значение, тем больше отклонение от идеальной траектории, создавая эффект "живого" дыхания космоса.
                            </div>
                          </div>
                        </div>
                        <span>{(params.chaos * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.01" value={params.chaos}
                        onChange={(e) => setParams({ ...params, chaos: parseFloat(e.target.value) })}
                        style={{ '--accent-color': '#ec4899' } as React.CSSProperties}
                        className="w-full cursor-pointer custom-slider"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                        <span>Поток (Flow)</span>
                        <span>{params.flow.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="5" step="0.1" value={params.flow}
                        onChange={(e) => setParams({ ...params, flow: parseFloat(e.target.value) })}
                        style={{ '--accent-color': '#06b6d4' } as React.CSSProperties}
                        className="w-full cursor-pointer custom-slider"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                        <span>Длина шлейфа</span>
                        <span>{(params.trailLength * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="2" step="0.01" value={params.trailLength}
                        onChange={(e) => setParams({ ...params, trailLength: parseFloat(e.target.value) })}
                        style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}
                        className="w-full cursor-pointer custom-slider"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                        <span>Яркость шлейфа</span>
                        <span>{(params.trailIntensity * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.01" value={params.trailIntensity}
                        onChange={(e) => setParams({ ...params, trailIntensity: parseFloat(e.target.value) })}
                        style={{ '--accent-color': '#8b5cf6' } as React.CSSProperties}
                        className="w-full cursor-pointer custom-slider"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                        <span>Плотность</span>
                        <span>{params.density}x</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" step="1" value={params.density}
                        onChange={(e) => setParams({ ...params, density: parseInt(e.target.value) })}
                        style={{ '--accent-color': '#10b981' } as React.CSSProperties}
                        className="w-full cursor-pointer custom-slider"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                        <span>Скорость пульсации</span>
                        <span>{params.pulsationSpeed.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="5" step="0.1" value={params.pulsationSpeed}
                        onChange={(e) => setParams({ ...params, pulsationSpeed: parseFloat(e.target.value) })}
                        style={{ '--accent-color': '#f43f5e' } as React.CSSProperties}
                        className="w-full cursor-pointer custom-slider"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <button 
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors text-sm font-bold"
                  >
                    <Share2 size={14} /> Поделиться
                  </button>
                </div>
              </motion.div>

              {/* Bottom Search Bar & Interpretation */}
              <motion.div 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  height: isExpanded ? '80vh' : 'auto',
                  width: isExpanded ? '90vw' : 'calc(100% - 3rem)',
                  maxWidth: isExpanded ? '1200px' : (showSidebar ? 'calc(100vw - 360px)' : '600px'),
                  x: isExpanded ? '-50%' : '0%',
                  left: isExpanded ? '50%' : 'auto',
                  right: isExpanded ? 'auto' : '1.5rem',
                }}
                exit={{ y: 100, opacity: 0 }}
                className={`absolute bottom-10 pointer-events-auto transition-all duration-500 ease-in-out`}
                style={{ zIndex: 100 }}
              >
                <div className={`bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative flex flex-col ${isExpanded ? 'h-full' : ''}`}>
                  {/* Header with Expand/Shrink */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold">Интерпретация Состояния</span>
                    {interpretation && (
                      <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400"
                      >
                        {isExpanded ? <Shrink size={18} /> : <Expand size={18} />}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                      <input 
                        value={query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="О чем ваш внутренний запрос?"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-3 focus:outline-none focus:border-emerald-500 transition-all font-serif italic text-base text-white placeholder:text-zinc-600"
                      />
                    </div>
                    <button 
                      onClick={handleInterpret} disabled={loading}
                      className="bg-gradient-to-br from-emerald-400 to-teal-600 text-black hover:scale-105 active:scale-95 p-3 rounded-xl transition-all font-bold flex items-center justify-center disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                      title="Отправить запрос"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </div>

                  {interpretation && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`overflow-y-auto pr-4 custom-scrollbar ${isExpanded ? 'flex-1' : 'max-h-32'}`}
                    >
                      <div className="markdown-body text-zinc-200 leading-relaxed text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {interpretation}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle UI Button - Fixed position and higher z-index */}
      <div className="absolute right-6 top-6 z-[100] flex flex-col items-end gap-2 pointer-events-auto">
        <button 
          onClick={() => setShowUI(!showUI)}
          className="p-4 bg-black/80 backdrop-blur-2xl border border-white/30 rounded-2xl hover:bg-emerald-500/40 transition-all group shadow-2xl active:scale-90"
          title={showUI ? "Скрыть интерфейс" : "Показать интерфейс"}
        >
          {showUI ? <Minimize size={28} className="text-emerald-400 transition-transform" /> : <Maximize size={28} className="text-white transition-transform" />}
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #10b981; margin-top: 1rem; margin-bottom: 0.5rem; font-family: serif; font-style: italic; }
        .markdown-body p { margin-bottom: 0.75rem; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .markdown-body strong { color: #34d399; }
        
        input[type="range"] {
          -webkit-appearance: none;
          background: rgba(255,255,255,0.1);
          height: 4px;
          border-radius: 2px;
        }
        input[type="range"].custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: var(--accent-color, #10b981);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 12px var(--accent-color, rgba(16,185,129,0.5));
          border: 2px solid rgba(255,255,255,0.2);
          transition: transform 0.1s ease;
        }
        input[type="range"].custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
