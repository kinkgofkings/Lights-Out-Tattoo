export type TattooCategoryKey =
  | 'black_and_grey'
  | 'realism'
  | 'color'
  | 'traditional'
  | 'coverups'
  | 'tribal'
  | 'mechanical'
  | 'steampunk'
  | 'new_skool'
  | 'portraits'
  | 'artwork'
  | 'photography'
  | 'digital_graphics'
  | 'miscellaneous';

export type ArtCategoryKey = 'all' | TattooCategoryKey;

export interface GalleryItem {
  id: string;
  title: string;
  clientName?: string;
  category: TattooCategoryKey;
  categoryLabel: string;
  imageUrl: string;
  additionalImages?: string[]; // Multiple images for this project
  beforeImageUrl?: string; // For cover-ups before/after comparison
  tags: string[];
  description: string;
  sessionHours?: number;
  placement?: string;
  isCoverUp?: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'youtube';
  youtubeId?: string;
  likes: number;
  userLiked?: boolean;
  commentsCount: number;
  tags: string[];
  createdAt: string;
  pinned?: boolean;
}

export interface JournalMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
}

export interface JournalPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  imageUrl?: string;
  mediaItems?: JournalMediaItem[];
  mediaUrls?: string[];
  tags: string[];
}

export interface Booking {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  tattooIdea: string;
  placement: string;
  approximateSize: string;
  isCoverUp: boolean;
  coverUpDescription?: string;
  referencePhotoUrl?: string;
  coverUpPhotoUrl?: string;
  estimatedHours: number;
  hourlyRate: number;
  estimatedPrice: number;
  discountPercent: number;
  finalEstimatedPrice: number;
  preferredDate: string;
  preferredTimeSlot: string;
  depositStatus?: 'unpaid' | 'paid' | 'forfeited';
  status: 'pending' | 'confirmed' | 'in_chair' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  // Security Deposit & Policy tracking
  securityDepositAmount?: number; // $200
  securityDepositStatus?: 'unpaid' | 'paid' | 'forfeited' | 'refunded';
  depositPolicyAccepted?: boolean;
  // Google Calendar Integration
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  googleCalendarSyncedAt?: string;
  // TikTok Live & Session Recording Add-on
  wantsTikTokSessionRecording?: boolean;
  sessionRecordingFee?: number;
  sessionRecordingWaiverId?: string;
}

export interface SessionRecordingWaiver {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  bookingId?: string;
  tattooConcept?: string;
  date: string;
  // Permissions & Consent
  consentVideoRecording: boolean;
  consentTikTokLiveStream: boolean;
  consentCommercialPosting: boolean;
  allowFaceVisibility: boolean; // if false, focus strictly on tattoo work
  allowAudioRecording: boolean;
  // Flat Fee Tracking
  videoPackageFee: number; // e.g. $45 flat fee
  paidStatus: 'unpaid' | 'paid' | 'included';
  signatureDataUrl?: string;
  signatureText?: string;
  signedAt: string;
}

export type LiveStatusType =
  | 'in_chair'
  | 'designing'
  | 'consulting'
  | 'open_slots'
  | 'studio_closed';

export interface ArtistProfile {
  artistName: string;
  businessName: string;
  tagline: string;
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  onlineDiscountPercent: number;
  // Studio Policy & Security Deposit
  securityDepositAmount: number; // $200
  depositPolicyText: string;
  // Payment & Cash App Gateway
  cashAppHandle: string; // e.g. '$LightsOutTattooTex'
  phone: string;
  emailPrimary: string;
  emailGeneral: string;
  website: string;
  location: string;
  address: string;
  serviceRadiusMiles: number;
  coordinates: { lat: number; lng: number };
  avatarUrl: string;
  bannerUrl: string;
  liveStatus: LiveStatusType;
  statusMessage: string;
  specialties: string[];
  socialLinks: {
    tiktok: string;
    instagram: string;
    youtube: string;
    facebook: string;
  };
  printifyStoreUrl?: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  location?: string;
  city?: string;
  rating: number;
  comment?: string;
  content?: string;
  tattooCategory?: string;
  tattooType?: string;
  verified: boolean;
  date: string;
  avatarUrl?: string;
}

export interface TikTokReel {
  id: string;
  videoId?: string;
  title: string;
  videoUrl?: string;
  thumbnailUrl: string;
  views?: string | number;
  likes: number;
  comments?: number;
  caption: string;
  tiktokUrl?: string;
  embedLink?: string;
  embedHtml?: string;
  youtubeEmbedId?: string;
  duration?: string;
  soundTitle?: string;
  hashtags?: string[];
}

export interface CityMarker {
  name: string;
  state: string;
  distanceMiles: number;
  driveTime: string;
  direction: string;
  ring: 25 | 50 | 75 | 100;
  xPercent: number; // 0-100 for SVG positioning
  yPercent: number; // 0-100 for SVG positioning
}

export interface PaymentTransaction {
  id: string; // e.g. 'LOT-PAY-9821'
  bookingId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  amount: number; // Subtotal before tip
  tipAmount: number;
  totalPaid: number;
  paymentType: 'deposit' | 'session_balance' | 'walk_in' | 'merch';
  paymentMethod: 'cash_app' | 'card_pos' | 'apple_pay' | 'cash';
  cashAppHandle?: string;
  note?: string;
  depositStatus?: 'unpaid' | 'paid' | 'forfeited';
  status: 'completed' | 'pending' | 'refunded';
  createdAt: string;
}

export interface SplashScreenScene {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  bulletPoints: string[];
  ctaText: string;
  ctaAction: 'enter' | 'booking' | 'gallery';
  highlightText?: string;
}

export interface ShowcasePhoto {
  id: string;
  url: string;
  caption: string;
  category?: string;
}

export interface SplashScreenSettings {
  enabled: boolean;
  showMode: 'always' | 'first_time_only';
  artworkVisibility: number; // 20 to 95
  overlayDarkness: number; // 10 to 80
  matrixSpeed: number; // 1 to 5
  avatarUrl?: string;
  showMatrixRain: boolean;
  showScanlines: boolean;
  showDualFeed: boolean;
  scenes: SplashScreenScene[];
  showcasePhotos: ShowcasePhoto[];
}

export interface AdminAuthSession {
  isAuthenticated: boolean;
  method: 'tiktok' | 'pin';
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  verifiedArtist?: boolean;
  loginTime: string;
}

