import { SplashScreenSettings, SplashScreenScene, ShowcasePhoto } from '../types';

export const defaultSplashScenes: SplashScreenScene[] = [
  {
    id: 'scene-1',
    badge: 'VERIFIED MASTER ARTIST • 20+ YRS NEEDLE EXPERIENCE',
    title: 'ENTER LIGHTS OUT TATTOO',
    subtitle: 'Northern Shenandoah Valley’s premier high-voltage studio by lead artist Tex.',
    bulletPoints: [
      'Hyper-detailed black & grey realism and photorealistic portraits',
      'Flawless cover-up reconstructions that make old, blown-out ink disappear',
      'Hospital-grade sterile field protocol and single-use cartridge systems'
    ],
    ctaText: 'Touch to Enter Studio',
    ctaAction: 'enter',
    highlightText: 'Winchester, VA • 100-Mile Radius'
  },
  {
    id: 'scene-2',
    badge: 'DARK NEO • SLEEVES • CUSTOM ILLUSTRATIVE',
    title: 'CUSTOM INK & FLASH VAULT',
    subtitle: 'Exclusive original tattoo concepts engineered specifically for your body anatomy.',
    bulletPoints: [
      'Dark neo-traditional skulls, wildlife anatomy, and intricate clockwork',
      'Biomechanical voltage flow and custom mechanical spine sleeves',
      'Vault access to claim exclusive flash pieces before public release'
    ],
    ctaText: 'Explore Artwork Vault',
    ctaAction: 'gallery',
    highlightText: 'Original Art by Tex'
  },
  {
    id: 'scene-3',
    badge: 'EXCLUSIVE WEB APPOINTMENTS • SAVE 15%',
    title: 'VIP BOOKINGS & CONSULTATIONS',
    subtitle: 'Lock in your session date directly through the app at $85/hr (Regular $100/hr).',
    bulletPoints: [
      'Real-time appointment schedule with instant estimate calculations',
      'Secure $200 security deposit locks your chair slot on the calendar',
      'Direct 1-on-1 reference review and design consultation with Tex'
    ],
    ctaText: 'Book Session Now (-15%)',
    ctaAction: 'booking',
    highlightText: '$85/hr Online Rate'
  },
  {
    id: 'scene-4',
    badge: 'CLINICAL GRADE HEALING RECOVERY',
    title: 'AFTERCARE & HEALING PROTOCOL',
    subtitle: 'Complete post-needle care instructions and direct artist check-in during your recovery.',
    bulletPoints: [
      'Medical-grade SecondSkin barrier application and removal schedules',
      'Unscented antibacterial wash routines and non-comedogenic hydration',
      'Direct texting line with Tex for healing check-ins and touch-up guarantee'
    ],
    ctaText: 'View Studio Protocol',
    ctaAction: 'enter',
    highlightText: '100% Healed Guarantee'
  },
  {
    id: 'scene-5',
    badge: 'OFFICIAL TIKTOK & VIRGINIA COMMUNITY',
    title: 'THE COLLECTIVE FEED',
    subtitle: 'Daily client sessions, freshly dropped flash, guest spots, and live studio streams.',
    bulletPoints: [
      'Official TikTok live studio streaming and 4K time-lapse packages',
      'Serving Winchester, Berryville, Front Royal, Martinsburg, and beyond',
      'Direct one-tap video sharing to TikTok with verified artist credentials'
    ],
    ctaText: 'Enter Tattoo Studio',
    ctaAction: 'enter',
    highlightText: '@lightsouttattoo.site'
  }
];

export const defaultShowcasePhotos: ShowcasePhoto[] = [
  {
    id: 'photo-1',
    url: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=900&q=80',
    caption: 'Hyper-Realistic Screech Owl (14h Forearm)',
    category: 'Realism'
  },
  {
    id: 'photo-2',
    url: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=900&q=80',
    caption: 'Anatomical Skull & Fractured Clockwork',
    category: 'Dark Art'
  },
  {
    id: 'photo-3',
    url: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=900&q=80',
    caption: 'Lead Artist Tex in the Chair • Lights Out Studio',
    category: 'Studio'
  },
  {
    id: 'photo-4',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80',
    caption: 'Artist Portrait • Tex Winchester VA',
    category: 'Artist'
  },
  {
    id: 'photo-5',
    url: 'https://images.unsplash.com/photo-1590246814883-578336214300?auto=format&fit=crop&w=900&q=80',
    caption: 'Raven & Obsidian Cover-Up Transformation',
    category: 'Cover-Up'
  },
  {
    id: 'photo-6',
    url: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?auto=format&fit=crop&w=900&q=80',
    caption: 'Alpha Timber Wolf & Mist Pine Trees',
    category: 'Wildlife'
  },
  {
    id: 'photo-7',
    url: 'https://images.unsplash.com/photo-1531891437562-4301cf092a93?auto=format&fit=crop&w=900&q=80',
    caption: 'Dark Neo Dagger Through Serpent Skull',
    category: 'Dark Neo'
  },
  {
    id: 'photo-8',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
    caption: 'Old Skool Antique Rotary & Voltage Needles',
    category: 'Machines'
  }
];

export const defaultSplashSettings: SplashScreenSettings = {
  enabled: true,
  showMode: 'always',
  artworkVisibility: 65, // 65% artwork visibility for optimal balance
  overlayDarkness: 35,   // 35% darkness so artwork clearly shows through
  matrixSpeed: 3,        // Balanced Matrix rain flow
  avatarUrl: '', // Default empty
  showMatrixRain: true,
  showScanlines: true,
  showDualFeed: true,
  scenes: defaultSplashScenes,
  showcasePhotos: defaultShowcasePhotos
};
