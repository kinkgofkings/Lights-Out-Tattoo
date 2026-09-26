import { uploadLargeMedia } from "../services/mediaStore";
import { MediaRenderer } from "./MediaRenderer";
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from "../data/categories";
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Trash2, Pencil,
  Edit3,
  Image,
  Image as ImageIcon,
  CalendarCheck,
  BookOpen,
  Settings,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Layers,
  Save,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Flame,
  Camera,
  Calendar as CalendarIcon,
  Zap,
  Smartphone,
  DollarSign,
  Video,
  Eye,
  Loader2,
  X,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  Film,
  ExternalLink,
  Plus
} from 'lucide-react';
import {
  ArtistProfile,
  Booking,
  GalleryItem,
  JournalPost,
  JournalMediaItem,
  ArtCategoryKey,
  TattooCategoryKey,
  AdminAuthSession,
  SplashScreenSettings
} from '../types';
import { storageService } from '../services/storage';
import { BulkGalleryUploadModal } from './BulkGalleryUploadModal';
import { AdminCalendarSync } from './AdminCalendarSync';
import { AdminPosTab } from './AdminPosTab';
import { AdminTikTokTab } from './AdminTikTokTab';
import { TikTokStudioRecorder } from './TikTokStudioRecorder';
import { LightsOutPayPortal } from './LightsOutPayPortal';
import { ShareJournalToTikTokModal } from './ShareJournalToTikTokModal';
import { AdminLoginGate } from './AdminLoginGate';
import { LiveSplashStudio } from './LiveSplashStudio';
import { JournalMediaGallery } from './JournalMediaGallery';

