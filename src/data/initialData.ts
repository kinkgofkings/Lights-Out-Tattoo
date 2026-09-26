import { ArtistProfile, GalleryItem, Post, JournalPost, Testimonial, TikTokReel, CityMarker, Booking, PaymentTransaction } from '../types';

export const initialProfile: ArtistProfile = {
  artistName: 'Tex',
  businessName: 'Lights Out Tattoo',
  tagline: 'Precision Black & Grey Realism • Custom Cover-Ups • High Voltage Dark Art',
  bio: 'Over 20 years of relentless needlecraft and dark artistry. Born and bred in the craft, I specialize in hyper-detailed black & grey realism, photorealistic portraits, complex botanical & wildlife shading, and complete cover-up reconstructions that make bad ink vanish forever. Servicing Northern Shenandoah Valley and a 100-mile radius around Winchester, Virginia.',
  experienceYears: 20,
  hourlyRate: 100,
  onlineDiscountPercent: 15,
  securityDepositAmount: 200,
  depositPolicyText: '$200 nonrefundable security deposit required to secure any appointment. If you miss your appointment without prior notification, you lose your spot and your deposit is forfeited. Reschedules are accepted with proper notification and schedule change.',
  cashAppHandle: '$texxx360',
  phone: '826-255-0831',
  emailPrimary: 'tex@lightsouttattoo.site',
  emailGeneral: 'info@lightsouttattoo.site',
  website: 'https://lightsouttattoo.site',
  location: 'Winchester, Virginia',
  address: 'Historic Downtown District, Winchester, VA 22601',
  serviceRadiusMiles: 100,
  coordinates: { lat: 39.1857, lng: -78.1633 },
  // High quality photo matching Tex's cyberpunk aesthetic (bearded, glasses, tactical sleeve, cyan lighting)
  avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1600&q=80',
  liveStatus: 'open_slots',
  statusMessage: '⚡ Chair is Open • Book Now & Claim -15% Online Discount!',
  specialties: [
    'Black & Grey Realism',
    'Heavy Cover-Ups & Reworks',
    'Custom Dark Neo-Traditional',
    'Wildlife & Floral Anatomy',
    'Skulls & Biomechanical High-Voltage',
    'Old Skool Machine Flash'
  ],
  socialLinks: {
    tiktok: 'https://www.tiktok.com/@lightsouttattoo.site',
    instagram: 'https://instagram.com/lightsouttattoova',
    youtube: 'https://youtube.com/@lightsouttattoo',
    facebook: 'https://facebook.com/lightsouttattoova'
  },
  printifyStoreUrl: 'https://lightsouttattoo.site/merch'
};

export const initialGallery: GalleryItem[] = [];

export const initialPosts: Post[] = [
  {
    id: 'post-1',
    authorName: 'Tex',
    authorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    title: '⚡ Fall Realism & Cover-Up Slots Open | Automatic 15% Discount on Online Bookings',
    content: 'What’s good Winchester and Shenandoah crew! We just unlocked booking slots for late September & October. If you have an embarrassing tattoo from years ago that needs disappearing, or you want to start a full black and grey sleeve, now is the time. Remember: any booking submitted right through this app gets an automatic 15% discount applied at deposit time. Call me directly at (826) 255-0831 or use the booking tab below!',
    mediaUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=900&q=80',
    mediaType: 'image',
    likes: 48,
    commentsCount: 12,
    tags: ['Booking', 'Special', 'WinchesterVA', 'Realism'],
    createdAt: '2026-09-05T14:30:00Z',
    pinned: true
  },
  {
    id: 'post-2',
    authorName: 'Tex',
    authorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    title: 'Behind The Machine: How We Made a 25-Year-Old Tribal Dragon Disappear',
    content: 'A lot of guys think you need laser treatments before you can cover heavy black ink. With proper contrast theory and knowing where to push the deep blacks vs where to cast negative skin breaks, we swallowed up this client’s old faded tribal with zero bleed-through. Swipe through the cover-up gallery tab to see the before and after slider!',
    mediaUrl: 'https://images.unsplash.com/photo-1550537687-c91072c4792d?auto=format&fit=crop&w=900&q=80',
    mediaType: 'image',
    likes: 67,
    commentsCount: 19,
    tags: ['CoverUpMastery', 'TattooEducation', 'BlackAndGrey'],
    createdAt: '2026-09-02T11:15:00Z'
  },
  {
    id: 'post-3',
    authorName: 'Tex',
    authorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    title: 'High-Voltage Rotary & Coil Setup: 20 Years of Tuning',
    content: 'Tuning machines is a dying art. When you hear that crisp 125Hz buzz, you know the needle depth is hitting the dermis with absolute surgical precision. No trauma, minimal redness, healed smooth as silk.',
    mediaType: 'youtube',
    youtubeId: 'dQw4w9WgXcQ', // Clean embed
    likes: 35,
    commentsCount: 7,
    tags: ['TattooMachines', 'Craftsmanship', 'OldSkool'],
    createdAt: '2026-08-28T18:45:00Z'
  }
];

