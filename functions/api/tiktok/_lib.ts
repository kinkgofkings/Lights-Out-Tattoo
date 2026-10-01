/**
 * Cloudflare Pages Functions - Shared TikTok & Firestore Utility Library
 * 
 * Provides:
 * - AES-256-GCM encryption/decryption for credentials and tokens at rest
 * - Firestore REST API client with graceful quota/fallback handling
 * - TikTok OAuth token exchange & user info fetchers
 * - Standard CORS and JSON response formatters
 */

export interface TikTokConfig {
  clientKey: string;
  clientSecret?: string;
  redirectUri: string;
  updatedAt?: string;
}

export interface TikTokTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  openId: string;
  user?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  updatedAt: string;
}

export type PagesFunction<TEnv = any> = (context: {
  request: Request;
  env: TEnv;
  params: Record<string, any>;
  data: Record<string, any>;
  next: () => Promise<Response>;
}) => Promise<Response> | Response;

// In-memory fallback cache across warm worker invocations
const MEMORY_CONFIG_STORE = new Map<string, any>();
const MEMORY_TOKEN_STORE = new Map<string, any>();

// Master secret for AES-256-GCM key derivation
const DEFAULT_ENCRYPTION_SECRET = 'lights-out-tattoo-internal-encryption-salt';

// Base Firestore configuration from firebase-applet-config
export const FIRESTORE_DEFAULTS = {
  projectId: 'gen-lang-client-0448860491',
  databaseId: 'ai-studio-lightsouttattoo-90b14bb6-c7cf-4eb6-b802-d3995a38347e',
  apiKey: '',
  collection: 'system_config',
  configDoc: 'tiktok_config',
  tokenDoc: 'tiktok_token'
};

// Base64 Web-safe helpers
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// AES-256-GCM Key Derivation using PBKDF2
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('lights-out-tattoo-salt-salt-aes256'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt sensitive credentials (client secret, OAuth access token)
 * using AES-256-GCM with a unique 12-byte initialization vector.
 */
export async function encryptCredential(plaintext: string, secret?: string): Promise<{ ciphertext: string; iv: string }> {
  const pass = secret || DEFAULT_ENCRYPTION_SECRET;
  const key = await getCryptoKey(pass);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    ciphertext: toBase64(new Uint8Array(cipherBuffer)),
    iv: toBase64(iv)
  };
}

/**
 * Decrypt credentials stored in Firestore
 */
export async function decryptCredential(ciphertext: string, ivBase64: string, secret?: string): Promise<string> {
  try {
    const pass = secret || DEFAULT_ENCRYPTION_SECRET;
    const key = await getCryptoKey(pass);
    const iv = fromBase64(ivBase64);
    const cipherBytes = fromBase64(ciphertext);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed, using as plaintext fallback if matching:', err);
    return ciphertext;
  }
}

// Convert Firestore JSON format to JS object
function parseFirestoreFields(fields: any): Record<string, any> {
  if (!fields || typeof fields !== 'object') return {};
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    const v = val as any;
    if (v.stringValue !== undefined) result[key] = v.stringValue;
    else if (v.booleanValue !== undefined) result[key] = v.booleanValue;
    else if (v.integerValue !== undefined) result[key] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) result[key] = parseFloat(v.doubleValue);
    else if (v.timestampValue !== undefined) result[key] = v.timestampValue;
    else if (v.mapValue?.fields !== undefined) result[key] = parseFirestoreFields(v.mapValue.fields);
  }
  return result;
}

// Convert JS object to Firestore REST API JSON format
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (typeof v === 'number') {
      if (Number.isInteger(v)) fields[k] = { integerValue: v.toString() };
      else fields[k] = { doubleValue: v };
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
    }
  }
  return fields;
}

/**
 * Save TikTok credentials to Firestore with AES-256-GCM encryption at rest.
 */