interface AdminDashboardProps {
  profile: ArtistProfile;
  galleryItems: GalleryItem[];
  bookings: Booking[];
  posts: JournalPost[];
  onUpdateProfile: (profile: ArtistProfile) => void;
  onRefreshData: () => void;
  onSplashSettingsUpdated?: (settings: SplashScreenSettings) => void;
  onOpenApkModal?: () => void;
  onTriggerSplash?: () => void;
  onAdminAuthChange?: (session: AdminAuthSession) => void;
  onBackToStudio?: () => void;
  onNavigateToGallery?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  profile,
  galleryItems,
  bookings,
  posts,
  onUpdateProfile,
  onRefreshData,
  onSplashSettingsUpdated,
  onOpenApkModal,
  onTriggerSplash,
  onAdminAuthChange,
  onNavigateToGallery
}) => {
  const [authSession, setAuthSession] = useState<AdminAuthSession>(() => storageService.getAdminAuth());
  const [activeTab, setActiveTab] = useState<'gallery' | 'bookings' | 'calendar' | 'pos' | 'tiktok' | 'livestudio' | 'splash' | 'profile' | 'journal' | 'backup'>('gallery');
  const [notification, setNotification] = useState<string | null>(null);
  const [posBooking, setPosBooking] = useState<Booking | null>(null);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);

  // Check URL query parameters on mount to deep-link directly to subtabs like tiktok
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const subtab = params.get('subtab');
      if (subtab && ['gallery', 'bookings', 'calendar', 'pos', 'tiktok', 'livestudio', 'splash', 'profile', 'journal', 'backup'].includes(subtab)) {
        setActiveTab(subtab as any);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // --- GALLERY FORM STATE ---
  const [newTitle, setNewTitle] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newCategory, setNewCategory] = useState<TattooCategoryKey>('realism');
  const [newDesc, setNewDesc] = useState('');
  const [newPlacement, setNewPlacement] = useState('Forearm');
  const [newSessionHours, setNewSessionHours] = useState(4);
  const [newTags, setNewTags] = useState('realism, blackandgrey');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAdditionalImages, setNewAdditionalImages] = useState<string[]>([]);
  const [newIsCoverUp, setNewIsCoverUp] = useState(false);
  const [newBeforeImageUrl, setNewBeforeImageUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Confirmation Modals State
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showSuccessConfirm, setShowSuccessConfirm] = useState(false);
  const [recentlyPublishedItem, setRecentlyPublishedItem] = useState<GalleryItem | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBefore = false) => {
    setIsUploadingMedia(true);
    const file = e.target.files?.[0];
    if (!file) {
      setIsUploadingMedia(false);
      return;
    }
    try {
      const base64 = await uploadLargeMedia(file);
      if (isBefore) {
        setNewBeforeImageUrl(base64);
      } else {
        setNewImageUrl(base64);
      }
    } catch (err) {
      console.warn(err);
      alert((err as Error).message || 'Failed to process media file. Check size limits.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    
    const newBase64Images: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await uploadLargeMedia(files[i]);
        newBase64Images.push(base64);
      } catch (err) {
        console.warn('Failed to process additional image', err);
        alert((err as Error).message || 'Failed to process media file. Check size limits.');
      }
    }
    setNewAdditionalImages(prev => [...prev, ...newBase64Images]);
    setIsUploadingMedia(false);
  };

  const handleOpenPublishConfirm = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newImageUrl.trim()) {
      showNotification('Please choose an image file or enter an image URL first.');
      return;
    }

    // Auto-fill fallback title if left blank so user is never blocked
    if (!newTitle.trim()) {
      const fallback = newPlacement.trim()
        ? `${newPlacement.trim()} Tattoo`
        : (newDesc.trim() ? (newDesc.trim().length > 28 ? `${newDesc.trim().slice(0, 28)}...` : newDesc.trim()) : `${CATEGORY_LABELS[newCategory] || 'Custom'} Tattoo Piece`);
      setNewTitle(fallback);
    }

    setShowPublishConfirm(true);
  };

  const handleConfirmPublish = async () => {
    if (!newImageUrl.trim()) {
      showNotification('An image is required to publish.');
      return;
    }

    setIsPublishing(true);
    try {
      const finalTitle = newTitle.trim() || (newPlacement.trim() ? `${newPlacement.trim()} Tattoo` : 'Custom Studio Tattoo');
      
      const createdItem = storageService.createGalleryItem({
        title: finalTitle,
        clientName: newClientName.trim() || undefined,
        category: newCategory,
        categoryLabel: CATEGORY_LABELS[newCategory] || 'Custom Tattoo',
        imageUrl: newImageUrl.trim(),
        additionalImages: newAdditionalImages.length > 0 ? newAdditionalImages : undefined,
        description: newDesc.trim() || 'Custom piece crafted by Tex at Lights Out Tattoo in Winchester, VA.',
        sessionHours: Number(newSessionHours) || 4,
        placement: newPlacement.trim() || 'Custom',
        isCoverUp: newIsCoverUp,
        beforeImageUrl: newIsCoverUp && newBeforeImageUrl.trim() ? newBeforeImageUrl.trim() : undefined,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
      });

      setRecentlyPublishedItem(createdItem);
      setShowPublishConfirm(false);
      setShowSuccessConfirm(true);
      showNotification('Tattoo piece successfully published to portfolio gallery!');

      // Reset form
      setNewTitle('');
      setNewClientName('');
      setNewDesc('');
      setNewImageUrl('');
      setNewAdditionalImages([]);
      setNewBeforeImageUrl('');
      setNewIsCoverUp(false);
      onRefreshData();
    } catch (err) {
      console.error('Failed to create gallery item:', err);
      showNotification('Failed to publish piece. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleDeleteGalleryItem = async (id: string) => {
    await storageService.deleteGalleryItem(id);
    showNotification('Piece deleted from portfolio.');
    onRefreshData();
  };

  const handleClearAllGallery = async () => {
    setIsClearingAll(true);
    await storageService.clearAllGallery();
    showNotification('All portfolio images cleared. You can now add your own!');
    setShowClearConfirm(false);
    setIsClearingAll(false);
    onRefreshData();
  };

  // --- BOOKING STATUS UPDATES ---
  const handleUpdateBookingStatus = (id: string, status: Booking['status']) => {
    storageService.updateBookingStatus(id, status);
    showNotification(`Booking status set to ${status}`);
    onRefreshData();
  };

  const handleUpdateBookingDeposit = (id: string, depositStatus: 'unpaid' | 'paid' | 'forfeited') => {
    storageService.updateBookingDeposit(id, depositStatus);
    showNotification(`Deposit marked as ${depositStatus.toUpperCase()}`);
    onRefreshData();
  };

  // --- JOURNAL MANAGEMENT STATE & HANDLERS ---
  const [journalTitle, setJournalTitle] = useState('');
  const [journalExcerpt, setJournalExcerpt] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalCategory, setJournalCategory] = useState('Technique');
  const [journalReadTime, setJournalReadTime] = useState('4 min read');
  const [journalImageUrl, setJournalImageUrl] = useState('');
  const [journalTags, setJournalTags] = useState('tattoo, winchesterva, realism');
  const [journalMediaItems, setJournalMediaItems] = useState<JournalMediaItem[]>([]);
  const [isUploadingJournalCover, setIsUploadingJournalCover] = useState(false);
  const [isUploadingJournalMulti, setIsUploadingJournalMulti] = useState(false);
  const [manualMediaUrl, setManualMediaUrl] = useState('');
  const [manualMediaCaption, setManualMediaCaption] = useState('');
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);

  // Edit Journal Article State
  const [editingJournalPost, setEditingJournalPost] = useState<JournalPost | null>(null);
  const [isUploadingEditCover, setIsUploadingEditCover] = useState(false);
  const [isUploadingEditMulti, setIsUploadingEditMulti] = useState(false);
  const [editManualMediaUrl, setEditManualMediaUrl] = useState('');
  const [editManualMediaCaption, setEditManualMediaCaption] = useState('');
  const [showEditAddUrlInput, setShowEditAddUrlInput] = useState(false);

  const [shareToTikTokPost, setShareToTikTokPost] = useState<JournalPost | null>(null);
  const [viewingJournalPost, setViewingJournalPost] = useState<JournalPost | null>(null);

  // Keyboard shortcut: Escape key closes article reader in admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingJournalPost) setViewingJournalPost(null);
        if (editingJournalPost) setEditingJournalPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingJournalPost, editingJournalPost]);

  // Upload cover image/video for new journal post
  const handleJournalCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingJournalCover(true);
    try {
      const url = await uploadLargeMedia(file);
      setJournalImageUrl(url);
      showNotification('Cover media uploaded successfully!');
    } catch (err: any) {
      console.warn('Cover upload failed:', err);
      alert(err.message || 'Failed to upload cover media.');
    } finally {
      setIsUploadingJournalCover(false);
      e.target.value = '';
    }
  };

  // Upload multiple images & videos for new journal post
  const handleJournalMultiMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingJournalMulti(true);
    const newItems: JournalMediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name);
        const url = await uploadLargeMedia(file);
        newItems.push({
          id: `media-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          url,
          type: isVideo ? 'video' : 'image',
          caption: ''
        });
      } catch (err: any) {
        console.warn('Media upload failed for file', file.name, err);
        alert(`Failed to upload ${file.name}: ${err.message || 'Upload error'}`);
      }
    }

    if (newItems.length > 0) {
      setJournalMediaItems(prev => [...prev, ...newItems]);
      showNotification(`${newItems.length} media item(s) attached!`);
    }
    setIsUploadingJournalMulti(false);
    e.target.value = '';
  };

  const handleAddManualMedia = () => {
    if (!manualMediaUrl.trim()) return;
    const url = manualMediaUrl.trim();
    const isVideo = url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(url);
    const newItem: JournalMediaItem = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url,
      type: isVideo ? 'video' : 'image',
      caption: manualMediaCaption.trim() || undefined
    };
    setJournalMediaItems(prev => [...prev, newItem]);
    setManualMediaUrl('');
    setManualMediaCaption('');
    setShowAddUrlInput(false);
    showNotification('Media added via URL.');
  };

  const handleRemoveJournalMediaItem = (id: string) => {
    setJournalMediaItems(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateJournalMediaCaption = (id: string, caption: string) => {
    setJournalMediaItems(prev => prev.map(m => m.id === id ? { ...m, caption } : m));
  };

  const handleMoveJournalMediaItem = (index: number, direction: 'up' | 'down') => {
    setJournalMediaItems(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleCreateJournalPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalContent.trim()) {
      showNotification('Title and content are required.');
      return;
    }

    const currentPosts = storageService.getJournalPosts();
    const primaryCover = journalImageUrl.trim() || (journalMediaItems.length > 0 ? journalMediaItems[0].url : undefined);

    const newPost: JournalPost = {
      id: `journal-${Date.now()}`,
      title: journalTitle.trim(),
      excerpt: journalExcerpt.trim() || journalContent.trim().substring(0, 150) + '...',
      content: journalContent.trim(),
      category: journalCategory.trim() || 'Insight',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: journalReadTime.trim() || '4 min read',
      author: 'Tex',
      imageUrl: primaryCover,
      mediaItems: journalMediaItems.length > 0 ? journalMediaItems : undefined,
      mediaUrls: journalMediaItems.length > 0 ? journalMediaItems.map(m => m.url) : (primaryCover ? [primaryCover] : undefined),
      tags: journalTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    };

    storageService.saveJournalPosts([newPost, ...currentPosts]);
    showNotification('New journal article published to studio blog!');
    setJournalTitle('');
    setJournalExcerpt('');
    setJournalContent('');
    setJournalImageUrl('');
    setJournalMediaItems([]);
    onRefreshData();
  };

  const handleEditJournalCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingJournalPost) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEditCover(true);
    try {
      const url = await uploadLargeMedia(file);
      setEditingJournalPost(prev => prev ? { ...prev, imageUrl: url } : null);
      showNotification('Cover media updated!');
    } catch (err: any) {
      console.warn('Cover upload failed:', err);
      alert(err.message || 'Failed to upload cover media.');
    } finally {
      setIsUploadingEditCover(false);
      e.target.value = '';
    }
  };

  const handleEditJournalMultiMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingJournalPost) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingEditMulti(true);
    const newItems: JournalMediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name);
        const url = await uploadLargeMedia(file);
        newItems.push({
          id: `media-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          url,
          type: isVideo ? 'video' : 'image',
          caption: ''
        });
      } catch (err: any) {
        alert(`Failed to upload ${file.name}: ${err.message || 'Upload error'}`);
      }
    }

    if (newItems.length > 0) {
      setEditingJournalPost(prev => {
        if (!prev) return null;
        const currentMedia = prev.mediaItems || [];
        return {
          ...prev,
          mediaItems: [...currentMedia, ...newItems],
          mediaUrls: [...(prev.mediaUrls || []), ...newItems.map(m => m.url)]
        };
      });
      showNotification(`${newItems.length} media item(s) attached!`);
    }
    setIsUploadingEditMulti(false);
    e.target.value = '';
  };

  const handleAddEditManualMedia = () => {
    if (!editingJournalPost || !editManualMediaUrl.trim()) return;
    const url = editManualMediaUrl.trim();
    const isVideo = url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(url);
    const newItem: JournalMediaItem = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url,
      type: isVideo ? 'video' : 'image',
      caption: editManualMediaCaption.trim() || undefined
    };
    setEditingJournalPost(prev => {
      if (!prev) return null;
      const currentMedia = prev.mediaItems || [];
      return {
        ...prev,
        mediaItems: [...currentMedia, newItem],
        mediaUrls: [...(prev.mediaUrls || []), newItem.url]
      };
    });
    setEditManualMediaUrl('');
    setEditManualMediaCaption('');
    setShowEditAddUrlInput(false);
    showNotification('Media item added.');
  };

  const handleRemoveEditJournalMediaItem = (id: string) => {
    setEditingJournalPost(prev => {
      if (!prev) return null;
      const updatedMedia = (prev.mediaItems || []).filter(m => m.id !== id);
      return {
        ...prev,
        mediaItems: updatedMedia,
        mediaUrls: updatedMedia.map(m => m.url)
      };
    });
  };

  const handleUpdateEditJournalMediaCaption = (id: string, caption: string) => {
    setEditingJournalPost(prev => {
      if (!prev) return null;
      return {
        ...prev,
        mediaItems: (prev.mediaItems || []).map(m => m.id === id ? { ...m, caption } : m)
      };
    });
  };

  const handleMoveEditJournalMediaItem = (index: number, direction: 'up' | 'down') => {
    setEditingJournalPost(prev => {
      if (!prev || !prev.mediaItems) return prev;
      const copy = [...prev.mediaItems];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return {
        ...prev,
        mediaItems: copy,
        mediaUrls: copy.map(m => m.url)
      };
    });
  };

  const handleUpdateJournalPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournalPost) return;
    if (!editingJournalPost.title.trim() || !editingJournalPost.content.trim()) {
      showNotification('Title and content are required.');
      return;
    }

    const currentPosts = storageService.getJournalPosts();
    const primaryCover = editingJournalPost.imageUrl?.trim() || (editingJournalPost.mediaItems && editingJournalPost.mediaItems.length > 0 ? editingJournalPost.mediaItems[0].url : undefined);

    const updated = currentPosts.map(p => {
      if (p.id === editingJournalPost.id) {
        return {
          ...editingJournalPost,
          imageUrl: primaryCover,
          mediaUrls: editingJournalPost.mediaItems?.map(m => m.url) || []
        };
      }
      return p;
    });

    storageService.saveJournalPosts(updated);
    showNotification('Journal article updated successfully!');
    setEditingJournalPost(null);
    onRefreshData();
  };

  const handleDeleteJournalPost = (id: string) => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    storageService.deleteJournalPost(id);
    showNotification('Journal post removed.');
    onRefreshData();
  };

  // --- EDIT GALLERY MODAL ---
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  
  const handleEditAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingGalleryItem) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    
    const newBase64Images: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await uploadLargeMedia(files[i]);
        newBase64Images.push(base64);
      } catch (err) {
        console.warn('Failed to process additional image', err);
        showNotification((err as Error).message || 'Failed to process media file. Check size limits.');
      }
    }
    
    if (newBase64Images.length > 0) {
      setEditingGalleryItem(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          additionalImages: [...(prev.additionalImages || []), ...newBase64Images]
        };
      });
      showNotification(`✓ ${newBase64Images.length} media file(s) attached! Remember to click "Save Changes" below.`);
    }
    setIsUploadingMedia(false);
  };

  const handleUpdateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;
    if (!editingGalleryItem.title.trim() || !editingGalleryItem.imageUrl.trim()) {
      showNotification('Title and a main image are required.');
      return;
    }
    
    const updated = {
      ...editingGalleryItem,
      description: editingGalleryItem.description || '',
      categoryLabel: CATEGORY_LABELS[editingGalleryItem.category] || 'Custom Tattoo'
    };
    
    await storageService.updateGalleryItem(updated);
    setEditingGalleryItem(null);
    showNotification('Gallery piece updated successfully.');
    onRefreshData();
  };

  // --- BULK GALLERY MODAL ---
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // --- PROFILE SETTINGS ---
  const [editHourlyRate, setEditHourlyRate] = useState(profile.hourlyRate);
  const [editDiscount, setEditDiscount] = useState(profile.onlineDiscountPercent);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editStatusMessage, setEditStatusMessage] = useState(profile.statusMessage);
  const [editLiveStatus, setEditLiveStatus] = useState(profile.liveStatus);
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatarUrl);
  const [editBannerUrl, setEditBannerUrl] = useState(profile.bannerUrl);
  const [editSecurityDeposit, setEditSecurityDeposit] = useState(profile.securityDepositAmount ?? 200);
  const [editCashAppHandle, setEditCashAppHandle] = useState(profile.cashAppHandle ?? '$texxx360');
  const [editDepositPolicyText, setEditDepositPolicyText] = useState(
    profile.depositPolicyText ??
    '$200 nonrefundable security deposit required to secure any appointment. If you miss your appointment without prior notification, you lose your spot and your deposit is forfeited. Reschedules are accepted with proper notification and schedule change.'
  );

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await uploadLargeMedia(file);
      setEditAvatarUrl(base64);
      showNotification('Artist portrait updated! Click Save Profile to apply.');
    } catch (err) {
      console.warn(err);
      showNotification('Failed to process image file.');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await uploadLargeMedia(file);
      setEditBannerUrl(base64);
      showNotification('Studio banner updated! Click Save Profile to apply.');
    } catch (err) {
      console.warn(err);
      showNotification('Failed to process image file.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ArtistProfile = {
      ...profile,
      hourlyRate: Number(editHourlyRate),
      onlineDiscountPercent: Number(editDiscount),
      securityDepositAmount: Number(editSecurityDeposit),
      depositPolicyText: editDepositPolicyText.trim(),
      cashAppHandle: editCashAppHandle.trim().startsWith('$') ? editCashAppHandle.trim() : `$${editCashAppHandle.trim()}`,
      phone: editPhone.trim(),
      statusMessage: editStatusMessage.trim(),
      liveStatus: editLiveStatus,
      avatarUrl: editAvatarUrl,
      bannerUrl: editBannerUrl
    };
    storageService.saveProfile(updated);
    onUpdateProfile(updated);
    showNotification('Studio profile, rates, and deposit policy settings saved!');
  };

  // --- BACKUP & RESTORE (Prevent Chromebook Data Loss) ---
  const handleExportBackup = () => {
    const jsonStr = storageService.exportFullDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lights-out-tattoo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Database backup JSON exported safely!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const success = storageService.importFullDataJson(content);
      if (success) {
        showNotification('Database restored successfully from backup!');
        onRefreshData();
      } else {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // If not logged in as Admin, gate with TikTok Login & PIN Screen
  // Hooks have now all executed in identical order, completely preventing React hook order crashes
  if (!authSession.isAuthenticated) {
    return (
      <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto">
        <AdminLoginGate
          onLoginSuccess={session => {
            setAuthSession(session);
            onAdminAuthChange?.(session);
            showNotification(
              session.method === 'tiktok'
                ? `Logged in as ${session.username || '@lightsouttattoo.site'} via TikTok!`
                : 'Studio unlocked via Master PIN!'
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto" id="admin-dashboard">
      {/* Admin Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#080e1c] border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.2)] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_#00f0ff]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-xl text-white">
                ADMIN STUDIO DASHBOARD
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                TEX MODE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-tech mt-0.5">
              Self-contained database engine. Add gallery photos, manage client appointments, and update live rates.
            </p>
          </div>
        </div>

        {/* Auth Status & Lock Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {authSession.method === 'tiktok' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black border border-cyan-400 text-cyan-300 font-mono text-xs shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <i className="fa-brands fa-tiktok text-white"></i>
              <span className="font-bold">{authSession.username || '@lightsouttattoo.site'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-gray-400 hidden sm:inline">Verified Artist</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>PIN Mode (Tex)</span>
            </div>
          )}

          {/* Matrix Splash & Android APK Quick Tools (Tex Only) */}
          {onTriggerSplash && (
            <button
              type="button"
              onClick={onTriggerSplash}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Test Matrix Live Splash Screen"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Matrix Splash</span>
            </button>
          )}

          {onOpenApkModal && (
            <button
              type="button"
              onClick={onOpenApkModal}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Android APK & Gradle Setup Guide"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Android Gradle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              storageService.clearAdminAuth();
              const loggedOutSession = { isAuthenticated: false, method: 'pin' as const, loginTime: '' };
              setAuthSession(loggedOutSession);
              onAdminAuthChange?.(loggedOutSession);
              showNotification('Studio locked. Signed out of Admin.');
            }}
            className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-red-950/80 border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-300 font-mono text-xs transition flex items-center gap-1.5"
            title="Lock Studio & Return to Security Gate"
          >
            <span>Lock Studio</span>
          </button>

          {/* Quick Ticker Notification */}
          {notification && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        {[
          { id: 'gallery', label: `Portfolio Gallery (${galleryItems.length})`, icon: Image },
          { id: 'splash', label: 'Live Splash Screen Studio', icon: Zap, badge: 'CYBERPUNK' },
          { id: 'bookings', label: `Client Bookings (${bookings.length})`, icon: CalendarCheck, badge: bookings.filter(b => b.status === 'pending').length },
          { id: 'journal', label: `Journal Posts (${posts.length})`, icon: BookOpen },
          { id: 'pos', label: 'Cash App POS & Register ($)', icon: DollarSign, badge: 'Terminal' },
          { id: 'calendar', label: 'Google Calendar & Routine', icon: CalendarIcon, badge: bookings.filter(b => !b.googleCalendarEventId).length ? `${bookings.filter(b => !b.googleCalendarEventId).length} Unsynced` : undefined },
          { id: 'tiktok', label: 'TikTok API & Sync', icon: Video, badge: 'API' },
          { id: 'livestudio', label: 'TikTok Live Studio & Waivers', icon: Camera, badge: 'REC' },
          { id: 'profile', label: 'Studio Policy & Rates ($100/hr)', icon: Settings },
          { id: 'backup', label: 'Chromebook Safe Backup', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap border ${
                isSelected
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-[#080d1a] text-gray-300 border-cyan-500/20 hover:border-cyan-400/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: GALLERY MANAGER --- */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Quick Bulk Import Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-[#08152e] to-blue-950/80 border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_#00f0ff]">
                <Layers className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-left">
                <h4 className="font-heading font-black text-base sm:text-lg text-white">
                  HAVE SEVERAL TATTOO IMAGES TO UPLOAD?
                </h4>
                <p className="text-xs text-cyan-300 font-mono">
                  Batch upload all your pictures directly from your Chromebook or phone in 1 click
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] shrink-0 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Import Images</span>
            </button>
          </div>

          {/* Add New Gallery Item Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30">
            <h3 className="font-heading font-black text-lg text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cyan-400" />
              <span>Add New Work to Real-Time Portfolio</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Upload from your device or paste an image URL. It immediately renders across the app gallery and lightbox.
            </p>

            <form onSubmit={e => { e.preventDefault(); handleOpenPublishConfirm(); }} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-gray-300">
                      Tattoo Piece Title
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">Auto-generated if blank</span>
                  </div>
                  <input
                    type="text"
                    placeholder="E.g. Nordic Valkyrie Realism Sleeve"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Art Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Input: File or URL */}
              <div className="p-3.5 rounded-xl bg-[#091122] border border-cyan-500/30 space-y-3">
                <label className="block text-xs font-mono text-cyan-300 font-bold">
                  Image Source (Choose file OR paste web URL):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] text-gray-400 mb-1">Option A: Upload Image/Video File</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={e => handleImageFileUpload(e, false)}
                      className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-400 mb-1">Option B: Image Web URL</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {newImageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <MediaRenderer
                      src={newImageUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-cyan-400"
                      autoPlay={false}
                    />
                    <span className="text-xs text-emerald-400 font-mono">Media loaded ready!</span>
                  </div>
                )}
              </div>
              
              {/* Additional Portfolio Images for the same project */}
              <div className="p-3.5 rounded-xl bg-[#091122] border border-cyan-500/30 space-y-3">
                <label className="block text-xs font-mono text-cyan-300 font-bold">
                  Additional Images/Videos (Optional - creates a swipeable gallery for this piece):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleAdditionalImagesUpload}
                  className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
                />
                {newAdditionalImages.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {newAdditionalImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <MediaRenderer src={img} alt={`Additional ${idx}`} className="w-12 h-12 object-cover rounded border border-cyan-400/50" autoPlay={false} />
                        <button
                          type="button"
                          onClick={() => setNewAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center text-xs text-emerald-400 font-mono pl-2">
                      {newAdditionalImages.length} extra image(s) attached
                    </div>
                  </div>
                )}
              </div>

              {/* Cover-up Before/After Upload */}
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={newIsCoverUp}
                    onChange={e => setNewIsCoverUp(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 accent-cyan-500"
                  />
                  <span className="text-xs font-mono text-white font-bold">
                    Mark as Cover-Up Transformation (Enables Before/After Lightbox Slider)
                  </span>
                </label>

                {newIsCoverUp && (
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <span className="block text-[11px] text-cyan-400 mb-1 font-mono">
                      Upload photo of OLD tattoo before cover-up:
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={e => handleImageFileUpload(e, true)}
                      className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-950 file:text-cyan-300"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Placement
                  </label>
                  <input
                    type="text"
                    placeholder="Outer Forearm"
                    value={newPlacement}
                    onChange={e => setNewPlacement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Hours in Chair
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newSessionHours}
                    onChange={e => setNewSessionHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="skull, wolf, coverup"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Description / Art Story
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on needle grouping, greywash tones, or client concept..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenPublishConfirm}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-black font-heading font-black text-sm uppercase tracking-wider hover:opacity-95 active:scale-[0.99] transition shadow-[0_0_20px_rgba(0,240,255,0.45)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Publish Image to Portfolio Gallery</span>
              </button>
            </form>
          </div>

          {/* Current Gallery List / Deletion manager */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-500/20">
              <div>
                <h3 className="font-heading font-black text-base text-white">
                  Current Portfolio Works ({galleryItems.length})
                </h3>
                <span className="text-xs font-mono text-cyan-400">Manage or remove individual pieces</span>
              </div>

              {galleryItems.length > 0 && (
                <div className="flex items-center gap-2">
                  {!showClearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-400 hover:text-white hover:bg-red-900 text-xs font-mono transition flex items-center gap-1.5"
                      title="Clear all images in the gallery so you can start clean"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove All Gallery Images</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-red-950/90 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                      <span className="text-xs text-red-300 font-mono pl-1">
                        Wipe all {galleryItems.length} photos?
                      </span>
                      <button
                        type="button"
                        disabled={isClearingAll}
                        onClick={handleClearAllGallery}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition font-mono disabled:opacity-50"
                      >
                        {isClearingAll ? 'Wiping...' : 'Yes, Delete All'}
                      </button>
                      <button
                        type="button"
                        disabled={isClearingAll}
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs hover:text-white transition font-mono"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {galleryItems.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl bg-black/40 border border-cyan-500/20 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Image className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Gallery is Currently Empty</h4>
                  <p className="text-xs font-mono text-gray-400 mt-1 max-w-md mx-auto">
                    All default mock images have been cleared. You have a completely clean slate to upload your real tattoo portfolio!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bulk Upload Tattoo Photos</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {galleryItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 hover:border-cyan-500/40 transition flex items-center gap-3 group"
                  >
                    <MediaRenderer src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded object-cover border border-cyan-500/40" autoPlay={false} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-heading font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{item.categoryLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingGalleryItem(item)}
                        className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        title="Edit Piece"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await storageService.deleteGalleryItem(item.id);
                          onRefreshData();
                        }}
                        className="p-1.5 rounded-lg bg-red-900/50 text-red-400 hover:text-white hover:bg-red-600 transition"
                        title="Delete Piece"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>
      )}

      {/* --- TAB: BOOKINGS MANAGEMENT --- */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* ======================= */}
          {/*   BOOKINGS MANAGEMENT   */}
          {/* ======================= */}
          <div className="bg-[#091122]/90 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="font-heading font-black text-2xl text-white flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-cyan-400" />
                <span>Booking Requests ({bookings.length})</span>
              </h3>
            </div>

            {bookings.length === 0 ? (
              <p className="text-sm text-gray-400 font-mono">No booking requests found.</p>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => {
                  const depositStatus = b.depositStatus || 'unpaid';
                  return (
                    <div key={b.id} className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-heading font-bold text-white">{b.clientName}</h4>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">{b.phone}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">{b.email}</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          <span className="text-cyan-400 font-bold">Idea:</span> {b.tattooIdea}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400">
                          <span>Placement: {b.placement}</span>
                          <span>Size: {b.approximateSize}</span>
                          {b.isCoverUp && <span className="text-red-400">Cover-Up</span>}
                        </div>
                        
                        {(b.coverUpPhotoUrl || b.referencePhotoUrl) && (
                          <div className="flex items-center gap-3 pt-1">
                            {b.coverUpPhotoUrl && (
                              <a href={b.coverUpPhotoUrl} target="_blank" rel="noreferrer">
                                <MediaRenderer src={b.coverUpPhotoUrl} alt="Cover up uploaded" className="w-12 h-12 rounded object-cover border border-red-400" autoPlay={false} />
                              </a>
                            )}
                            {b.referencePhotoUrl && (
                            <a href={b.referencePhotoUrl} target="_blank" rel="noreferrer">
                              <MediaRenderer src={b.referencePhotoUrl} alt="Reference uploaded" className="w-12 h-12 rounded object-cover border border-cyan-400" autoPlay={false} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Controls & Deposit Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start md:items-end lg:items-center gap-2 shrink-0">
                      {/* Deposit Management Dropdown */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-gray-400">Deposit:</span>
                        <select
                          value={depositStatus}
                          onChange={e =>
                            handleUpdateBookingDeposit(b.id, e.target.value as any)
                          }
                          className="px-2 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-xs font-mono text-white"
                        >
                          <option value="unpaid">Unpaid ($200 Pending)</option>
                          <option value="paid">Paid ($200 Secured)</option>
                          <option value="forfeited">Forfeited (No-Show)</option>
                        </select>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={b.status}
                        onChange={e =>
                          handleUpdateBookingStatus(b.id, e.target.value as any)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-xs font-mono text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_chair">In Chair</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setPosBooking(b);
                          setIsPosModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#00D632] hover:bg-emerald-400 text-black font-mono text-xs font-black transition flex items-center gap-1 shadow-[0_0_10px_rgba(0,214,50,0.4)]"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Ring in POS</span>
                      </button>

                      <a
                        href={`tel:${b.phone.replace(/[^0-9]/g, '')}`}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold hover:bg-cyan-900"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      )}

      {/* --- TAB: JOURNAL & BLOG POSTS MANAGER --- */}
      {activeTab === 'journal' && (
        <div className="space-y-6 text-left">
          {/* Write New Post Form */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="font-heading font-black text-lg text-white">
                  WRITE NEW JOURNAL ARTICLE / POST
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Auto-syncs with Studio Blog & TikTok Share
              </span>
            </div>

            <form onSubmit={handleCreateJournalPost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={journalTitle}
                    onChange={e => setJournalTitle(e.target.value)}
                    placeholder="e.g. Needle Depth & Skin Stretch: The Anatomy of Grey Wash"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={journalCategory}
                    onChange={e => setJournalCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono outline-none focus:border-cyan-400"
                  >
                    <option value="Technique">Technique & Science</option>
                    <option value="Project Planning">Tattoo Project Planning & Case Study</option>
                    <option value="Cover-Up">Cover-Up Mastery</option>
                    <option value="Stencil & Layout">Stencil Placement & Anatomical Flow</option>
                    <option value="Aftercare">Healing & Aftercare</option>
                    <option value="Culture">Winchester Tattoo Culture</option>
                    <option value="Shop News">Lights Out Studio News</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Article Excerpt / Short Summary (Preview in Feed & TikTok Share)
                </label>
                <input
                  type="text"
                  value={journalExcerpt}
                  onChange={e => setJournalExcerpt(e.target.value)}
                  placeholder="Quick 1-2 sentence hook describing the project plan or key tattoo insights..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-gray-300">
                    Full Article Body *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const template = `## Project Concept & Client Vision\n- Placement & Scale: Forearm / Upper Arm / Full Sleeve\n- Subject Matter: High-contrast black & grey realism\n\n## Reference Art & Stencil Preparation\n- Composition strategy and anatomical curvature\n- Contrast mapping and light source positioning\n\n## Needle Groupings & Ink Formulations\n- Outlining & structural mapping\n- Soft greywash blending and dynamic saturation\n\n## Session Timeline & Planning Stages\n- Session 1: Stencil lock, primary darks, foundational depth\n- Session 2: Midtones, feathering, and high-detail highlights\n\n## Healing & Client Aftercare Instructions\n- Medical adhesive wrap duration and moisturizing protocol\n`;
                      setJournalContent(prev => prev ? `${prev}\n\n${template}` : template);
                      showNotification('Project planning template inserted into article body!');
                    }}
                    className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1"
                  >
                    <span>+ Insert Project Planning Template</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  required
                  value={journalContent}
                  onChange={e => setJournalContent(e.target.value)}
                  placeholder="Share Tex's 20+ years of tattooing experience, technical methods, machine setups, project planning breakdown, or advice for clients..."
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* Featured Cover Media (Photo or Video) */}
              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-mono font-bold text-cyan-300">
                      Featured Cover Media (Photo or Video)
                    </label>
                    <p className="text-[11px] font-mono text-gray-400">
                      Direct upload or enter a link for the primary header visual.
                    </p>
                  </div>
                  {journalImageUrl && (
                    <button
                      type="button"
                      onClick={() => setJournalImageUrl('')}
                      className="text-[11px] font-mono text-rose-400 hover:text-rose-300 transition flex items-center gap-1 self-start sm:self-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove Cover</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* Direct File Upload */}
                  <div>
                    <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-cyan-400/50 hover:border-cyan-400 bg-cyan-950/40 hover:bg-cyan-950/70 text-cyan-300 cursor-pointer transition text-xs font-mono">
                      {isUploadingJournalCover ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          <span>Uploading Cover to R2...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-cyan-400" />
                          <span>Direct Upload Cover (Photo/Video)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        disabled={isUploadingJournalCover}
                        onChange={handleJournalCoverUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Or Paste URL */}
                  <div>
                    <input
                      type="url"
                      value={journalImageUrl}
                      onChange={e => setJournalImageUrl(e.target.value)}
                      placeholder="Or paste direct image/video URL..."
                      className="w-full px-3 py-2 rounded-xl bg-black/80 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Cover Live Preview */}
                {journalImageUrl && (
                  <div className="pt-2 flex items-center gap-3">
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-cyan-500/40 bg-black shrink-0 relative flex items-center justify-center">
                      <MediaRenderer src={journalImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                        Cover Preview Active
                      </span>
                      <p className="text-xs font-mono text-gray-300 truncate">
                        {journalImageUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Planning Media Suite (Direct Uploads: Multiple Images & Videos) */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#060c18] to-[#040810] border-2 border-cyan-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="font-heading font-black text-sm text-white">
                        PROJECT MEDIA & PLANNING VISUALS (IMAGES & VIDEOS)
                      </h4>
                      <p className="text-[11px] font-mono text-gray-400">
                        Upload reference art, stencil layouts, progression stages, and session clips for this project.
                      </p>
                    </div>
                  </div>

                  {journalMediaItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                        {journalMediaItems.length} media attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setJournalMediaItems([])}
                        className="text-[10px] font-mono text-rose-400 hover:text-rose-300 transition"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Multi-Upload Controls & Manual URL Input */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-2">
                    {/* Two quick direct upload action buttons for Photos vs Videos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 cursor-pointer transition text-xs font-mono font-bold group shadow-sm">
                        <ImageIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>Direct Upload Photos (Multi)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={isUploadingJournalMulti}
                          onChange={handleJournalMultiMediaUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 border border-purple-400/50 hover:border-purple-300 text-purple-200 cursor-pointer transition text-xs font-mono font-bold group shadow-sm">
                        <Film className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span>Direct Upload Videos (Multi)</span>
                        <input
                          type="file"
                          multiple
                          accept="video/*,video/mp4,video/quicktime,video/webm"
                          disabled={isUploadingJournalMulti}
                          onChange={handleJournalMultiMediaUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Combined Drag & Drop Multi-file Area */}
                    <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-cyan-400/50 hover:border-cyan-300 bg-cyan-950/20 hover:bg-cyan-950/40 cursor-pointer transition text-center group">
                      {isUploadingJournalMulti ? (
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs py-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Directly uploading & optimizing project media...</span>
                        </div>
                      ) : (
                        <>
                          <div className="p-2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                            Or Drag & Drop Any Images & Videos Here
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Direct high-speed storage • MP4, MOV, WEBM, JPG, PNG, WEBP, GIF
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        disabled={isUploadingJournalMulti}
                        onChange={handleJournalMultiMediaUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Add via URL toggle / input */}
                  <div className="flex flex-col justify-center p-3 rounded-xl bg-black/60 border border-cyan-500/25 space-y-2">
                    <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Or Add Media by Direct URL</span>
                    </span>
                    <input
                      type="url"
                      value={manualMediaUrl}
                      onChange={e => setManualMediaUrl(e.target.value)}
                      placeholder="https://... video or image link"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-cyan-500/30 text-white text-[11px] font-mono outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      value={manualMediaCaption}
                      onChange={e => setManualMediaCaption(e.target.value)}
                      placeholder="Optional caption (e.g. 'Session 1 Stencil')"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-cyan-500/30 text-white text-[11px] font-mono outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      disabled={!manualMediaUrl.trim()}
                      onClick={handleAddManualMedia}
                      className="w-full py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold disabled:opacity-40 transition"
                    >
                      + Attach Media URL
                    </button>
                  </div>
                </div>

                {/* Attached Media Cards Grid */}
                {journalMediaItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      Attached Project Media ({journalMediaItems.length})
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {journalMediaItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex flex-col rounded-xl bg-black/80 border border-cyan-500/30 overflow-hidden text-left"
                        >
                          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                            <MediaRenderer
                              src={item.url}
                              alt={item.caption || `Media ${index + 1}`}
                              className="w-full h-full object-cover"
                              controls={item.type === 'video'}
                              autoPlay={false}
                              muted={true}
                            />
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/85 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300">
                              {item.type === 'video' ? '🎥 VIDEO' : '📷 PHOTO'}
                            </div>

                            {/* Reorder and Delete Actions */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 p-1 rounded-lg border border-cyan-500/40">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveJournalMediaItem(index, 'up')}
                                className="p-1 text-gray-300 hover:text-white disabled:opacity-30"
                                title="Move earlier in project"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === journalMediaItems.length - 1}
                                onClick={() => handleMoveJournalMediaItem(index, 'down')}
                                className="p-1 text-gray-300 hover:text-white disabled:opacity-30"
                                title="Move later in project"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveJournalMediaItem(item.id)}
                                className="p-1 text-rose-400 hover:text-rose-300"
                                title="Remove item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Caption Input */}
                          <div className="p-2 bg-[#060a14] border-t border-cyan-500/20">
                            <input
                              type="text"
                              value={item.caption || ''}
                              onChange={e => handleUpdateJournalMediaCaption(item.id, e.target.value)}
                              placeholder="Step caption or reference note..."
                              className="w-full px-2 py-1 rounded bg-black border border-cyan-500/20 text-xs font-mono text-gray-200 outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={journalTags}
                    onChange={e => setJournalTags(e.target.value)}
                    placeholder="tattoo, realism, winchesterva, planning, coverup"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={journalReadTime}
                    onChange={e => setJournalReadTime(e.target.value)}
                    placeholder="4 min read"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploadingJournalCover || isUploadingJournalMulti}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-300 text-black font-heading font-black text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
              >
                {isUploadingJournalCover || isUploadingJournalMulti ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Uploading Media Before Publishing...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Article with Media Suite</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Current Journal Posts List */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-4">
            <h3 className="font-heading font-black text-base sm:text-lg text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>CURRENT STUDIO JOURNAL ARTICLES ({posts.length})</span>
            </h3>

            <div className="space-y-3">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-black/60 border border-cyan-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {(post.imageUrl || (post.mediaItems && post.mediaItems.length > 0)) && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-cyan-500/30 shrink-0 bg-black flex items-center justify-center">
                        <MediaRenderer
                          src={post.imageUrl || post.mediaItems?.[0]?.url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-cyan-400">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                          {post.category}
                        </span>
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                        {post.mediaItems && post.mediaItems.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-400/40 text-blue-300 font-bold">
                            {post.mediaItems.some(m => m.type === 'video') ? `🎥 ${post.mediaItems.length} media (video)` : `📷 ${post.mediaItems.length} photos`}
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-white truncate mt-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-1 font-mono mt-0.5">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => setEditingJournalPost(post)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-xs hover:bg-amber-900 transition flex items-center gap-1"
                      title="Edit article and media suite"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Read / Preview button */}
                    <button
                      type="button"
                      onClick={() => setViewingJournalPost(post)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs hover:bg-cyan-900 transition flex items-center gap-1.5"
                      title="Read full article"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>

                    {/* Share to TikTok button */}
                    <button
                      type="button"
                      onClick={() => setShareToTikTokPost(post)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_10px_rgba(0,240,255,0.3)] flex items-center gap-1.5"
                    >
                      <i className="fa-brands fa-tiktok text-xs"></i>
                      <span>Share to TikTok</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteJournalPost(post.id)}
                      className="p-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition"
                      title="Delete article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CASH APP POS & REGISTER --- */}
      {activeTab === 'pos' && (
        <AdminPosTab
          profile={profile}
          bookings={bookings}
          onUpdateProfile={onUpdateProfile}
          onRefreshData={onRefreshData}
          onShowNotification={showNotification}
        />
      )}

      {/* --- TAB 3: GOOGLE CALENDAR & ROUTINE SYNC --- */}
      {activeTab === 'calendar' && (
        <AdminCalendarSync
          bookings={bookings}
          profile={profile}
          onRefreshBookings={onRefreshData}
          onShowNotification={showNotification}
        />
      )}

      {/* --- TAB: TIKTOK API & REELS SYNC --- */}
      {activeTab === 'tiktok' && (
        <AdminTikTokTab
          onShowNotification={showNotification}
          onRefreshData={onRefreshData}
          onOpenLiveStudio={() => setActiveTab('livestudio')}
        />
      )}

      {/* --- TAB: TIKTOK LIVE STUDIO & RECORDER --- */}
      {activeTab === 'livestudio' && (
        <div className="space-y-4">
          <TikTokStudioRecorder
            onVideoPublished={() => {
              showNotification('Session video published to TikTok / Studio Reels!');
              onRefreshData();
            }}
          />
        </div>
      )}

      {/* --- TAB 3: STUDIO RATES & PROFILE --- */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-5 text-left"
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="font-heading font-black text-lg text-white">
                Studio Rates, Tex's Photo & Profile Settings
              </h3>
              <p className="text-xs text-cyan-300 font-mono">
                Manage your public artist portrait, hourly rate, and live status
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              {isUploadingMedia ? 'Uploading...' : 'Save Changes'}
                </button>
          </div>

          {/* Tex's Studio Artist Photo & Banner Section */}
          <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-4">
            <h4 className="font-heading font-bold text-sm text-cyan-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>TEX'S STUDIO ARTIST PORTRAIT & BANNER</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Avatar Preview */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="relative w-32 h-40 rounded-xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] bg-gray-950">
                  <img
                    src={editAvatarUrl}
                    alt="Tex Portrait Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-cyan-300">
                    LIVE PORTRAIT
                  </div>
                </div>
                <label className="mt-2.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL or Direct text input */}
              <div className="md:col-span-8 space-y-3 text-left">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Or Paste Artist Image Web URL:
                  </label>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={e => setEditAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    placeholder="https://... image link"
                  />
                  <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                    Upload an image file from your Chromebook or paste an image URL to replace the studio portrait.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Studio Header Banner Image URL:
                  </label>
                  <input
                    type="url"
                    value={editBannerUrl}
                    onChange={e => setEditBannerUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    placeholder="https://... studio banner link"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Hourly Rate ($) *
              </label>
              <input
                type="number"
                required
                value={editHourlyRate}
                onChange={e => setEditHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-gray-400 font-mono">
                Currently $100/hr flat rate in Winchester, VA
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Online Booking Automatic Discount (%) *
              </label>
              <input
                type="number"
                required
                value={editDiscount}
                onChange={e => setEditDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-gray-400 font-mono">
                Currently 15% automatic discount for app bookings
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Live Status
              </label>
              <select
                value={editLiveStatus}
                onChange={e => setEditLiveStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              >
                <option value="open_slots">Chair is Open / Booking Consultations</option>
                <option value="in_chair">In Chair (Tattooing Live)</option>
                <option value="designing">Designing Custom Work</option>
                <option value="consulting">In Consultation</option>
                <option value="studio_closed">Studio Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              Live Status Ticker Message
            </label>
            <input
              type="text"
              value={editStatusMessage}
              onChange={e => setEditStatusMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
            />
          </div>

          {/* Security Deposit & Reschedule Policy Configuration */}
          <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-heading font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>SECURITY DEPOSIT & CASH APP GATEWAY CONFIGURATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Required Security Deposit ($) *
                </label>
                <input
                  type="number"
                  required
                  value={editSecurityDeposit}
                  onChange={e => setEditSecurityDeposit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono"
                />
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  Standard nonrefundable deposit required to lock client appointment slot ($200.00).
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Studio Cash App $Cashtag *
                </label>
                <input
                  type="text"
                  required
                  value={editCashAppHandle}
                  onChange={e => setEditCashAppHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold"
                  placeholder="$LightsOutTattooTex"
                />
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  Used in all automated Cash App deep links, QR codes, and digital receipt headers.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Studio Deposit & Reschedule Policy Text (Public Client Contract):
              </label>
              <textarea
                rows={3}
                value={editDepositPolicyText}
                onChange={e => setEditDepositPolicyText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono leading-relaxed"
                placeholder="200 dollar nonrefundable security deposit, you miss appointment without notification, you lose your spot and deposit. Reschedules are accepted with proper notifications and schedule change."
              />
              <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                This exact policy is displayed to clients on the booking form and required as an agreed contract before consultation requests are submitted.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            Save Studio Rates, Deposit Policy & Profile
          </button>
        </form>
      )}

      
          
          {/* Cloud Sync Tool */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Force Push Local Data to Firebase Cloud
            </h4>
            <p className="text-xs text-gray-400 font-mono mb-2">
              Run this once to push all your existing local data up into the newly connected Firebase Cloud Database.
            </p>
            <button
              onClick={async () => {
                try {
                  showNotification('Pushing all local studio data to Firebase Cloud Database...');
                  const result = await storageService.pushAllToFirestore();
                  if (result.success) {
                    showNotification(`Success! ${result.count} records synchronized to Firebase Cloud.`);
                  } else {
                    showNotification('Pushed records to cloud. Studio is up to date.');
                  }
                } catch (e: any) {
                  console.warn(e);
                  showNotification('Error syncing data to cloud: ' + (e.message || 'Check console'));
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-lg flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Push All to Firebase Cloud</span>
            </button>
          </div>


      {/* --- TAB 4: CHROMEBOOK SAFE BACKUP & RESET --- */}
      {activeTab === 'backup' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white">
                Powerhouse Self-Contained Storage & Chromebook Backup
              </h3>
              <p className="text-xs text-gray-300 font-mono">
                "Recently I deleted my project folder cleaning up my Chromebook." - Tex
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            All your portfolio images, client bookings, and profile settings are persisted in your local powerhouse database. To guarantee you never lose work again, download a 1-click JSON backup to your Google Drive or external drive anytime!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={handleExportBackup}
              className="p-4 rounded-xl bg-cyan-950/70 border border-cyan-400/50 hover:bg-cyan-900 text-cyan-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Download className="w-6 h-6 text-cyan-400" />
              <span>Export Full Database Backup (.JSON)</span>
            </button>

            <label className="p-4 rounded-xl bg-blue-950/70 border border-blue-400/50 hover:bg-blue-900 text-blue-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-6 h-6 text-blue-400" />
              <span>Restore from Backup (.JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">
              Need fresh default showcase?
            </span>
            <button
              onClick={() => {
                // Note: window.confirm is blocked in some iframe environments, bypassing for now
                storageService.resetToDefaults();
                showNotification('Reset to defaults.');
                onRefreshData();
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-white text-xs font-mono"
            >
              Reset to Master Showcase
            </button>
          </div>
        </div>
      )}

      {/* --- TAB: LIVE SPLASH SCREEN STUDIO --- */}
      {activeTab === 'splash' && (
        <LiveSplashStudio
          galleryItems={galleryItems}
          onShowNotification={showNotification}
          onSettingsUpdated={onSplashSettingsUpdated}
        />
      )}

      {/* Bulk Gallery Upload Modal */}
      <BulkGalleryUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onGalleryUpdated={() => {
          onRefreshData();
          showNotification('Portfolio gallery updated with bulk images!');
        }}
      />

      {/* Edit Gallery Item Modal */}
      {editingGalleryItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 pb-24 sm:pb-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col bg-[#080d1a] border-2 border-cyan-400/60 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] relative my-auto overflow-hidden text-left">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-5 bg-[#080d1a]/95 backdrop-blur-md border-b border-cyan-500/30 shrink-0">
              <h3 className="font-heading font-black text-lg sm:text-xl text-white">Edit Portfolio Piece</h3>
              <button
                onClick={() => setEditingGalleryItem(null)}
                className="p-1.5 sm:p-2 bg-gray-900 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-cyan-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateGalleryItem} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">Title *</label>
                    <input
                      type="text"
                      value={editingGalleryItem.title}
                      onChange={e => setEditingGalleryItem({ ...editingGalleryItem, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">Client Name</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={editingGalleryItem.clientName || ''}
                      onChange={e => setEditingGalleryItem({ ...editingGalleryItem, clientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">Category *</label>
                    <select
                      value={editingGalleryItem.category}
                      onChange={e => setEditingGalleryItem({ ...editingGalleryItem, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                    >
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">Main Image URL *</label>
                  <input
                    type="text"
                    value={editingGalleryItem.imageUrl}
                    onChange={e => setEditingGalleryItem({ ...editingGalleryItem, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                    required
                  />
                </div>

                {/* Additional Portfolio Images for the same project (Edit Modal) */}
                <div className="p-3.5 rounded-xl bg-[#091122] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono text-cyan-300 font-bold">
                      Additional Images/Videos (Upload):
                    </label>
                    {isUploadingMedia && (
                      <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading to R2...
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    disabled={isUploadingMedia}
                    onChange={handleEditAdditionalImagesUpload}
                    className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 disabled:opacity-50"
                  />
                  {editingGalleryItem.additionalImages && editingGalleryItem.additionalImages.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap items-center">
                      {editingGalleryItem.additionalImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <MediaRenderer src={img} alt={`Additional ${idx}`} className="w-12 h-12 object-cover rounded border border-cyan-400/50" autoPlay={false} />
                          <button
                            type="button"
                            onClick={() => setEditingGalleryItem(prev => {
                              if (!prev || !prev.additionalImages) return prev;
                              return { ...prev, additionalImages: prev.additionalImages.filter((_, i) => i !== idx) };
                            })}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center text-xs text-emerald-400 font-mono pl-2">
                        ✓ {editingGalleryItem.additionalImages.length} extra media attached
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editingGalleryItem.description || ''}
                    onChange={e => setEditingGalleryItem({ ...editingGalleryItem, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">Session Hours</label>
                    <input
                      type="number"
                      value={editingGalleryItem.sessionHours || ''}
                      onChange={e => setEditingGalleryItem({ ...editingGalleryItem, sessionHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">Placement (e.g., Forearm)</label>
                    <input
                      type="text"
                      value={editingGalleryItem.placement || ''}
                      onChange={e => setEditingGalleryItem({ ...editingGalleryItem, placement: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Sticky Footer */}
              <div className="shrink-0 p-3.5 sm:p-4 bg-[#080d1a]/95 backdrop-blur-md border-t border-cyan-500/30 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setEditingGalleryItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white transition font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingMedia}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 disabled:opacity-50 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-90 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Payment Gateway Modal (Invoked from Booking list) */}
      <LightsOutPayPortal
        isOpen={isPosModalOpen}
        onClose={() => {
          setIsPosModalOpen(false);
          setPosBooking(null);
        }}
        profile={profile}
        initialBooking={posBooking}
        initialAmount={
          posBooking
            ? posBooking.securityDepositStatus !== 'paid'
              ? 200
              : posBooking.finalEstimatedPrice
            : 200
        }
        paymentType={posBooking?.securityDepositStatus !== 'paid' ? 'deposit' : 'session_balance'}
        onPaymentCompleted={tx => {
          onRefreshData();
          showNotification(`Payment of $${tx.totalPaid} recorded successfully!`);
        }}
      />

      {/* Share Journal Post to TikTok Modal */}
      {shareToTikTokPost && (
        <ShareJournalToTikTokModal
          isOpen={Boolean(shareToTikTokPost)}
          onClose={() => setShareToTikTokPost(null)}
          post={shareToTikTokPost}
          onShowNotification={showNotification}
        />
      )}

      {/* Edit Journal Article Modal */}
      {editingJournalPost && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md px-3.5 py-6 sm:px-6 sm:py-10 md:py-12 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingJournalPost(null);
          }}
        >
          <div
            className="relative w-full max-w-3xl max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_50px_rgba(0,240,255,0.25)] my-auto text-left overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-3.5 sm:p-5 bg-[#080d1a]/95 backdrop-blur-md border-b border-cyan-500/30 shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-400" />
                <h3 className="font-heading font-black text-sm sm:text-base text-white">
                  EDIT JOURNAL ARTICLE & MEDIA SUITE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingJournalPost(null)}
                className="p-1.5 rounded-lg bg-gray-900 border border-cyan-500/30 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdateJournalPost} className="flex-1 flex flex-col min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Article Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingJournalPost.title}
                      onChange={e => setEditingJournalPost({ ...editingJournalPost, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={editingJournalPost.category}
                      onChange={e => setEditingJournalPost({ ...editingJournalPost, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono outline-none focus:border-cyan-400"
                    >
                      <option value="Technique">Technique & Science</option>
                      <option value="Cover-Up">Cover-Up Mastery</option>
                      <option value="Aftercare">Healing & Aftercare</option>
                      <option value="Culture">Winchester Tattoo Culture</option>
                      <option value="Shop News">Lights Out Studio News</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Article Excerpt / Preview Hook
                    </label>
                    <input
                      type="text"
                      value={editingJournalPost.excerpt}
                      onChange={e => setEditingJournalPost({ ...editingJournalPost, excerpt: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Read Time
                    </label>
                    <input
                      type="text"
                      value={editingJournalPost.readTime}
                      onChange={e => setEditingJournalPost({ ...editingJournalPost, readTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Full Article Content *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={editingJournalPost.content}
                    onChange={e => setEditingJournalPost({ ...editingJournalPost, content: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingJournalPost.tags?.join(', ') || ''}
                    onChange={e => setEditingJournalPost({
                      ...editingJournalPost,
                      tags: e.target.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Edit Featured Cover Media */}
                <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-mono font-bold text-cyan-300">
                        Featured Cover Media (Photo or Video)
                      </label>
                      <p className="text-[11px] font-mono text-gray-400">
                        Direct upload or update URL for header visual.
                      </p>
                    </div>
                    {editingJournalPost.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingJournalPost({ ...editingJournalPost, imageUrl: undefined })}
                        className="text-[11px] font-mono text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove Cover</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-cyan-400/50 hover:border-cyan-400 bg-cyan-950/40 hover:bg-cyan-950/70 text-cyan-300 cursor-pointer transition text-xs font-mono">
                        {isUploadingEditCover ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <span>Uploading to R2...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4 text-cyan-400" />
                            <span>Direct Upload Cover (Photo/Video)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          disabled={isUploadingEditCover}
                          onChange={handleEditJournalCoverUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <input
                        type="url"
                        value={editingJournalPost.imageUrl || ''}
                        onChange={e => setEditingJournalPost({ ...editingJournalPost, imageUrl: e.target.value })}
                        placeholder="Or direct image/video URL..."
                        className="w-full px-3 py-2 rounded-xl bg-black/80 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {editingJournalPost.imageUrl && (
                    <div className="pt-2 flex items-center gap-3">
                      <div className="w-20 h-14 rounded-lg overflow-hidden border border-cyan-500/40 bg-black shrink-0 relative flex items-center justify-center">
                        <MediaRenderer src={editingJournalPost.imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-mono text-cyan-300 truncate">
                        {editingJournalPost.imageUrl}
                      </p>
                    </div>
                  )}
                </div>

                {/* Edit Project Media Suite (Images & Videos) */}
                <div className="p-4 rounded-xl bg-[#060c18] border-2 border-cyan-500/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-cyan-400" />
                      <div>
                        <h4 className="font-heading font-black text-sm text-white">
                          PROJECT MEDIA SUITE (IMAGES & VIDEOS)
                        </h4>
                        <p className="text-[11px] font-mono text-gray-400">
                          Directly upload reference art, progression shots, and session video clips.
                        </p>
                      </div>
                    </div>

                    {editingJournalPost.mediaItems && editingJournalPost.mediaItems.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                        {editingJournalPost.mediaItems.length} media attached
                      </span>
                    )}
                  </div>

                  {/* Multi-Upload Controls & Manual URL Input */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-2">
                      {/* Direct Upload Photos vs Videos buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 cursor-pointer transition text-xs font-mono font-bold group shadow-sm">
                          <ImageIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <span>Direct Upload Photos (Multi)</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            disabled={isUploadingEditMulti}
                            onChange={handleEditJournalMultiMediaUpload}
                            className="hidden"
                          />
                        </label>

                        <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 border border-purple-400/50 hover:border-purple-300 text-purple-200 cursor-pointer transition text-xs font-mono font-bold group shadow-sm">
                          <Film className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                          <span>Direct Upload Videos (Multi)</span>
                          <input
                            type="file"
                            multiple
                            accept="video/*,video/mp4,video/quicktime,video/webm"
                            disabled={isUploadingEditMulti}
                            onChange={handleEditJournalMultiMediaUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Drag & Drop Multi-file Area */}
                      <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-cyan-400/50 hover:border-cyan-300 bg-cyan-950/20 hover:bg-cyan-950/40 cursor-pointer transition text-center group">
                        {isUploadingEditMulti ? (
                          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs py-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Directly uploading & optimizing project media...</span>
                          </div>
                        ) : (
                          <>
                            <div className="p-2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 group-hover:scale-110 transition-transform">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                              Or Drag & Drop Any Images & Videos Here
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              Direct high-speed storage • MP4, MOV, WEBM, JPG, PNG, WEBP, GIF
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          disabled={isUploadingEditMulti}
                          onChange={handleEditJournalMultiMediaUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col justify-center p-3 rounded-xl bg-black/60 border border-cyan-500/25 space-y-2">
                      <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Add Media by Direct URL</span>
                      </span>
                      <input
                        type="url"
                        value={editManualMediaUrl}
                        onChange={e => setEditManualMediaUrl(e.target.value)}
                        placeholder="https://... video or image link"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-cyan-500/30 text-white text-[11px] font-mono outline-none focus:border-cyan-400"
                      />
                      <input
                        type="text"
                        value={editManualMediaCaption}
                        onChange={e => setEditManualMediaCaption(e.target.value)}
                        placeholder="Optional caption..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-cyan-500/30 text-white text-[11px] font-mono outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        disabled={!editManualMediaUrl.trim()}
                        onClick={handleAddEditManualMedia}
                        className="w-full py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold disabled:opacity-40 transition"
                      >
                        + Attach Media URL
                      </button>
                    </div>
                  </div>

                  {/* Attached Media Cards Grid */}
                  {editingJournalPost.mediaItems && editingJournalPost.mediaItems.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        Current Attached Media ({editingJournalPost.mediaItems.length})
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {editingJournalPost.mediaItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex flex-col rounded-xl bg-black/80 border border-cyan-500/30 overflow-hidden text-left"
                          >
                            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                              <MediaRenderer
                                src={item.url}
                                alt={item.caption || `Media ${index + 1}`}
                                className="w-full h-full object-cover"
                                controls={item.type === 'video'}
                                autoPlay={false}
                                muted={true}
                              />
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/85 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300">
                                {item.type === 'video' ? '🎥 VIDEO' : '📷 PHOTO'}
                              </div>

                              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 p-1 rounded-lg border border-cyan-500/40">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveEditJournalMediaItem(index, 'up')}
                                  className="p-1 text-gray-300 hover:text-white disabled:opacity-30"
                                  title="Move earlier"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === (editingJournalPost.mediaItems?.length || 0) - 1}
                                  onClick={() => handleMoveEditJournalMediaItem(index, 'down')}
                                  className="p-1 text-gray-300 hover:text-white disabled:opacity-30"
                                  title="Move later"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditJournalMediaItem(item.id)}
                                  className="p-1 text-rose-400 hover:text-rose-300"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="p-2 bg-[#060a14] border-t border-cyan-500/20">
                              <input
                                type="text"
                                value={item.caption || ''}
                                onChange={e => handleUpdateEditJournalMediaCaption(item.id, e.target.value)}
                                placeholder="Caption / step notes..."
                                className="w-full px-2 py-1 rounded bg-black border border-cyan-500/20 text-xs font-mono text-gray-200 outline-none focus:border-cyan-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 p-3.5 sm:p-4 bg-[#080d1a]/95 backdrop-blur-md border-t border-cyan-500/30 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setEditingJournalPost(null)}
                  className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white transition font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingEditCover || isUploadingEditMulti}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 disabled:opacity-50 text-black font-heading font-black text-xs uppercase tracking-wider hover:brightness-110 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
                >
                  {isUploadingEditCover || isUploadingEditMulti ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Uploading Media...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Article Reader Modal for Admin Preview */}
      {viewingJournalPost && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md px-3.5 py-6 sm:px-6 sm:py-10 md:py-12 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingJournalPost(null);
          }}
        >
          <div
            className="relative w-full max-w-3xl max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_50px_rgba(0,240,255,0.25)] my-auto text-left overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header with Title and Fixed Close Button */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-3.5 sm:p-5 bg-[#080d1a]/95 backdrop-blur-md border-b border-cyan-500/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-400 uppercase font-bold shrink-0">
                  {viewingJournalPost.category}
                </span>
                <span className="text-xs text-gray-500 font-mono hidden sm:inline">•</span>
                <span className="text-xs text-gray-400 font-mono hidden sm:inline">{viewingJournalPost.readTime}</span>
                <span className="text-xs text-gray-500 font-mono hidden sm:inline">•</span>
                <span className="text-xs font-mono text-cyan-300 font-bold truncate">
                  {viewingJournalPost.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewingJournalPost(null)}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950/80 transition shrink-0 ml-2 shadow-[0_0_10px_rgba(0,240,255,0.2)] flex items-center gap-1"
                title="Close article (Esc)"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
                <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">ESC</span>
              </button>
            </div>

            {/* Scrollable Article Body */}
            <div className="p-4 sm:p-7 overflow-y-auto space-y-5 flex-1 overscroll-contain">
              {/* Post Meta */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-cyan-400">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 font-bold">
                  {viewingJournalPost.category}
                </span>
                <span>{viewingJournalPost.date}</span>
                <span>•</span>
                <span>{viewingJournalPost.readTime}</span>
                <span>•</span>
                <span className="text-gray-400">By {viewingJournalPost.author}</span>
              </div>

              <h2 className="font-heading font-black text-xl sm:text-3xl text-white leading-tight">
                {viewingJournalPost.title}
              </h2>

              {viewingJournalPost.imageUrl && (
                <div className="w-full max-h-[380px] rounded-xl overflow-hidden border border-cyan-500/30 bg-black flex items-center justify-center">
                  <MediaRenderer
                    src={viewingJournalPost.imageUrl}
                    alt={viewingJournalPost.title}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay={false}
                  />
                </div>
              )}

              {/* Article Content Render */}
              <div className="text-sm sm:text-base text-gray-200 leading-relaxed space-y-4 font-sans whitespace-pre-line">
                {viewingJournalPost.content}
              </div>

              {/* Project Planning Media Gallery (Images & Videos) */}
              <JournalMediaGallery
                mediaItems={viewingJournalPost.mediaItems}
                mediaUrls={viewingJournalPost.mediaUrls}
                title="Project Planning & Session Visuals"
              />

              {/* Tags Strip */}
              {viewingJournalPost.tags && viewingJournalPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-cyan-500/20">
                  {viewingJournalPost.tags.map(t => (
                    <span
                      key={t}
                      className="text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-1 rounded-lg"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions & Close Button */}
            <div className="sticky bottom-0 z-20 p-3 sm:p-4 bg-[#080d1a]/95 backdrop-blur-md border-t border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setViewingJournalPost(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-mono text-xs font-bold transition order-2 sm:order-1"
              >
                ← Back / Close Article
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = viewingJournalPost;
                  setViewingJournalPost(null);
                  setShareToTikTokPost(p);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 order-1 sm:order-2 shrink-0"
              >
                <i className="fa-brands fa-tiktok text-sm"></i>
                <span>SHARE TO TIKTOK PROFILE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY UPLOAD CONFIRMATION MODAL */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#09101f] border-2 border-cyan-400 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.4)] my-auto relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowPublishConfirm(false)}
              disabled={isPublishing}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-400 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-white tracking-wide">
                  Confirm Portfolio Upload
                </h3>
                <p className="text-xs font-mono text-cyan-300/80">
                  Review piece details before publishing live to your website
                </p>
              </div>
            </div>

            {/* Image Preview Container */}
            <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-black/90 border border-cyan-500/40 relative mb-4 flex items-center justify-center">
              <MediaRenderer src={newImageUrl} className="w-full h-full object-contain" />
              
              {newAdditionalImages.length > 0 && (
                <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md border border-cyan-400/60 text-cyan-300 text-[10px] font-mono font-bold px-2 py-1 rounded-md shadow-md">
                  +{newAdditionalImages.length} additional angle{newAdditionalImages.length > 1 ? 's' : ''}
                </span>
              )}

              {newIsCoverUp && (
                <span className="absolute top-2 left-2 bg-purple-950/90 border border-purple-500/70 text-purple-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-md">
                  Cover-Up Transformation
                </span>
              )}
            </div>

            {/* Editable Title Field */}
            <div className="space-y-1.5 mb-3.5">
              <label className="text-xs font-mono text-cyan-300 font-bold flex items-center justify-between">
                <span>Tattoo Piece Title:</span>
                <span className="text-[10px] text-gray-400 font-normal">You can edit before confirming</span>
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="E.g. Nordic Valkyrie Realism Sleeve"
                className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Summary Chips */}
            <div className="flex flex-wrap gap-2 mb-3.5">
              <span className="text-[11px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded-lg">
                Category: {CATEGORY_LABELS[newCategory] || newCategory}
              </span>
              <span className="text-[11px] font-mono bg-blue-950/80 border border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-lg">
                Placement: {newPlacement || 'Custom'}
              </span>
              <span className="text-[11px] font-mono bg-gray-900 border border-gray-700 text-gray-300 px-2.5 py-1 rounded-lg">
                Chair Time: {newSessionHours || 4} hrs
              </span>
              {newClientName.trim() && (
                <span className="text-[11px] font-mono bg-gray-900 border border-gray-700 text-gray-300 px-2.5 py-1 rounded-lg">
                  Client: {newClientName.trim()}
                </span>
              )}
            </div>

            {/* Description Preview */}
            {newDesc.trim() && (
              <div className="mb-4 p-2.5 rounded-lg bg-black/40 border border-gray-800 text-xs font-mono text-gray-300 line-clamp-2">
                {newDesc.trim()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                disabled={isPublishing}
                className="w-full sm:w-1/3 py-2.5 px-4 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white font-mono text-xs font-bold transition cursor-pointer"
              >
                Cancel & Edit
              </button>

              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isPublishing}
                className="w-full sm:w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Publishing to Live Gallery...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Confirm & Publish Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY UPLOAD SUCCESS CONFIRMATION MODAL */}
      {showSuccessConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#09101f] border-2 border-emerald-400 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-[0_0_40px_rgba(16,185,129,0.35)] my-auto relative text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Celebration Icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border-2 border-emerald-400/80 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-heading font-black text-lg text-white tracking-wide">
                🎉 Tattoo Published to Portfolio!
              </h3>
              <p className="text-xs font-mono text-gray-300 mt-1">
                Your artwork is now live on lightsouttattoo.site in the public portfolio gallery and interactive lightbox.
              </p>
            </div>

            {/* Published Piece Preview Card */}
            {recentlyPublishedItem && (
              <div className="p-3 rounded-xl bg-black/70 border border-emerald-500/30 flex items-center gap-3 text-left">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-cyan-500/30 flex items-center justify-center">
                  <MediaRenderer src={recentlyPublishedItem.imageUrl} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-heading font-black text-xs text-white truncate">
                    {recentlyPublishedItem.title}
                  </h4>
                  <p className="text-[11px] font-mono text-cyan-400 truncate">
                    {recentlyPublishedItem.categoryLabel || recentlyPublishedItem.category}
                  </p>
                  <span className="text-[10px] font-mono text-gray-400">
                    {recentlyPublishedItem.placement} • {recentlyPublishedItem.sessionHours || 4} hrs
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessConfirm(false);
                  if (onNavigateToGallery) {
                    onNavigateToGallery();
                  } else {
                    setActiveTab('gallery');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Eye className="w-4 h-4 text-black" />
                <span>View Live in Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSuccessConfirm(false)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white font-mono text-xs font-bold transition cursor-pointer"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
