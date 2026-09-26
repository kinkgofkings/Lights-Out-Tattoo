import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  X,
  DollarSign,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Share2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  RotateCcw,
  Zap,
  Lock
} from 'lucide-react';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';
import { ArtistProfile, Booking, PaymentTransaction } from '../types';
import { storageService } from '../services/storage';

interface LightsOutPayPortalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ArtistProfile;
  initialAmount?: number;
  initialBooking?: Booking | null;
  paymentType?: 'deposit' | 'session_balance' | 'walk_in' | 'merch';
  onPaymentCompleted?: (transaction: PaymentTransaction) => void;
}

export const LightsOutPayPortal: React.FC<LightsOutPayPortalProps> = ({
  isOpen,
  onClose,
  profile,
  initialAmount = 200,
  initialBooking = null,
  paymentType = 'deposit',
  onPaymentCompleted
}) => {
  // Amount string typed on Cash App keypad
  const [amountStr, setAmountStr] = useState<string>(initialAmount ? initialAmount.toString() : '200');
  const [clientName, setClientName] = useState<string>(initialBooking?.clientName || '');
  const [clientPhone, setClientPhone] = useState<string>(initialBooking?.phone || '');
  const [clientEmail, setClientEmail] = useState<string>(initialBooking?.email || '');
  const [note, setNote] = useState<string>(
    initialBooking
      ? `Deposit for ${(initialBooking.tattooIdea || '').slice(0, 35)} (${initialBooking.id})`
      : 'Tattoo Session Deposit'
  );

  // Tip Selection
  const [selectedTipPercent, setSelectedTipPercent] = useState<number | 'custom' | 0>(0);
  const [customTipStr, setCustomTipStr] = useState<string>('');

  // Payment Method: Cash App ($), Card/Tap POS, Studio Cash
  const [paymentMethod, setPaymentMethod] = useState<'cash_app' | 'card_pos' | 'cash'>('cash_app');

  // Studio Cash received for change calculator
  const [cashReceivedStr, setCashReceivedStr] = useState<string>('');

  // Card POS input state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('22601');
  const [cardTapActive, setCardTapActive] = useState(false);

  // State for generated QR Code and processing
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCashtag, setCopiedCashtag] = useState(false);
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);

  // Parse numerical amount
  const numericAmount = useMemo(() => {
    const parsed = parseFloat(amountStr);
    return isNaN(parsed) ? 0 : parsed;
  }, [amountStr]);

  // Calculate tip
  const tipAmount = useMemo(() => {
    if (selectedTipPercent === 'custom') {
      const custom = parseFloat(customTipStr);
      return isNaN(custom) ? 0 : custom;
    }
    if (typeof selectedTipPercent === 'number' && selectedTipPercent > 0) {
      return Math.round(numericAmount * (selectedTipPercent / 100));
    }
    return 0;
  }, [numericAmount, selectedTipPercent, customTipStr]);

  const totalPayable = numericAmount + tipAmount;

  // Clean Cashtag (strip leading $ for URLs)
  const cleanCashtag = useMemo(() => {
    const raw = profile.cashAppHandle || '$LightsOutTattooTex';
    return raw.replace(/^\$/, '').trim();
  }, [profile.cashAppHandle]);

  // Cash App Pay Link
  const cashAppUrl = useMemo(() => {
    const formattedAmount = totalPayable > 0 ? totalPayable.toFixed(2) : '200.00';
    return `https://cash.app/$${cleanCashtag}/${formattedAmount}`;
  }, [cleanCashtag, totalPayable]);

  // Generate QR Code for Cash App Link
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(
      cashAppUrl,
      {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#000000',
          light: '#00D632' // Cash App signature emerald green background
        }
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [cashAppUrl, isOpen]);

  // Sync initial booking changes
  useEffect(() => {
    if (initialBooking) {
      setClientName(initialBooking.clientName);
      setClientPhone(initialBooking.phone);
      setClientEmail(initialBooking.email || '');
      setNote(`Deposit for ${(initialBooking.tattooIdea || '').slice(0, 35)} (${initialBooking.id})`);
    }
    if (initialAmount) {
      setAmountStr(initialAmount.toString());
    }
  }, [initialBooking, initialAmount, isOpen]);

  if (!isOpen) return null;

  // Keypad Handlers
  const handleDigit = (digit: string) => {
    if (amountStr === '0' && digit !== '.') {
      setAmountStr(digit);
      return;
    }
    if (digit === '.' && amountStr.includes('.')) return;
    if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
    if (amountStr.length >= 7) return; // Prevent absurd digits
    setAmountStr(prev => prev + digit);
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
      return;
    }
    setAmountStr(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmountStr('0');
  };

  const handleCopyCashtag = () => {
    navigator.clipboard.writeText(`$${cleanCashtag}`);
    setCopiedCashtag(true);
    setTimeout(() => setCopiedCashtag(false), 2000);
  };

  // Complete Payment Action
  const handleFinalizePayment = (methodOverride?: 'cash_app' | 'card_pos' | 'cash') => {
    if (totalPayable <= 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const finalMethod = methodOverride || paymentMethod;
      const tx = storageService.recordTransaction({
        bookingId: initialBooking?.id,
        clientName: clientName.trim() || 'Walk-in Client',
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        amount: numericAmount,
        tipAmount,
        totalPaid: totalPayable,
        paymentType: (paymentType || 'deposit') as 'deposit' | 'session_balance' | 'walk_in' | 'merch',
        paymentMethod: finalMethod,
        cashAppHandle: `$${cleanCashtag}`,
        note: note.trim()
      });

      setCompletedTx(tx);
      setIsProcessing(false);
      if (onPaymentCompleted) {
        onPaymentCompleted(tx);
      }
    }, 900);
  };

  // Simulate Contactless Tap to Pay
  const handleSimulateTap = () => {
    setCardTapActive(true);
    setTimeout(() => {
      setCardTapActive(false);
      handleFinalizePayment('card_pos');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#050811] border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_50px_rgba(0,214,50,0.25)] overflow-hidden flex flex-col max-h-[95vh] my-auto">
        
        {/* Top Header Bar */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-[#0a1510] to-[#050811] border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00D632] flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_#00D632]">
              $
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-sm text-white tracking-wider">
                  LIGHTS OUT PAY
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold uppercase">
                  Cash App POS
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                {profile.businessName} • Winchester, VA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close portal"
            className="p-2 rounded-xl bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* COMPLETED RECEIPT VIEW */}
        {completedTx ? (
          <div className="p-6 overflow-y-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(0,214,50,0.5)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Payment Authorized & Secured
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-white">
                ${completedTx.totalPaid.toFixed(2)}
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Paid to {profile.businessName} (${cleanCashtag})
              </p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-2xl bg-[#09121d] border border-cyan-500/30 text-left font-mono text-xs space-y-2.5 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                <BustedLightbulbIcon size={140} glow={false} />
              </div>

              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-gray-400">Transaction ID:</span>
                <span className="text-cyan-300 font-bold">{completedTx.id}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-gray-400">Client:</span>
                <span className="text-white font-bold">{completedTx.clientName}</span>
              </div>
              {completedTx.bookingId && (
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Booking Ref:</span>
                  <span className="text-emerald-400 font-bold">{completedTx.bookingId} (Locked)</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-gray-400">Date & Time:</span>
                <span className="text-gray-300">
                  {new Date(completedTx.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-gray-400">Payment Channel:</span>
                <span className="text-emerald-400 uppercase font-bold">
                  {completedTx.paymentMethod === 'cash_app'
                    ? 'Cash App Pay'
                    : completedTx.paymentMethod === 'card_pos'
                    ? 'POS Card / Tap'
                    : 'Studio Cash'}
                </span>
              </div>

              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Amount:</span>
                  <span className="text-white">${completedTx.amount.toFixed(2)}</span>
                </div>
                {completedTx.tipAmount > 0 && (
                  <div className="flex justify-between text-cyan-300">
                    <span>Artist Needle Tip:</span>
                    <span>+${completedTx.tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-gray-700">
                  <span>Total Recorded:</span>
                  <span className="text-emerald-400">${completedTx.totalPaid.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-black/60 border border-gray-800 text-[11px] text-gray-400 leading-normal">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
                <span>
                  {completedTx.paymentType === 'deposit'
                    ? '$200 nonrefundable security deposit is applied to your tattoo total. Non-attendance without advance notice forfeits your deposit.'
                    : 'Thank you for choosing Lights Out Tattoo. Follow your artist aftercare protocol.'}
                </span>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 font-mono text-xs font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-90 transition shadow-[0_0_15px_rgba(0,214,50,0.4)]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE POS & CASH APP CHECKOUT VIEW */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Mode / Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/80 rounded-2xl border border-gray-800">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash_app')}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'cash_app'
                    ? 'bg-[#00D632] text-black shadow-[0_0_12px_rgba(0,214,50,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-sm font-black">$</span>
                <span>Cash App</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card_pos')}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'card_pos'
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>POS Card/Tap</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Studio Cash</span>
              </button>
            </div>

            {/* CASH APP AMOUNT DISPLAY (The iconic massive numbers!) */}
            <div className="py-4 px-2 text-center rounded-2xl bg-gradient-to-b from-[#0a1811] to-[#050b07] border border-emerald-500/30 relative">
              <div className="flex items-center justify-center text-white">
                <span className="text-3xl sm:text-4xl font-heading font-black text-emerald-400 mr-1">
                  $
                </span>
                <span className="text-5xl sm:text-6xl font-heading font-black tracking-tight select-none">
                  {amountStr}
                </span>
              </div>

              {/* Breakdown subtext if tip is active */}
              {tipAmount > 0 && (
                <div className="text-xs font-mono text-emerald-300 mt-1">
                  Base ${numericAmount} + Needle Tip ${tipAmount} ={' '}
                  <strong className="text-white">${totalPayable.toFixed(2)} Total</strong>
                </div>
              )}

              {/* Quick Preset Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-2 border-t border-emerald-950">
                {[
                  { label: '$200 Deposit', val: '200', desc: 'Lock Slot' },
                  { label: '$100 1-Hr', val: '100', desc: '1 Hour' },
                  { label: '$300 Half-Day', val: '300', desc: '3 Hours' },
                  { label: '$600 Full-Day', val: '600', desc: 'Full Sit' }
                ].map(preset => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setAmountStr(preset.val)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition border ${
                      amountStr === preset.val
                        ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-[0_0_8px_#00D632]'
                        : 'bg-black/60 text-gray-300 border-emerald-500/30 hover:border-emerald-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CLIENT & NOTE INFO BAR */}
            <div className="p-3 rounded-xl bg-black/60 border border-gray-800 space-y-2 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Justin Tyler"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#090e1a] border border-gray-700 text-white text-xs focus:border-emerald-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Phone (SMS Receipt)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 540-555-0192"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#090e1a] border border-gray-700 text-white text-xs focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">Payment Note / Concept</label>
                <input
                  type="text"
                  placeholder="e.g. $200 nonrefundable appointment deposit"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090e1a] border border-gray-700 text-white text-xs focus:border-emerald-400 outline-none"
                />
              </div>
            </div>

            {/* ARTIST TIP SELECTOR */}
            <div className="p-3 rounded-xl bg-black/50 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Artist Tip (Optional)</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  {tipAmount > 0 ? `+$${tipAmount.toFixed(2)}` : 'None'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs font-mono">
                {[
                  { label: '0%', val: 0 },
                  { label: '15%', val: 15 },
                  { label: '20%', val: 20 },
                  { label: '25%', val: 25 },
                  { label: 'Custom', val: 'custom' }
                ].map(tip => (
                  <button
                    key={tip.label}
                    type="button"
                    onClick={() => setSelectedTipPercent(tip.val as any)}
                    className={`py-1.5 px-1 rounded-lg text-center transition border ${
                      selectedTipPercent === tip.val
                        ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                        : 'bg-black border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tip.label}
                  </button>
                ))}
              </div>
              {selectedTipPercent === 'custom' && (
                <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                  <span className="text-gray-400">Custom Tip $:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="25"
                    value={customTipStr}
                    onChange={e => setCustomTipStr(e.target.value)}
                    className="w-24 px-2 py-1 rounded bg-[#090e1a] border border-cyan-400 text-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* --- PAYMENT METHOD 1: CASH APP --- */}
            {paymentMethod === 'cash_app' && (
              <div className="p-4 rounded-2xl bg-[#07130b] border border-emerald-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* QR Code Container */}
                  <div className="p-2.5 rounded-2xl bg-[#00D632] flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,214,50,0.3)] shrink-0">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`Cash App QR for $${cleanCashtag}`}
                        className="w-36 h-36 rounded-xl block"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center font-mono text-black text-xs font-bold">
                        Generating QR...
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-black text-black tracking-wider uppercase mt-1">
                      Scan with Cash App
                    </span>
                  </div>

                  {/* Cash App Handle & Deep Link Details */}
                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wide block">
                        Official Studio Cashtag:
                      </span>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                        <span className="text-xl sm:text-2xl font-heading font-black text-white">
                          ${cleanCashtag}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCashtag}
                          className="p-1.5 rounded-lg bg-black border border-emerald-500/40 text-emerald-300 hover:text-white transition flex items-center gap-1 text-xs font-mono"
                          title="Copy $Cashtag"
                        >
                          {copiedCashtag ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[10px]">{copiedCashtag ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-gray-300 leading-relaxed">
                      Tap the button below to launch Cash App instantly on mobile with <strong>${totalPayable.toFixed(2)}</strong> preloaded.
                    </p>

                    <a
                      href={cashAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#00D632] hover:bg-[#00ea37] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,214,50,0.5)] transition active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open Cash App (${totalPayable.toFixed(2)})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Instant Authorization Confirmation Button */}
                <div className="pt-2 border-t border-emerald-950">
                  <button
                    type="button"
                    disabled={isProcessing || totalPayable <= 0}
                    onClick={() => handleFinalizePayment('cash_app')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,214,50,0.4)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Verifying & Generating Receipt...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Record Payment & Issue Official Receipt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* --- PAYMENT METHOD 2: POS CARD / TAP TERMINAL --- */}
            {paymentMethod === 'card_pos' && (
              <div className="p-4 rounded-2xl bg-[#08121f] border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold">Virtual Studio Card Terminal</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Encrypted 256-Bit</span>
                </div>

                {/* Contactless Tap Feature */}
                <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <Zap className="w-5 h-5 animate-pulse" />
                    <span className="font-heading font-bold text-xs uppercase tracking-wide">
                      Contactless Tap to Pay
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-gray-400">
                    Hold phone or contactless card near the screen for instant POS charge.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateTap}
                    disabled={cardTapActive || isProcessing}
                    className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 mx-auto ${
                      cardTapActive
                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_#00D632]'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-400 hover:bg-cyan-900'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{cardTapActive ? 'Reading Contactless Chip...' : 'Simulate NFC Tap to Pay'}</span>
                  </button>
                </div>

                {/* Manual Card Entry */}
                <div className="space-y-2.5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/80 border border-gray-700 text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Exp (MM/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="09/28"
                        value={cardExp}
                        onChange={e => setCardExp(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/80 border border-gray-700 text-white focus:border-cyan-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/80 border border-gray-700 text-white focus:border-cyan-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Postal Zip</label>
                      <input
                        type="text"
                        placeholder="22601"
                        value={cardZip}
                        onChange={e => setCardZip(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/80 border border-gray-700 text-white focus:border-cyan-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing || totalPayable <= 0}
                  onClick={() => handleFinalizePayment('card_pos')}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Charge ${totalPayable.toFixed(2)} & Print Receipt</span>
                </button>
              </div>
            )}

            {/* --- PAYMENT METHOD 3: STUDIO CASH --- */}
            {paymentMethod === 'cash' && (
              <div className="p-4 rounded-2xl bg-[#141209] border border-amber-500/40 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">Studio Cash Drawer & Change Calculator</span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <label className="text-[10px] text-gray-400 block">
                    Cash Tendered from Client ($)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={cashReceivedStr}
                    onChange={e => setCashReceivedStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-amber-500/40 text-amber-300 font-bold text-base outline-none"
                  />
                  {parseFloat(cashReceivedStr) > totalPayable && (
                    <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 flex justify-between items-center text-amber-200">
                      <span>Change Due to Client:</span>
                      <strong className="text-base text-white font-bold">
                        ${(parseFloat(cashReceivedStr) - totalPayable).toFixed(2)}
                      </strong>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isProcessing || totalPayable <= 0}
                  onClick={() => handleFinalizePayment('cash')}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept Cash (${totalPayable.toFixed(2)}) & Issue Receipt</span>
                </button>
              </div>
            )}

            {/* KEYPAD NUMERIC BUTTONS (Cash App style touch digits) */}
            <div className="pt-2 border-t border-gray-800">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(char => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleDigit(char)}
                    className="py-3 sm:py-3.5 rounded-2xl bg-[#090e1a] hover:bg-gray-800 active:bg-emerald-950 border border-gray-800 text-white font-heading font-black text-lg sm:text-xl transition shadow-sm active:scale-95 select-none"
                  >
                    {char}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-3 sm:py-3.5 rounded-2xl bg-[#140b0f] hover:bg-red-950 active:bg-red-900 border border-red-900/40 text-red-300 font-heading font-black text-sm uppercase transition flex items-center justify-center active:scale-95 select-none"
                  title="Backspace"
                >
                  ⌫
                </button>
              </div>

              <div className="flex justify-between items-center mt-2 px-1 text-[11px] font-mono text-gray-500">
                <span>Direct Cash App Gateway</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-red-400 transition"
                >
                  Clear Amount
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
