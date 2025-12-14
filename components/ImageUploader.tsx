
import React, { useRef } from 'react';
import { Upload, X, Maximize2, Video, Film, Aperture, Plus } from 'lucide-react';

interface Props {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onPreview: (img: string) => void;
  maxImages?: number;
  gridCols?: number; // Deprecated in favor of flex layout but kept for compat
  label?: string;
  compact?: boolean;
}

export const ImageUploader: React.FC<Props> = ({ 
    images, onImagesChange, onPreview, maxImages = 8, label 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: string[] = [];
      const files = Array.from(e.target.files);
      let processedCount = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          newImages.push(base64);
          processedCount++;
          if (processedCount === files.length) {
            onImagesChange([...images, ...newImages].slice(0, maxImages));
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
    const newImgs = [...images];
    newImgs.splice(index, 1);
    onImagesChange(newImgs);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Dynamic Grid Layout */}
      <div className="flex flex-wrap gap-3 h-full overflow-y-auto content-start">
          {/* Render Existing Images */}
          {images.map((img, idx) => (
             <div 
                key={idx} 
                className="w-24 h-24 flex-shrink-0 relative group bg-void-900 overflow-hidden border border-neon-secondary/30 rounded-sm"
             >
                <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm z-10">
                    <button onClick={(e) => { e.stopPropagation(); onPreview(`data:image/jpeg;base64,${img}`); }} className="p-1.5 bg-neon-secondary text-black rounded-sm hover:scale-110 transition-transform"><Maximize2 size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="p-1.5 bg-red-500 text-white rounded-sm hover:scale-110 transition-transform"><X size={12} /></button>
                </div>
                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20"></div>
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20"></div>
             </div>
          ))}

          {/* Render 'Add' Button if limit not reached */}
          {images.length < maxImages && (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 flex-shrink-0 relative group bg-void-900 border border-white/5 hover:border-neon-primary/50 cursor-pointer hover:bg-white/5 hover:shadow-[0_0_15px_rgba(124,58,237,0.1)] transition-all duration-300 rounded-sm flex flex-col items-center justify-center text-slate-700 group-hover:text-neon-primary"
             >
                <Plus size={24} className="mb-2 opacity-50"/>
                <span className="text-[8px] font-mono tracking-widest">ADD</span>
                
                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20"></div>
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20"></div>
             </div>
          )}
      </div>
      <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
    </div>
  );
};

interface VideoProps {
    video: { data: string; mimeType: string } | null | undefined;
    onVideoChange: (video: { data: string; mimeType: string } | null) => void;
}

export const VideoUploader: React.FC<VideoProps> = ({ video, onVideoChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                onVideoChange({ data: base64, mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div 
            onClick={() => !video && fileInputRef.current?.click()}
            className={`relative w-full h-full min-h-[100px] border border-white/5 bg-void-900 overflow-hidden group transition-all rounded-sm ${!video ? 'cursor-pointer hover:border-neon-primary/50 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(124,58,237,0.1)]' : 'border-neon-secondary/30'}`}
        >
             {video ? (
                <div className="relative w-full h-full">
                    <video src={`data:${video.mimeType};base64,${video.data}`} className="w-full h-full object-cover opacity-80" muted />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
                         <button onClick={(e) => { e.stopPropagation(); onVideoChange(null); }} className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-2">
                            <X size={12} /> 清除 / PURGE
                        </button>
                    </div>
                    <div className="absolute top-2 right-2 bg-neon-primary text-white text-[8px] font-mono px-1 rounded-sm">VIDEO REF</div>
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 group-hover:text-neon-primary gap-2">
                    <Video size={20} />
                    <span className="text-[10px] font-mono uppercase tracking-widest">导入视频 / MP4</span>
                </div>
             )}
             
             {/* Tech Corners */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20"></div>
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20"></div>

             <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        </div>
    )
}
