import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Booking } from '../types';

// Initialize Firebase App & Auth
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events'
];

const provider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache access token strictly in-memory per security guidelines
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google authentication');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const isGoogleConnected = (): boolean => {
  return !!cachedAccessToken && !!auth.currentUser;
};

/**
 * Fetch events from the primary Google Calendar
 */
export const listCalendarEvents = async (
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> => {
  if (!cachedAccessToken) {
    throw new Error('Google Calendar not connected. Please sign in with Google first.');
  }

  const now = new Date();
  const min = timeMin || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const max = timeMax || new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('timeMin', min);
  url.searchParams.append('timeMax', max);
  url.searchParams.append('maxResults', '100');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Session expired. Please reconnect your Google Calendar.');
    }
    const errText = await res.text();
    throw new Error(`Google Calendar API error: ${errText}`);
  }

  const data = await res.json();
  return (data.items || []) as GoogleCalendarEvent[];
};

/**
 * Creates or syncs an appointment event directly on Tex's Google Calendar
 */
export const createCalendarEvent = async (
  booking: Booking,
  sessionStartISO?: string,
  sessionEndISO?: string
): Promise<GoogleCalendarEvent> => {
  if (!cachedAccessToken) {
    throw new Error('Google Calendar is not connected. Sign in with Google to sync.');
  }

  // Calculate session start & end if not provided
  let startISO = sessionStartISO;
  let endISO = sessionEndISO;

  if (!startISO || !endISO) {
    const sessionHours = booking.estimatedHours || 3;
    let targetDate = booking.preferredDate;
    if (!targetDate || targetDate.includes('Flexible')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      targetDate = tomorrow.toISOString().split('T')[0];
    }

    let startHour = 14; // default 2 PM
    if (booking.preferredTimeSlot?.toLowerCase().includes('10:00') || booking.preferredTimeSlot?.toLowerCase().includes('morning')) {
      startHour = 10;
    } else if (booking.preferredTimeSlot?.toLowerCase().includes('6:00') || booking.preferredTimeSlot?.toLowerCase().includes('evening')) {
      startHour = 18;
    }

    const startDate = new Date(`${targetDate}T${String(startHour).padStart(2, '0')}:00:00`);
    const endDate = new Date(startDate.getTime() + sessionHours * 60 * 60 * 1000);

    startISO = startDate.toISOString();
    endISO = endDate.toISOString();
  }

  const depositStatusText = booking.securityDepositStatus === 'paid'
    ? 'PAID ($200.00)'
    : booking.securityDepositStatus === 'forfeited'
    ? 'FORFEITED (No-show without notice)'
    : 'PENDING ($200.00 required to hold spot)';

  const eventPayload = {
    summary: `⚡ Lights Out Tattoo: ${booking.clientName} (${booking.placement || 'Tattoo'})`,
    description: [
      `LIGHTS OUT TATTOO - APPOINTMENT DETAILS`,
      `Client: ${booking.clientName}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email || 'N/A'}`,
      `Concept: ${booking.tattooIdea}`,
      `Placement: ${booking.placement} (${booking.approximateSize})`,
      `Type: ${booking.isCoverUp ? 'Cover-Up Transformation' : 'Original Custom Piece'}`,
      `Estimated Time: ${booking.estimatedHours} Hours @ $${booking.hourlyRate}/hr`,
      `Estimated Quote: ~$${booking.finalEstimatedPrice} (15% Online Booking Discount Applied)`,
      ``,
      `STUDIO POLICY & SECURITY DEPOSIT:`,
      `• Deposit Amount: $200.00 (Nonrefundable)`,
      `• Deposit Status: ${depositStatusText}`,
      `• POLICY NOTICE: Missed appointments without notice forfeit time slot & $200 deposit. Reschedules accepted with proper notice.`,
      ``,
      `Booking Reference: ${booking.id}`,
      `Studio: Lights Out Tattoo, Winchester, VA (Artist: Tex)`
    ].join('\n'),
    location: 'Lights Out Tattoo, Historic Downtown, Winchester, VA 22601',
    start: {
      dateTime: startISO,
      timeZone: 'America/New_York'
    },
    end: {
      dateTime: endISO,
      timeZone: 'America/New_York'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 24 hours prior
        { method: 'popup', minutes: 120 }   // 2 hours prior
      ]
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventPayload)
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Authentication expired. Reconnect Google Calendar and try again.');
    }
    const errText = await res.text();
    throw new Error(`Failed to create calendar event: ${errText}`);
  }

  const createdEvent = (await res.json()) as GoogleCalendarEvent;
  return createdEvent;
};

/**
 * Remove an event from Google Calendar
 */
export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
  if (!cachedAccessToken) return false;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`
      }
    }
  );

  return res.status === 204 || res.ok;
};
