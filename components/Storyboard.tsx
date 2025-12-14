
import React, { useState, useRef } from 'react';
import { Play, Image as ImageIcon, Wand2, Copy, ChevronDown, ChevronUp, RefreshCw, ArrowRight, Maximize2, Mic, Pause, Download, Edit3, X, Check, FileJson, Terminal, Film, Database } from 'lucide-react';
import { StoryboardScene, VideoMode, AspectRatio, GeneratedAsset, ImageResolution } from '../types';
import { generateImage, generateSpeech, regenerateVeoPrompt } from '../services/geminiService';
import { AnalysisLoader } from './AnalysisLoader';

interface Props {
  scenes: StoryboardScene[];
  videoMode: VideoMode;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  productImages: string[];
  modelImages: string[];
  backgroundImages: string[];
  assignedVoice: string;
  onUpdateScene: (id: string, updates: Partial<StoryboardScene>) => void;
  onPreview: (url: string, type: 'image' | 'audio') => void;
}

export const Storyboard: React.FC<Props> = ({ 
    scenes, videoMode, aspectRatio, resolution, productImages, modelImages, backgroundImages, assignedVoice,
    onUpdateScene, onPreview
}) => {
  const [expandedScene, setExpandedScene] = useState<string | null>(scenes[0]?.id || null);
  const [editPromptData, setEditPromptData] = useState<{sceneId: string, type: 'start' | 'middle' | 'end', prompt: string} | null>(null);
  const [refineData, setRefineData] = useState<{sceneId: string, type: 'start' | 'middle' | 'end', originalImage: string} | null>(null);
  const [modificationInput, setModificationInput] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedScene(expandedScene === id ? null : id);
  };

  const handleDownload = (url: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleBatchGenerate = async (scene: StoryboardScene) => {
      let startImageData = scene.startImage?.data;
      if (!startImageData) {
           startImageData = await handleGenerateImage(scene, 'start');
      }
      if (!startImageData && (videoMode === VideoMode.StartEnd || videoMode === VideoMode.Intermediate)) return; 
      
      const promises = [];
      if (videoMode === VideoMode.Intermediate && !scene.middleImage) {
           promises.push(handleGenerateImage(scene, 'middle', undefined, startImageData));
      }
      if ((videoMode === VideoMode.StartEnd || videoMode === VideoMode.Intermediate) && !scene.endImage) {
          promises.push(handleGenerateImage(scene, 'end', undefined, startImageData));
      }
      await Promise.all(promises);
  };

  // Main Generation Function
  const handleGenerateImage = async (
    scene: StoryboardScene, 
    type: 'start' | 'end' | 'middle', 
    customPrompt?: string,
    overrideStartImageData?: string
  ): Promise<string | undefined> => {
    const loadingUpdate = {
        isGeneratingStart: type === 'start' ? true : scene.isGeneratingStart,
        isGeneratingMiddle: type === 'middle' ? true : scene.isGeneratingMiddle,
        isGeneratingEnd: type === 'end' ? true : scene.isGeneratingEnd,
        error: undefined
    };
    onUpdateScene(scene.id, loadingUpdate);

    try {
      // 1. Determine Prompt
      // If customPrompt is passed (e.g. from Refine or Edit Override), use it.
      // Otherwise use the Scene's imagePrompt.
      let prompt = customPrompt || scene.prompt.imagePrompt;

      // 2. Determine Reference Images
      let referenceImages: string[] = [];
      
      // If this is a REFINEMENT (overrideStartImageData is passed as the Source Image to modify),
      // Put it FIRST so the model uses it as the primary structural reference.
      if (overrideStartImageData) {
          referenceImages.push(overrideStartImageData);
      }

      // Add other context images
      if (modelImages && modelImages.length > 0) referenceImages.push(...modelImages);
      if (backgroundImages && backgroundImages.length > 0) referenceImages.push(...backgroundImages);
      // Only add product images if we aren't heavily editing a specific existing image to avoid confusion, 
      // or add them after.
      if (productImages && productImages.length > 0) referenceImages.push(...productImages.slice(0, 2)); 
      
      // Consistency Logic for Standard Flow (not Refine)
      if (!overrideStartImageData) {
          if (type === 'middle') {
            const startImg = scene.startImage?.data;
            if (startImg) referenceImages.unshift(startImg);
            if (scene.endImage?.data) referenceImages.push(scene.endImage.data);
          } else if (type === 'end') {
              const startImg = scene.startImage?.data;
              if (startImg) referenceImages.unshift(startImg);
          }
      }

      let targetResolution = resolution;
      if (videoMode === VideoMode.Intermediate && type === 'middle') targetResolution = ImageResolution.Res_1K;

      const base64 = await generateImage(prompt, aspectRatio, targetResolution, referenceImages);
      const asset: GeneratedAsset = {
        type: 'image',
        url: `data:image/jpeg;base64,${base64}`,
        mimeType: 'image/jpeg',
        data: base64
      };

      if (type === 'start') onUpdateScene(scene.id, { startImage: asset });
      else if (type === 'end') onUpdateScene(scene.id, { endImage: asset });
      else if (type === 'middle') onUpdateScene(scene.id, { middleImage: asset });

      if ((videoMode === VideoMode.StartEnd || videoMode === VideoMode.Intermediate) && type === 'end') {
        const index = scenes.findIndex(s => s.id === scene.id);
        if (index < scenes.length - 1) {
          onUpdateScene(scenes[index + 1].id, { startImage: asset });
        }
      }
      return base64;
    } catch (e) {
      onUpdateScene(scene.id, { error: `生成失败: ${(e as Error).message}` });
      return undefined;
    } finally {
       const finalUpdate: any = {};
       if(type === 'start') finalUpdate.isGeneratingStart = false;
       if(type === 'middle') finalUpdate.isGeneratingMiddle = false;
       if(type === 'end') finalUpdate.isGeneratingEnd = false;
       onUpdateScene(scene.id, finalUpdate);
    }
  };

  const handleGenerateAudio = async (scene: StoryboardScene) => {
    if (!scene.dialogue) return;
    onUpdateScene(scene.id, { isGeneratingAudio: true, error: undefined });
    try {
        const base64 = await generateSpeech(scene.dialogue, assignedVoice);
        const asset: GeneratedAsset = {
            type: 'audio',
            url: `data:audio/wav;base64,${base64}`,
            mimeType: 'audio/wav',
            data: base64
        };
        onUpdateScene(scene.id, { audio: asset });
    } catch (e) {
        onUpdateScene(scene.id, { error: `语音失败: ${(e as Error).message}` });
    } finally {
        onUpdateScene(scene.id, { isGeneratingAudio: false });
    }
  };

  const updatePrompt = (id: string, value: string) => {
      const scene = scenes.find(s => s.id === id);
      if (scene) onUpdateScene(id, { prompt: { ...scene.prompt, imagePrompt: value } });
  }

  const handleUpdatePromptContent = async (scene: StoryboardScene) => {
      onUpdateScene(scene.id, { isUpdatingPrompt: true });
      try {
          const newPrompt = await regenerateVeoPrompt(scene);
          onUpdateScene(scene.id, { prompt: { ...scene.prompt, imagePrompt: newPrompt } });
      } catch (e) {
          onUpdateScene(scene.id, { error: `提示词更新失败: ${(e as Error).message}` });
      } finally {
          onUpdateScene(scene.id, { isUpdatingPrompt: false });
      }
  }

  const openEditDialog = (scene: StoryboardScene, type: 'start' | 'middle' | 'end') => {
      setEditPromptData({ sceneId: scene.id, type, prompt: scene.prompt.imagePrompt });
  };

  const openRefineDialog = (scene: StoryboardScene, type: 'start' | 'middle' | 'end', asset?: GeneratedAsset) => {
      if (!asset || !asset.data) return;
      setModificationInput("");
      setRefineData({ sceneId: scene.id, type, originalImage: asset.data });
  };

  return (
    <div className="space-y-6 pb-20">
       {/* 1. Prompt Override Modal (Advanced JSON Edit) */}
       {editPromptData && (
        <div className="fixed inset-0 z-[200] bg-void-950/90 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-void-900 border border-neon-primary rounded-sm p-6 w-full max-w-3xl shadow-[0_0_50px_rgba(124,58,237,0.2)] animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <Terminal size={18} className="text-neon-primary"/> 提示词覆写协议 / OVERRIDE
                    </h3>
                    <button onClick={() => setEditPromptData(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div>
                    <label className="text-[10px] text-neon-secondary font-mono uppercase mb-3 block flex items-center gap-2">
                        <Database size={12}/> VEO MANIFEST V4.0 (JSON OBJECT)
                    </label>
                    <textarea 
                        value={editPromptData.prompt} 
                        onChange={(e) => setEditPromptData(prev => prev ? ({...prev, prompt: e.target.value}) : null)}
                        className="w-full bg-black border border-white/10 p-5 text-xs text-green-400 focus:border-neon-primary outline-none h-80 font-mono leading-relaxed resize-none shadow-inner"
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setEditPromptData(null)} className="px-6 py-2 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5 transition-all">取消</button>
                    <button onClick={() => {
                        if (!editPromptData) return;
                        const scene = scenes.find(s => s.id === editPromptData.sceneId);
                        if (scene) handleGenerateImage(scene, editPromptData.type, editPromptData.prompt);
                        setEditPromptData(null);
                    }} className="px-6 py-2 bg-neon-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-neon-primary/80 transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                        确认覆写并生成
                    </button>
                </div>
            </div>
        </div>
       )}

       {/* 2. Visual Refine Modal (Simple Text Input for Image Mod) */}
       {refineData && (
        <div className="fixed inset-0 z-[200] bg-void-950/90 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-void-900 border border-neon-secondary rounded-sm p-6 w-full max-w-lg shadow-[0_0_50px_rgba(45,212,191,0.2)] animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <Wand2 size={18} className="text-neon-secondary"/> 视觉微调 / REFINE
                    </h3>
                    <button onClick={() => setRefineData(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                
                <div className="mb-6 flex gap-4">
                     <div className="w-24 h-24 flex-shrink-0 border border-white/10 bg-black">
                         <img src={`data:image/jpeg;base64,${refineData.originalImage}`} className="w-full h-full object-cover opacity-70" />
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-mono uppercase mb-2 block">
                            输入修改指令 / MODIFICATION PROMPT
                        </label>
                        <textarea 
                            value={modificationInput} 
                            onChange={(e) => setModificationInput(e.target.value)}
                            className="w-full bg-black border border-white/10 p-3 text-xs text-white focus:border-neon-secondary outline-none h-24 resize-none shadow-inner"
                            placeholder="例如：把背景换成办公室、让模特微笑、增加光照..."
                            autoFocus
                        />
                     </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={() => setRefineData(null)} className="px-6 py-2 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5 transition-all">取消</button>
                    <button onClick={() => {
                        if (!refineData || !modificationInput.trim()) return;
                        const scene = scenes.find(s => s.id === refineData.sceneId);
                        // Call Generate Image with Custom Prompt + Original Image as Reference
                        if (scene) handleGenerateImage(scene, refineData.type, modificationInput, refineData.originalImage);
                        setRefineData(null);
                    }} className="px-6 py-2 bg-neon-secondary text-black text-xs font-bold uppercase tracking-widest hover:bg-neon-secondary/80 transition-all shadow-[0_0_15px_rgba(45,212,191,0.4)]">
                        开始微调 / EXECUTE
                    </button>
                </div>
            </div>
        </div>
       )}

      {scenes.map((scene, index) => (
        <div key={scene.id} className="glass-panel rounded-sm border-l-4 border-l-void-700 hover:border-l-neon-primary transition-all duration-300 group">
          
          {/* Timeline Strip Header */}
          <div className="p-5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-white/5 to-transparent" onClick={() => toggleExpand(scene.id)}>
            <div className="flex items-center gap-6">
               <div className="w-14 h-14 bg-void-900 border border-white/10 flex items-center justify-center font-mono text-xl font-bold text-neon-primary shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-neon-primary opacity-50"></div>
                  {String(index + 1).padStart(2, '0')}
               </div>
               <div>
                  <div className="text-base text-white font-bold mb-1 tracking-wide line-clamp-1">{scene.visual}</div>
                  <div className="text-xs text-slate-500 font-mono flex items-center gap-2 uppercase">
                      <span className="text-neon-secondary font-bold">Action:</span> {scene.action}
                  </div>
               </div>
            </div>
            <div className={`transition-transform duration-300 ${expandedScene === scene.id ? 'rotate-180' : ''} text-neon-primary`}>
              <ChevronDown size={24}/>
            </div>
          </div>

          {/* Details */}
          {expandedScene === scene.id && (
            <div className="p-6 border-t border-white/5 bg-void-950/30">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* Inputs */}
                <div className="xl:col-span-5 space-y-5">
                    <div className="grid grid-cols-1 gap-5">
                        <InputBlock label="画面描述 (Visual)" value={scene.visual} onChange={(v) => onUpdateScene(scene.id, { visual: v })} rows={2} />
                        <InputBlock label="动作指令 (Action)" value={scene.action} onChange={(v) => onUpdateScene(scene.id, { action: v })} rows={2} />
                        <InputBlock label="运镜方式 (Camera)" value={scene.camera} onChange={(v) => onUpdateScene(scene.id, { camera: v })} />
                        
                        <div className="grid grid-cols-2 gap-4">
                             <InputBlock label="对白 (参考)" value={scene.dialogue_cn} readOnly />
                             <InputBlock label={`对白 (${assignedVoice})`} value={scene.dialogue} onChange={(v) => onUpdateScene(scene.id, { dialogue: v })} highlight />
                        </div>
                    </div>

                    {/* VEO PROMPT TERMINAL - Always Visible */}
                    <div className="border border-white/10 bg-black rounded-sm overflow-hidden mt-6 relative group/terminal">
                         <div className="absolute inset-0 border border-neon-primary/20 pointer-events-none z-10"></div>
                         <div className="bg-void-900 p-2 flex items-center justify-between border-b border-white/10">
                             <span className="text-[10px] font-mono text-neon-secondary flex items-center gap-2"><FileJson size={12}/> VEO MANIFEST V4.0</span>
                             <div className="flex gap-2">
                                <button onClick={() => handleUpdatePromptContent(scene)} disabled={scene.isUpdatingPrompt} className="p-1 hover:text-white text-slate-500 transition-colors" title="同步中文修改到 Prompt">
                                    <RefreshCw size={14} className={scene.isUpdatingPrompt ? 'animate-spin' : ''} />
                                </button>
                                <button onClick={() => navigator.clipboard.writeText(scene.prompt.imagePrompt)} className="p-1 hover:text-white text-slate-500"><Copy size={14}/></button>
                             </div>
                         </div>
                         <textarea 
                            value={scene.prompt.imagePrompt}
                            onChange={(e) => updatePrompt(scene.id, e.target.value)}
                            className="w-full bg-transparent p-4 text-[10px] text-green-500 font-mono leading-relaxed outline-none h-48 resize-none opacity-80 group-hover/terminal:opacity-100 transition-opacity"
                         />
                    </div>
                    
                    <button 
                        onClick={() => handleBatchGenerate(scene)}
                        disabled={scene.isGeneratingStart || scene.isGeneratingMiddle || scene.isGeneratingEnd}
                        className="w-full py-4 bg-white/5 hover:bg-neon-primary hover:text-white border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-[0.2em] transition-all mt-4 flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Wand2 size={14} /> 渲染全部分镜 / RENDER ALL
                    </button>
                </div>

                {/* Visuals */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        <AssetSlate 
                            label="起始帧 / START" 
                            asset={scene.startImage} 
                            loading={scene.isGeneratingStart} 
                            onGen={() => handleGenerateImage(scene, 'start')} 
                            onRefine={() => openRefineDialog(scene, 'start', scene.startImage)}
                            onPreview={onPreview}
                            onEdit={() => openEditDialog(scene, 'start')}
                            onDownload={() => scene.startImage && handleDownload(scene.startImage.url, `scene_${index+1}_start.jpg`)}
                        />
                        {(videoMode === VideoMode.Intermediate) && (
                            <AssetSlate 
                                label="过渡帧 / MID" 
                                asset={scene.middleImage} 
                                loading={scene.isGeneratingMiddle} 
                                onGen={() => handleGenerateImage(scene, 'middle')} 
                                onRefine={() => openRefineDialog(scene, 'middle', scene.middleImage)}
                                onPreview={onPreview}
                                onEdit={() => openEditDialog(scene, 'middle')}
                                onDownload={() => scene.middleImage && handleDownload(scene.middleImage.url, `scene_${index+1}_mid.jpg`)}
                                isDraft
                            />
                        )}
                        {(videoMode === VideoMode.StartEnd || videoMode === VideoMode.Intermediate) && (
                            <AssetSlate 
                                label="结束帧 / END" 
                                asset={scene.endImage} 
                                loading={scene.isGeneratingEnd} 
                                onGen={() => handleGenerateImage(scene, 'end')} 
                                onRefine={() => openRefineDialog(scene, 'end', scene.endImage)}
                                onPreview={onPreview}
                                onEdit={() => openEditDialog(scene, 'end')}
                                onDownload={() => scene.endImage && handleDownload(scene.endImage.url, `scene_${index+1}_end.jpg`)}
                            />
                        )}
                    </div>

                    {/* Audio Module */}
                    <div className="glass-panel p-5 flex items-center gap-5 border border-white/5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-neon-secondary/50"></div>
                        <div className={`p-4 rounded-full ${scene.audio ? 'bg-neon-secondary text-black shadow-[0_0_15px_#2dd4bf]' : 'bg-void-800 text-slate-600'}`}>
                            <Mic size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-mono text-slate-500 mb-2 tracking-widest uppercase">音频轨道 / AUDIO TRACK ({assignedVoice})</div>
                            {scene.audio ? (
                                <div className="flex items-center gap-4">
                                    <AudioPlayer url={scene.audio.url} />
                                    <div className="h-8 bg-void-900 flex-1 rounded overflow-hidden flex items-center px-1 gap-0.5 opacity-50">
                                        {Array.from({length: 20}).map((_,i) => (
                                            <div key={i} className="flex-1 bg-neon-secondary rounded-sm" style={{height: `${30 + Math.random()*70}%`}}></div>
                                        ))}
                                    </div>
                                    <button onClick={() => scene.audio && handleDownload(scene.audio.url, `scene_${index+1}_audio.wav`)} className="text-[10px] text-slate-400 hover:text-white uppercase tracking-wider border border-white/10 px-2 py-1 rounded flex items-center gap-1"><Download size={10}/> 下载</button>
                                    <button onClick={() => handleGenerateAudio(scene)} className="text-[10px] text-slate-400 hover:text-white uppercase tracking-wider border border-white/10 px-2 py-1 rounded">重生成</button>
                                </div>
                            ) : (
                                <button 
                                    disabled={!scene.dialogue || scene.isGeneratingAudio}
                                    onClick={() => handleGenerateAudio(scene)}
                                    className="text-xs text-neon-primary hover:text-white transition-colors uppercase font-bold tracking-widest disabled:opacity-50 flex items-center gap-2"
                                >
                                    {scene.isGeneratingAudio ? '语音合成中...' : '生成语音 / SYNTHESIZE'} <ArrowRight size={12}/>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const InputBlock = ({ label, value, onChange, rows = 1, readOnly, highlight }: any) => (
    <div className="space-y-2">
        <label className={`text-[10px] font-mono tracking-widest uppercase ${highlight ? 'text-neon-primary' : 'text-slate-500'}`}>{label}</label>
        {rows > 1 ? (
            <textarea 
                value={value || ''}
                onChange={e => onChange && onChange(e.target.value)}
                readOnly={readOnly}
                rows={rows}
                className={`w-full bg-void-900 border ${highlight ? 'border-neon-primary/50 text-white' : 'border-white/10 text-slate-300'} p-3 text-xs focus:border-neon-primary outline-none transition-all resize-none rounded-sm shadow-inner`}
            />
        ) : (
            <input 
                value={value || ''}
                onChange={e => onChange && onChange(e.target.value)}
                readOnly={readOnly}
                className={`w-full bg-void-900 border ${highlight ? 'border-neon-primary/50 text-white' : 'border-white/10 text-slate-300'} p-3 text-xs focus:border-neon-primary outline-none transition-all rounded-sm shadow-inner`}
            />
        )}
    </div>
)

const AssetSlate = ({ label, asset, loading, onGen, onRefine, onPreview, onEdit, onDownload, isDraft }: any) => (
    <div className="w-48 flex-shrink-0 group relative">
        <div className={`aspect-[9/16] bg-void-900 border ${asset ? 'border-neon-secondary/50' : 'border-white/10'} relative overflow-hidden flex flex-col items-center justify-center transition-all group-hover:border-neon-secondary group-hover:shadow-[0_0_20px_rgba(45,212,191,0.2)]`}>
            {loading ? (
                <AnalysisLoader mode="generation" variant="contained" />
            ) : asset ? (
                <>
                    <img src={asset.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-6 gap-3 z-10">
                         <div className="flex gap-2">
                             <button onClick={() => onPreview(asset.url, 'image')} className="p-2.5 bg-black/50 backdrop-blur text-white rounded-full hover:bg-neon-secondary hover:text-black transition-all" title="预览 / Preview"><Maximize2 size={14}/></button>
                             <button onClick={onRefine} className="p-2.5 bg-black/50 backdrop-blur text-white rounded-full hover:bg-neon-secondary hover:text-black transition-all" title="微调 / Refine"><Wand2 size={14}/></button>
                             <button onClick={onEdit} className="p-2.5 bg-black/50 backdrop-blur text-white rounded-full hover:bg-neon-secondary hover:text-black transition-all" title="编辑 Prompt / Edit"><Edit3 size={14}/></button>
                             <button onClick={onDownload} className="p-2.5 bg-black/50 backdrop-blur text-white rounded-full hover:bg-neon-secondary hover:text-black transition-all" title="下载 / Download"><Download size={14}/></button>
                         </div>
                    </div>
                </>
            ) : (
                <div className="text-center p-2 opacity-30 group-hover:opacity-60 transition-opacity">
                    <Film size={32} className="mx-auto mb-3 text-slate-500"/>
                    <div className="text-[10px] font-mono text-slate-500 tracking-widest">空插槽 / EMPTY</div>
                </div>
            )}
            
            {/* Tech UI Overlays */}
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent flex justify-between z-10 pointer-events-none">
                <span className="text-[9px] font-mono text-white tracking-wider">{label}</span>
                {asset && <span className="text-[9px] font-mono text-neon-secondary animate-pulse">RDY</span>}
            </div>
            
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30"></div>
        </div>
        
        <button 
            onClick={onGen} 
            disabled={loading}
            className={`w-full mt-3 py-2 border text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${asset ? 'bg-void-800 border-white/10 text-slate-400 hover:text-white hover:border-white/30' : 'bg-void-700 border-white/10 text-slate-300 hover:bg-white/10'}`}
        >
            {asset ? '重新生成 / REGEN' : '生成画面 / GENERATE'}
        </button>
    </div>
)

const AudioPlayer = ({ url }: { url: string }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const toggle = () => {
        if (!audioRef.current) return;
        if (playing) audioRef.current.pause();
        else audioRef.current.play();
        setPlaying(!playing);
    };
    return (
        <div className="flex items-center gap-2">
            <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} className="hidden"/>
            <button onClick={toggle} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neon-secondary transition-colors shadow-lg">
                {playing ? <Pause size={12} fill="black" /> : <Play size={12} fill="black" />}
            </button>
        </div>
    )
}
