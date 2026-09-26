import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Plus,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  CalendarCheck,
  Phone,
  Mail,
  Zap,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Booking, ArtistProfile } from '../types';
import {
  initAuth,
  googleSignIn,
  logout,
  listCalendarEvents,
  createCalendarEvent,
  GoogleCalendarEvent,
  isGoogleConnected
} from '../services/googleCalendar';
import { storageService } from '../services/storage';
import { User } from 'firebase/auth';

interface AdminCalendarSyncProps {
  bookings: Booking[];
  profile: ArtistProfile;
  onRefreshBookings: () => void;
  onShowNotification: (msg: string) => void;
}

export const AdminCalendarSync: React.FC<AdminCalendarSyncProps> = ({
  bookings,
  profile,
  onRefreshBookings,
  onShowNotification
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [syncingBookingId, setSyncingBookingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'month' | 'agenda'>('month');

  // Initialize Auth state listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsConnected(true);
        loadCalendarEvents();
      },
      () => {
        setCurrentUser(null);
        setIsConnected(false);
        setCalendarEvents([]);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadCalendarEvents = async () => {
    setIsLoading(true);
    try {
      const events = await listCalendarEvents();
      setCalendarEvents(events);
    } catch (err: any) {
      console.warn('Calendar events load notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setIsConnected(true);
        onShowNotification('Google Calendar connected successfully! Syncing routine...');
        await loadCalendarEvents();
      }
    } catch (err: any) {
      console.error('Sign in failure:', err);
      onShowNotification(err.message || 'Failed to connect Google Calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await logout();
    setCurrentUser(null);
    setIsConnected(false);
    setCalendarEvents([]);
    onShowNotification('Google Calendar disconnected.');
  };

  // Sync a booking directly into Google Calendar
  const handleSyncBooking = async (booking: Booking) => {
    if (!isConnected) {
      onShowNotification('Please connect your Google Calendar first.');
      return;
    }

    setSyncingBookingId(booking.id);
    try {
      const event = await createCalendarEvent(booking);
      storageService.updateBookingCalendarSync(booking.id, event.id, event.htmlLink);
      onRefreshBookings();
      await loadCalendarEvents();
      onShowNotification(`Appointment for ${booking.clientName} synced to Google Calendar!`);
    } catch (err: any) {
      console.error('Sync failed:', err);
      onShowNotification(err.message || 'Could not sync to Google Calendar.');
    } finally {
      setSyncingBookingId(null);
    }
  };

  // Update security deposit status
  const handleUpdateDeposit = (
    bookingId: string,
    status: 'unpaid' | 'paid' | 'forfeited'
  ) => {
    storageService.updateBookingDeposit(bookingId, status);
    onRefreshBookings();
    if (status === 'paid') {
      onShowNotification('Security Deposit marked as PAID ($200.00). Spot is locked!');
    } else if (status === 'forfeited') {
      onShowNotification('Notice: Deposit forfeited due to missed appointment without notice.');
    } else {
      onShowNotification('Security Deposit status updated.');
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Build Calendar Days for Current Month
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Find bookings or calendar events for a specific date
  const getItemsForDate = (dateStr: string) => {
    const dayBookings = bookings.filter(b => b.preferredDate === dateStr);
    const dayEvents = calendarEvents.filter(ev => {
      const evDate = ev.start.dateTime
        ? ev.start.dateTime.split('T')[0]
        : ev.start.date;
      return evDate === dateStr;
    });
    return { dayBookings, dayEvents };
  };

  return (
    <div className="space-y-6" id="admin-calendar-sync">
      {/* Policy & Google Integration Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#09152b] via-[#0b1b36] to-[#070e1e] border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-lg text-white">
              STUDIO CALENDAR & GOOGLE SYNC
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300">
              TEX ROUTINE
            </span>
          </div>
          <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
            Sync tattoo chair sessions, cover-up consultations, and daily routine events directly
            with your personal or studio Google Calendar. Connected appointments update live so you
            never double-book or miss a needle slot.
          </p>

          {/* Official Security Deposit Rule Banner */}
          <div className="mt-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-200 font-mono">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span>
              <strong>$200 Nonrefundable Security Deposit Policy:</strong> Missing an appointment
              without notification forfeits both the spot & $200 deposit. Reschedules accepted
              with advance notice.
            </span>
          </div>
        </div>

        {/* Google Authentication Control */}
        <div className="shrink-0 w-full lg:w-auto">
          {isConnected && currentUser ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-black/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <div className="flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Tex'}
                    className="w-9 h-9 rounded-full border border-cyan-400 object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-cyan-300" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white font-heading">
                      {currentUser.displayName || 'Google Connected'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono block truncate max-w-[180px]">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                <button
                  onClick={loadCalendarEvents}
                  disabled={isLoading}
                  title="Refresh calendar events"
                  className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono hover:bg-red-900 transition"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            /* Official Google Sign In Button */
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white text-gray-800 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoading ? 'Connecting...' : 'Connect Google Calendar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Monthly Calendar & Booking Inquiries Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Monthly Calendar (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/30">
            {/* Header / Month Nav */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                <h4 className="font-heading font-bold text-base text-white">{monthName}</h4>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg bg-black/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 transition"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonthDate(new Date())}
                  className="px-2 py-1 rounded-lg bg-black/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 hover:bg-cyan-950 transition"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg bg-black/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 transition"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of week labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-cyan-400 font-bold mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-16 rounded-lg bg-black/20" />;
                }

                const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  day
                ).padStart(2, '0')}`;
                const { dayBookings, dayEvents } = getItemsForDate(dayDateStr);
                const isToday = dayDateStr === new Date().toISOString().split('T')[0];
                const isSelected = dayDateStr === selectedDate;
                const hasAppointments = dayBookings.length > 0 || dayEvents.length > 0;

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(dayDateStr)}
                    className={`h-16 p-1 rounded-lg border transition cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : isToday
                        ? 'bg-blue-950/40 border-blue-400/60'
                        : 'bg-black/50 border-gray-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday ? 'text-cyan-300' : 'text-gray-300'
                        }`}
                      >
                        {day}
                      </span>
                      {hasAppointments && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#00f0ff]" />
                      )}
                    </div>

                    <div className="space-y-0.5 overflow-hidden">
                      {dayBookings.slice(0, 1).map(b => (
                        <div
                          key={b.id}
                          className="text-[9px] font-mono truncate px-1 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-500/30"
                          title={`${b.clientName} - ${b.tattooIdea}`}
                        >
                          {b.clientName.split(' ')[0]}
                        </div>
                      ))}
                      {dayEvents.slice(0, 1).map(ev => (
                        <div
                          key={ev.id}
                          className="text-[9px] font-mono truncate px-1 rounded bg-blue-900/60 text-blue-200 border border-blue-500/30"
                          title={ev.summary}
                        >
                          📅 {ev.summary.replace('⚡ Lights Out Tattoo: ', '')}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Agenda Details */}
          <div className="p-4 rounded-2xl bg-[#080d1a] border border-cyan-500/30">
            <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
              <span className="text-xs font-mono text-cyan-300 font-bold">
                SCHEDULE FOR {selectedDate}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {getItemsForDate(selectedDate).dayBookings.length} Studio Bookings •{' '}
                {getItemsForDate(selectedDate).dayEvents.length} Calendar Events
              </span>
            </div>

            {getItemsForDate(selectedDate).dayBookings.length === 0 &&
            getItemsForDate(selectedDate).dayEvents.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono text-center py-4">
                No sessions or events scheduled for this day yet.
              </p>
            ) : (
              <div className="space-y-2">
                {getItemsForDate(selectedDate).dayBookings.map(b => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{b.clientName}</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px]">
                          {b.preferredTimeSlot}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            b.securityDepositStatus === 'paid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : b.securityDepositStatus === 'forfeited'
                              ? 'bg-red-950 text-red-300 border border-red-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          Deposit: {b.securityDepositStatus?.toUpperCase() || 'UNPAID'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-[11px] mt-0.5 truncate max-w-md">
                        {b.tattooIdea} ({b.placement}) • ~{b.estimatedHours} hrs @ ${b.hourlyRate}/hr
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.googleCalendarHtmlLink ? (
                        <a
                          href={b.googleCalendarHtmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Google Cal</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handleSyncBooking(b)}
                          disabled={syncingBookingId === b.id}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500 text-black font-bold text-[11px] hover:bg-cyan-400 transition flex items-center gap-1 shrink-0"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Sync Cal</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {getItemsForDate(selectedDate).dayEvents.map(ev => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-200 font-bold">{ev.summary}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-400/40">
                          Google Event
                        </span>
                      </div>
                      {ev.location && (
                        <p className="text-gray-400 text-[11px] mt-0.5">{ev.location}</p>
                      )}
                    </div>
                    {ev.htmlLink && (
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-300 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inquiries & Deposit Management Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                  Sync Inquiries to Calendar
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {bookings.filter(b => !b.googleCalendarEventId).length} Unsynced
              </span>
            </div>

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {bookings.length === 0 ? (
                <p className="text-xs text-gray-400 font-mono text-center py-6">
                  No booking inquiries currently recorded.
                </p>
              ) : (
                bookings.map(booking => {
                  const isSynced = !!booking.googleCalendarEventId;
                  const depositStatus = booking.securityDepositStatus || 'unpaid';

                  return (
                    <div
                      key={booking.id}
                      className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                        isSynced
                          ? 'bg-[#060b17] border-cyan-500/40'
                          : 'bg-black/60 border-gray-800 hover:border-cyan-500/30'
                      }`}
                    >
                      {/* Client Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-sm text-white">
                              {booking.clientName}
                            </span>
                            {booking.isCoverUp && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                                Cover-Up
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mt-0.5">
                            <a
                              href={`tel:${booking.phone.replace(/[^0-9]/g, '')}`}
                              className="text-cyan-400 hover:underline flex items-center gap-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{booking.phone}</span>
                            </a>
                            <span>•</span>
                            <span>{booking.preferredDate}</span>
                          </div>
                        </div>

                        {/* Google Calendar Sync Button / Status */}
                        {isSynced ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>In Cal</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSyncBooking(booking)}
                            disabled={syncingBookingId === booking.id || !isConnected}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition shadow-[0_0_10px_rgba(0,240,255,0.3)] active:scale-95 disabled:opacity-50 shrink-0"
                            title={isConnected ? 'Add to Google Calendar' : 'Connect Google first'}
                          >
                            <Zap className="w-3 h-3" />
                            <span>
                              {syncingBookingId === booking.id ? 'Syncing...' : 'Push to Cal'}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Idea / Placement summary */}
                      <p className="text-xs text-gray-300 font-tech">
                        <strong>Piece:</strong> {booking.tattooIdea} ({booking.placement})
                      </p>

                      {/* Security Deposit Controls & Policy Actions */}
                      <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span className="text-gray-400">$200 Deposit:</span>
                          <span
                            className={`font-bold uppercase px-1.5 py-0.2 rounded text-[10px] ${
                              depositStatus === 'paid'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : depositStatus === 'forfeited'
                                ? 'bg-red-950 text-red-300 border border-red-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {depositStatus}
                          </span>
                        </div>

                        {/* Quick Deposit Status Toggles */}
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          {depositStatus !== 'paid' && (
                            <button
                              onClick={() => handleUpdateDeposit(booking.id, 'paid')}
                              className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-900 transition"
                              title="Mark $200 deposit received"
                            >
                              Paid $200
                            </button>
                          )}
                          {depositStatus !== 'forfeited' && (
                            <button
                              onClick={() => handleUpdateDeposit(booking.id, 'forfeited')}
                              className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 hover:bg-red-900 transition"
                              title="Client no-show without notification: forfeit spot & deposit"
                            >
                              Forfeit (No-Show)
                            </button>
                          )}
                          {depositStatus !== 'unpaid' && (
                            <button
                              onClick={() => handleUpdateDeposit(booking.id, 'unpaid')}
                              className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700 text-gray-400 hover:text-white transition"
                              title="Reset deposit to unpaid"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