export const initialTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    clientName: 'Marcus Vance',
    location: 'Winchester, VA',
    rating: 5,
    comment: 'Tex is an absolute wizard. I had a disastrous home tattoo on my shoulder for 12 years that I was embarrassed to take my shirt off for. Tex designed a custom black & grey owl that completely made the old ink vanish. You cannot see a single trace of the old tattoo. Cleanest studio in the Shenandoah Valley, and the $100/hr rate with the online discount is unbeatable for this caliber of art.',
    tattooCategory: 'Cover-Up & Realism',
    verified: true,
    date: 'August 2026'
  },
  {
    id: 'test-2',
    clientName: 'Sarah Jenkins',
    location: 'Martinsburg, WV',
    rating: 5,
    comment: 'Drove 30 minutes from Martinsburg to Winchester specifically for Tex’s realism work. His feather and fur texture on my wolf chest piece looks like a high-definition photograph. His 20+ years of experience shows immediately—he has a remarkably gentle hand, very light trauma on the skin, and it healed fully in less than 10 days.',
    tattooCategory: 'Black & Grey Realism',
    verified: true,
    date: 'July 2026'
  },
  {
    id: 'test-3',
    clientName: 'David Miller',
    location: 'Front Royal, VA',
    rating: 5,
    comment: 'Lights Out Tattoo is the only shop I will ever go to. Tex is professional, upfront, and tells you straight up how a piece will age. The interactive pricing estimator in the app was spot on, and he honored the 15% app discount with no questions asked. 10/10 recommend!',
    tattooCategory: 'Skull & Clockwork Sleeve',
    verified: true,
    date: 'July 2026'
  },
  {
    id: 'test-4',
    clientName: 'Brandon Kowalski',
    location: 'Frederick, MD',
    rating: 5,
    comment: 'Traveled down to Winchester for a two-day back session. The high-voltage studio atmosphere is unreal, music was killer, and Tex’s attention to detail is obsessive in the best way possible. True black and grey master.',
    tattooCategory: 'Back Piece Realism',
    verified: true,
    date: 'June 2026'
  }
];

