import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Compress an image file using an offscreen canvas to optimize file size
 * while keeping black & grey realism detail crisp.
 */
async function optimizeImageForUpload(file: File, maxDim = 1920, quality = 0.86): Promise<string> {
  return new Promise((resolve) => {
    // If not an image, resolve with original reader
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

/**
 * Read video or binary file to Data URL
 */
async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read media file'));
    reader.readAsDataURL(file);
  });
}

// IndexedDB local cache for direct client-side fallback
const DB_NAME = 'LOT_StudioMediaDB';
const STORE_NAME = 'media_store';

function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function saveToIndexedDB(id: string, dataUrl: string, type: string): Promise<string> {
  try {
    const idb = await openIndexedDB();
    if (!idb) return dataUrl;
    return new Promise((resolve) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, dataUrl, type, timestamp: Date.now() });
      tx.oncomplete = () => resolve(`indexeddb://${id}`);
      tx.onerror = () => resolve(dataUrl);
    });
  } catch {
    return dataUrl;
  }
}

async function getFromIndexedDB(id: string): Promise<string | null> {
  try {
    const idb = await openIndexedDB();
    if (!idb) return null;
    return new Promise((resolve) => {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Universal Direct Media Upload:
 * Handles images and videos effortlessly.
 * 1. Optimizes images using offscreen canvas.
 * 2. Uploads directly to server /api/upload (storing in /uploads/).
 * 3. Falls back smoothly to IndexedDB / Object URL if offline or in-browser.
 */
export const uploadLargeMedia = async (file: File): Promise<string> => {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name);
  
  // Step 1: Prepare data URL (compress images to maintain speed & storage efficiency)
  let dataUrl = '';
  if (isVideo) {
    dataUrl = await readFileAsDataUrl(file);
  } else {
    dataUrl = await optimizeImageForUpload(file);
  }

  if (!dataUrl) {
    throw new Error(`Failed to process ${file.name}`);
  }

  // Step 2: Attempt direct server upload to /api/upload
  try {
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        dataUrl
      })
    });

    if (uploadRes.ok) {
      const result = await uploadRes.json();
      if (result.success && (result.url || result.publicUrl)) {
        return result.url || result.publicUrl;
      }
    }
  } catch (serverErr) {
    console.warn('Server direct upload endpoint not accessible, using client-side store fallback:', serverErr);
  }

  // Step 3: Local IndexedDB / memory fallback so uploads NEVER block the user
  const mediaKey = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const storedUri = await saveToIndexedDB(mediaKey, dataUrl, file.type);
  if (storedUri.startsWith('indexeddb://')) {
    mediaCache.set(storedUri, dataUrl);
    return storedUri;
  }

  return dataUrl;
};

const mediaCache = new Map<string, string>();

/**
 * Resolve any media URL or custom scheme (media://, indexeddb://, /uploads/...)
 */
export const resolveMediaUrl = async (mediaUri: string | undefined): Promise<string> => {
  if (!mediaUri) return '';
  if (mediaUri.startsWith('http://') || mediaUri.startsWith('https://') || mediaUri.startsWith('/') || mediaUri.startsWith('data:') || mediaUri.startsWith('blob:')) {
    return mediaUri;
  }

  if (mediaCache.has(mediaUri)) {
    return mediaCache.get(mediaUri)!;
  }

  // IndexedDB reference resolution
  if (mediaUri.startsWith('indexeddb://')) {
    const key = mediaUri.replace('indexeddb://', '');
    const data = await getFromIndexedDB(key);
    if (data) {
      mediaCache.set(mediaUri, data);
      return data;
    }
  }

  // Legacy Firestore chunks resolution
  if (mediaUri.startsWith('media://')) {
    try {
      const mediaId = mediaUri.replace('media://', '');
      const metaDoc = await getDoc(doc(db, 'media_meta', mediaId));
      if (!metaDoc.exists()) return '';

      const { totalChunks, type } = metaDoc.data();
      const chunks: Uint8Array[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkDoc = await getDoc(doc(db, 'media_chunks', `${mediaId}_${i}`));
        if (chunkDoc.exists()) {
          const b64 = chunkDoc.data().data;
          const binStr = atob(b64);
          const len = binStr.length;
          const bytes = new Uint8Array(len);
          for (let j = 0; j < len; j++) {
            bytes[j] = binStr.charCodeAt(j);
          }
          chunks.push(bytes);
        }
      }

      const blob = new Blob(chunks, { type: type || 'video/mp4' });
      const objectUrl = URL.createObjectURL(blob);
      mediaCache.set(mediaUri, objectUrl);
      return objectUrl;
    } catch (e) {
      console.warn('Failed to resolve legacy media chunk', e);
      return '';
    }
  }

  return mediaUri;
};
