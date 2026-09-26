import { uploadLargeMedia } from "../services/mediaStore";
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Upload,
  CheckCircle2,
  Percent,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  FileImage,
  X,
  DollarSign,
  QrCode
} from 'lucide-react';
import { ArtistProfile, Booking, PaymentTransaction } from '../types';
import { storageService } from '../services/storage';
import { LightsOutPayPortal } from './LightsOutPayPortal';

interface BookingSectionProps {
  profile: ArtistProfile;
  prefillDetails?: {
    approximateSize?: string;
    placement?: string;
    isCoverUp?: boolean;
    estimatedHours?: number;
    estimatedPrice?: number;
    finalPrice?: number;
  } | null;
  onBookingSubmitted?: (booking: Booking) => void;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  profile,
  prefillDetails,
  onBookingSubmitted
}) => {
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tattooIdea, setTattooIdea] = useState('');
  const [placement, setPlacement] = useState(prefillDetails?.placement || 'Forearm');
  const [approximateSize, setApproximateSize] = useState(
    prefillDetails?.approximateSize || 'Medium / Palm Size'
  );
  const [isCoverUp, setIsCoverUp] = useState(prefillDetails?.isCoverUp || false);
  const [coverUpDescription, setCoverUpDescription] = useState('');
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [coverUpPhoto, setCoverUpPhoto] = useState<string | null>(null);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('2:00 PM Afternoon');
  const [depositAcknowledged, setDepositAcknowledged] = useState(false);
  const [wantsTikTokRecording, setWantsTikTokRecording] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPayPortalOpen, setIsPayPortalOpen] = useState(false);
  const [depositCompleted, setDepositCompleted] = useState(false);

  // Handle file uploads
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'reference' | 'coverup'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await uploadLargeMedia(file);
      if (type === 'reference') setReferencePhoto(base64);
      else setCoverUpPhoto(base64);
    } catch (err) {
      console.error('Upload error', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientName.trim() || !phone.trim() || !tattooIdea.trim()) {
      setErrorMessage('Please provide your name, phone number, and a description of your tattoo idea.');
      return;
    }

    if (!depositAcknowledged) {
      setErrorMessage('Please acknowledge and agree to the $200 nonrefundable security deposit and reschedule terms.');
      return;
    }

    setIsSubmitting(true);

    try {
      const estimatedHours = prefillDetails?.estimatedHours || (isCoverUp ? 4 : 3);
      const hourlyRate = profile.hourlyRate;
      const basePrice = estimatedHours * hourlyRate;
      const discountPercent = profile.onlineDiscountPercent;
      const finalPrice = basePrice - Math.round(basePrice * (discountPercent / 100));

      const newBooking = storageService.createBooking({
        clientName: clientName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        tattooIdea: tattooIdea.trim(),
        placement,
        approximateSize,
        isCoverUp,
        coverUpDescription: isCoverUp ? coverUpDescription.trim() : undefined,
        referencePhotoUrl: referencePhoto || undefined,
        coverUpPhotoUrl: coverUpPhoto || undefined,
        estimatedHours,
        hourlyRate,
        estimatedPrice: basePrice,
        discountPercent,
        finalEstimatedPrice: finalPrice,
        preferredDate: preferredDate || 'Flexible / First available',
        preferredTimeSlot,
        securityDepositAmount: 200,
        securityDepositStatus: 'unpaid',
        depositPolicyAccepted: true,
        wantsTikTokSessionRecording: wantsTikTokRecording,
        sessionRecordingFee: wantsTikTokRecording ? 45 : 0,
        notes: `Submitted via Lights Out Web App with 15% discount applied. Agreed to $200 deposit policy.${wantsTikTokRecording ? ' Requested TikTok 4K Session Recording ($45 Package).' : ''}`
      });

      setConfirmedBooking(newBooking);
      if (onBookingSubmitted) onBookingSubmitted(newBooking);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not save booking. Please try again or call Tex directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-4xl mx-auto" id="booking-system">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-tech text-xs uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Automatic Online Booking Discount</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-white">
          BOOK A <span className="text-cyan-400">CONSULTATION</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-lg mx-auto">
          Direct pipeline to Tex. All appointments booked through this app automatically qualify for our{' '}
          <strong className="text-emerald-400">15% online discount</strong>!
        </p>
      </div>

      {confirmedBooking ? (
        /* Confirmation Success Screen */
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#09152b] to-[#060a14] border-2 border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_#10b981]">
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </div>

          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-400/40 text-emerald-300">
            BOOKING ID: {confirmedBooking.id}
          </span>

          <h3 className="font-heading font-black text-xl sm:text-2xl text-white mt-3">
            Consultation Request Received!
          </h3>
          <p className="text-sm text-gray-300 mt-1 max-w-md mx-auto">
            Thanks <strong className="text-cyan-300">{confirmedBooking.clientName}</strong>. Tex will review your reference and placement details and reach out via phone/text at{' '}
            <strong className="text-white font-mono">{confirmedBooking.phone}</strong> to confirm your slot and deposit.
          </p>

          <div className="my-5 p-4 rounded-xl bg-black/60 border border-cyan-500/30 max-w-md mx-auto text-left text-xs font-mono space-y-2 text-gray-300">
            <div className="flex justify-between border-b border-gray-800 pb-1.5">
              <span className="text-gray-400">Tattoo Focus:</span>
              <span className="text-white font-semibold truncate max-w-[220px]">
                {confirmedBooking.tattooIdea}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-1.5">
              <span className="text-gray-400">Placement & Size:</span>
              <span className="text-cyan-300">
                {confirmedBooking.placement} ({confirmedBooking.approximateSize})
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-1.5">
              <span className="text-gray-400">Estimated Rate:</span>
              <span className="text-white">${confirmedBooking.hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold pt-1 border-b border-gray-800 pb-1.5">
              <span>Estimated Total (-15% Discount):</span>
              <span>~${confirmedBooking.finalEstimatedPrice}</span>
            </div>
            <div className="pt-1 text-cyan-300">
              <div className="flex justify-between items-center">
                <span>Security Deposit Status:</span>
                {depositCompleted || confirmedBooking.securityDepositStatus === 'paid' ? (
                  <span className="font-bold text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
                    $200.00 PAID & SECURED ✓
                  </span>
                ) : (
                  <span className="font-bold text-amber-300 font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40">
                    $200.00 PENDING
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal font-sans">
                Nonrefundable deposit applied to final session balance. Note: Missed appointments without notice forfeit your spot and deposit. Reschedules are honored with proper advance notice.
              </p>
            </div>
          </div>

          {/* Deposit Instant Pay Option */}
          {(!depositCompleted && confirmedBooking.securityDepositStatus !== 'paid') && (
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#071912] to-cyan-950/70 border-2 border-emerald-400/60 shadow-[0_0_20px_rgba(0,214,50,0.3)] max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-2.5 justify-center">
                <span className="w-8 h-8 rounded-full bg-[#00D632] text-black font-heading font-black text-base flex items-center justify-center shadow-[0_0_10px_#00D632]">
                  $
                </span>
                <div className="text-left">
                  <h4 className="font-heading font-black text-sm text-white">
                    LOCK YOUR SPOT INSTANTLY
                  </h4>
                  <p className="text-[11px] text-emerald-300 font-mono">
                    Pay via Studio Cash App ({profile.cashAppHandle || '$texxx360'}) or POS
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPayPortalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D632] to-emerald-400 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,214,50,0.6)] flex items-center justify-center gap-2 active:scale-95"
              >
                <DollarSign className="w-4 h-4" />
                <span>Open Cash App / POS Deposit Portal ($200)</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <a
              href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-950 border border-cyan-400/50 hover:bg-cyan-900 text-cyan-300 font-bold text-xs font-mono flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call Tex Now ({profile.phone})</span>
            </a>
            <button
              onClick={() => setConfirmedBooking(null)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-white text-xs font-mono"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      ) : (
        /* The Booking Form */
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 shadow-[0_0_25px_rgba(0,240,255,0.15)] space-y-5"
        >
          {/* Automatic Discount Callout Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-400/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-heading text-xs font-bold text-emerald-300 uppercase">
                  Promo Code Activated: LIGHTSOUT15
                </span>
                <p className="text-[11px] text-gray-300">
                  15% off applied automatically to all consultations booked in-app.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-emerald-500 text-black shrink-0">
              15% OFF
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Marcus Vance"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
                Phone Number (Calls & Texts) *
              </label>
              <input
                type="tel"
                required
                placeholder="(540) 555-0192"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Tattoo Concept & Placement */}
          <div>
            <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
              Tattoo Concept & Idea *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe your subject, elements you want included (e.g. realistic owl with dark pine branches, pocketwatch with Roman numerals, cover-up of old tribal)..."
              value={tattooIdea}
              onChange={e => setTattooIdea(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Placement and Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
                Placement On Body
              </label>
              <select
                value={placement}
                onChange={e => setPlacement(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="Forearm">Forearm (Outer / Inner)</option>
                <option value="Upper Arm / Bicep">Upper Arm / Bicep</option>
                <option value="Chest Plate">Chest Plate</option>
                <option value="Full Back">Full Back / Shoulder Blade</option>
                <option value="Calf / Shin">Calf / Shin</option>
                <option value="Thigh">Thigh Panel</option>
                <option value="Ribs / Sternum">Ribs / Sternum</option>
                <option value="Neck / Hand">Neck / Hand</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
                Approximate Size
              </label>
              <select
                value={approximateSize}
                onChange={e => setApproximateSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="Small Flash / Filler">Small Flash / Filler (1-2 hrs)</option>
                <option value="Medium / Palm Size">Medium / Palm Size (3-4 hrs)</option>
                <option value="Large Statement">Large Statement (5-7 hrs)</option>
                <option value="Half Sleeve">Half Sleeve / Chest Plate (8-12 hrs)</option>
                <option value="Full Sleeve / Back">Full Sleeve / Back (15-25+ hrs)</option>
              </select>
            </div>
          </div>

          {/* Cover-Up Toggle */}
          <div className="p-3.5 rounded-xl bg-[#091122] border border-cyan-500/30">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCoverUp}
                onChange={e => setIsCoverUp(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 accent-cyan-500"
              />
              <span className="font-heading font-bold text-xs sm:text-sm text-white">
                Is this a Cover-Up of an existing tattoo?
              </span>
            </label>

            {isCoverUp && (
              <div className="mt-3 pt-3 border-t border-cyan-500/20 space-y-3">
                <input
                  type="text"
                  placeholder="Describe what is currently there (age, darkness, size in inches)..."
                  value={coverUpDescription}
                  onChange={e => setCoverUpDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
                />

                {/* Upload Photo of existing tattoo */}
                <div>
                  <label className="block text-[11px] font-mono text-cyan-300 mb-1">
                    Upload clear photo of existing tattoo to cover:
                  </label>
                  {coverUpPhoto ? (
                    <div className="relative inline-block">
                      <img
                        src={coverUpPhoto}
                        alt="Tattoo to cover"
                        className="w-24 h-24 object-cover rounded-lg border border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setCoverUpPhoto(null)}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={e => handleFileUpload(e, 'coverup')}
                      className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reference Photo Upload */}
          <div>
            <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
              Reference Photos / Inspiration (Optional)
            </label>
            {referencePhoto ? (
              <div className="relative inline-block">
                <img
                  src={referencePhoto}
                  alt="Reference uploaded"
                  className="w-24 h-24 object-cover rounded-lg border border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setReferencePhoto(null)}
                  className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*,video/*"
                onChange={e => handleFileUpload(e, 'reference')}
                className="w-full text-xs text-gray-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
              />
            )}
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
                Preferred Date (or Approx Timeframe)
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-tech font-bold uppercase text-gray-300 mb-1">
                Time Slot Preference
              </label>
              <select
                value={preferredTimeSlot}
                onChange={e => setPreferredTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="10:00 AM Morning">10:00 AM (Morning Session)</option>
                <option value="2:00 PM Afternoon">2:00 PM (Afternoon Session)</option>
                <option value="6:00 PM Evening">6:00 PM (Evening Session)</option>
                <option value="Flexible / Any Time">Flexible / Any Time</option>
              </select>
            </div>
          </div>

          {/* TikTok Live Stream & 4K Recording Package Option */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#071329] via-[#091a38] to-[#040e20] border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsTikTokRecording}
                  onChange={e => setWantsTikTokRecording(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 shrink-0 cursor-pointer"
                />
                <span className="font-heading font-black text-xs sm:text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  TIKTOK LIVE STREAM & 4K SESSION REEL PACKAGE
                </span>
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-400/40 shrink-0">
                +$45 Flat Fee
              </span>
            </div>
            <p className="text-[11px] text-gray-300 font-tech pl-6 leading-relaxed">
              Optional add-on: Includes studio multi-angle filming during your appointment, studio media consent waiver, optional TikTok Live broadcast to realism enthusiasts, and an edited 4K reel for your social media.
            </p>
          </div>

          {/* Official Studio Security Deposit & Missed Appointment Policy */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-[#180d19] to-cyan-950/40 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-heading font-bold text-sm uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Studio Security Deposit & Cancellation Policy</span>
            </div>

            <div className="text-xs text-gray-300 font-mono space-y-1.5 leading-relaxed">
              <p>
                • <strong className="text-white">$200 Nonrefundable Security Deposit:</strong> Required to lock your appointment time slot on Tex&apos;s needle schedule (applied directly toward your session total).
              </p>
              <p>
                • <strong className="text-red-300">Missed Appointment / No-Show:</strong> If you miss your scheduled appointment without advance notification, your time slot and deposit are forfeited.
              </p>
              <p>
                • <strong className="text-emerald-300">Reschedules:</strong> Reschedules are accepted with proper advance notice and confirmed schedule change.
              </p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-gray-800">
              <input
                type="checkbox"
                required
                checked={depositAcknowledged}
                onChange={e => setDepositAcknowledged(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-cyan-500 accent-cyan-500 shrink-0 cursor-pointer"
              />
              <span className="text-xs font-mono text-cyan-200 font-bold select-none">
                I agree to the $200 nonrefundable security deposit, no-show forfeit policy, and reschedule terms. *
              </span>
            </label>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-black font-heading font-black text-sm uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.5)] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Transmitting to Tex...' : 'Send Consultation Request (-15% Applied)'}
          </button>

          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1">
            <span>📞 Direct questions? Call Tex: {profile.phone}</span>
            <span>📍 Winchester, VA</span>
          </div>
        </form>
      )}

      {/* Cash App & POS Portal Modal for Deposit */}
      {confirmedBooking && (
        <LightsOutPayPortal
          isOpen={isPayPortalOpen}
          onClose={() => setIsPayPortalOpen(false)}
          profile={profile}
          initialAmount={200}
          initialBooking={confirmedBooking}
          paymentType="deposit"
          onPaymentCompleted={(tx: PaymentTransaction) => {
            setDepositCompleted(true);
            setConfirmedBooking(prev => prev ? { ...prev, securityDepositStatus: 'paid' } : null);
          }}
        />
      )}
    </div>
  );
};