export const initialTikTokReels: TikTokReel[] = [
  {
    id: 'reel-poppy-memorial',
    videoId: '',
    title: 'Poppy Memorial Realism Leg Piece • Lessons Not Learned in Blood',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=600&q=80',
    views: '1.2K',
    likes: 412,
    comments: 28,
    caption: 'Remembering Poppy: "Remembering you is easy I do it everyday. Missing you is the hardest part but never goodbye. 02/09/2013." Handcrafted realism leg sleeve at Lights Out Tattoo in Winchester, VA.',
    duration: '0:42',
    videoUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    tiktokUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    embedLink: '',
    soundTitle: 'Original Audio - The Dirty Texan | Lights Out Tattoo',
    hashtags: ['lightsouttattoo', 'winchesterva', 'blackandgreyrealism', 'tattoomemorial', 'thedirtytexan']
  },
  {
    id: 'reel-heals-brokenhearted',
    videoId: '',
    title: 'He Heals The Brokenhearted & Binds Up Their Wounds • Psalms 147:3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=600&q=80',
    views: '1.8K',
    likes: 638,
    comments: 45,
    caption: 'Faith, healing, and spiritual ink at Lights Out Tattoo, Winchester VA. "He heals the brokenhearted and binds up their wounds." - Psalms 147:3.',
    duration: '0:30',
    videoUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    tiktokUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    embedLink: '',
    soundTitle: 'Atmospheric Worship & Reverence - Ambient Studio',
    hashtags: ['faith', 'healing', 'psalms147', 'lightsouttattoo', 'winchesterva']
  },
  {
    id: 'reel-tex-behind-the-machine',
    videoId: '',
    title: 'The Dirty Texan • Lessons Not Learned In Blood Are Soon Forgotten',
    thumbnailUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    views: '2.4K',
    likes: 520,
    comments: 34,
    caption: 'Tex in the Winchester studio breaking down custom black & grey realism needlework, client aftercare, and the code of the needle.',
    duration: '0:38',
    videoUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    tiktokUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    embedLink: '',
    soundTitle: 'Pure Coil Hum 120Hz - Tex Studio Audio',
    hashtags: ['thedirtytexan', 'lightsouttattoo', 'winchesterva', 'oldschooltattoo']
  },
  {
    id: 'reel-winchester-community',
    videoId: '',
    title: 'Winchester & Frederick County Community Update • I-81 Corridor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    views: '980',
    likes: 310,
    comments: 19,
    caption: 'Standing with our local Winchester, Frederick County, and Shenandoah Valley community. 100% locally owned and operated.',
    duration: '0:28',
    videoUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    tiktokUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    embedLink: '',
    soundTitle: 'Local News & Studio Dispatch',
    hashtags: ['winchesterva', 'frederickcounty', 'virginia', 'community']
  },
  {
    id: 'reel-cyberpunk-dark-realism',
    videoId: '',
    title: 'Cybernetic Armor & Dark Realism Stencil Concept • The Dirty Texan',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    views: '1.5K',
    likes: 480,
    comments: 22,
    caption: 'Custom digital and needle concept render for large-scale biomechanical and sci-fi realism arm sleeves.',
    duration: '0:35',
    videoUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    tiktokUrl: 'https://www.tiktok.com/@lightsouttattoo.site',
    embedLink: '',
    soundTitle: 'Dark Synthwave - Cyber Pulse',
    hashtags: ['cyberpunk', 'darkrealism', 'tattoodesign', 'lightsouttattoo']
  }
];

