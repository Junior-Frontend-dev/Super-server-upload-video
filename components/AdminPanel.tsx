import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Settings, FileVideo, Upload, Trash2, LogOut, CheckCircle, XCircle, Clock, Link as LinkIcon, Video as VideoIcon, KeyRound, Film, Hourglass, Users, ShieldCheck, ShieldOff, UserX, MessageSquareWarning, ThumbsUp, ThumbsDown, Image as ImageIcon, Layers, FolderUp, X, LayoutDashboard, Megaphone, Edit, Search, UserPlus, AlertTriangle, Crown } from 'lucide-react';
import { Video, UploadPayload, User } from '../types';
import VideoCard from './VideoCard';
import Dropzone from './Dropzone';

interface AdminPanelProps {
  currentUser: User | null;
  users: User[];
  videos: Video[];
  pendingVideos: Video[];
  onUpload: (uploadData: UploadPayload) => Promise<void>;
  onDelete: (videoId: number) => void;
  onPlayVideo: (video: Video) => void;
  onSwitchToUserView: () => void;
  onLogout: () => void;
  onApproveVideo: (videoId: number) => void;
  onRejectVideo: (videoId: number) => void;
  onVerifyUser: (userId: number, verify: boolean) => void;
  onBanUser: (userId: number, ban: boolean) => void;
  onTierChange: (userId: number, tier: 'Normal' | 'Vip' | 'SVip') => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onEditVideo: (video: Video) => void;
  siteAnnouncement: string;
  onSetAnnouncement: (announcement: string) => void;
}

