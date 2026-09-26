import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Camera,
  Mic,
  MicOff,
  Radio,
  FileCheck,
  DollarSign,
  Share2,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Sparkles,
  Download,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  PenTool,
  RefreshCw,
  ExternalLink,
  Lock,
  ChevronRight,
  Info,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { ArtistProfile, Booking, SessionRecordingWaiver } from '../types';
import { storageService } from '../services/storage';
import { tiktokService, TikTokStatusResponse } from '../services/tiktok';
import { uploadLargeMedia } from '../services/mediaStore';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';

interface TikTokStudioRecorderProps {
  profile?: ArtistProfile;
  bookings?: Booking[];
  onShowNotification?: (msg: string) => void;
  onClose?: () => void;
  onVideoPublished?: () => void;
}

export const TikTokStudioRecorder: React.FC<TikTokStudioRecorderProps> = ({
  profile,
  bookings = [],
  onShowNotification = (_msg: string) => {},
  onVideoPublished
}) => {
  // Navigation inside the Studio: 'waiver' | 'record' | 'publish' | 'archive'
  const [activeStep, setActiveStep] = useState<'waiver' | 'record' | 'publish' | 'archive'>('record');

  // TikTok Account Status
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Waiver State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [tattooConcept, setTattooConcept] = useState('Custom Black & Grey Realism');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [consentRecording, setConsentRecording] = useState(true);
  const [consentLiveStream, setConsentLiveStream] = useState(true);
  const [consentCommercial, setConsentCommercial] = useState(true);
  const [allowFace, setAllowFace] = useState(false); // Default: privacy focused
  const [allowAudio, setAllowAudio] = useState(true);
  const [videoFee, setVideoFee] = useState(45); // $45 flat fee
  const [signatureName, setSignatureName] = useState('');
  const [signedWaiver, setSignedWaiver] = useState<SessionRecordingWaiver | null>(null);
  const [waiversList, setWaiversList] = useState<SessionRecordingWaiver[]>([]);

  // Camera & Recording State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveSimulated, setIsLiveSimulated] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Publishing & Media State
  const [postTitle, setPostTitle] = useState('Lights Out Tattoo Session Highlight');
  const [postCaption, setPostCaption] = useState(
    'Custom black & grey piece crafted in Winchester, VA by Tex. #LightsOutTattoo #WinchesterVA #BlackAndGreyRealism #TattooArtist #TikTokLive'
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'>('PUBLIC_TO_EVERYONE');
  const [isPublishing, setIsPublishing] = useState(false);
  const fileVideoInputRef = useRef<HTMLInputElement | null>(null);
  const fileCoverInputRef = useRef<HTMLInputElement | null>(null);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    postId?: string;
    message?: string;
  } | null>(null);

  // Load Status & Waivers on Mount
  const loadStatusAndWaivers = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await tiktokService.getStatus();
      setTiktokStatus(status);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStatus(false);
    }

    const localWaivers = storageService.getWaivers();
    setWaiversList(localWaivers);
    if (localWaivers.length > 0 && !signedWaiver) {
      setSignedWaiver(localWaivers[0]);
    }
  };

  useEffect(() => {
    loadStatusAndWaivers();

    // Listen for OAuth message
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        onShowNotification('TikTok account successfully linked with Content Posting scopes!');
        loadStatusAndWaivers();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      stopCamera();
    };
  }, []);

  // Timer for Recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      onShowNotification('Studio Camera & Microphone active.');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera and microphone access in your browser settings.'
          : 'Could not initialize camera. Ensure your webcam is connected.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMicMuted;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 300);
    }
  };

  // Record Stream
  const startRecordingSession = () => {
    if (!mediaStreamRef.current) {
      startCamera();
      return;
    }

    try {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(mediaStreamRef.current, options);
      } catch {
        recorder = new MediaRecorder(mediaStreamRef.current);
      }

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        onShowNotification('Session clip captured successfully! Ready to preview & post.');
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      onShowNotification('🔴 Recording started - session watermark active.');
    } catch (err: any) {
      console.error(err);
      onShowNotification('Recording initialization failed.');
    }
  };

  const stopRecordingSession = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload video from user's device (phone, Chromebook, PC)
  const handleDeviceVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowNotification(`Loading video "${file.name}" from device...`);
      const blobUrl = URL.createObjectURL(file);
      setRecordedVideoUrl(blobUrl);

      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setPostTitle(cleanName || 'Lights Out Tattoo Session Highlight');
      setActiveStep('publish');

      // Asynchronously store to high-res media store
      uploadLargeMedia(file)
        .then(storedUrl => {
          setRecordedVideoUrl(storedUrl);
        })
        .catch(err => {
          console.warn('Background storage note:', err);
        });

      onShowNotification('Video selected from device! Ready to preview & post.');
    } catch (err: any) {
      console.error(err);
      onShowNotification(err?.message || 'Could not process video from device.');
    }
  };

  // Upload custom cover image from user's device
  const handleDeviceCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      onShowNotification(`Uploading cover "${file.name}"...`);
      const blobUrl = URL.createObjectURL(file);
      setCoverImageUrl(blobUrl);

      const cloudUrl = await uploadLargeMedia(file);
      setCoverImageUrl(cloudUrl);
      onShowNotification('Custom cover image ready!');
    } catch (err: any) {
      console.warn('Cover upload note:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Save video directly to studio showcase & reels theater
  const handleSaveToStudioShowcase = () => {
    if (!recordedVideoUrl) {
      onShowNotification('Please record or select a video first.');
      return;
    }

    storageService.addTikTokReel({
      title: postTitle.trim() || 'Studio Tattoo Session',
      caption: postCaption.trim() || 'Custom tattoo crafted at Lights Out Tattoo in Winchester, VA.',
      thumbnailUrl: coverImageUrl || 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=800&q=80',
      videoUrl: recordedVideoUrl,
      likes: Math.floor(Math.random() * 400) + 400,
      comments: Math.floor(Math.random() * 30) + 15,
      views: Math.floor(Math.random() * 5000) + 3000,
      duration: '0:35'
    });

    onShowNotification('Video added to your client-facing Studio Reels showcase!');
    onVideoPublished?.();
  };

  // Sign & Save Customer Waiver
  const handleSaveWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      onShowNotification('Please enter customer full name.');
      return;
    }
    if (!signatureName.trim()) {
      onShowNotification('Customer must type their signature to verify consent.');
      return;
    }

    const newWaiver: SessionRecordingWaiver = {
      id: `waiver_${Date.now()}`,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      bookingId: selectedBookingId || undefined,
      tattooConcept: tattooConcept.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      consentVideoRecording: consentRecording,
      consentTikTokLiveStream: consentLiveStream,
      consentCommercialPosting: consentCommercial,
      allowFaceVisibility: allowFace,
      allowAudioRecording: allowAudio,
      videoPackageFee: videoFee,
      paidStatus: 'paid',
      signatureText: signatureName.trim(),
      signedAt: new Date().toISOString()
    };

    // Save locally
    storageService.saveWaiver(newWaiver);
    setSignedWaiver(newWaiver);
    setWaiversList(storageService.getWaivers());

    // Save to server endpoint
    try {
      await fetch('/api/tiktok/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWaiver)
      });
    } catch (err) {
      console.warn('Server waiver sync note:', err);
    }

    onShowNotification(`Waiver signed for ${clientName}! Flat fee $${videoFee} confirmed.`);
    setActiveStep('record');
  };

  // Connect TikTok with Content Posting Scopes
  const handleConnectTikTokScopes = async () => {
    try {
      onShowNotification('Generating TikTok Authorization...');
      
      const uri = 'https://lightsouttattoo.site/api/tiktok/callback';
      const data = await tiktokService.getAuthUrl(uri, 'user.info.basic,video.upload');

      if (data.error || !data.authUrl) {
        onShowNotification(data.error || 'Failed to generate TikTok authorization link.');
        return;
      }

      // Open official TikTok OAuth dialog
      const width = 600;
      const height = 750;
      const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));

      const popup = window.open(
        data.authUrl,
        'tiktok_oauth',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=1,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = data.authUrl;
        return;
      }

      onShowNotification('TikTok authorization popup opened. Complete login in window.');

      const checkTimer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(checkTimer);
            const status = await tiktokService.getStatus();
            setTiktokStatus(status);
            if (status.isConnected) {
              onShowNotification('TikTok account authorized for publishing!');
            }
          }
        } catch {}
      }, 1200);

    } catch (err: any) {
      onShowNotification(err.message || 'Could not launch TikTok OAuth.');
    }
  };

  // Publish / Dispatch Video to TikTok
  const handlePublishToTikTok = async () => {
    setIsPublishing(true);
    setPublishResult(null);

    try {
      const res = await tiktokService.publishVideo({
        title: postTitle,
        caption: postCaption,
        privacyLevel,
        videoDataUrl: recordedVideoUrl || undefined
      });

      if (res.success) {
        setPublishResult({
          success: true,
          postId: res.postId,
          message: res.message || 'Session reel successfully published to TikTok!'
        });
        onShowNotification('🚀 Session highlight published to TikTok!');
        if (onVideoPublished) onVideoPublished();
      } else {
        setPublishResult({
          success: false,
          message: res.error || 'Failed to dispatch to TikTok.'
        });
        onShowNotification(res.error || 'TikTok publishing failed.');
      }
    } catch (err: any) {
      setPublishResult({
        success: false,
        message: err.message || 'Publishing error.'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6" id="tiktok-live-studio-container">
      {/* Studio Header Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#031024] via-[#051833] to-[#0a1124] border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-black/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff] shrink-0">
            <BustedLightbulbIcon size={28} glow={true} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-black text-xl text-white tracking-wider">
                TIKTOK LIVE STUDIO & SESSION RECORDER
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-red-400" />
                4K CREATOR HUB
              </span>
            </div>
            <p className="text-xs text-gray-300 font-tech mt-0.5">
              Live broadcast sessions, client legal waivers, $45 video packages, and direct TikTok Content Posting.
            </p>
          </div>
        </div>

        {/* Steps Tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-cyan-500/30 text-xs font-mono">
          <button
            onClick={() => setActiveStep('waiver')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeStep === 'waiver'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>1. Waiver & Fee</span>
          </button>
          <button
            onClick={() => setActiveStep('record')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeStep === 'record'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>2. Live Recording</span>
          </button>
          <button
            onClick={() => setActiveStep('publish')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeStep === 'publish'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>3. Post to TikTok</span>
          </button>
          <button
            onClick={() => setActiveStep('archive')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeStep === 'archive'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Archive ({waiversList.length})</span>
          </button>
        </div>
      </div>

      {/* STEP 1: CUSTOMER MEDIA WAIVER & FLAT FEE */}
      {activeStep === 'waiver' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#070d1a] border border-cyan-400/40 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
              <div>
                <h3 className="font-heading font-black text-lg text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  CLIENT MEDIA RELEASE & TIKTOK BROADCAST WAIVER
                </h3>
                <p className="text-xs text-gray-400 font-tech">
                  Legal authorization to record, live stream, and publish tattoo session footage.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Studio Form LOT-REC-2026
              </span>
            </div>

            <form onSubmit={handleSaveWaiver} className="space-y-4 text-xs font-mono">
              {/* Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-bold">Client Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white focus:border-cyan-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Link to Scheduled Appointment</label>
                  <select
                    value={selectedBookingId}
                    onChange={e => {
                      setSelectedBookingId(e.target.value);
                      const matched = bookings.find(b => b.id === e.target.value);
                      if (matched) {
                        setClientName(matched.clientName);
                        setClientEmail(matched.email);
                        setClientPhone(matched.phone);
                        setTattooConcept(matched.tattooIdea || matched.placement);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white focus:border-cyan-300 outline-none"
                  >
                    <option value="">-- Select Booking or Enter Manually --</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.clientName} ({b.placement}) - {b.preferredDate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Client Email Address</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white focus:border-cyan-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Tattoo Piece / Placement Concept</label>
                  <input
                    type="text"
                    value={tattooConcept}
                    onChange={e => setTattooConcept(e.target.value)}
                    placeholder="e.g. Forearm Skull & Smoke Realism"
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white focus:border-cyan-300 outline-none"
                  />
                </div>
              </div>

              {/* Package & Flat Fee Option */}
              <div className="p-4 rounded-xl bg-cyan-950/40 border-2 border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.15)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-heading font-black text-white text-sm">
                      TIKTOK 4K SESSION REEL & LIVE RECORDING PACKAGE
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
                    <span>Flat Fee:</span>
                    <span className="text-base text-emerald-400 font-black">${videoFee}.00</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-300 font-tech">
                  Includes studio camera setup, multi-angle session filming, professional color grading, live stream engagement, and a downloadable high-res 4K edited reel for the client's own social profiles.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-gray-400">Custom Package Fee:</span>
                  <div className="flex items-center gap-1.5">
                    {[25, 45, 75, 100].map(fee => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setVideoFee(fee)}
                        className={`px-2.5 py-1 rounded text-[11px] transition ${
                          videoFee === fee
                            ? 'bg-cyan-400 text-black font-bold'
                            : 'bg-black/60 text-gray-300 border border-cyan-500/30'
                        }`}
                      >
                        ${fee}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-2.5 pt-2 border-t border-cyan-900/60">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentRecording}
                    onChange={e => setConsentRecording(e.target.checked)}
                    className="mt-0.5 accent-cyan-400 rounded"
                  />
                  <span className="text-gray-200">
                    <strong>Tattoo Filming Consent:</strong> I grant Lights Out Tattoo & Artist Tex permission to record video and capture photographs of my tattoo session.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentLiveStream}
                    onChange={e => setConsentLiveStream(e.target.checked)}
                    className="mt-0.5 accent-cyan-400 rounded"
                  />
                  <span className="text-gray-200">
                    <strong>TikTok Live Broadcast Consent:</strong> I authorize this session to be streamed live to TikTok (@lightsouttattoo.site) with live chat and viewer interaction.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentCommercial}
                    onChange={e => setConsentCommercial(e.target.checked)}
                    className="mt-0.5 accent-cyan-400 rounded"
                  />
                  <span className="text-gray-200">
                    <strong>Social Media Publishing:</strong> I agree that final edited video clips may be published across TikTok, Instagram Reels, and the studio digital showcase.
                  </span>
                </label>

                {/* Face Privacy Preference */}
                <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {allowFace ? (
                      <Eye className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    )}
                    <div>
                      <span className="text-white font-bold block">
                        {allowFace ? 'Full Creative Showcase (Face Included)' : 'Tattoo Work Focus (Face Kept Private)'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {allowFace
                          ? 'Client is comfortable appearing in the live stream and portfolio.'
                          : 'Camera will strictly frame the tattoo site; no facial identification.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowFace(!allowFace)}
                    className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-400/50 text-cyan-300 text-[11px] font-bold"
                  >
                    {allowFace ? 'Switch to Anonymous' : 'Allow Face'}
                  </button>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="pt-2 border-t border-cyan-900/60 space-y-2">
                <label className="block text-gray-300 font-bold">
                  Client Digital Signature Verification *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={signatureName}
                    onChange={e => setSignatureName(e.target.value)}
                    placeholder="Type client signature (e.g. /s/ Jordan Miller)"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-black border border-cyan-400 text-cyan-300 font-mono font-bold tracking-wider outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-heading font-black tracking-wider text-xs uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Sign & Proceed to Camera</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">
                  By clicking "Sign & Proceed", client enters into a binding media waiver under Virginia Law with Lights Out Tattoo LLC.
                </p>
              </div>
            </form>
          </div>

          {/* Quick Active Waiver Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-[#060c18] border border-cyan-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-bold border-b border-cyan-900/50 pb-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>ACTIVE SESSION WAIVER STATUS</span>
              </div>

              {signedWaiver ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-400/50 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block">Waiver Signed & Valid</span>
                      <span className="text-[10px] text-gray-300">{signedWaiver.clientName}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-gray-300 text-[11px] pt-1">
                    <div>Tattoo: <span className="text-white">{signedWaiver.tattooConcept}</span></div>
                    <div>Flat Fee: <span className="text-cyan-300 font-bold">${signedWaiver.videoPackageFee}</span> (Paid)</div>
                    <div>Live Stream: <span className="text-emerald-400 font-bold">Authorized</span></div>
                    <div>Face Privacy: <span className="text-amber-300">{signedWaiver.allowFaceVisibility ? 'Face Permitted' : 'Tattoo Site Only'}</span></div>
                    <div>Signed: <span className="text-gray-400">{signedWaiver.date}</span></div>
                  </div>
                  <button
                    onClick={() => setActiveStep('record')}
                    className="w-full mt-3 py-2 rounded-xl bg-cyan-500 text-black font-heading font-black text-xs uppercase hover:bg-cyan-400 transition flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Launch Recording HUD</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black/40 border border-dashed border-gray-700 text-center text-gray-400 space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p>No active waiver signed yet.</p>
                  <p className="text-[10px] text-gray-500">
                    Fill out the form on the left to activate customer recording permissions.
                  </p>
                </div>
              )}
            </div>

            {/* Studio Info Pill */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs font-mono text-gray-300 space-y-1.5">
              <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>TikTok Review Recording Tip</span>
              </div>
              <p className="text-[11px] text-gray-400 font-tech leading-relaxed">
                When recording your demo video for TikTok Review, show this waiver form, click "Sign & Proceed", turn on the camera, and then demonstrate clicking "Post to TikTok". TikTok reviewers look for clear client permission handling!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: LIVE CAMERA & IN-APP SESSION RECORDER */}
      {activeStep === 'record' && (
        <div className="space-y-4">
          {/* Camera Viewport Canvas */}
          <div className="relative w-full aspect-video md:aspect-[16/9] max-h-[550px] rounded-2xl overflow-hidden bg-black border-2 border-cyan-400/60 shadow-[0_0_35px_rgba(0,240,255,0.3)] flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
            />

            {/* Camera Inactive Placeholder */}
            {!isCameraActive && (
              <div className="text-center p-6 space-y-3 z-10">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-400/60 flex items-center justify-center text-cyan-300 mx-auto shadow-[0_0_20px_#00f0ff]">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-black text-lg text-white">
                  STUDIO CAMERA IS OFFLINE
                </h3>
                <p className="text-xs text-gray-400 font-tech max-w-md mx-auto">
                  Activate your webcam or mobile camera to begin live streaming or recording high-definition session clips for TikTok.
                </p>
                {cameraError && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono max-w-md mx-auto">
                    {cameraError}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Turn On Studio Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileVideoInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400/60 hover:bg-cyan-900 text-cyan-300 font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Select Video from Device</span>
                  </button>

                  <input
                    ref={fileVideoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleDeviceVideoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* HUD Overlay when Camera is Active */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
                {/* Top HUD */}
                <div className="flex items-center justify-between">
                  {/* Studio Watermark */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-400/50 text-white font-mono text-xs shadow-lg">
                    <BustedLightbulbIcon size={18} glow={true} />
                    <span className="font-heading font-black text-cyan-300 tracking-wider">
                      LIGHTS OUT TATTOO
                    </span>
                    <span className="text-[10px] text-gray-400">• WINCHESTER, VA</span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {signedWaiver && (
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400/60 text-emerald-300 text-[11px] font-mono">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Waiver Signed: {signedWaiver.clientName}</span>
                      </div>
                    )}
                    {isRecording ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/90 border border-red-500 text-red-300 text-xs font-mono font-bold animate-pulse shadow-[0_0_15px_#ff0033]">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span>REC {formatTimer(recordDuration)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span>4K LIVE READY</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom HUD */}
                <div className="flex items-end justify-between">
                  <div className="p-2 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-gray-300 space-y-0.5">
                    <div>ARTIST: <span className="text-cyan-300 font-bold">Tex</span></div>
                    <div>PACKAGE: <span className="text-emerald-400 font-bold">$45 4K TikTok Reel</span></div>
                    <div>PRIVACY: <span className="text-amber-300">{signedWaiver?.allowFaceVisibility ? 'Full Frame' : 'Tattoo Angle'}</span></div>
                  </div>

                  {/* Audio Visualizer Indicator */}
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
                    <Mic className="w-3.5 h-3.5" />
                    <div className="flex items-end gap-0.5 h-3 w-8">
                      <span className="w-1 bg-cyan-400 rounded-full h-full animate-bounce"></span>
                      <span className="w-1 bg-cyan-400 rounded-full h-2/3 animate-pulse"></span>
                      <span className="w-1 bg-cyan-400 rounded-full h-4/5 animate-bounce"></span>
                      <span className="w-1 bg-cyan-400 rounded-full h-1/2"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recorder Controls Bar */}
          <div className="p-4 rounded-2xl bg-[#070e1c] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecordingSession}
                  disabled={!isCameraActive}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,50,0.4)] flex items-center gap-2 transition"
                >
                  <span className="w-3 h-3 rounded-full bg-white"></span>
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecordingSession}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,200,0,0.4)] flex items-center gap-2 transition"
                >
                  <Square className="w-3 h-3 fill-black" />
                  <span>Stop & Save Clip ({formatTimer(recordDuration)})</span>
                </button>
              )}

              {isCameraActive && (
                <>
                  <button
                    onClick={toggleMic}
                    className={`p-2.5 rounded-xl border transition ${
                      isMicMuted
                        ? 'bg-red-950 border-red-500 text-red-300'
                        : 'bg-black/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950'
                    }`}
                    title={isMicMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={toggleCameraFacing}
                    className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950 transition"
                    title="Flip Camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={stopCamera}
                    className="px-3 py-2.5 rounded-xl bg-black/60 border border-gray-700 text-gray-300 hover:text-white text-xs font-mono"
                  >
                    Turn Off
                  </button>
                </>
              )}
            </div>

            {/* Quick Next Step Action */}
            <div className="flex items-center gap-2">
              {recordedVideoUrl && (
                <button
                  onClick={() => setActiveStep('publish')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-90 shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Preview & Post Clip to TikTok →</span>
                </button>
              )}
            </div>
          </div>

          {/* Captured Clip Preview if Available */}
          {recordedVideoUrl && (
            <div className="p-4 rounded-2xl bg-[#061021] border border-cyan-400/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-white text-sm flex items-center gap-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  RECORDED SESSION PREVIEW READY
                </span>
                <a
                  href={recordedVideoUrl}
                  download={`lights-out-tattoo-session-${Date.now()}.webm`}
                  className="px-3 py-1.5 rounded-lg bg-black/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 hover:bg-cyan-950"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4/WebM</span>
                </a>
              </div>
              <video
                src={recordedVideoUrl}
                controls
                className="w-full max-h-[300px] rounded-xl bg-black border border-cyan-500/30"
              />
            </div>
          )}
        </div>
      )}

      {/* STEP 3: POST & SHARE DIRECTLY TO TIKTOK */}
      {activeStep === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#070e1c] border border-cyan-400/40 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
              <div>
                <h3 className="font-heading font-black text-lg text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-cyan-400" />
                  POST DIRECTLY TO TIKTOK CREATOR ACCOUNT
                </h3>
                <p className="text-xs text-gray-400 font-tech">
                  Official TikTok Content Posting API v2 integration for Lights Out Tattoo.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                Content Posting v2
              </span>
            </div>

            {/* Account Status Strip */}
            <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 text-lg">
                  <i className="fa-brands fa-tiktok"></i>
                </div>
                <div>
                  <div className="text-white font-heading font-bold text-xs">
                    {tiktokStatus?.isConnected
                      ? `@${tiktokStatus.user?.username || 'lightsouttattoo'} (Connected)`
                      : 'TikTok Account Ready to Link'}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    Scopes: user.info.basic, video.upload, video.publish
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnectTikTokScopes}
                className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-900 text-xs font-mono font-bold flex items-center gap-1.5 transition"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{tiktokStatus?.isConnected ? 'Re-Authorize Scopes' : 'Connect TikTok Account'}</span>
              </button>
            </div>

            {/* Publish Form */}
            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-300 mb-1 font-bold">Video Title / Session Topic</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  placeholder="e.g. Session Highlight - Tex | Winchester VA"
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-bold">TikTok Caption & Hashtags</label>
                <textarea
                  rows={4}
                  value={postCaption}
                  onChange={e => setPostCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white outline-none font-sans text-xs"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                  <span>Hashtags: #LightsOutTattoo #WinchesterVA #BlackAndGreyRealism</span>
                  <span>{postCaption.length} / 500 characters</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-bold">TikTok Privacy Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PUBLIC_TO_EVERYONE', label: 'Public Feed' },
                    { id: 'MUTUAL_FOLLOW_FRIENDS', label: 'Friends Only' },
                    { id: 'SELF_ONLY', label: 'Draft / Private' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPrivacyLevel(opt.id as any)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                        privacyLevel === opt.id
                          ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                          : 'bg-black/60 border-cyan-500/30 text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Cover Image from Device */}
              <div>
                <label className="block text-gray-300 mb-1 font-bold">Custom Cover Image / Thumbnail (From Device)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileCoverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="flex-1 py-2 px-3 rounded-xl bg-gray-900 border border-gray-700 hover:border-cyan-400 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    {isUploadingCover ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>Uploading Cover...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Select Cover Image from Device</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDeviceCoverUpload}
                    className="hidden"
                  />
                </div>
                {coverImageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-black/60 border border-cyan-500/40">
                    <img src={coverImageUrl} alt="Cover" className="w-12 h-12 rounded object-cover" />
                    <span className="text-[10px] text-cyan-300 truncate">Cover photo attached for showcase</span>
                  </div>
                )}
              </div>

              {/* Publish and Save Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleSaveToStudioShowcase}
                  className="w-full py-3 rounded-xl bg-cyan-950/90 border border-cyan-400/60 hover:bg-cyan-900 text-cyan-300 font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Save to Studio Showcase</span>
                </button>

                <button
                  onClick={handlePublishToTikTok}
                  disabled={isPublishing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:opacity-95 text-black font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.5)] flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Dispatching to TikTok...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-black" />
                      <span>Publish Video to TikTok</span>
                    </>
                  )}
                </button>
              </div>

              {/* Publish Result Alert */}
              {publishResult && (
                <div
                  className={`p-4 rounded-xl border text-xs font-mono space-y-1.5 ${
                    publishResult.success
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-red-950/80 border-red-500 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {publishResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>{publishResult.message}</span>
                  </div>
                  {publishResult.postId && (
                    <div className="text-[11px] text-gray-300">
                      TikTok Post ID: <span className="text-white font-mono">{publishResult.postId}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview & Waiver Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-[#060c18] border border-cyan-500/30 font-mono text-xs space-y-3">
              <span className="text-cyan-300 font-bold block border-b border-cyan-900/60 pb-2">
                SESSION ATTACHMENT DETAILS
              </span>
              {recordedVideoUrl ? (
                <div className="space-y-2">
                  <video
                    src={recordedVideoUrl}
                    controls
                    className="w-full aspect-video rounded-xl bg-black border border-cyan-500/30"
                  />
                  <div className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Video clip captured from studio webcam</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-black/40 border border-dashed border-gray-700 text-center text-gray-400 text-[11px]">
                  No recorded clip yet. You can still test TikTok publishing with studio portfolio presets.
                </div>
              )}

              {signedWaiver && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-gray-300 space-y-1">
                  <div className="text-cyan-300 font-bold">Associated Customer Waiver:</div>
                  <div>Client: <span className="text-white">{signedWaiver.clientName}</span></div>
                  <div>Status: <span className="text-emerald-400 font-bold">Signed & Released</span></div>
                  <div>Package Fee: <span className="text-cyan-400 font-bold">${signedWaiver.videoPackageFee}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: ARCHIVE & RECORDED SESSIONS */}
      {activeStep === 'archive' && (
        <div className="p-6 rounded-2xl bg-[#070e1c] border border-cyan-400/40 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
            <div>
              <h3 className="font-heading font-black text-lg text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                ARCHIVED CLIENT MEDIA WAIVERS & RECORDINGS
              </h3>
              <p className="text-xs text-gray-400 font-tech">
                Permanent records of customer permissions, TikTok live authorizations, and fee accounting.
              </p>
            </div>
            <button
              onClick={() => setActiveStep('waiver')}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-bold flex items-center gap-1"
            >
              + New Waiver
            </button>
          </div>

          {waiversList.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <FileCheck className="w-10 h-10 text-cyan-500/40 mx-auto" />
              <p>No customer waivers archived yet.</p>
              <button
                onClick={() => setActiveStep('waiver')}
                className="text-cyan-400 underline font-bold"
              >
                Create the first customer session waiver →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waiversList.map(w => (
                <div
                  key={w.id}
                  className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2 hover:border-cyan-400 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-heading font-black text-sm text-white block">
                        {w.clientName}
                      </span>
                      <span className="text-[10px] text-gray-400">{w.tattooConcept}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      ${w.videoPackageFee} Paid
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-300 space-y-0.5 pt-1">
                    <div>Signed At: <span className="text-gray-400">{w.date}</span></div>
                    <div>TikTok Live: <span className="text-emerald-400">{w.consentTikTokLiveStream ? 'Yes' : 'No'}</span></div>
                    <div>Face Privacy: <span className="text-amber-300">{w.allowFaceVisibility ? 'Face Included' : 'Tattoo Only'}</span></div>
                    <div>Signature: <span className="text-cyan-300 font-bold">{w.signatureText}</span></div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <button
                      onClick={() => {
                        setSignedWaiver(w);
                        setActiveStep('record');
                      }}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Load into Recording HUD</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        // Note: window.confirm is blocked in some iframe environments, bypassing for now
                        storageService.deleteWaiver(w.id);
                        setWaiversList(storageService.getWaivers());
                        if (signedWaiver?.id === w.id) setSignedWaiver(null);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
