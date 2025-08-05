
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Video, UploadPayload, Comment, User } from './types';
import AdminPanel from './components/AdminPanel';
import UserView from './components/UserView';
import WatchPage from './components/VideoPlayer'; // Renamed conceptually to WatchPage
import PasswordPrompt from './components/PasswordPrompt';
import UserUploadPanel from './components/UserUploadPanel';
import UserProfilePage from './components/UserProfilePage';
import EditProfileModal from './components/EditProfileModal';
import { performAiSearch, moderateUploadedContent, generateKeywords, generateSceneTags, addApiKeyListener } from './services/geminiService';
import { AlertTriangle, CheckCircle, Info, X, Search, Bot, Sparkles, ServerCrash } from 'lucide-react';
import UserAuth from './components/UserAuth';
import EditVideoModal from './components/EditVideoModal';
import TierBenefitsModal from './components/TierBenefitsModal';


// A simple hashing function for demonstration. In a real app, use a robust library like bcrypt.
const simpleHash = async (text: string) => {
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

let nextIdCounter = Date.now();
const getUniqueId = () => nextIdCounter++;

type ToastType = 'success' | 'error' | 'info';
interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

type AppView = { type: 'USER_VIEW' } | { type: 'ADMIN_PANEL' } | { type: 'PROFILE_PAGE', userId: number };
export type FilterType = 'all' | 'video' | 'image' | 'link';

const Toast = ({ message, type, onDismiss }: { message: string, type: ToastType, onDismiss: () => void }) => {
  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-400" />,
    error: <AlertTriangle className="h-6 w-6 text-red-400" />,
    info: <Info className="h-6 w-6 text-blue-400" />,
  };
  
  const colors = {
    success: 'border-green-500/50',
    error: 'border-red-500/50',
    info: 'border-blue-500/50',
  };

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`animate-toast-in max-w-sm w-full bg-slate-800/50 backdrop-blur-xl shadow-2xl rounded-xl pointer-events-auto ring-1 ring-white/10 overflow-hidden border-l-4 ${colors[type]}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-slate-100">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button onClick={onDismiss} className="rounded-full p-1 inline-flex text-slate-400 hover:text-slate-100 hover:bg-white/10 focus:outline-none transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApiKeyWarningBanner = () => (
    <div className="bg-red-900/50 border-b border-red-500/30 text-red-200 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
        <ServerCrash className="h-5 w-5 flex-shrink-0" />
        <span>Không thể kết nối đến Gemini. Khóa API bị thiếu hoặc không hợp lệ. Các tính năng AI sẽ bị vô hiệu hóa.</span>
    </div>
);


const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [pendingVideos, setPendingVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoAwaitingPassword, setVideoAwaitingPassword] = useState<Video | null>(null);
  const [showUserUpload, setShowUserUpload] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [userInteractions, setUserInteractions] = useState<Record<number, 'liked' | 'disliked'>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [view, setView] = useState<AppView>({ type: 'USER_VIEW' });
  const [searchQuery, setSearchQuery] = useState('');
  const [siteAnnouncement, setSiteAnnouncement] = useState('Trang web đang trong giai đoạn thử nghiệm. Một số tính năng có thể thay đổi.');
  
  const [aiSearchResults, setAiSearchResults] = useState<Video[] | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [apiKeyError, setApiKeyError] = useState(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToasts(prev => [...prev, { id: getUniqueId(), message, type }]);
  }, []);
  
  // App Initialization (No localStorage)
  useEffect(() => {
    addApiKeyListener(() => setApiKeyError(true));

    const initializeApp = async () => {
        const vipPasswordHash = await simpleHash('password');
        const svipPasswordHash = await simpleHash('password');
        const initialUsers: User[] = [
            { 
                id: getUniqueId(), 
                username: 'vipuser', 
                passwordHash: vipPasswordHash, 
                likedVideoIds: [], 
                displayName: 'VIP Member', 
                avatarUrl: 'https://api.dicebear.com/8.x/adventurer/svg?seed=vipuser&backgroundColor=b6e3f4', 
                isVerified: true, 
                isBanned: false, 
                tier: 'Vip',
                profileBannerUrl: 'https://images.unsplash.com/photo-1554034483-043b355799a2?q=80&w=1280&auto=format&fit=crop',
                watchHistory: [],
                preferences: { trackHistory: true },
                commentStyle: { color: '#38bdf8' } // sky-400
            },
            { 
                id: getUniqueId(), 
                username: 'svipuser', 
                passwordHash: svipPasswordHash, 
                likedVideoIds: [], 
                displayName: 'Super VIP', 
                avatarUrl: 'https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=svipuser&backgroundColor=f472b6', 
                isVerified: true, 
                isBanned: false, 
                tier: 'SVip',
                profileBannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3a8034?q=80&w=1280&auto=format&fit=crop',
                watchHistory: [],
                preferences: { trackHistory: true },
                commentStyle: { gradient: { from: '#ec4899', to: '#f9a8d4' } } // pink-500 to pink-300
            },
        ];
        setUsers(initialUsers);
    };

    initializeApp();

    // Cleanup blob URLs on component unmount
    return () => {
        videos.forEach(revokeBlobUrls);
        pendingVideos.forEach(revokeBlobUrls);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setAiSearchResults(null);
    }
  }, [searchQuery]);

  // Reset selected video and AI search when view changes
  useEffect(() => {
      setSelectedVideo(null);
      setAiSearchResults(null);
      setSearchQuery('');
  }, [view]);


  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const updateUserState = (userId: number, updateFn: (user: User) => Partial<User>) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updateFn(u) } : u));
    if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...updateFn(prev) } : null);
    }
  };

  const updateVideo = useCallback((videoId: number, updateFn: (video: Video) => Partial<Video>) => {
    const updater = (prevVideos: Video[]) => prevVideos.map(v => v.id === videoId ? { ...v, ...updateFn(v) } : v);
    setVideos(updater);
    setPendingVideos(updater);
    if(selectedVideo && selectedVideo.id === videoId){
       setSelectedVideo(prev => prev ? {...prev, ...updateFn(prev)}: null);
    }
    if(editingVideo && editingVideo.id === videoId) {
       setEditingVideo(prev => prev ? {...prev, ...updateFn(prev)}: null);
    }
  }, [selectedVideo, editingVideo]);
  
  const handleUpdateVideoDetails = (videoId: number, updates: Partial<Video>) => {
    updateVideo(videoId, () => updates);
    showToast('Video updated successfully!', 'success');
    setEditingVideo(null);
  };
  
  const recordView = useCallback((video: Video) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    updateVideo(video.id, v => {
        const newAnalytics = v.analytics || { viewsByDate: {} };
        newAnalytics.viewsByDate[today] = (newAnalytics.viewsByDate[today] || 0) + 1;
        return { 
            views: v.views + 1,
            analytics: newAnalytics,
        };
    });

    if (currentUser && (currentUser.tier === 'Vip' || currentUser.tier === 'SVip') && currentUser.preferences?.trackHistory) {
        updateUserState(currentUser.id, u => {
            const history = u.watchHistory || [];
            const updatedHistory = [video.id, ...history.filter(id => id !== video.id)];
            return { watchHistory: updatedHistory.slice(0, 50) };
        });
    }
  }, [currentUser, updateVideo]);

  const handleAdminUpload = useCallback(async (upload: UploadPayload) => {
    if (!currentUser) return;
    
    const { title, videoFile, thumbnailFile, type, externalUrl, tier, password } = upload;

    const moderationResult = await moderateUploadedContent(title);
    const keywords = await generateKeywords(title);
    
    const videoUrl = videoFile ? URL.createObjectURL(videoFile) : undefined;
    const isImageUpload = type === 'image' && videoFile;
    // For image uploads, the 'videoFile' is the image itself, so thumbnail is the same.
    const thumbnailUrl = isImageUpload ? videoUrl : (thumbnailFile ? URL.createObjectURL(thumbnailFile) : null);
    
    const newVideo: Video = {
      id: getUniqueId(),
      title: title.trim(),
      type,
      videoUrl,
      imageUrl: isImageUpload ? videoUrl : undefined,
      externalUrl,
      thumbnailUrl,
      filePath: videoFile ? `/uploads/${Date.now()}-${videoFile.name}` : undefined,
      likes: 0, dislikes: 0, views: 0,
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      status: 'approved',
      uploaderId: currentUser.id,
      uploaderName: currentUser.displayName,
      uploaderAvatarUrl: currentUser.avatarUrl,
      isUploaderVerified: currentUser.isVerified,
      tier: tier || 'Normal',
      password,
      comments: [],
      aiKeywords: keywords,
      moderationStatus: moderationResult.isSafe ? null : 'flagged',
      moderationReason: moderationResult.reason,
      classification: moderationResult.classification,
      analytics: { viewsByDate: {} }
    };
    setVideos(prev => [newVideo, ...prev]);

    if (!moderationResult.isSafe) {
        showToast(`AI Flagged: "${newVideo.title}" as ${moderationResult.classification}.`, 'info');
    }
  }, [currentUser, showToast]);

  const handleUserUpload = useCallback(async (upload: Omit<UploadPayload, 'tier' | 'password'>) => {
    if(!currentUser) return;

    const { title, videoFile, thumbnailFile, type, externalUrl } = upload;

    const moderationResult = await moderateUploadedContent(title);
    
    const videoUrl = videoFile ? URL.createObjectURL(videoFile) : undefined;
    const isImageUpload = type === 'image' && videoFile;
    const thumbnailUrl = isImageUpload ? videoUrl : (thumbnailFile ? URL.createObjectURL(thumbnailFile) : null);

    const newVideo: Video = {
      id: getUniqueId(),
      title: title.trim(),
      type,
      videoUrl,
      imageUrl: isImageUpload ? videoUrl : undefined,
      externalUrl,
      thumbnailUrl,
      filePath: videoFile ? `/uploads/${Date.now()}-${videoFile.name}` : undefined,
      likes: 0, dislikes: 0, views: 0,
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      status: 'pending',
      uploaderId: currentUser.id,
      uploaderName: currentUser.displayName,
      uploaderAvatarUrl: currentUser.avatarUrl,
      isUploaderVerified: currentUser.isVerified,
      tier: 'Normal',
      comments: [],
      moderationStatus: moderationResult.isSafe ? null : 'flagged',
      moderationReason: moderationResult.reason,
      classification: moderationResult.classification,
      analytics: { viewsByDate: {} }
    };

    if (!moderationResult.isSafe) {
        showToast(`Nội dung đã được gắn cờ AI để xem xét thêm: ${moderationResult.reason}`, 'info');
    }

    setPendingVideos(prev => [newVideo, ...prev]);
  }, [currentUser, showToast]);

  const approveVideo = useCallback(async (videoId: number) => {
    const videoToApprove = pendingVideos.find(v => v.id === videoId);
    if(videoToApprove) {
      const keywords = await generateKeywords(videoToApprove.title);
      setVideos(prev => [{ ...videoToApprove, status: 'approved', aiKeywords: keywords }, ...prev]);
      setPendingVideos(prev => prev.filter(v => v.id !== videoId));
      showToast('Video đã được duyệt!', 'success');
    }
  }, [pendingVideos, showToast]);

  const revokeBlobUrls = (video: Video) => {
    if (video.videoUrl && video.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(video.videoUrl);
    }
    if (video.thumbnailUrl && video.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(video.thumbnailUrl);
    }
    // imageUrl is the same as videoUrl for image uploads
  };

  const rejectVideo = useCallback((videoId: number) => {
     const videoToReject = pendingVideos.find(v => v.id === videoId);
     if (videoToReject) {
        revokeBlobUrls(videoToReject);
        setPendingVideos(prev => prev.filter(v => v.id !== videoId));
        showToast('Video đã bị từ chối.', 'info');
     }
  }, [pendingVideos, showToast]);

  const deleteVideo = useCallback((videoId: number) => {
    const videoToDelete = videos.find(v => v.id === videoId) || pendingVideos.find(v => v.id === videoId);
    if (videoToDelete) {
        revokeBlobUrls(videoToDelete);
    }
    setVideos(prev => prev.filter(video => video.id !== videoId));
    setPendingVideos(prev => prev.filter(video => video.id !== videoId));
    if (selectedVideo && selectedVideo.id === videoId) setSelectedVideo(null);
    if (editingVideo && editingVideo.id === videoId) setEditingVideo(null);
    showToast('Đã xóa video.', 'success');
  }, [selectedVideo, editingVideo, showToast, videos, pendingVideos]);

  const handleInteraction = useCallback((videoId: number, type: 'like' | 'dislike' | 'view') => {
    if (type === 'view') {
        const video = videos.find(v => v.id === videoId) || pendingVideos.find(v => v.id === videoId);
        if (video) recordView(video);
        return;
    }
    if (!currentUser) {
        showToast('Bạn cần đăng nhập để thực hiện hành động này.', 'error');
        return;
    }
    const currentInteraction = userInteractions[videoId];
    const newInteractions = { ...userInteractions };
    let likesChange = 0, dislikesChange = 0;
    const desiredState = type === 'like' ? 'liked' : 'disliked';

    if (currentInteraction === desiredState) {
        delete newInteractions[videoId];
        if (type === 'like') likesChange = -1; else dislikesChange = -1;
    } else {
        if (currentInteraction === 'liked') likesChange = -1;
        if (currentInteraction === 'disliked') dislikesChange = -1;
        newInteractions[videoId] = desiredState;
        if (type === 'like') likesChange = 1; else dislikesChange = 1;
    }
    setUserInteractions(newInteractions);
    updateVideo(videoId, v => ({
        likes: Math.max(0, v.likes + likesChange),
        dislikes: Math.max(0, v.dislikes + dislikesChange),
    }));
    if (currentUser && type === 'like') {
        updateUserState(currentUser.id, u => {
            const likedIds = new Set(u.likedVideoIds || []);
            likedIds.has(videoId) ? likedIds.delete(videoId) : likedIds.add(videoId);
            return { likedVideoIds: Array.from(likedIds) };
        });
    }
  }, [userInteractions, updateVideo, currentUser, showToast, videos, pendingVideos, recordView]);

  const playVideo = useCallback((video: Video) => {
    if (video.type === 'link' && video.externalUrl) {
      window.open(video.externalUrl, '_blank', 'noopener,noreferrer');
      recordView(video);
      return;
    }

    const canBypassPassword = currentUser && (
        (video.tier === 'SVip' && currentUser.tier === 'SVip') ||
        (video.tier === 'Vip' && (currentUser.tier === 'Vip' || currentUser.tier === 'SVip'))
    );

    if ((video.tier === 'Vip' || video.tier === 'SVip') && video.password && !canBypassPassword) {
      setVideoAwaitingPassword(video);
    } else {
      recordView(video);
      setSelectedVideo(video);
    }
  }, [recordView, currentUser]);
  
  const handlePasswordSubmit = useCallback((password: string) => {
    if (videoAwaitingPassword && password === videoAwaitingPassword.password) {
      recordView(videoAwaitingPassword);
      setSelectedVideo(videoAwaitingPassword);
      setVideoAwaitingPassword(null);
    } else {
      showToast('Mật khẩu không đúng!', 'error');
    }
  }, [videoAwaitingPassword, recordView, showToast]);
  
  const handleCommentSubmit = useCallback((videoId: number, commentText: string) => {
      if (!currentUser) {
          showToast("Bạn phải đăng nhập để bình luận.", 'error');
          return;
      }
      const commenter = users.find(u => u.id === currentUser.id);
      if(!commenter) return;

      const newComment: Comment = {
          id: getUniqueId(), 
          videoId, 
          userId: commenter.id,
          username: commenter.username,
          displayName: commenter.displayName,
          avatarUrl: commenter.avatarUrl,
          isUserVerified: commenter.isVerified,
          text: commentText,
          timestamp: new Date().toISOString(),
          status: 'approved',
          moderationReason: null
      };

      updateVideo(videoId, v => ({ comments: [...(v.comments || []), newComment] }));
  }, [currentUser, users, updateVideo, showToast]);

  const handlePinComment = useCallback((videoId: number, commentId: number) => {
    updateVideo(videoId, video => {
        const comments = video.comments.map(c => ({
            ...c,
            isPinned: c.id === commentId ? !c.isPinned : false // Unpin others, toggle current
        }));
        return { comments };
    });
  }, [updateVideo]);
  
  const handleRegister = async (username: string, password: string): Promise<boolean> => {
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase()) || username.toLowerCase() === 'admin') {
        showToast("Tên người dùng đã tồn tại hoặc không hợp lệ.", 'error'); return false;
    }
    const passwordHash = await simpleHash(password);
    const newUserId = getUniqueId();
    const newUser: User = { 
        id: newUserId, 
        username, 
        passwordHash, 
        likedVideoIds: [], 
        displayName: username, 
        avatarUrl: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${newUserId}`, 
        isVerified: false, 
        isBanned: false, 
        tier: 'Normal',
        profileBannerUrl: '',
        pinnedVideoId: undefined,
        watchHistory: [],
        preferences: { trackHistory: true },
        commentStyle: {}
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    showToast(`Chào mừng ${username}!`, 'success');
    return true;
  };

  const handleUserLogin = async (username: string, password: string): Promise<boolean> => {
    if (username.toLowerCase() === 'admin' && password === 'password') {
        const adminUser: User = { id: 0, username: 'admin', passwordHash: '', likedVideoIds: [], displayName: 'Admin', avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Admin`, isVerified: true, isBanned: false, tier: 'SVip' };
        setCurrentUser(adminUser);
        setView({type: 'ADMIN_PANEL'});
        showToast('Chào mừng Admin!', 'success');
        return true;
    }
    
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
        if(user.isBanned) {
            showToast("Tài khoản của bạn đã bị khóa.", 'error'); return false;
        }
        const passwordHash = await simpleHash(password);
        if (user.passwordHash === passwordHash) {
            setCurrentUser(user);
            showToast(`Chào mừng quay trở lại, ${user.displayName}!`, 'success');
            return true;
        }
    }
    showToast("Tài khoản hoặc mật khẩu không đúng.", 'error');
    return false;
  };
  
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setView({ type: 'USER_VIEW' });
    showToast('Đã đăng xuất.', 'info');
  }, [showToast]);

  const handleProfileUpdate = useCallback((updates: Partial<User>) => {
      if(!currentUser) return;
      updateUserState(currentUser.id, (user) => ({...user, ...updates}));
      
      const updatedUser = { ...currentUser, ...updates };
      if (updates.displayName || updates.avatarUrl) {
          setVideos(prev => prev.map(v => v.uploaderId === currentUser.id ? {...v, uploaderName: updatedUser.displayName, uploaderAvatarUrl: updatedUser.avatarUrl, isUploaderVerified: currentUser.isVerified} : v));
          setPendingVideos(prev => prev.map(v => v.uploaderId === currentUser.id ? {...v, uploaderName: updatedUser.displayName, uploaderAvatarUrl: updatedUser.avatarUrl, isUploaderVerified: currentUser.isVerified} : v));
      }
      showToast('Hồ sơ đã được cập nhật!', 'success');
      setShowEditProfile(false);
  }, [currentUser, showToast, updateUserState]);

  const handleUserVerification = (userId: number, shouldVerify: boolean) => {
    updateUserState(userId, () => ({ isVerified: shouldVerify }));
    const user = users.find(u => u.id === userId);
    if(user){
      setVideos(prev => prev.map(v => v.uploaderId === userId ? {...v, isUploaderVerified: shouldVerify} : v));
      setPendingVideos(prev => prev.map(v => v.uploaderId === userId ? {...v, isUploaderVerified: shouldVerify} : v));
    }
    showToast(`Người dùng đã được ${shouldVerify ? 'xác minh' : 'bỏ xác minh'}.`, 'success');
  };

  const handleUserBan = (userId: number, shouldBan: boolean) => {
    updateUserState(userId, () => ({ isBanned: shouldBan }));
    showToast(`Người dùng đã bị ${shouldBan ? 'khóa' : 'mở khóa'}.`, 'error');
  };
  
  const handleUserTierChange = (userId: number, tier: 'Normal' | 'Vip' | 'SVip') => {
    updateUserState(userId, () => ({ tier }));
    showToast(`Cập nhật hạng người dùng thành công!`, 'success');
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) {
        showToast('Vui lòng nhập nội dung tìm kiếm.', 'info');
        return;
    }
    
    setFilterType('all');
    setSelectedVideo(null);
    setIsAiSearching(true);
    setAiSearchResults(null);
    
    try {
        const videosForSearch = videos
            .filter(v => v.status === 'approved')
            .map(v => ({ id: v.id, title: v.title, keywords: v.aiKeywords || [], filePath: v.filePath }));

        const resultIds = await performAiSearch(searchQuery, videosForSearch);

        const idToVideoMap = new Map(videos.map(v => [v.id, v]));
        const foundVideos = resultIds.map(id => idToVideoMap.get(id)).filter(Boolean) as Video[];
        
        setAiSearchResults(foundVideos);

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred during AI search.";
        showToast(message, 'error');
        setAiSearchResults([]); // Show empty result on error
    } finally {
        setIsAiSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (aiSearchResults) {
      setAiSearchResults(null);
    }
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter);
    if (aiSearchResults) {
      setAiSearchResults(null);
    }
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAiSearch();
    }
  };

  const videosToDisplay = useMemo(() => {
    if (aiSearchResults) {
      return aiSearchResults;
    }
  
    const approved = videos.filter(v => v.status === 'approved');
    
    const typeFiltered = filterType === 'all'
      ? approved
      : approved.filter(video => video.type === filterType);

    if (!searchQuery.trim()) {
      return typeFiltered;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    return typeFiltered.filter(video => 
        video.title.toLowerCase().includes(lowercasedQuery) ||
        video.uploaderName.toLowerCase().includes(lowercasedQuery)
    );
  }, [videos, searchQuery, filterType, aiSearchResults]);
  
  const handleViewProfile = (userId: number) => {
      setView({ type: 'PROFILE_PAGE', userId });
      setSelectedVideo(null); // Close player when navigating to profile
  }

  const handlePinVideo = useCallback((videoId: number) => {
    if (!currentUser) return;
    updateUserState(currentUser.id, u => {
        const isCurrentlyPinned = u.pinnedVideoId === videoId;
        if(isCurrentlyPinned) {
            showToast('Đã bỏ ghim video khỏi hồ sơ!', 'info');
            return { pinnedVideoId: undefined };
        } else {
            showToast('Đá ghim video vào hồ sơ!', 'success');
            return { pinnedVideoId: videoId };
        }
    });
  }, [currentUser, showToast, updateUserState]);
  
  const handleGenerateScenes = useCallback(async (videoId: number) => {
      try {
        const video = videos.find(v => v.id === videoId);
        if(!video) throw new Error("Video not found");

        const tags = await generateSceneTags(video.title);
        updateVideo(videoId, () => ({ aiSceneTags: tags }));
        showToast("AI đã phân tích xong các cảnh!", 'success');
      } catch (error) {
         const message = error instanceof Error ? error.message : "An unknown error occurred during AI scene analysis.";
         showToast(message, 'error');
      }
  }, [videos, updateVideo, showToast]);

  const renderView = () => {
      switch (view.type) {
        case 'ADMIN_PANEL':
            if (currentUser?.username !== 'admin') {
                setView({type: 'USER_VIEW'}); // Security redirect
                return null;
            }
            return <AdminPanel 
                currentUser={currentUser} 
                users={users.filter(u => u.username !== 'admin')} 
                videos={videos} 
                pendingVideos={pendingVideos} 
                onUpload={handleAdminUpload} 
                onDelete={deleteVideo} 
                onPlayVideo={playVideo} 
                onSwitchToUserView={() => setView({type: 'USER_VIEW'})} 
                onLogout={handleLogout} 
                onApproveVideo={approveVideo} 
                onRejectVideo={rejectVideo} 
                onVerifyUser={handleUserVerification} 
                onBanUser={handleUserBan} 
                onTierChange={handleUserTierChange}
                showToast={showToast}
                onEditVideo={(video) => setEditingVideo(video)}
                siteAnnouncement={siteAnnouncement}
                onSetAnnouncement={setSiteAnnouncement}
            />;
        case 'PROFILE_PAGE':
            const profileUser = users.find(u => u.id === view.userId);
            if (!profileUser) {
                showToast('Không tìm thấy người dùng này.', 'error');
                setView({ type: 'USER_VIEW' });
                return null;
            }
            const userVideos = videos.filter(v => v.uploaderId === profileUser.id && v.status === 'approved');
            const historyVideos = (profileUser.watchHistory || [])
                .map(id => videos.find(v => v.id === id))
                .filter((v): v is Video => !!v);

            return <UserProfilePage user={profileUser} videos={userVideos} historyVideos={historyVideos} currentUser={currentUser} onPlayVideo={playVideo} onBack={() => setView({ type: 'USER_VIEW' })} onEditProfile={() => setShowEditProfile(true)} onPinVideo={handlePinVideo} />;
        case 'USER_VIEW':
        default:
            return (
              <div className="bg-[#0a0a10] text-slate-200 min-h-screen">
                  {apiKeyError && <ApiKeyWarningBanner />}
                  <header className="sticky top-0 z-30 flex items-center justify-between gap-4 p-3 px-4 md:px-6 bg-[#0a0a10]/60 backdrop-blur-lg border-b border-white/10">
                      <div className="flex items-center gap-3">
                         <Bot className="h-8 w-8 text-amber-400" />
                         <span className="text-2xl font-bold tracking-tight text-white">V-Hub<span className="text-amber-400">AI</span></span>
                      </div>
                      <div className="flex-1 flex justify-center px-4">
                         <div className="w-full max-w-2xl relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none"/>
                            <input 
                              type="text"
                              placeholder="Lọc video hoặc hỏi AI bất cứ điều gì..."
                              value={searchQuery}
                              onChange={handleSearchChange}
                              onKeyDown={handleSearchKeyDown}
                              className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-32 md:pr-40 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500/80 focus:bg-white/10 outline-none transition-all duration-300"
                            />
                             <button
                                onClick={handleAiSearch}
                                disabled={isAiSearching || apiKeyError}
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-300 rounded-full hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                               <Sparkles className={`h-4 w-4 ${isAiSearching ? 'animate-spin' : ''}`} />
                               <span className="text-xs sm:text-sm font-semibold hidden sm:inline">{isAiSearching ? 'Đang tìm...' : 'AI Search'}</span>
                            </button>
                         </div>
                      </div>
                      <UserAuth currentUser={currentUser} onRegister={handleRegister} onLogin={handleUserLogin} onLogout={handleLogout} onOpenUpload={() => setShowUserUpload(true)} onSwitchToAdminView={() => setView({type: 'ADMIN_PANEL'})} showToast={showToast} onViewProfile={handleViewProfile} onShowBenefits={() => setShowBenefitsModal(true)} />
                  </header>
                  <main>
                      {selectedVideo ? (
                          <WatchPage 
                            video={selectedVideo} 
                            allVideos={videos.filter(v => v.status === 'approved')}
                            onClose={() => setSelectedVideo(null)} 
                            onInteraction={handleInteraction} 
                            interactionStatus={userInteractions[selectedVideo.id]} 
                            onCommentSubmit={handleCommentSubmit}
                            onPinComment={handlePinComment}
                            currentUser={currentUser} 
                            onViewProfile={handleViewProfile} 
                            users={users} 
                            onPlayNext={playVideo}
                            onGenerateScenes={handleGenerateScenes}
                            showToast={showToast}
                          />
                      ) : (
                          <UserView 
                            videos={videosToDisplay} 
                            onPlayVideo={playVideo} 
                            onViewProfile={handleViewProfile}
                            currentUser={currentUser} 
                            searchQuery={searchQuery}
                            siteAnnouncement={siteAnnouncement}
                            isAiSearching={isAiSearching}
                            aiSearchResults={aiSearchResults}
                            filterType={filterType}
                            onFilterChange={handleFilterChange}
                          />
                      )}
                  </main>
              </div>
            );
    }
  }

  return (
    <>
      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {toasts.map(toast => (<Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => dismissToast(toast.id)} />))}
        </div>
      </div>
      
      {renderView()}

      {showBenefitsModal && <TierBenefitsModal onClose={() => setShowBenefitsModal(false)} />}
      {videoAwaitingPassword && <PasswordPrompt videoTitle={videoAwaitingPassword.title} onClose={() => setVideoAwaitingPassword(null)} onSubmit={handlePasswordSubmit} />}
      {showUserUpload && currentUser && <UserUploadPanel onClose={() => setShowUserUpload(false)} onUpload={handleUserUpload} showToast={showToast} />}
      {showEditProfile && currentUser && <EditProfileModal currentUser={currentUser} onClose={() => setShowEditProfile(false)} onSave={handleProfileUpdate} showToast={showToast} />}
      {editingVideo && currentUser?.username === 'admin' && <EditVideoModal video={editingVideo} onClose={() => setEditingVideo(null)} onSave={handleUpdateVideoDetails} />}
    </>
  );
};

export default App;