export const initialJournalPosts: JournalPost[] = [
  {
    id: 'journal-1',
    title: 'The Art of the Cover-Up: Why Old Inks Need Black & Grey Realism',
    excerpt: 'Clients come to Winchester convinced their old, blown-out tribal or ex-lover name requires painful laser sessions. Here is why strategic greywash textures and depth control beat lasers.',
    content: `When a client walks through the doors of Lights Out Tattoo in Winchester carrying a 10- or 20-year-old regret, the first question they ask is: "Tex, will I have to get this lasered first?"\n\nThe honest answer in 95% of cases is no. Laser removal takes months, costs thousands, and often leaves scar tissue that makes tattooing harder later.\n\nCover-up mastery isn't about slapping a solid black block over old ink. It is an exercise in optical physics and anatomical flow. The human eye is naturally drawn toward areas of highest contrast and sharp focal detail—the glint in an owl’s eye, the highlights on a crow's feathers, the fractured teeth of a hyper-detailed skull.\n\nBy anchoring dense, rich carbon blacks directly over the old pigment and radiating outward with delicate 3-shade greywashes into clean virgin skin, the old tattoo doesn't just get covered—it vanishes into the background architecture of the piece.\n\nIf you have old ink in Northern Virginia, West Virginia, or Maryland that you hide at the pool, book a consultation right here in the app. We will make it disappear.`,
    category: 'Cover-Up Mastery',
    date: 'September 2026',
    readTime: '4 min read',
    author: 'Tex',
    imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1200&q=80',
    tags: ['CoverUp', 'BlackAndGrey', 'LaserAlternative', 'Realism']
  },
  {
    id: 'journal-2',
    title: 'Needle Craft & High Voltage: 20 Years in the Northern Shenandoah',
    excerpt: 'Reflecting on over two decades behind the machine in Winchester, VA—from hand-wound coils to rotary precision, and what never changes in real tattooing.',
    content: `Twenty years is a long time in any industry, but in tattooing, it spans an entire generational shift. When I started, you soldered your own needle groupings onto needle bars over a butane torch and tuned contact screws by ear on heavy iron frames.\n\nToday, cartridge needles and high-torque wireless rotaries give us microscopic precision that makes pore-level realism and velvet-smooth gradients possible.\n\nYet the fundamentals never change. Stretch the skin tight, keep your machine angle consistent, know exactly which layer of the dermis holds pigment without bleeding, and treat every single client like they are wearing your art for the rest of their natural life.\n\nServing Winchester, Front Royal, Martinsburg, and the entire 100-mile Shenandoah radius has been an honor. Thank you to everyone who has sat in my chair.`,
    category: 'Studio Chronicles',
    date: 'August 2026',
    readTime: '3 min read',
    author: 'Tex',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=80',
    tags: ['20Years', 'Craftsmanship', 'WinchesterVA', 'History']
  },
  {
    id: 'journal-3',
    title: 'Aftercare Secrets: Protecting Contrast and Deep Black Tones',
    excerpt: 'The session is only half the work. How you protect your piece during the first 14 days determines whether your contrast lasts 30 years or fades in 3.',
    content: `You just spent 6 hours in the chair, and your skin is buzzing with fresh ink. Now begins the most critical phase: aftercare.\n\n1. Second Skin & Protective Wraps: Leave medical film on for the first 24-48 hours unless fluid accumulation breaks the adhesive seal. When removing, peel gently under lukewarm running water.\n2. Wash with Unscented Antibacterial Soap: Use only clean hands—never washcloths or sponges which harbor bacteria.\n3. Thin, Breathable Ointment: Never suffocate the tattoo under thick globs of petroleum jelly. A pea-sized dab of light moisturizer patted gently twice a day is plenty.\n4. Sunscreen is King: Once fully healed (after 3 weeks), apply SPF 50+ whenever outdoors. UV rays break down pigment molecules faster than anything else.\n\nTake care of your ink, and your ink will represent you proudly forever.`,
    category: 'Client Guide',
    date: 'July 2026',
    readTime: '3 min read',
    author: 'Tex',
    imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=1200&q=80',
    tags: ['Aftercare', 'Healing', 'Sunscreen', 'Contrast']
  }
];

export const serviceCities: CityMarker[] = [
  { name: 'Winchester', state: 'VA', distanceMiles: 0, driveTime: 'Studio Hub', direction: 'Center', ring: 25, xPercent: 50, yPercent: 50 },
  { name: 'Stephens City', state: 'VA', distanceMiles: 8, driveTime: '12 min', direction: 'South', ring: 25, xPercent: 50, yPercent: 56 },
  { name: 'Berryville', state: 'VA', distanceMiles: 11, driveTime: '15 min', direction: 'East', ring: 25, xPercent: 58, yPercent: 49 },
  { name: 'Strasburg', state: 'VA', distanceMiles: 18, driveTime: '22 min', direction: 'South-West', ring: 25, xPercent: 44, yPercent: 62 },
  { name: 'Front Royal', state: 'VA', distanceMiles: 21, driveTime: '26 min', direction: 'South-East', ring: 25, xPercent: 59, yPercent: 64 },
  { name: 'Martinsburg', state: 'WV', distanceMiles: 22, driveTime: '25 min', direction: 'North-East', ring: 25, xPercent: 56, yPercent: 35 },
  { name: 'Charles Town', state: 'WV', distanceMiles: 25, driveTime: '30 min', direction: 'East-North-East', ring: 25, xPercent: 65, yPercent: 43 },
  { name: 'Woodstock', state: 'VA', distanceMiles: 31, driveTime: '35 min', direction: 'South-West', ring: 50, xPercent: 40, yPercent: 71 },
  { name: 'Leesburg', state: 'VA', distanceMiles: 39, driveTime: '45 min', direction: 'East', ring: 50, xPercent: 74, yPercent: 48 },
  { name: 'Hagerstown', state: 'MD', distanceMiles: 43, driveTime: '48 min', direction: 'North', ring: 50, xPercent: 54, yPercent: 24 },
  { name: 'Frederick', state: 'MD', distanceMiles: 51, driveTime: '55 min', direction: 'North-East', ring: 75, xPercent: 72, yPercent: 28 },
  { name: 'Culpeper', state: 'VA', distanceMiles: 58, driveTime: '1 hr 10 min', direction: 'South-East', ring: 75, xPercent: 68, yPercent: 78 },
  { name: 'Harrisonburg', state: 'VA', distanceMiles: 67, driveTime: '1 hr 12 min', direction: 'South-West', ring: 75, xPercent: 32, yPercent: 84 },
  { name: 'Cumberland', state: 'MD', distanceMiles: 68, driveTime: '1 hr 15 min', direction: 'North-West', ring: 75, xPercent: 28, yPercent: 20 },
  { name: 'Tysons / DC Perimeter', state: 'VA', distanceMiles: 72, driveTime: '1 hr 20 min', direction: 'East', ring: 75, xPercent: 86, yPercent: 53 },
  { name: 'Charlottesville', state: 'VA', distanceMiles: 95, driveTime: '1 hr 45 min', direction: 'South', ring: 100, xPercent: 48, yPercent: 95 },
  { name: 'Baltimore Outer', state: 'MD', distanceMiles: 92, driveTime: '1 hr 40 min', direction: 'East-North-East', ring: 100, xPercent: 94, yPercent: 32 }
];