export async function saveCredentialsToFirestore(
  config: { clientKey: string; clientSecret?: string; redirectUri: string },
  env: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const encSecret = env?.ENCRYPTION_SECRET || env?.TIKTOK_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_SECRET;
  
  // Encrypt clientSecret if provided
  let encryptedSecret = '';
  let secretIv = '';
  if (config.clientSecret) {
    const enc = await encryptCredential(config.clientSecret, encSecret);
    encryptedSecret = enc.ciphertext;
    secretIv = enc.iv;
  }

  const documentData: Record<string, any> = {
    clientKey: config.clientKey,
    redirectUri: config.redirectUri,
    encryptionAlgorithm: 'AES-256-GCM',
    hasClientSecret: Boolean(config.clientSecret || encryptedSecret),
    updatedAt: new Date().toISOString()
  };

  if (encryptedSecret) {
    documentData.encryptedClientSecret = encryptedSecret;
    documentData.clientSecretIv = secretIv;
  }

  // Always update memory cache immediately
  MEMORY_CONFIG_STORE.set('tiktok_config', {
    ...config,
    encryptedSecret,
    secretIv,
    updatedAt: documentData.updatedAt
  });

  // If KV binding exists in Cloudflare Pages
  if (env?.TIKTOK_KV && typeof env.TIKTOK_KV.put === 'function') {
    try {
      await env.TIKTOK_KV.put('tiktok_config', JSON.stringify(documentData));
    } catch (e) {
      console.warn('Could not write to KV:', e);
    }
  }

  // Persist to Google Cloud Firestore via REST API
  const projectId = env?.FIREBASE_PROJECT_ID || FIRESTORE_DEFAULTS.projectId;
  const databaseId = env?.FIRESTORE_DATABASE_ID || FIRESTORE_DEFAULTS.databaseId;
  const apiKey = env?.FIREBASE_API_KEY || FIRESTORE_DEFAULTS.apiKey;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${FIRESTORE_DEFAULTS.collection}/${FIRESTORE_DEFAULTS.configDoc}?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: toFirestoreFields(documentData)
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Firestore save returned HTTP ${res.status}: ${errText}. Memory & KV fallback retained.`);
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Firestore network error saving credentials, relying on fallback store:', err.message);
    return { success: true };
  }
}

export const DEFAULT_STUDIO_CLIENT_KEY = 'aw3x3m18kgf8mzyp';
export const DEFAULT_STUDIO_CLIENT_SECRET = '';
export const DEFAULT_STUDIO_REDIRECT_URI = 'https://lightsouttattoo.site/oauth/callback';

/**
 * Read TikTok credentials from Firestore or fallback store, decrypting secrets.
 */
export async function getCredentialsFromFirestore(
  env: Record<string, any>
): Promise<{ clientKey: string; clientSecret: string; redirectUri: string; hasSecret: boolean }> {
  const encSecret = env?.ENCRYPTION_SECRET || env?.TIKTOK_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_SECRET;
  
  // Check environment variables first
  let clientKey = (env?.TIKTOK_CLIENT_KEY || '').trim();
  let clientSecret = (env?.TIKTOK_CLIENT_SECRET || '').trim();
  let redirectUri = (env?.TIKTOK_REDIRECT_URI || '').trim();

  // Try Firestore REST API
  const projectId = env?.FIREBASE_PROJECT_ID || FIRESTORE_DEFAULTS.projectId;
  const databaseId = env?.FIRESTORE_DATABASE_ID || FIRESTORE_DEFAULTS.databaseId;
  const apiKey = env?.FIREBASE_API_KEY || FIRESTORE_DEFAULTS.apiKey;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${FIRESTORE_DEFAULTS.collection}/${FIRESTORE_DEFAULTS.configDoc}?key=${apiKey}`;

  let docData: Record<string, any> | null = null;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      docData = parseFirestoreFields(json.fields);
    }
  } catch (e) {
    console.warn('Could not read from Firestore:', e);
  }

  // Fallback to KV if available
  if (!docData && env?.TIKTOK_KV && typeof env.TIKTOK_KV.get === 'function') {
    try {
      const kvVal = await env.TIKTOK_KV.get('tiktok_config', 'json');
      if (kvVal) docData = kvVal;
    } catch {}
  }

  // Fallback to memory store
  if (!docData && MEMORY_CONFIG_STORE.has('tiktok_config')) {
    docData = MEMORY_CONFIG_STORE.get('tiktok_config');
  }

  if (docData) {
    if (!clientKey && docData.clientKey) clientKey = docData.clientKey;
    if (!redirectUri && docData.redirectUri) redirectUri = docData.redirectUri;

    // Decrypt client secret if present
    if (!clientSecret && docData.encryptedClientSecret && docData.clientSecretIv) {
      clientSecret = await decryptCredential(docData.encryptedClientSecret, docData.clientSecretIv, encSecret);
    } else if (!clientSecret && docData.clientSecret) {
      clientSecret = docData.clientSecret;
    }
  }

  // Default to official Lights Out Tattoo studio credentials if not yet set
  if (!clientKey) {
    clientKey = DEFAULT_STUDIO_CLIENT_KEY;
  }
  if (!clientSecret) {
    clientSecret = DEFAULT_STUDIO_CLIENT_SECRET;
  }
  if (!redirectUri) {
    redirectUri = DEFAULT_STUDIO_REDIRECT_URI;
  }

  return {
    clientKey,
    clientSecret,
    redirectUri,
    hasSecret: Boolean(clientSecret)
  };
}

/**
 * Save active TikTok tokens with AES-256-GCM encryption to Firestore
 */