interface MultiUploadItem {
  id: number;
  file: File;
  title: string;
  previewUrl: string;
  type: 'video' | 'image';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, users, videos, pendingVideos, onUpload, onDelete, onPlayVideo, onSwitchToUserView, onLogout, onApproveVideo, onRejectVideo, onVerifyUser, onBanUser, onTierChange, showToast, onEditVideo, siteAnnouncement, onSetAnnouncement }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'users' | 'moderation' | 'settings'>('dashboard');
  const [uploadType, setUploadType] = useState<'video' | 'image' | 'link' | 'multi'>('video');
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(0);

  const [multiUploadItems, setMultiUploadItems] = useState<MultiUploadItem[]>([]);
  const [uploadDetails, setUploadDetails] = useState({
    title: '', 
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    videoUrl: null as string | null, // for preview
    thumbnailUrl: null as string | null, // for preview
    externalUrl: '', 
    tier: 'Normal' as 'Normal' | 'Vip' | 'SVip', 
    password: ''
  });
  
  const [uploading, setUploading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [announcementText, setAnnouncementText] = useState(siteAnnouncement);

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
        externalUrl: '',
        tier: 'Normal', 
        password: ''
    });
    setMultiUploadItems([]);
    if (multiFileInputRef.current) {
        multiFileInputRef.current.value = '';
    }
  }, [uploadDetails.videoUrl, uploadDetails.thumbnailUrl]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        if (uploadDetails.videoUrl) URL.revokeObjectURL(uploadDetails.videoUrl);
        if (uploadDetails.thumbnailUrl) URL.revokeObjectURL(uploadDetails.thumbnailUrl);
    };
  }, [uploadDetails.videoUrl, uploadDetails.thumbnailUrl]);

  const handleUploadClick = async () => {
    if (uploadType === 'multi') {
        if (multiUploadItems.length === 0) {
            showToast('Vui lòng chọn ít nhất một file để upload.', 'error'); return;
        }
        const hasEmptyTitle = multiUploadItems.some(item => !item.title.trim());
        if (hasEmptyTitle) {
            showToast('Vui lòng điền tiêu đề cho tất cả các file.', 'error'); return;
        }
        if ((uploadDetails.tier === 'Vip' || uploadDetails.tier === 'SVip') && !uploadDetails.password?.trim()) {
            showToast('Vui lòng nhập mật khẩu cho tier VIP/SVIP.', 'error'); return;
        }

        setUploading(true);
        try {
            for (const item of multiUploadItems) {
                const uploadData: UploadPayload = {
                    title: item.title,
                    type: item.type,
                    videoFile: item.file,
                    thumbnailFile: null, // Multi-upload doesn't support separate thumbnails for simplicity
                    externalUrl: '',
                    tier: uploadDetails.tier,
                    password: uploadDetails.password,
                };
                await onUpload(uploadData);
            }
            showToast(`Upload thành công ${multiUploadItems.length} mục!`, 'success');
            clearUploadState();
        } catch (error) {
            showToast('Có lỗi xảy ra khi upload hàng loạt', 'error'); console.error('Multi-upload error:', error);
        } finally {
            setUploading(false);
        }
        return;
    }
    
    if (uploadType === 'video' && (!uploadDetails.title.trim() || !uploadDetails.videoFile)) {
      showToast('Vui lòng điền tiêu đề và chọn file video.', 'error'); return;
    }
    if (uploadType === 'image' && (!uploadDetails.title.trim() || !uploadDetails.videoFile)) {
        showToast('Vui lòng điền tiêu đề và chọn file ảnh.', 'error'); return;
    }
    if (uploadType === 'link' && (!uploadDetails.title.trim() || !uploadDetails.externalUrl.trim() || !uploadDetails.thumbnailFile)) {
      showToast('Vui lòng điền tiêu đề, URL và chọn thumbnail.', 'error'); return;
    }
    if ((uploadDetails.tier === 'Vip' || uploadDetails.tier === 'SVip') && !uploadDetails.password?.trim()) {
      showToast('Vui lòng nhập mật khẩu cho tier VIP/SVIP.', 'error'); return;
    }

    setUploading(true);
    try {
      const uploadData: UploadPayload = {
        title: uploadDetails.title,
        videoFile: uploadDetails.videoFile,
        thumbnailFile: uploadDetails.thumbnailFile,
        type: uploadType,
        externalUrl: uploadDetails.externalUrl,
        tier: uploadDetails.tier,
        password: uploadDetails.password,
      };
      await onUpload(uploadData);
      clearUploadState();
      showToast('Upload thành công!', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi upload', 'error'); console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

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

    if (e.target) e.target.value = '';
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    setMultiUploadItems(prev => prev.map((item, i) => i === index ? { ...item, title: newTitle } : item));
  };

  const removeMultiUploadItem = (itemToRemove: MultiUploadItem) => {
    URL.revokeObjectURL(itemToRemove.previewUrl);
    setMultiUploadItems(prev => prev.filter((item) => item.id !== itemToRemove.id));
  };
  
  const handleSaveSettings = () => {
    onSetAnnouncement(announcementText);
    showToast('Cài đặt đã được lưu!', 'success');
  };

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users;
    const lowercasedQuery = userSearchQuery.toLowerCase();
    return users.filter(user => 
        user.displayName.toLowerCase().includes(lowercasedQuery) ||
        user.username.toLowerCase().includes(lowercasedQuery)
    );
  }, [users, userSearchQuery]);
    
  type TabName = 'dashboard' | 'content' | 'users' | 'moderation' | 'settings';
  const TabButton: React.FC<{ tabName: TabName, label: string, icon: React.ReactNode, count?: number }> = ({ tabName, label, icon, count }) => (
    <button onClick={() => setActiveTab(tabName)} className={`py-3 px-6 font-semibold text-base transition-all duration-300 flex items-center gap-2.5 relative border-b-2 ${activeTab === tabName ? 'text-amber-400 border-amber-400' : 'text-slate-400 hover:text-white border-transparent'}`}>
      {icon} {label}
      {count !== undefined && count > 0 && (
        <span className="absolute top-1.5 right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-black bg-amber-400 rounded-full">{count}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-8xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Settings className="text-amber-400" />Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <button onClick={onSwitchToUserView} className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors shadow-sm font-semibold">Chế độ người dùng</button>
              <button onClick={onLogout} className="px-5 py-2.5 bg-red-600/80 border border-red-500/50 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md flex items-center gap-2"><LogOut className="h-5 w-5" />Đăng xuất</button>
            </div>
        </header>

        <div className="border-b border-white/10 flex flex-wrap">
          <TabButton tabName="dashboard" label="Dashboard" icon={<LayoutDashboard className="h-5 w-5"/>} />
          <TabButton tabName="content" label="Nội dung" icon={<FileVideo className="h-5 w-5"/>} />
          <TabButton tabName="moderation" label="Kiểm duyệt" icon={<MessageSquareWarning className="h-5 w-5"/>} count={pendingVideos.length} />
          <TabButton tabName="users" label="Người dùng" icon={<Users className="h-5 w-5"/>} />
          <TabButton tabName="settings" label="Cài đặt" icon={<Settings className="h-5 w-5"/>} />
        </div>

        {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-down">
                <div className="lg:col-span-2 space-y-8">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg flex items-center gap-4 border border-white/10"><div className="p-3 bg-amber-500/10 rounded-lg"><Film className="h-8 w-8 text-amber-400"/></div><div><h3 className="text-slate-400 text-sm font-medium">Total Content</h3><p className="text-3xl font-bold text-white">{videos.length}</p></div></div>
                        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg flex items-center gap-4 border border-white/10"><div className="p-3 bg-green-500/10 rounded-lg"><Users className="h-8 w-8 text-green-400"/></div><div><h3 className="text-slate-400 text-sm font-medium">Registered Users</h3><p className="text-3xl font-bold text-white">{users.length}</p></div></div>
                        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg flex items-center gap-4 border border-white/10"><div className="p-3 bg-yellow-500/10 rounded-lg"><Hourglass className="h-8 w-8 text-yellow-400"/></div><div><h3 className="text-slate-400 text-sm font-medium">Pending Approvals</h3><p className="text-3xl font-bold text-white">{pendingVideos.length}</p></div></div>
                        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg flex items-center gap-4 border border-white/10"><div className="p-3 bg-red-500/10 rounded-lg"><MessageSquareWarning className="h-8 w-8 text-red-400"/></div><div><h3 className="text-slate-400 text-sm font-medium">Pending Comments</h3><p className="text-3xl font-bold text-white">0</p></div></div>
                    </div>

                    {/* Top Content */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Top Content</h2>
                        <div className="space-y-4">
                            {videos.slice().sort((a,b) => b.views - a.views).slice(0, 3).map(video => (
                                <div key={video.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5">
                                    <img src={video.thumbnailUrl || ''} alt={video.title} className="w-24 h-14 rounded-md object-cover flex-shrink-0 bg-slate-700" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white line-clamp-1">{video.title}</h3>
                                        <p className="text-sm text-slate-400">{video.views.toLocaleString()} views</p>
                                    </div>
                                    <button onClick={() => onPlayVideo(video)} className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 font-semibold text-sm">View</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button onClick={() => setActiveTab('content')} className="w-full text-left p-3 bg-white/5 hover:bg-amber-500/10 rounded-lg font-semibold text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-3"><Upload className="h-5 w-5"/> Upload New Content</button>
                            <button onClick={() => setActiveTab('moderation')} className="w-full text-left p-3 bg-white/5 hover:bg-amber-500/10 rounded-lg font-semibold text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-3"><Clock className="h-5 w-5"/> Review Pending Videos</button>
                            <button onClick={() => setActiveTab('users')} className="w-full text-left p-3 bg-white/5 hover:bg-amber-500/10 rounded-lg font-semibold text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-3"><Users className="h-5 w-5"/> Manage Users</button>
                        </div>
                    </div>
                    {/* Recent Activity */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                        <div className="space-y-4">
                            {users.slice(-3).reverse().map(user => (
                                <div key={`user-${user.id}`} className="flex items-center gap-3 text-sm">
                                    <UserPlus className="h-5 w-5 text-green-400 flex-shrink-0"/>
                                    <p className="text-slate-400"><span className="font-semibold text-white">{user.displayName}</span> has registered.</p>
                                </div>
                            ))}
                             {videos.slice(0, 3).map(video => (
                                <div key={`video-${video.id}`} className="flex items-center gap-3 text-sm">
                                    <FileVideo className="h-5 w-5 text-amber-400 flex-shrink-0"/>
                                    <p className="text-slate-400"><span className="font-semibold text-white">{video.title}</span> was uploaded.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
           </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-8 animate-fade-in-down">
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Upload className="text-amber-400" /> Upload nội dung</h2>
              <div className="mb-6 p-1 bg-black/20 rounded-lg flex gap-1.5 max-w-xl border border-white/10"><button onClick={() => { setUploadType('video'); clearUploadState(); }} className={`w-1/4 py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'video' ? 'bg-amber-500 text-black shadow' : 'text-slate-300 hover:bg-white/5'}`}> <VideoIcon className="h-5 w-5"/> Video </button><button onClick={() => { setUploadType('image'); clearUploadState(); }} className={`w-1/4 py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'image' ? 'bg-amber-500 text-black shadow' : 'text-slate-300 hover:bg-white/5'}`}> <ImageIcon className="h-5 w-5"/> Ảnh </button><button onClick={() => { setUploadType('link'); clearUploadState(); }} className={`w-1/4 py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'link' ? 'bg-amber-500 text-black shadow' : 'text-slate-300 hover:bg-white/5'}`}> <LinkIcon className="h-5 w-5"/> Link </button><button onClick={() => { setUploadType('multi'); clearUploadState(); }} className={`w-1/4 py-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${uploadType === 'multi' ? 'bg-amber-500 text-black shadow' : 'text-slate-300 hover:bg-white/5'}`}> <Layers className="h-5 w-5"/> Hàng loạt </button></div>
              
              <div className="space-y-6">
                {uploadType !== 'multi' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            {uploadType === 'video' && (<Dropzone fileType="video" onFileSelect={(file, url) => handleFileSelect(file, url, 'video')} previewUrl={uploadDetails.videoUrl} accept="video/*" title="File Video *" description="MP4, AVI, MOV, WebM" fileName={uploadDetails.videoFile?.name || null} />)}
                            {uploadType === 'image' && (<Dropzone fileType="image" onFileSelect={(file, url) => handleFileSelect(file, url, 'video')} previewUrl={uploadDetails.videoUrl} accept="image/*" title="File Ảnh *" description="JPG, PNG, GIF, WebP" fileName={uploadDetails.videoFile?.name || null} />)}
                            {uploadType === 'link' && (<div><label className="block text-sm font-medium text-slate-300 mb-2">URL liên kết *</label><input type="url" value={uploadDetails.externalUrl} onChange={(e) => setUploadDetails(prev => ({...prev, externalUrl: e.target.value}))} className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition bg-white/5 text-white" placeholder="https://example.com" /></div>)}
                            
                            {uploadType !== 'image' && <Dropzone fileType="image" onFileSelect={(file, url) => handleFileSelect(file, url, 'thumbnail')} previewUrl={uploadDetails.thumbnailUrl} accept="image/*" title={uploadType === 'link' ? "Ảnh thumbnail *" : "Ảnh thumbnail (Tùy chọn)"} description="JPG, PNG, GIF, WebP" fileName={uploadDetails.thumbnailFile?.name || null} />}
                        </div>
                        <div className="lg:col-span-2 space-y-6 flex flex-col">
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Tiêu đề *</label><input type="text" value={uploadDetails.title} onChange={(e) => setUploadDetails(prev => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition bg-white/5 text-white" placeholder="Nhập tiêu đề..." maxLength={100} /></div>
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Tier</label><div className="flex gap-2">{(['Normal', 'Vip', 'SVip'] as const).map(tier => (<button key={tier} type="button" onClick={() => setUploadDetails(prev => ({...prev, tier}))} className={`px-4 py-2 rounded-lg font-medium transition-colors ${uploadDetails.tier === tier ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>{tier}</button>))}</div></div>
                            {(uploadDetails.tier === 'Vip' || uploadDetails.tier === 'SVip') && (<div><label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><KeyRound className="h-4 w-4"/> Mật khẩu *</label><input type="text" value={uploadDetails.password} onChange={(e) => setUploadDetails(prev => ({ ...prev, password: e.target.value }))} className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition bg-white/5 text-white" placeholder="Nhập mật khẩu..." /></div>)}
                            <div className="flex-grow"></div>
                            <div className="space-y-3"><button onClick={handleUploadClick} disabled={uploading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black py-3 px-6 rounded-lg font-semibold text-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/20"><Upload className="h-6 w-6" /> {uploading ? 'Đang upload...' : 'Upload Nội dung'} </button><button onClick={clearUploadState} className="w-full bg-white/10 text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-white/20 transition-colors"> Xóa tất cả </button></div>
                        </div>
                    </div>
                )}
                {uploadType === 'multi' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <input type="file" multiple accept="video/*,image/*" ref={multiFileInputRef} onChange={handleMultiFileSelect} className="hidden" />
                            <button type="button" onClick={() => multiFileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-4 px-6 border-2 border-dashed border-white/20 rounded-lg hover:border-amber-400 hover:bg-white/5 transition-colors">
                                <FolderUp className="h-8 w-8 text-slate-500" />
                                <div>
                                    <p className="font-semibold text-slate-200">Chọn video và ảnh</p>
                                    <p className="text-sm text-slate-400">Bạn có thể chọn nhiều file cùng lúc</p>
                                </div>
                            </button>
                            {multiUploadItems.length > 0 && (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 bg-black/20 p-3 rounded-lg border border-white/10">
                                    <h3 className="font-semibold text-slate-300 px-1 pb-1">Các file đã chọn ({multiUploadItems.length})</h3>
                                    {multiUploadItems.map((item, index) => (
                                        <div key={item.id} className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:border-amber-400">
                                            {item.type === 'image' ? (
                                                <img src={item.previewUrl} alt="preview" className="w-16 h-10 rounded object-cover flex-shrink-0 bg-slate-700" />
                                            ) : (
                                                <div className="w-16 h-10 rounded bg-black flex items-center justify-center flex-shrink-0">
                                                    <VideoIcon className="h-6 w-6 text-white/80" />
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
                                                <p className="text-xs text-slate-500 mt-1 truncate">
                                                    {item.file.name} · <span className="font-medium">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </p>
                                            </div>
                                            <button onClick={() => removeMultiUploadItem(item)} className="p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 rounded-full flex-shrink-0 transition-colors">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-2 space-y-6 flex flex-col bg-slate-800/50 border border-white/10 p-6 rounded-xl">
                            <h3 className="font-semibold text-lg text-white">Cài đặt hàng loạt</h3>
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Tier</label><div className="flex gap-2">{(['Normal', 'Vip', 'SVip'] as const).map(tier => (<button key={tier} type="button" onClick={() => setUploadDetails(prev => ({...prev, tier}))} className={`px-4 py-2 rounded-lg font-medium transition-colors ${uploadDetails.tier === tier ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>{tier}</button>))}</div></div>
                            {(uploadDetails.tier === 'Vip' || uploadDetails.tier === 'SVip') && (<div><label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><KeyRound className="h-4 w-4"/> Mật khẩu *</label><input type="text" value={uploadDetails.password} onChange={(e) => setUploadDetails(prev => ({ ...prev, password: e.target.value }))} className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition bg-white/5 text-white" placeholder="Nhập mật khẩu..." /></div>)}
                            <div className="flex-grow"></div>
                            <div className="space-y-3">
                                <button onClick={handleUploadClick} disabled={uploading || multiUploadItems.length === 0} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black py-3 px-6 rounded-lg font-semibold text-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/20"><Upload className="h-6 w-6" /> {uploading ? 'Đang upload...' : `Upload (${multiUploadItems.length}) mục`} </button>
                                <button onClick={clearUploadState} className="w-full bg-white/10 text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-white/20 transition-colors"> Xóa tất cả </button>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            </div>
            
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6 md:p-8"><h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"> <FileVideo className="text-amber-400" /> Quản lý nội dung ({videos.length}) </h2>{videos.length === 0 ? (<div className="text-center py-16"><FileVideo className="h-24 w-24 text-slate-700 mx-auto mb-4" /> <p className="text-slate-500 text-lg">Chưa có nội dung nào</p> </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">{videos.map(video => (<div key={video.id} className="bg-slate-900/50 rounded-lg overflow-hidden border border-white/10 group relative transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"><VideoCard video={video} onPlay={onPlayVideo} currentUser={currentUser}/>
            {video.moderationStatus === 'flagged' && (
                <div className="absolute top-2 left-2 z-10 p-1.5 bg-red-600/90 rounded-full backdrop-blur-sm shadow-lg" title={`AI Flagged: ${video.classification} - ${video.moderationReason}`}>
                    <AlertTriangle className="h-4 w-4 text-white" />
                </div>
            )}
            <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><button onClick={() => onEditVideo(video)} className="bg-blue-600/80 backdrop-blur-md text-white p-2 rounded-full hover:bg-blue-600" title="Sửa"><Edit className="h-4 w-4" /></button><button onClick={() => onDelete(video.id)} className="bg-red-600/80 backdrop-blur-md text-white p-2 rounded-full hover:bg-red-600" title="Xóa"> <Trash2 className="h-4 w-4" /> </button></div><div className="p-3"><h3 className="font-semibold line-clamp-2 text-white">{video.title}</h3><p className="text-sm text-slate-400 mt-1">{video.uploadDate}</p></div></div>))}</div>)}</div>
          </div>
        )}

        {activeTab === 'moderation' && (
            <div className="space-y-8 animate-fade-in-down">
                <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"> <Clock className="text-yellow-400" /> Nội dung chờ duyệt ({pendingVideos.length}) </h2>
                    {pendingVideos.length > 0 ? 
                        (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">{pendingVideos.map(video => (<div key={video.id} className="bg-slate-900/50 rounded-lg overflow-hidden border border-white/10 group relative transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1">
                            <VideoCard video={video} onPlay={onPlayVideo} isUserView={false} isAdminReviewing={true} currentUser={currentUser} />
                            {video.moderationStatus === 'flagged' && (
                                <div className="absolute top-2 left-2 z-10 p-1.5 bg-red-600/90 rounded-full backdrop-blur-sm shadow-lg" title={`AI Flagged: ${video.classification} - ${video.moderationReason}`}>
                                    <AlertTriangle className="h-4 w-4 text-white" />
                                </div>
                            )}
                        <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onApproveVideo(video.id)} className="bg-green-600/80 backdrop-blur-md text-white p-2 rounded-full hover:bg-green-600 shadow-md" title="Duyệt"><CheckCircle className="h-5 w-5" /></button><button onClick={() => onRejectVideo(video.id)} className="bg-red-600/80 backdrop-blur-md text-white p-2 rounded-full hover:bg-red-600 shadow-md" title="Từ chối"><XCircle className="h-5 w-5" /></button></div><div className="p-3"><h3 className="font-semibold line-clamp-2 text-white">{video.title}</h3><p className="text-sm text-slate-400 mt-1">{video.uploadDate}</p></div></div>))}</div>
                        ) : (
                        <div className="text-center py-16">
                            <CheckCircle className="h-24 w-24 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">Không có nội dung nào chờ duyệt.</p>
                        </div>
                        )
                    }
                </div>
            </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-down">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Users className="text-amber-400" /> Quản lý người dùng ({users.length})</h2>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500"/>
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-400 outline-none transition"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold text-slate-400">User</th>
                    <th className="p-4 font-semibold text-slate-400">Username</th>
                    <th className="p-4 font-semibold text-slate-400">Tier</th>
                    <th className="p-4 font-semibold text-slate-400">Status</th>
                    <th className="p-4 font-semibold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="relative">
                            <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
                            {user.username === 'admin' ? (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2" title="Admin">
                                    <Crown className="h-5 w-5 text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.7))' }} />
                                </div>
                            ) : user.tier === 'SVip' ? (
                                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full text-[10px] font-bold text-white border-2 border-slate-800 svip-badge-glow" title="SVIP User">
                                    SVIP
                                </div>
                            ) : user.tier === 'Vip' ? (
                                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full text-[10px] font-bold text-white border-2 border-slate-800 vip-badge-glow" title="VIP User">
                                    VIP
                                </div>
                            ) : null}
                        </div>
                        <span className="font-medium text-white">{user.displayName}</span>
                      </td>
                      <td className="p-4 text-slate-400">@{user.username}</td>
                      <td className="p-4">
                        <select
                          value={user.tier}
                          onChange={(e) => onTierChange(user.id, e.target.value as 'Normal' | 'Vip' | 'SVip')}
                          className="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition bg-white/5 text-white"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Vip">Vip</option>
                          <option value="SVip">SVip</option>
                        </select>
                      </td>
                      <td className="p-4"><div className="flex items-center gap-2">{user.isBanned && <span className="px-2 py-1 text-xs font-medium text-red-300 bg-red-500/20 rounded-full">Banned</span>}{user.isVerified && <span className="px-2 py-1 text-xs font-medium text-blue-300 bg-blue-500/20 rounded-full">Verified</span>}</div></td>
                      <td className="p-4"><div className="flex items-center gap-2">
                          {user.isVerified ? (<button onClick={() => onVerifyUser(user.id, false)} className="p-2 bg-yellow-500/10 text-yellow-400 rounded-full hover:bg-yellow-500/20" title="Unverify"><ShieldOff className="h-5 w-5"/></button>) : (<button onClick={() => onVerifyUser(user.id, true)} className="p-2 bg-green-500/10 text-green-400 rounded-full hover:bg-green-500/20" title="Verify"><ShieldCheck className="h-5 w-5"/></button>)}
                          {user.isBanned ? (<button onClick={() => onBanUser(user.id, false)} className="p-2 bg-slate-600 text-slate-300 rounded-full hover:bg-slate-500" title="Unban"><CheckCircle className="h-5 w-5"/></button>) : (<button onClick={() => onBanUser(user.id, true)} className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20" title="Ban"><UserX className="h-5 w-5"/></button>)}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
             <div className="bg-slate-800/50 border border-white/10 rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-down">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Megaphone className="text-amber-400" /> Thông báo chung</h2>
                <div className="space-y-4 max-w-2xl">
                    <p className="text-slate-400">Tạo một thông báo sẽ được hiển thị cho tất cả người dùng trên trang chủ. Để trống để tắt thông báo.</p>
                    <div>
                        <label htmlFor="announcement" className="block text-sm font-medium text-slate-300 mb-2">Nội dung thông báo</label>
                        <textarea
                            id="announcement"
                            rows={4}
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition bg-white/5 text-white"
                            placeholder="Ví dụ: Bảo trì hệ thống vào lúc 2 giờ sáng..."
                        />
                    </div>
                     {announcementText && (
                        <div>
                            <p className="text-sm font-medium text-slate-300 mb-2">Xem trước:</p>
                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg p-4 flex items-center gap-4">
                                <Megaphone className="h-6 w-6 flex-shrink-0" />
                                <p className="text-sm font-medium">{announcementText}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors shadow-md font-semibold flex items-center gap-2">
                           Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;