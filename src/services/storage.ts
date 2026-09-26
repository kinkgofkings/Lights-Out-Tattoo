import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArtistProfile, Booking, GalleryItem, Post, JournalPost, Testimonial, TikTokReel, PaymentTransaction, SessionRecordingWaiver, SplashScreenSettings, AdminAuthSession } from '../types';
import { initialBookings, initialGallery, initialPosts, initialJournalPosts, initialProfile, initialTestimonials, initialTikTokReels, initialTransactions } from '../data/initialData';
import { defaultSplashSettings } from '../data/splashData';

const KEYS = {
  PROFILE: 'lot_profile_v1',
  GALLERY: 'lot_gallery_v1',
  POSTS: 'lot_posts_v1',
  JOURNAL: 'lot_journal_v1',
  BOOKINGS: 'lot_bookings_v1',
  TESTIMONIALS: 'lot_testimonials_v1',
  REELS: 'lot_reels_v2',
  TRANSACTIONS: 'lot_transactions_v1',
  WAIVERS: 'lot_tiktok_waivers_v1',
  PIN: 'lot_admin_pin_v1',
  SPLASH: 'lot_splash_settings_v1',
  ADMIN_AUTH: 'lot_admin_session_v1',
  SPLASH_SEEN: 'lot_splash_seen_v1',
  TIKTOK_CONFIG: 'lot_tiktok_config_v1'
};


const getStorageKeyForCol = (col: string): string => {
  switch (col) {
    case 'profile': return KEYS.PROFILE;
    case 'gallery': return KEYS.GALLERY;
    case 'posts': return KEYS.POSTS;
    case 'journal': return KEYS.JOURNAL;
    case 'bookings': return KEYS.BOOKINGS;
    case 'testimonials': return KEYS.TESTIMONIALS;
    case 'reels': return KEYS.REELS;
    case 'transactions': return KEYS.TRANSACTIONS;
    case 'waivers': return KEYS.WAIVERS;
    case 'splash': return KEYS.SPLASH;
    case 'tiktok_config': return KEYS.TIKTOK_CONFIG;
    default: return 'lot_' + col + '_v1';
  }
};

let memoryGalleryCache: GalleryItem[] | null = null;

export const setupFirestoreSync = (callback: (data: any) => void) => {
  const arrayCollections = ['gallery', 'posts', 'journal', 'reels', 'bookings', 'transactions', 'testimonials', 'waivers'];
  const objectCollections = ['profile', 'splash', 'tiktok_config'];

  const setupArrayListener = (col: string) => {
    const storageKey = getStorageKeyForCol(col);
    onSnapshot(
      collection(db, col),
      (snapshot) => {
        let items = snapshot.docs.map(doc => {
          const data = doc.data();
          data._docId = doc.id;
          return data;
        });

        // Filter out any obsolete 'data' document
        items = items.filter(item => item._docId !== 'data');

        // Clean up _docId and ensure arrays exist
        items = items.map(item => {
          const { _docId, ...rest } = item;
          if (col === 'gallery' || col === 'posts' || col === 'journal') {
            if (!rest.tags) rest.tags = [];
          }
          return rest;
        });

        // CRITICAL: Do NOT wipe localStorage if Firestore returns an empty collection!
        // Instead, check if localStorage has valid data and seed it to Firestore
        if (items.length === 0) {
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Auto-seed to Firestore so cloud database is never empty
                for (const item of parsed) {
                  if (item && item.id) {
                    setDoc(doc(db, col, item.id), item).catch(() => {});
                  }
                }
                return; // Keep existing local data
              }
            }
          } catch {}
          return;
        }

        if (col === 'gallery') {
          memoryGalleryCache = items as GalleryItem[];
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(items));
        } catch (storageErr) {
          console.warn('LocalStorage write skipped due to quota for ' + col, storageErr);
        }
        callback(col);
      },
      (error) => { console.warn("Sync error:", error); }
    );
  };

  const setupObjectListener = (col: string) => {
    const storageKey = getStorageKeyForCol(col);
    onSnapshot(
      doc(db, col, 'data'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          try {
            localStorage.setItem(storageKey, JSON.stringify(data));
          } catch (storageErr) {
            console.warn('LocalStorage write failed for ' + col, storageErr);
          }
          callback(col);
        } else {
          // If object doc doesn't exist in Firestore, seed it if localStorage has it
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              setDoc(doc(db, col, 'data'), parsed).catch(() => {});
            }
          } catch {}
        }
      },
      (error) => { console.warn("Sync error:", error); }
    );
  };

  arrayCollections.forEach(setupArrayListener);
  objectCollections.forEach(setupObjectListener);
};






const serializeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(serializeForFirestore);
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        res[key] = serializeForFirestore(obj[key]);
      }
    }
    return res;
  }
  return obj;
};

const arrayCache = new Map<string, any[]>();
const saveToFirestore = async (col: string, data: any) => {
  try {
    if (Array.isArray(data)) {
      // Intentionally do nothing. Array writes are now handled per-document.
    } else {
      const cleanData = serializeForFirestore(data);
      await setDoc(doc(db, col, 'data'), cleanData);
    }
  } catch (e) {
    console.warn('Firestore save failed', e);
  }
};
const deleteFromFirestore = async (col: string, id: string) => {
  try {
    await deleteDoc(doc(db, col, id));
  } catch(e) {
    console.warn('Firestore delete failed', e);
  }
};

export const storageService = {
  // Profile
  getProfile(): ArtistProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...initialProfile, ...parsed, specialties: parsed.specialties || initialProfile.specialties };
      }
      return initialProfile;
    } catch {
      return initialProfile;
    }
  },

  saveProfile(profile: ArtistProfile): void {
    try {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
      saveToFirestore("profile", profile);
    } catch (e) {
      console.warn('Local storage write failed', e);
    }
  },

  updateLiveStatus(status: ArtistProfile['liveStatus'], customMessage?: string): ArtistProfile {
    const profile = this.getProfile();
    const defaultMessages: Record<string, string> = {
      open_slots: '⚡ Chair is Open • Book Now & Claim -15% Online Discount!',
      in_chair: '⚡ In The Chair • Working on full realism custom tattoo piece',
      designing: '⚡ Designing Custom Work • Preparing stencils & flash',
      consulting: '⚡ In Consultation • Reviewing client reference artwork',
      studio_closed: 'Studio Closed • Online bookings & requests open 24/7'
    };
    const updated = {
      ...profile,
      liveStatus: status,
      statusMessage: customMessage !== undefined ? customMessage : (defaultMessages[status] || profile.statusMessage)
    };
    this.saveProfile(updated);
    return updated;
  },

  // Gallery
  getGallery(): GalleryItem[] {
    if (memoryGalleryCache !== null) {
      return memoryGalleryCache;
    }
    try {
      const data = localStorage.getItem(KEYS.GALLERY);
      if (!data) {
        memoryGalleryCache = initialGallery;
        return initialGallery;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        memoryGalleryCache = parsed;
        return parsed;
      }
      if (parsed && Array.isArray(parsed.items)) {
        memoryGalleryCache = parsed.items;
        return parsed.items;
      }
      memoryGalleryCache = [];
      return [];

    } catch {
      memoryGalleryCache = initialGallery;
      return initialGallery;
    }
  },

  getGalleryItems(): GalleryItem[] {
    return this.getGallery();
  },

  saveGallery(gallery: GalleryItem[]): void {
    memoryGalleryCache = gallery;
    try {
      const strippedGallery = gallery.map(item => {
        const stripBase64 = (str?: string) => (str && str.startsWith('data:') && str.length > 250000) ? 'media://stripped_for_local_storage' : str;
        return {
          ...item,
          imageUrl: stripBase64(item.imageUrl) || item.imageUrl,
          additionalImages: item.additionalImages?.map(img => stripBase64(img) || img) || []
        };
      });
      localStorage.setItem(KEYS.GALLERY, JSON.stringify(strippedGallery));
    } catch (e) {
      console.warn('Storage quota warning on gallery save to localStorage', e);
    }
  },

  addGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt'>): GalleryItem {
    const gallery = this.getGallery();
    const newItem: GalleryItem = {
      ...item,
      id: `gal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newItem, ...gallery];
    this.saveGallery(updated);
    try {
      const cleanData = serializeForFirestore(newItem);
      setDoc(doc(db, "gallery", newItem.id), cleanData).catch(e => console.warn('Firestore setDoc failed:', e));
    } catch (e) {
      console.warn('Firestore setDoc sync exception caught:', e);
    }
    return newItem;
  },

  async addGalleryItemsBulk(newItemsData: Omit<GalleryItem, 'id' | 'createdAt'>[]): Promise<GalleryItem[]> {
    const current = this.getGallery();
    const createdItems: GalleryItem[] = newItemsData.map((data, idx) => ({
      ...data,
      id: `gal-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0]
    }));

    const updated = [...createdItems, ...current];
    this.saveGallery(updated);

    // Persist each item directly to Firestore
    for (const item of createdItems) {
      try {
        const cleanData = serializeForFirestore(item);
        await setDoc(doc(db, "gallery", item.id), cleanData);
      } catch (err) {
        console.warn('Failed to write item to Firestore', item.id, err);
      }
    }

    return createdItems;
  },

  createGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt'>): GalleryItem {
    return this.addGalleryItem(item);
  },

  async updateGalleryItem(updatedItem: GalleryItem): Promise<void> {
    const gallery = this.getGallery();
    const index = gallery.findIndex(g => g.id === updatedItem.id);
    if (index !== -1) {
      gallery[index] = updatedItem;
      this.saveGallery(gallery);
      try {
        const cleanData = serializeForFirestore(updatedItem);
        await setDoc(doc(db, "gallery", updatedItem.id), cleanData);
      } catch(e) {
        console.warn('Firestore update failed', e);
      }
    }
  },

  async deleteGalleryItem(id: string): Promise<void> {
    const gallery = this.getGallery().filter(g => g.id !== id);
    this.saveGallery(gallery);
    await deleteFromFirestore("gallery", id);
  },

  async clearAllGallery(): Promise<void> {
    const gallery = this.getGallery();
    memoryGalleryCache = [];
    try {
      localStorage.setItem(KEYS.GALLERY, JSON.stringify([]));
    } catch (e) {}

    for (const item of gallery) {
      try {
        await deleteDoc(doc(db, "gallery", item.id));
      } catch (e) {}
    }
    try {
      await deleteDoc(doc(db, "gallery", "data"));
    } catch (e) {}
  },

  // Posts / Wall
  getPosts(): Post[] {
    try {
      const data = localStorage.getItem(KEYS.POSTS);
      if (!data) {
        localStorage.setItem(KEYS.POSTS, JSON.stringify(initialPosts));
        return initialPosts;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];

    } catch {
      return initialPosts;
    }
  },

  savePosts(posts: Post[]): void {
    try {
      localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
      for (const p of posts) {
        if (p && p.id) {
          setDoc(doc(db, "posts", p.id), p).catch(e => console.warn(e));
        }
      }
    } catch (e) {
      console.warn('Storage error on posts save', e);
    }
  },

  addPost(postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'commentsCount'>): Post {
    const posts = this.getPosts();
    const newPost: Post = {
      ...postData,
      id: `post-${Date.now()}`,
      likes: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };
    const updated = [newPost, ...posts];
    this.savePosts(updated);
    setDoc(doc(db, "posts", newPost.id), newPost).catch(e => console.warn(e));
    return newPost;
  },

  updatePost(updatedPost: Post): void {
    const posts = this.getPosts();
    const index = posts.findIndex(p => p.id === updatedPost.id);
    if (index !== -1) {
      posts[index] = updatedPost;
      this.savePosts(posts);
    }
  },

  deletePost(id: string): void {
    const posts = this.getPosts().filter(p => p.id !== id);
    this.savePosts(posts);
    deleteFromFirestore("posts", id);
  },

  toggleLikePost(id: string): Post[] {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === id);
    if (post) {
      if (post.userLiked) {
        post.likes = Math.max(0, post.likes - 1);
        post.userLiked = false;
      } else {
        post.likes += 1;
        post.userLiked = true;
      }
      this.savePosts(posts);
    }
    return posts;
  },

  // Journal Posts
  getJournalPosts(): JournalPost[] {
    try {
      const data = localStorage.getItem(KEYS.JOURNAL);
      if (!data) {
        localStorage.setItem(KEYS.JOURNAL, JSON.stringify(initialJournalPosts));
        return initialJournalPosts;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];

    } catch {
      return initialJournalPosts;
    }
  },

  saveJournalPosts(posts: JournalPost[]): void {
    try {
      localStorage.setItem(KEYS.JOURNAL, JSON.stringify(posts));
    } catch (e) {
      console.warn('Storage error on journal save, attempting sanitized write', e);
      try {
        const stripBase64 = (str?: string) => (str && str.startsWith('data:') && str.length > 250000) ? 'media://stripped_for_local_storage' : str;
        const sanitized = posts.map(p => ({
          ...p,
          imageUrl: stripBase64(p.imageUrl) || p.imageUrl,
          mediaItems: p.mediaItems?.map(m => ({
            ...m,
            url: stripBase64(m.url) || m.url
          }))
        }));
        localStorage.setItem(KEYS.JOURNAL, JSON.stringify(sanitized));
      } catch (err) {
        console.warn('Fallback journal save failed', err);
      }
    }
    for (const p of posts) {
      if (p && p.id) {
        setDoc(doc(db, "journal", p.id), p).catch(e => console.warn(e));
      }
    }
  },

  deleteJournalPost(id: string): void {
    const posts = this.getJournalPosts().filter(p => p.id !== id);
    this.saveJournalPosts(posts);
    deleteFromFirestore("journal", id);
  },

  // TikTok Reels
  getTikTokReels(): TikTokReel[] {
    try {
      // 1. Purge legacy v1 and any dog/scout test reels
      try {
        const oldV1 = localStorage.getItem('lot_reels_v1');
        if (oldV1) {
          localStorage.removeItem('lot_reels_v1');
        }
      } catch {}

      const data = localStorage.getItem(KEYS.REELS);
      if (!data) {
        localStorage.setItem(KEYS.REELS, JSON.stringify(initialTikTokReels));
        return initialTikTokReels;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize: filter out dog/scout videos and clear fake mock IDs that break iframe embeds
        let needsUpdate = false;
        const cleanReels = parsed
          .filter(r => {
            const isDog = r.title?.toLowerCase().includes('scramble') || 
                          r.caption?.toLowerCase().includes('scout') || 
                          r.caption?.toLowerCase().includes('petsoftiktok') ||
                          r.videoId === '6718335390845095173';
            if (isDog) needsUpdate = true;
            return !isDog;
          })
          .map(r => {
            // If the reel has the fake mock ID 718335390845095173 or similar, clear it
            if (r.videoId && (r.videoId.startsWith('718335') || r.videoId.startsWith('721150') || r.videoId.startsWith('719787'))) {
              needsUpdate = true;
              return {
                ...r,
                videoId: '',
                embedLink: '',
                videoUrl: r.videoUrl || 'https://www.tiktok.com/@lightsouttattoo.site'
              };
            }
            return r;
          });

        if (cleanReels.length === 0) {
          localStorage.setItem(KEYS.REELS, JSON.stringify(initialTikTokReels));
          return initialTikTokReels;
        }

        if (needsUpdate) {
          localStorage.setItem(KEYS.REELS, JSON.stringify(cleanReels));
        }
        return cleanReels;
      }
      return initialTikTokReels;

    } catch {
      return initialTikTokReels;
    }
  },

  purgeReelsCache(): TikTokReel[] {
    try {
      localStorage.removeItem('lot_reels_v1');
      localStorage.removeItem('lot_reels_v2');
      localStorage.setItem(KEYS.REELS, JSON.stringify(initialTikTokReels));
    } catch {}
    return initialTikTokReels;
  },

  saveTikTokReels(reels: TikTokReel[]): void {
    try {
      localStorage.setItem(KEYS.REELS, JSON.stringify(reels));
      for (const r of reels) {
        if (r && r.id) {
          setDoc(doc(db, "reels", r.id), r).catch(e => console.warn(e));
        }
      }
    } catch (e) {
      console.warn('Storage error on reels save', e);
    }
  },

  addTikTokReel(reel: Omit<TikTokReel, 'id'>): TikTokReel {
    const reels = this.getTikTokReels();
    const newReel: TikTokReel = {
      ...reel,
      id: `tt-${Date.now()}`
    };
    const updated = [newReel, ...reels];
    this.saveTikTokReels(updated);
    setDoc(doc(db, "reels", newReel.id), newReel).catch(e => console.warn(e));
    return newReel;
  },

  deleteTikTokReel(id: string): void {
    const reels = this.getTikTokReels().filter(r => r.id !== id);
    this.saveTikTokReels(reels);
    deleteFromFirestore("reels", id);
  },

  async syncTikTokReels(newReels: TikTokReel[]): Promise<void> {
    const existing = this.getTikTokReels();
    // Merge new reels avoiding duplicates by ID or videoUrl
    const existingUrls = new Set(existing.map(r => r.videoUrl || r.id));
    const toAdd = newReels.filter(r => !existingUrls.has(r.videoUrl || r.id));
    const merged = [...toAdd, ...existing];
    this.saveTikTokReels(merged);
    for (const r of toAdd) {
      if (r && r.id) {
        await setDoc(doc(db, "reels", r.id), r).catch(e => console.warn(e));
      }
    }
  },

  // Bookings
  getBookings(): Booking[] {
    try {
      const data = localStorage.getItem(KEYS.BOOKINGS);
      if (!data) {
        localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(initialBookings));
        return initialBookings;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];

    } catch {
      return initialBookings;
    }
  },

  saveBookings(bookings: Booking[]): void {
    try {
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
      for (const b of bookings) {
        if (b && b.id) {
          setDoc(doc(db, "bookings", b.id), b).catch(e => console.warn(e));
        }
      }
    } catch (e) {
      console.warn('Storage error on bookings save', e);
    }
  },

  createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
    const bookings = this.getBookings();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newBooking: Booking = {
      ...bookingData,
      id: `LOT-${randomNum}`,
      status: 'pending',
      securityDepositAmount: bookingData.securityDepositAmount ?? 200,
      securityDepositStatus: bookingData.securityDepositStatus ?? 'unpaid',
      depositPolicyAccepted: bookingData.depositPolicyAccepted ?? true,
      createdAt: new Date().toISOString()
    };
    const updated = [newBooking, ...bookings];
    this.saveBookings(updated);
    setDoc(doc(db, "bookings", newBooking.id), newBooking).catch(e => console.warn(e));
    return newBooking;
  },

  updateBookingStatus(id: string, status: Booking['status']): void {
    const bookings = this.getBookings();
    const target = bookings.find(b => b.id === id);
    if (target) {
      target.status = status;
      this.saveBookings(bookings);
      setDoc(doc(db, "bookings", id), target, { merge: true }).catch(e => console.warn(e));
    }
  },

  updateBookingDeposit(id: string, depositStatus: Booking['securityDepositStatus']): void {
    const bookings = this.getBookings();
    const target = bookings.find(b => b.id === id);
    if (target) {
      target.securityDepositStatus = depositStatus;
      this.saveBookings(bookings);
      setDoc(doc(db, "bookings", id), target, { merge: true }).catch(e => console.warn(e));
    }
  },

  updateBookingCalendarSync(id: string, eventId: string, htmlLink?: string): void {
    const bookings = this.getBookings();
    const target = bookings.find(b => b.id === id);
    if (target) {
      target.googleCalendarEventId = eventId;
      target.googleCalendarHtmlLink = htmlLink;
      target.googleCalendarSyncedAt = new Date().toISOString();
      target.status = 'confirmed';
      this.saveBookings(bookings);
      setDoc(doc(db, "bookings", id), target, { merge: true }).catch(e => console.warn(e));
    }
  },

  deleteBooking(id: string): void {
    const bookings = this.getBookings().filter(b => b.id !== id);
    this.saveBookings(bookings);
    deleteFromFirestore("bookings", id);
  },

  // --- Payment Transactions & Cash App POS Gateway ---
  getTransactions(): PaymentTransaction[] {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      if (!data) {
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
        return initialTransactions;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];

    } catch {
      return initialTransactions;
    }
  },

  saveTransactions(transactions: PaymentTransaction[]): void {
    try {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
      for (const tx of transactions) {
        if (tx && tx.id) {
          setDoc(doc(db, "transactions", tx.id), tx).catch(e => console.warn(e));
        }
      }
    } catch (e) {
      console.warn('Storage error on transactions save', e);
    }
  },

  recordTransaction(txData: Omit<PaymentTransaction, 'id' | 'createdAt' | 'status'>): PaymentTransaction {
    const transactions = this.getTransactions();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newTx: PaymentTransaction = {
      ...txData,
      id: `LOT-PAY-${randomCode}`,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    const updated = [newTx, ...transactions];
    this.saveTransactions(updated);

    // If linked to a booking and this is a security deposit, automatically mark booking deposit as paid!
    if (txData.bookingId && txData.paymentType === 'deposit') {
      this.updateBookingDeposit(txData.bookingId, 'paid');
    }

    return newTx;
  },

  // Testimonials
  getTestimonials(): Testimonial[] {
    try {
      const data = localStorage.getItem(KEYS.TESTIMONIALS);
      if (!data) {
        localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(initialTestimonials));
        return initialTestimonials;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];

    } catch {
      return initialTestimonials;
    }
  },

  saveTestimonials(testimonials: Testimonial[]): void {
    try {
      localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(testimonials));
      for (const t of testimonials) {
        if (t && t.id) {
          setDoc(doc(db, "testimonials", t.id), t).catch(e => console.warn(e));
        }
      }
    } catch (e) {
      console.warn('Storage error on testimonials save', e);
    }
  },

  addTestimonial(test: Partial<Testimonial> & { clientName: string; rating: number }): Testimonial {
    const tests = this.getTestimonials();
    const newTest: Testimonial = {
      id: `tst-${Date.now()}`,
      clientName: test.clientName,
      rating: test.rating,
      verified: test.verified ?? true,
      date: test.date || 'Recent Client',
      location: test.location || test.city || 'Winchester, VA',
      city: test.city || test.location || 'Winchester, VA',
      comment: test.comment || test.content || '',
      content: test.content || test.comment || '',
      tattooCategory: test.tattooCategory || test.tattooType || 'Custom Realism',
      tattooType: test.tattooType || test.tattooCategory || 'Custom Realism',
      avatarUrl: test.avatarUrl
    };
    const updated = [newTest, ...tests];
    try {
      localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(updated));
      setDoc(doc(db, "testimonials", newTest.id), newTest).catch(err => console.warn(err));
    } catch (e) {
      console.warn(e);
    }
    return newTest;
  },

  createTestimonial(test: Partial<Testimonial> & { clientName: string; rating: number }): Testimonial {
    return this.addTestimonial(test);
  },

  // Admin PIN (Defaults to 1234 or Tex)
  getAdminPin(): string {
    return localStorage.getItem(KEYS.PIN) || '1234';
  },

  setAdminPin(pin: string): void {
    localStorage.setItem(KEYS.PIN, pin);
  },

  // Chromebook Backup & Restore (JSON export / import)
  exportFullDataJson(): string {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      profile: this.getProfile(),
      gallery: this.getGallery(),
      bookings: this.getBookings(),
      transactions: this.getTransactions(),
      testimonials: this.getTestimonials(),
      posts: this.getPosts(),
      journal: this.getJournalPosts(),
      reels: this.getTikTokReels()
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullDataJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.gallery)) this.saveGallery(data.gallery);
      if (Array.isArray(data.bookings)) this.saveBookings(data.bookings);
      if (Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (Array.isArray(data.testimonials)) {
        localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(data.testimonials));
      }
      if (Array.isArray(data.posts)) this.savePosts(data.posts);
      if (Array.isArray(data.journal)) this.saveJournalPosts(data.journal);
      if (Array.isArray(data.reels)) this.saveTikTokReels(data.reels);
      // Sync imported arrays directly to Firestore since we removed batch saving
      const syncArray = async (col, arr) => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
          if (item && item.id) await setDoc(doc(db, col, item.id), item).catch(e => console.warn(e));
        }
      };
      
      Promise.all([
        syncArray("gallery", data.gallery),
        syncArray("bookings", data.bookings),
        syncArray("transactions", data.transactions),
        syncArray("testimonials", data.testimonials),
        syncArray("posts", data.posts),
        syncArray("journal", data.journal),
        syncArray("reels", data.reels)
      ]).catch(e => console.warn('Background sync failed', e));

      return true;
    } catch (err) {
      console.warn('Import failed', err);
      return false;
    }
  },

  resetToDefaults(): void {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.GALLERY);
    localStorage.removeItem(KEYS.POSTS);
    localStorage.removeItem(KEYS.JOURNAL);
    localStorage.removeItem(KEYS.BOOKINGS);
    localStorage.removeItem(KEYS.TRANSACTIONS);
    localStorage.removeItem(KEYS.TESTIMONIALS);
    localStorage.removeItem(KEYS.REELS);
    localStorage.removeItem(KEYS.WAIVERS);
  },

  // Session Recording & TikTok Waivers
  getWaivers(): SessionRecordingWaiver[] {
    try {
      const data = localStorage.getItem(KEYS.WAIVERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWaivers(waivers: SessionRecordingWaiver[]): void {
    try {
      localStorage.setItem(KEYS.WAIVERS, JSON.stringify(waivers));
      
    } catch (e) {
      console.warn('Storage error on waivers save', e);
    }
  },

  saveWaiver(waiver: SessionRecordingWaiver): void {
    try {
      const current = this.getWaivers();
      const idx = current.findIndex(w => w.id === waiver.id);
      let updated: SessionRecordingWaiver[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = waiver;
      } else {
        updated = [waiver, ...current];
      }
      localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));
      if (waiver) setDoc(doc(db, "waivers", waiver.id), waiver).catch(err => console.warn(err));
    } catch (e) {
      console.warn('Failed to save waiver', e);
    }
  },

  deleteWaiver(id: string): void {
    try {
      const current = this.getWaivers();
      const updated = current.filter(w => w.id !== id);
      localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));
      
      deleteFromFirestore("waivers", id);
      
    } catch (e) {
      console.warn('Failed to delete waiver', e);
    }
  },

  // Utility to read local file to base64 with reliable JPEG compression or direct passthrough for GIFs/Videos
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // For videos/gifs we handle it in the component now using uploadLargeMedia directly
      // So we'll just return raw for them up to 50MB and let the component handle chunking
      if (file.type === 'image/gif' || file.type.startsWith('video/')) {
        if (file.size > 50000000) { // 50MB limit
          reject(new Error(`File ${file.name} is too large. Limit is 50MB.`));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read GIF/Video file'));
        reader.readAsDataURL(file);
        return;
      }

      // Standard image compression (JPG, PNG, WEBP)
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round(height * (MAX_DIM / width));
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round(width * (MAX_DIM / height));
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering context not available'));
          return;
        }

        // Fill background in case of transparent png
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Standard JPEG quality 0.72 - universal browser support, crisp detail, ~50-80KB size
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
        resolve(compressedBase64);
      };
      img.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      };
      img.src = objectUrl;
    });
  },

  // Splash Screen Settings
  getSplashScreenSettings(): SplashScreenSettings {
    try {
      const data = localStorage.getItem(KEYS.SPLASH);
      if (!data) {
        localStorage.setItem(KEYS.SPLASH, JSON.stringify(defaultSplashSettings));
        return defaultSplashSettings;
      }
      const parsed = JSON.parse(data);
      return {
        ...defaultSplashSettings,
        ...parsed,
        scenes: parsed.scenes || defaultSplashSettings.scenes,
        showcasePhotos: parsed.showcasePhotos || defaultSplashSettings.showcasePhotos
      };
    } catch {
      return defaultSplashSettings;
    }
  },

  saveSplashScreenSettings(settings: SplashScreenSettings): void {
    try {
      localStorage.setItem(KEYS.SPLASH, JSON.stringify(settings));
      saveToFirestore("splash", settings);
    } catch (e) {
      console.warn('Failed to save splash screen settings', e);
    }
  },

  resetSplashScreenSettings(): SplashScreenSettings {
    try {
      localStorage.setItem(KEYS.SPLASH, JSON.stringify(defaultSplashSettings));
    } catch (e) {
      console.warn('Reset failed', e);
    }
    return defaultSplashSettings;
  },

  hasSeenSplash(): boolean {
    return localStorage.getItem(KEYS.SPLASH_SEEN) === 'true';
  },

  setSeenSplash(): void {
    localStorage.setItem(KEYS.SPLASH_SEEN, 'true');
  },

  // Admin Studio Authentication Session
  getAdminAuth(): AdminAuthSession {
    try {
      const data = localStorage.getItem(KEYS.ADMIN_AUTH);
      if (data) {
        
        return JSON.parse(data);

      }
    } catch {
      // ignore
    }
    return {
      isAuthenticated: false,
      method: 'pin',
      loginTime: ''
    };
  },

  setAdminAuth(session: AdminAuthSession): void {
    try {
      localStorage.setItem(KEYS.ADMIN_AUTH, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to store admin session', e);
    }
  },

  clearAdminAuth(): void {
    try {
      localStorage.removeItem(KEYS.ADMIN_AUTH);
    } catch (e) {
      console.warn('Failed to clear admin session', e);
    }
  },

  // TikTok Configuration Storage
  getTikTokConfig(): {
    clientKey?: string;
    rawClientKey?: string;
    redirectUri?: string;
    configured?: boolean;
    hasClientKey?: boolean;
    hasClientSecret?: boolean;
    isConnected?: boolean;
    user?: any;
    lastUpdated?: string;
  } {
    try {
      const raw = localStorage.getItem(KEYS.TIKTOK_CONFIG);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return {
      clientKey: '',
      rawClientKey: '',
      redirectUri: 'https://lightsouttattoo.site/api/tiktok/callback',
      configured: false,
      hasClientKey: false,
      hasClientSecret: false,
      isConnected: false,
      user: null
    };
  },

  saveTikTokConfig(config: any): void {
    try {
      const current = this.getTikTokConfig();
      const merged = { ...current, ...config, lastUpdated: new Date().toISOString() };
      localStorage.setItem(KEYS.TIKTOK_CONFIG, JSON.stringify(merged));
      setDoc(doc(db, "tiktok_config", "data"), merged).catch(e => console.warn(e));
    } catch (e) {
      console.warn('Failed to save TikTok config', e);
    }
  },

  // Force Push All Local Studio Data to Firestore Cloud Database
  async pushAllToFirestore(): Promise<{ success: boolean; count: number }> {
    let totalPushed = 0;
    try {
      // 1. Profile
      const profile = this.getProfile();
      await setDoc(doc(db, "profile", "data"), profile);
      totalPushed++;

      // 2. Splash
      const splash = this.getSplashScreenSettings();
      await setDoc(doc(db, "splash", "data"), splash);
      totalPushed++;

      // 3. TikTok Config
      const ttConfig = this.getTikTokConfig();
      if (ttConfig.clientKey || ttConfig.redirectUri) {
        await setDoc(doc(db, "tiktok_config", "data"), ttConfig);
        totalPushed++;
      }

      // 4. Gallery Items
      const gallery = this.getGallery();
      for (const g of gallery) {
        if (g && g.id) {
          await setDoc(doc(db, "gallery", g.id), g);
          totalPushed++;
        }
      }

      // 5. Reels
      const reels = this.getTikTokReels();
      for (const r of reels) {
        if (r && r.id) {
          await setDoc(doc(db, "reels", r.id), r);
          totalPushed++;
        }
      }

      // 6. Bookings
      const bookings = this.getBookings();
      for (const b of bookings) {
        if (b && b.id) {
          await setDoc(doc(db, "bookings", b.id), b);
          totalPushed++;
        }
      }

      // 7. Transactions
      const txs = this.getTransactions();
      for (const t of txs) {
        if (t && t.id) {
          await setDoc(doc(db, "transactions", t.id), t);
          totalPushed++;
        }
      }

      // 8. Testimonials
      const testimonials = this.getTestimonials();
      for (const t of testimonials) {
        if (t && t.id) {
          await setDoc(doc(db, "testimonials", t.id), t);
          totalPushed++;
        }
      }

      // 9. Posts
      const posts = this.getPosts();
      for (const p of posts) {
        if (p && p.id) {
          await setDoc(doc(db, "posts", p.id), p);
          totalPushed++;
        }
      }

      // 10. Journal
      const journal = this.getJournalPosts();
      for (const j of journal) {
        if (j && j.id) {
          await setDoc(doc(db, "journal", j.id), j);
          totalPushed++;
        }
      }

      return { success: true, count: totalPushed };
    } catch (err: any) {
      console.warn('Error pushing data to Firestore:', err);
      return { success: false, count: totalPushed };
    }
  }
};