export async function saveTokensToFirestore(
  tokens: TikTokTokenRecord | null,
  env: Record<string, any>
): Promise<void> {
  const encSecret = env?.ENCRYPTION_SECRET || env?.TIKTOK_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_SECRET;
  
  if (!tokens) {
    MEMORY_TOKEN_STORE.delete('tiktok_token');
    return;
  }

  // Encrypt access token and refresh token
  const encAccess = await encryptCredential(tokens.accessToken, encSecret);
  const encRefresh = await encryptCredential(tokens.refreshToken, encSecret);

  const documentData: Record<string, any> = {
    encryptedAccessToken: encAccess.ciphertext,
    accessTokenIv: encAccess.iv,
    encryptedRefreshToken: encRefresh.ciphertext,
    refreshTokenIv: encRefresh.iv,
    expiresAt: tokens.expiresAt,
    refreshExpiresAt: tokens.refreshExpiresAt || 0,
    openId: tokens.openId,
    user: tokens.user || {},
    encryptionAlgorithm: 'AES-256-GCM',
    updatedAt: new Date().toISOString()
  };

  MEMORY_TOKEN_STORE.set('tiktok_token', tokens);

  if (env?.TIKTOK_KV && typeof env.TIKTOK_KV.put === 'function') {
    try {
      await env.TIKTOK_KV.put('tiktok_token', JSON.stringify(documentData));
    } catch {}
  }

  const projectId = env?.FIREBASE_PROJECT_ID || FIRESTORE_DEFAULTS.projectId;
  const databaseId = env?.FIRESTORE_DATABASE_ID || FIRESTORE_DEFAULTS.databaseId;
  const apiKey = env?.FIREBASE_API_KEY || FIRESTORE_DEFAULTS.apiKey;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${FIRESTORE_DEFAULTS.collection}/${FIRESTORE_DEFAULTS.tokenDoc}?key=${apiKey}`;

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(documentData) })
    });
  } catch (e) {
    console.warn('Error saving token to Firestore:', e);
  }
}

/**
 * Retrieve and decrypt active TikTok tokens
 */
export async function getTokensFromFirestore(
  env: Record<string, any>
): Promise<TikTokTokenRecord | null> {
  if (MEMORY_TOKEN_STORE.has('tiktok_token')) {
    return MEMORY_TOKEN_STORE.get('tiktok_token');
  }

  const encSecret = env?.ENCRYPTION_SECRET || env?.TIKTOK_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_SECRET;
  const projectId = env?.FIREBASE_PROJECT_ID || FIRESTORE_DEFAULTS.projectId;
  const databaseId = env?.FIRESTORE_DATABASE_ID || FIRESTORE_DEFAULTS.databaseId;
  const apiKey = env?.FIREBASE_API_KEY || FIRESTORE_DEFAULTS.apiKey;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${FIRESTORE_DEFAULTS.collection}/${FIRESTORE_DEFAULTS.tokenDoc}?key=${apiKey}`;

  let docData: Record<string, any> | null = null;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      docData = parseFirestoreFields(json.fields);
    }
  } catch {}

  if (!docData && env?.TIKTOK_KV && typeof env.TIKTOK_KV.get === 'function') {
    try {
      docData = await env.TIKTOK_KV.get('tiktok_token', 'json');
    } catch {}
  }

  if (docData && docData.encryptedAccessToken && docData.accessTokenIv) {
    try {
      const accessToken = await decryptCredential(docData.encryptedAccessToken, docData.accessTokenIv, encSecret);
      const refreshToken = docData.encryptedRefreshToken
        ? await decryptCredential(docData.encryptedRefreshToken, docData.refreshTokenIv, encSecret)
        : '';

      const record: TikTokTokenRecord = {
        accessToken,
        refreshToken,
        expiresAt: docData.expiresAt || 0,
        refreshExpiresAt: docData.refreshExpiresAt || 0,
        openId: docData.openId || '',
        user: docData.user,
        updatedAt: docData.updatedAt || new Date().toISOString()
      };
      MEMORY_TOKEN_STORE.set('tiktok_token', record);
      return record;
    } catch (e) {
      console.error('Error decrypting stored tokens:', e);
    }
  }

  return null;
}

// Standard CORS headers helper
export function corsHeaders(request?: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Content-Type': 'application/json'
  };
}

// Normalize Redirect URI
export function normalizeRedirectUri(rawUri: string | undefined, request?: Request): string {
  let uri = (rawUri || '').trim();
  if (!uri || uri.includes('run.app')) {
    return DEFAULT_STUDIO_REDIRECT_URI;
  }
  try {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      uri = `https://${uri}`;
    }
    const parsed = new URL(uri);
    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
      parsed.protocol = 'https:';
    }
    parsed.search = '';
    parsed.hash = '';
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return DEFAULT_STUDIO_REDIRECT_URI;
  }
}