export const initialBookings: Booking[] = [
  {
    id: 'LOT-8821',
    clientName: 'Justin Tyler',
    email: 'justin.t@example.com',
    phone: '540-555-0192',
    tattooIdea: 'Realism roaring black bear with pine branch background',
    placement: 'Left Forearm',
    approximateSize: 'Medium (6x4 in)',
    isCoverUp: false,
    estimatedHours: 4,
    hourlyRate: 100,
    estimatedPrice: 400,
    discountPercent: 15,
    finalEstimatedPrice: 340,
    preferredDate: '2026-09-18',
    preferredTimeSlot: '2:00 PM Afternoon',
    status: 'confirmed',
    securityDepositAmount: 200,
    securityDepositStatus: 'paid',
    depositPolicyAccepted: true,
    notes: 'Client paid $200 security deposit. Flash sketch pre-approved.',
    createdAt: '2026-09-04T16:20:00Z'
  },
  {
    id: 'LOT-8822',
    clientName: 'Amanda Brooks',
    email: 'abrooks.va@example.com',
    phone: '304-555-4819',
    tattooIdea: 'Cover up faded Chinese lettering on ankle with realism black raven & dark brambles',
    placement: 'Right Ankle / Lower Calf',
    approximateSize: 'Small-Medium',
    isCoverUp: true,
    coverUpDescription: 'Blown out blue-black characters from 2008 about 3 inches long.',
    estimatedHours: 3,
    hourlyRate: 100,
    estimatedPrice: 300,
    discountPercent: 15,
    finalEstimatedPrice: 255,
    preferredDate: '2026-09-22',
    preferredTimeSlot: '11:00 AM Morning',
    status: 'pending',
    securityDepositAmount: 200,
    securityDepositStatus: 'unpaid',
    depositPolicyAccepted: true,
    notes: 'Needs before photo review. Awaiting $200 deposit to lock calendar slot.',
    createdAt: '2026-09-06T10:15:00Z'
  }
];

export const initialTransactions: PaymentTransaction[] = [
  {
    id: 'LOT-PAY-9104',
    bookingId: 'LOT-8821',
    clientName: 'Justin Tyler',
    clientPhone: '540-555-0192',
    clientEmail: 'justin.t@example.com',
    amount: 200,
    tipAmount: 0,
    totalPaid: 200,
    paymentType: 'deposit',
    paymentMethod: 'cash_app',
    cashAppHandle: '$texxx360',
    note: 'Appointment security deposit for Realism Roaring Bear forearm piece',
    status: 'completed',
    createdAt: '2026-09-04T16:25:00Z'
  },
  {
    id: 'LOT-PAY-9092',
    clientName: 'Marcus Vance',
    clientPhone: '540-555-3211',
    amount: 450,
    tipAmount: 70,
    totalPaid: 520,
    paymentType: 'session_balance',
    paymentMethod: 'card_pos',
    note: 'In-chair session checkout: Biomechanical rib piece (4.5 hrs) + Tip',
    status: 'completed',
    createdAt: '2026-09-03T19:40:00Z'
  }
];
