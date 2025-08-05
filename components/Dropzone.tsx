import React, { useState, useCallback, useRef } from 'react';
import { X, UploadCloud } from 'lucide-react';

interface DropzoneProps {
  fileType: 'video' | 'image';
  onFileSelect: (file: File | null, url: string | null) => void;
  previewUrl: string | null;
  accept: string;
  title: string;
  description: string;
  fileName: string | null;
}

const Dropzone: React.FC<DropzoneProps> = ({ fileType, onFileSelect, previewUrl, accept, title, description, fileName }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) {
      onFileSelect(null, null);
      return;
    }
    // Use createObjectURL for efficient, memory-safe previews for all file types.
    const objectUrl = URL.createObjectURL(file);
    onFileSelect(file, objectUrl);
  }, [onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Reset input value to allow re-selecting the same file
    if (e.target) e.target.value = '';
  };

  const onClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleFile(null);
      if(inputRef.current) inputRef.current.value = "";
  }

  const borderColor = dragActive ? 'border-amber-400 bg-white/10' : 'border-white/10';

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{title}</label>
      <div
        className={`relative border-2 border-dashed ${borderColor} rounded-lg p-6 text-center hover:border-amber-500/50 transition-colors duration-300 cursor-pointer min-h-[160px] flex flex-col justify-center items-center bg-white/5`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !previewUrl && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
        {previewUrl ? (
          <div className="space-y-2 w-full">
            {fileType === 'video' ? (
              <video src={previewUrl} className="w-full h-32 object-cover rounded-lg bg-black" controls muted playsInline />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
            )}
            <div className="flex items-center justify-between text-sm p-1 bg-green-900/50 border border-green-500/30 rounded-md">
              <p className="text-green-300 font-medium truncate pr-2">✓ {fileName}</p>
              <button onClick={onClear} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full p-1 flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2" onClick={() => inputRef.current?.click()}>
            <UploadCloud className="mx-auto h-12 w-12 text-slate-500" />
            <div>
              <p className="text-slate-300 font-medium">Kéo thả hoặc <span className="text-amber-400">click</span> để chọn file</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;
