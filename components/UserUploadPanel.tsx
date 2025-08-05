import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Video as VideoIcon, Link as LinkIcon, AlertTriangle, Image as ImageIcon, Layers, FolderUp } from 'lucide-react';
import { UploadPayload } from '../types';
import Dropzone from './Dropzone';

interface UserUploadPanelProps {
  onClose: () => void;
  onUpload: (uploadData: Omit<UploadPayload, 'tier' | 'password'>) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface MultiUploadItem {
  id: number;
  file: File;
  title: string;
  previewUrl: string;
  type: 'video' | 'image';
}

const UserUploadPanel: React.FC<UserUploadPanelProps> = ({ onClose, onUpload, showToast }) => {
  const [uploadType, setUploadType] = useState<'video' | 'image' | 'link' | 'multi'>('video');
  const idCounter = useRef(0);

  const [uploadDetails, setUploadDetails] = useState({
    title: '', 
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    videoUrl: null as string | null,
    thumbnailUrl: null as string | null,
    externalUrl: ''
  });

  const [multiUploadItems, setMultiUploadItems] = useState<MultiUploadItem[]>([]);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  
  const getMultiId = () => Date.now() + (idCounter.current++);
  
  const clearUploadState = useCallback(() => {
    if (uploadDetails.videoUrl) URL.revokeObjectURL(uploadDetails.videoUrl);
    if (uploadDetails.thumbnailUrl) URL.revokeObjectURL(uploadDetails.thumbnailUrl);

    setUploadDetails({
        title: '', 
        videoFile: null,
        thumbnailFile: null,
        videoUrl: null, 
        thumbnailUrl: null, 
        externalUrl: ''
    });
    setMultiUploadItems([]);
    if (multiFileInputRef.current) {
        multiFileInputRef.current.value = '';
    }
  }, [uploadDetails.videoUrl, uploadDetails.thumbnailUrl]);

  useEffect(() => {
    return () => {
        if (uploadDetails.videoUrl) URL.revokeObjectURL(uploadDetails.videoUrl);
        if (uploadDetails.thumbnailUrl) URL.revokeObjectURL(uploadDetails.thumbnailUrl);
        multiUploadItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (file: File | null, url: string | null, type: 'video' | 'thumbnail') => {
    if (type === 'video') {
      if (uploadDetails.videoUrl) URL.revokeObjectURL(uploadDetails.videoUrl);
      setUploadDetails(prev => ({ ...prev, videoFile: file, videoUrl: url }));
    } else {
      if (uploadDetails.thumbnailUrl) URL.revokeObjectURL(uploadDetails.thumbnailUrl);
      setUploadDetails(prev => ({ ...prev, thumbnailFile: file, thumbnailUrl: url }));
    }
  };
  
  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filePromises = Array.from(files)
        .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
        .map(file => new Promise<MultiUploadItem | null>((resolve) => {
            const type = file.type.startsWith('image/') ? 'image' : 'video';
            const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const previewUrl = URL.createObjectURL(file);
            resolve({
                id: getMultiId(),
                file: file,
                title,
                previewUrl,
                type,
            });
        }));

    Promise.all(filePromises).then(newItems => {
        setMultiUploadItems(prev => [...prev, ...newItems.filter(Boolean) as MultiUploadItem[]]);
    });

    if(e.target) e.target.value = '';
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    setMultiUploadItems(prev => prev.map((item, i) => i === index ? { ...item, title: newTitle } : item));
  };

  const removeMultiUploadItem = (itemToRemove: MultiUploadItem) => {
    URL.revokeObjectURL(itemToRemove.previewUrl);
    setMultiUploadItems(prev => prev.filter((item) => item.id !== itemToRemove.id));
  };


  const handleUploadClick = async () => {
    if (uploadType === 'multi') {
        if (multiUploadItems.length === 0) {
            showToast('Vui lòng chọn ít nhất một file để upload.', 'error');
            return;
        }
        const hasEmptyTitle = multiUploadItems.some(item => !item.title.trim());
        if (hasEmptyTitle) {
            showToast('Vui lòng điền tiêu đề cho tất cả các file.', 'error');
            return;
        }
        
        setUploading(true);
        try {
            for (const item of multiUploadItems) {
                const uploadData: Omit<UploadPayload, 'tier' | 'password'> = {
                    title: item.title,
                    type: item.type,
                    videoFile: item.file,
                    thumbnailFile: null,
                    externalUrl: '',
                };
                await onUpload(uploadData);
            }
            showToast(`Đã gửi ${multiUploadItems.length} mục để xét duyệt!`, 'success');
            onClose();
        } catch (error) {
            showToast('Có lỗi xảy ra trong quá trình upload hàng loạt.', 'error');
        } finally {
            setUploading(false);
        }
        return;
    }

    const isVideoInvalid = uploadType === 'video' && (!uploadDetails.title.trim() || !uploadDetails.videoFile);
    const isImageInvalid = uploadType === 'image' && (!uploadDetails.title.trim() || !uploadDetails.videoFile);
    const isLinkInvalid = uploadType === 'link' && (!uploadDetails.title.trim() || !uploadDetails.externalUrl.trim() || !uploadDetails.thumbnailFile);

    if (isVideoInvalid || isLinkInvalid || isImageInvalid) { 
        showToast('Vui lòng điền các trường bắt buộc (*).', 'error'); 
        return; 
    }

    setUploading(true);
    try {
        const uploadData = {
          title: uploadDetails.title,
          videoFile: uploadDetails.videoFile,
          thumbnailFile: uploadDetails.thumbnailFile,
          type: uploadType,
          externalUrl: uploadDetails.externalUrl,
        };
        await onUpload(uploadData);
        showToast('Upload thành công! Nội dung của bạn sẽ được admin xem xét.', 'success');
        onClose();
    } catch (error) {
        showToast('Có lỗi xảy ra khi upload. Vui lòng thử lại.', 'error');
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-start justify-center p-4 pt-[10vh] backdrop-blur-md" onClick={onClose}>
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-fade-in-down" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-white">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Upload nội dung</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-6 w-6" /></button>
          </div>
          <div className="mb-6 p-1 bg-black/20 rounded-lg grid grid-cols-4 gap-1.5 border border-white/10">
            <button onClick={() => { setUploadType('video'); clearUploadState(); }} className={`py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'video' ? 'bg-amber-500 text-black' : 'hover:bg-white/5'}`}><VideoIcon className="inline-block h-5 w-5" /> Video</button>
            <button onClick={() => { setUploadType('image'); clearUploadState(); }} className={`py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'image' ? 'bg-amber-500 text-black' : 'hover:bg-white/5'}`}><ImageIcon className="inline-block h-5 w-5" /> Ảnh</button>
            <button onClick={() => { setUploadType('link'); clearUploadState(); }} className={`py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'link' ? 'bg-amber-500 text-black' : 'hover:bg-white/5'}`}><LinkIcon className="inline-block h-5 w-5" /> Link</button>
            <button onClick={() => { setUploadType('multi'); clearUploadState(); }} className={`py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'multi' ? 'bg-amber-500 text-black' : 'hover:bg-white/5'}`}><Layers className="inline-block h-5 w-5" /> Hàng loạt</button>
          </div>
          <div className="space-y-4">
             {uploadType !== 'multi' && (
                <>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Tiêu đề *</label><input type="text" value={uploadDetails.title} onChange={(e) => setUploadDetails(prev => ({...prev, title: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition" placeholder="Nhập tiêu đề..." maxLength={100} /></div>
                    
                    {uploadType === 'video' && (<Dropzone fileType="video" onFileSelect={(file, url) => handleFileSelect(file, url, 'video')} previewUrl={uploadDetails.videoUrl} accept="video/*" title="File video *" description="MP4, AVI, MOV, WebM" fileName={uploadDetails.videoFile?.name || null} />)}
                    {uploadType === 'image' && (<Dropzone fileType="image" onFileSelect={(file, url) => handleFileSelect(file, url, 'video')} previewUrl={uploadDetails.videoUrl} accept="image/*" title="File ảnh *" description="JPG, PNG, GIF, WebP" fileName={uploadDetails.videoFile?.name || null} />)}
                    {uploadType === 'link' && (<div><label className="block text-sm font-medium text-slate-300 mb-2">URL liên kết *</label><input type="url" value={uploadDetails.externalUrl} onChange={(e) => setUploadDetails(prev => ({...prev, externalUrl: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition" placeholder="https://example.com" /></div>)}

                    {uploadType !== 'image' && <Dropzone fileType="image" onFileSelect={(file, url) => handleFileSelect(file, url, 'thumbnail')} previewUrl={uploadDetails.thumbnailUrl} accept="image/*" title={uploadType === 'link' ? "Ảnh thumbnail *" : "Ảnh thumbnail (Tùy chọn)"} description="JPG, PNG, GIF, WebP" fileName={uploadDetails.thumbnailFile?.name || null} />}
                </>
             )}

             {uploadType === 'multi' && (
                <div className="space-y-4">
                  <input type="file" multiple accept="video/*,image/*" ref={multiFileInputRef} onChange={handleMultiFileSelect} className="hidden" />
                  <button onClick={() => multiFileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-3 px-6 border-2 border-dashed border-white/20 rounded-lg hover:border-amber-400 hover:bg-white/5 transition-colors">
                    <FolderUp className="h-6 w-6" />
                    Chọn video và ảnh từ máy tính
                  </button>
                  
                  {multiUploadItems.length > 0 && (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 bg-black/20 p-3 rounded-lg border border-white/10">
                      {multiUploadItems.map((item, index) => (
                        <div key={item.id} className="bg-slate-800/80 p-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 hover:bg-slate-700/80 border border-white/10">
                            {item.type === 'image' ? (
                                <img src={item.previewUrl} alt="preview" className="w-16 h-10 rounded object-cover flex-shrink-0 bg-slate-900" />
                            ) : (
                                <div className="w-16 h-10 rounded bg-black flex items-center justify-center flex-shrink-0">
                                    <VideoIcon className="h-6 w-6 text-slate-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <input
                                    type="text"
                                    placeholder="Tiêu đề *"
                                    value={item.title}
                                    onChange={(e) => handleTitleChange(index, e.target.value)}
                                    className="w-full text-sm font-semibold text-white bg-transparent border-b border-white/20 focus:border-amber-400 outline-none transition pb-1"
                                />
                                <p className="text-xs text-slate-400 mt-1 truncate">
                                    {item.file.name} · <span className="font-medium">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </p>
                            </div>
                            <button onClick={() => removeMultiUploadItem(item)} className="p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-white rounded-full transition-colors flex-shrink-0">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             )}
            
            <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 bg-yellow-900/30 text-yellow-200 border border-yellow-700/50 rounded-lg p-3 text-sm"><AlertTriangle className="h-8 w-8 flex-shrink-0 mt-1" /><span>Nội dung của bạn sẽ được gửi cho Admin để xem xét trước khi được đăng công khai.</span></div>
                <button onClick={handleUploadClick} disabled={uploading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black py-3 px-6 rounded-lg font-semibold text-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/20"><Upload className="h-6 w-6" />{uploading ? 'Đang gửi...' : 'Gửi để xét duyệt'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserUploadPanel;