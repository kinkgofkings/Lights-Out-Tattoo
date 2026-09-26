import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  DollarSign,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Lock,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { ArtistProfile } from '../types';
import { storageService } from '../services/storage';

interface ClientCashAppPayPortalProps {
  profile: ArtistProfile;
  onBackToStudio: () => void;
  onUnlockAdminPos: () => void;
  isAdmin: boolean;
}

export const ClientCashAppPayPortal: React.FC<ClientCashAppPayPortalProps> = ({
  profile,
  onBackToStudio,
  onUnlockAdminPos,
  isAdmin
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(200);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientNote, setClientNote] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedCashtag, setCopiedCashtag] = useState(false);
  const [paymentReported, setPaymentReported] = useState(false);

  // Clean Cashtag without leading '$' for URL formation
  const rawCashtag = (profile.cashAppHandle || '$texxx360').replace(/^\$/, '');
  const displayCashtag = `$${rawCashtag}`;

  // Current amount
  const currentAmount = useMemo(() => {
    if (selectedPreset === 'custom') {
      const parsed = parseFloat(customAmountStr);
      return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }
    return selectedPreset;
  }, [selectedPreset, customAmountStr]);

  // Generate direct Cash App pay URL
  const cashAppPayUrl = useMemo(() => {
    if (currentAmount > 0) {
      return `https://cash.app/$${rawCashtag}/${currentAmount}`;
    }
    return `https://cash.app/$${rawCashtag}`;
  }, [rawCashtag, currentAmount]);

  // Generate QR Code
  useEffect(() => {
    QRCode.toDataURL(cashAppPayUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Failed to generate Cash App QR', err));
  }, [cashAppPayUrl]);

  const handleCopyCashtag = () => {
    navigator.clipboard.writeText(displayCashtag);
    setCopiedCashtag(true);
    setTimeout(() => setCopiedCashtag(false), 2000);
  };

  const handleConfirmSent = () => {
    if (!clientName.trim()) {
      alert('Please enter your name so Tex can identify your deposit.');
      return;
    }

    // Save a deposit record in local storage without exposing ledger
    try {
      storageService.recordTransaction({
        bookingId: `client-pay-${Date.now()}`,
        clientName: clientName.trim(),
        clientPhone: '',
        clientEmail: '',
        amount: currentAmount,
        tipAmount: 0,
        totalPaid: currentAmount,
        paymentMethod: 'cash_app',
        paymentType: 'deposit',
        cashAppHandle: displayCashtag,
        note: clientNote.trim() || 'Direct Client Cash App Deposit'
      });
    } catch {
      // ignore
    }

    setPaymentReported(true);
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-3xl mx-auto space-y-6" id="client-cashapp-portal">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStudio}
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Studio Overview</span>
        </button>

        <button
          onClick={onUnlockAdminPos}
          className="text-xs font-mono text-gray-500 hover:text-cyan-300 flex items-center gap-1 transition"
          title="Tex only: Unlock studio POS register and financial totals"
        >
          <Lock className="w-3 h-3 text-cyan-400" />
          <span>{isAdmin ? 'Open Admin POS Register' : 'Studio Owner Access'}</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl bg-[#080d1a] border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(0,214,50,0.15)] overflow-hidden text-left">
        {/* Header */}
        <div className="p-5 sm:p-7 bg-gradient-to-r from-emerald-950/60 via-[#080d1a] to-cyan-950/40 border-b border-emerald-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-400/40 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>OFFICIAL VERIFIED CASH APP PORTAL</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-wide">
                PAY <span className="text-[#00D632]">LIGHTS OUT TATTOO</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300">
                Send appointment deposits or session payments directly to Lead Artist Tex via Cash App.
              </p>
            </div>

            {/* Official Cashtag Badge */}
            <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 flex items-center justify-between sm:justify-start gap-3 shrink-0">
              <div>
                <div className="text-[10px] font-mono text-gray-400 uppercase">Tex's Cashtag</div>
                <div className="font-mono text-lg font-black text-[#00D632] tracking-wider">
                  {displayCashtag}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCashtag}
                className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 transition"
                title="Copy Cashtag"
              >
                {copiedCashtag ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Screen */}
        {paymentReported ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto shadow-[0_0_25px_#00D632]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-black text-2xl text-white">
                PAYMENT CONFIRMATION LOGGED
              </h3>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Thank you, <span className="text-emerald-400 font-bold">{clientName}</span>! Your deposit of <span className="text-white font-bold">${currentAmount}</span> has been reported.
              </p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Tex will verify the funds on Cash App and credit this amount to your tattoo appointment.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onBackToStudio}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-md"
              >
                Return to Studio Overview
              </button>
              <button
                onClick={() => setPaymentReported(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 font-mono text-xs hover:text-white transition"
              >
                Make Another Payment
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <div className="p-5 sm:p-7 space-y-6">
            {/* Step 1: Select Deposit Amount */}
            <div className="space-y-2.5">
              <label className="block text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                1. SELECT DEPOSIT OR SESSION AMOUNT
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { amount: 50, label: 'Drawing Fee' },
                  { amount: 100, label: 'Standard Appointment Deposit' },
                  { amount: 200, label: 'Half-Day Session Deposit' },
                  { amount: 300, label: 'Full-Day Custom Deposit' }
                ].map(tier => {
                  const isSelected = selectedPreset === tier.amount;
                  return (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(tier.amount);
                        setCustomAmountStr('');
                      }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#00D632] bg-emerald-950/80 text-white shadow-[0_0_15px_rgba(0,214,50,0.3)]'
                          : 'border-gray-800 bg-black/40 text-gray-300 hover:border-emerald-500/50 hover:bg-emerald-950/30'
                      }`}
                    >
                      <span className="font-heading font-black text-xl text-[#00D632]">
                        ${tier.amount}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 mt-1 leading-tight">
                        {tier.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Option */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPreset('custom')}
                  className={`px-3 py-2 rounded-xl border font-mono text-xs font-bold transition ${
                    selectedPreset === 'custom'
                      ? 'border-[#00D632] bg-emerald-950/80 text-white'
                      : 'border-gray-800 bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  Enter Custom Amount
                </button>
                {selectedPreset === 'custom' && (
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-emerald-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={customAmountStr}
                      onChange={e => setCustomAmountStr(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-black border border-emerald-500/50 text-white font-mono text-sm focus:outline-none focus:border-[#00D632]"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Client Info */}
            <div className="space-y-3 pt-2 border-t border-gray-800">
              <label className="block text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                2. YOUR DETAILS (SO TEX CAN MATCH YOUR DEPOSIT)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Miller"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    Tattoo Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday Sleeve / Skull Realism"
                    value={clientNote}
                    onChange={e => setClientNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Pay via Cash App */}
            <div className="p-5 rounded-xl bg-black/60 border border-emerald-500/30 flex flex-col md:flex-row items-center gap-6">
              {/* QR Code */}
              <div className="shrink-0 text-center">
                {qrCodeUrl ? (
                  <div className="p-2.5 bg-white rounded-xl shadow-lg inline-block border-2 border-emerald-400">
                    <img src={qrCodeUrl} alt="Cash App QR" className="w-36 h-36 object-contain" />
                  </div>
                ) : (
                  <div className="w-36 h-36 bg-gray-900 rounded-xl flex items-center justify-center font-mono text-xs text-gray-500">
                    Generating QR...
                  </div>
                )}
                <div className="mt-1 text-[10px] font-mono text-gray-400">
                  Scan with Camera or Cash App
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex-1 text-left space-y-4 w-full">
                <div>
                  <div className="text-xs font-mono text-gray-400">Total Deposit to Pay:</div>
                  <div className="text-3xl font-heading font-black text-[#00D632]">
                    ${currentAmount}
                  </div>
                </div>

                <a
                  href={cashAppPayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-[#00D632] hover:bg-[#00be2c] text-black font-heading font-black text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,214,50,0.4)]"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>TAP TO PAY ${currentAmount} ON CASH APP</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>

                <div className="text-[11px] text-gray-400 font-sans space-y-1">
                  <p>• Make sure to include your name in the Cash App note.</p>
                  <p>• Deposits are credited 100% towards your final tattoo cost.</p>
                </div>
              </div>
            </div>

            {/* Step 4: Confirm Sent */}
            <div className="pt-2 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400">
                Already sent the funds via Cash App? Let Tex know:
              </div>
              <button
                type="button"
                onClick={handleConfirmSent}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-950 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-900 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>I Have Sent Payment</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
