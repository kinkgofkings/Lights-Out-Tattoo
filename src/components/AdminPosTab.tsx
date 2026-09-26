import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import { ArtistProfile, Booking, PaymentTransaction } from '../types';
import { storageService } from '../services/storage';
import { LightsOutPayPortal } from './LightsOutPayPortal';

interface AdminPosTabProps {
  profile: ArtistProfile;
  bookings: Booking[];
  onUpdateProfile: (profile: ArtistProfile) => void;
  onRefreshData: () => void;
  onShowNotification: (msg: string) => void;
}

export const AdminPosTab: React.FC<AdminPosTabProps> = ({
  profile,
  bookings,
  onUpdateProfile,
  onRefreshData,
  onShowNotification
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(
    storageService.getTransactions()
  );
  const [isPosPortalOpen, setIsPosPortalOpen] = useState(false);
  const [selectedBookingForPay, setSelectedBookingForPay] = useState<Booking | null>(null);
  const [presetAmountForPay, setPresetAmountForPay] = useState<number>(200);

  // Filter & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'cash_app' | 'card_pos' | 'cash'>('all');

  // Edit Cashtag
  const [editCashtag, setEditCashtag] = useState(profile.cashAppHandle || '$texxx360');
  const [copiedCashtag, setCopiedCashtag] = useState(false);

  // Selected transaction to view receipt
  const [viewingReceipt, setViewingReceipt] = useState<PaymentTransaction | null>(null);

  // Metrics
  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((acc, tx) => acc + tx.totalPaid, 0);
    const totalTips = transactions.reduce((acc, tx) => acc + tx.tipAmount, 0);
    const depositsCount = transactions.filter(tx => tx.paymentType === 'deposit').length;
    const cashAppCount = transactions.filter(tx => tx.paymentMethod === 'cash_app').length;

    return {
      totalRevenue,
      totalTips,
      depositsCount,
      cashAppCount,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Filtered transactions list
  const filteredTxs = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch =
        tx.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.bookingId && tx.bookingId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMethod = filterMethod === 'all' || tx.paymentMethod === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [transactions, searchQuery, filterMethod]);

  const handleSaveCashtag = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = editCashtag.trim().startsWith('$') ? editCashtag.trim() : `$${editCashtag.trim()}`;
    const updated = {
      ...profile,
      cashAppHandle: formatted
    };
    storageService.saveProfile(updated);
    onUpdateProfile(updated);
    onShowNotification(`Studio Cash App handle updated to ${formatted}`);
  };

  const handleCopyCashtag = () => {
    navigator.clipboard.writeText(profile.cashAppHandle || '$texxx360');
    setCopiedCashtag(true);
    setTimeout(() => setCopiedCashtag(false), 2000);
  };

  const handleOpenPosForBooking = (b: Booking) => {
    setSelectedBookingForPay(b);
    setPresetAmountForPay(b.securityDepositStatus !== 'paid' ? 200 : b.finalEstimatedPrice);
    setIsPosPortalOpen(true);
  };

  const handleOpenBlankPos = () => {
    setSelectedBookingForPay(null);
    setPresetAmountForPay(200);
    setIsPosPortalOpen(true);
  };

  const handlePaymentDone = (tx: PaymentTransaction) => {
    const updated = storageService.getTransactions();
    setTransactions(updated);
    onRefreshData();
    onShowNotification(`Payment of $${tx.totalPaid} recorded successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Terminal Actions */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#0c1813] to-cyan-950/70 border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(0,214,50,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#00D632] text-black font-heading font-black text-2xl flex items-center justify-center shadow-[0_0_20px_#00D632] shrink-0">
            $
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-lg text-white tracking-wide">
                LIGHTS OUT CASH APP POS GATEWAY
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-black font-bold uppercase">
                Active Terminal
              </span>
            </div>
            <p className="text-xs text-gray-300 font-mono mt-0.5">
              Custom studio register • Cash App QR • In-chair checkouts • $200 deposit locks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenBlankPos}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D632] to-emerald-400 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,214,50,0.5)] flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Launch POS Keypad</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTransactions(storageService.getTransactions());
              onShowNotification('Transaction ledger refreshed');
            }}
            className="p-2.5 rounded-xl bg-black/60 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition"
            title="Refresh Transactions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#060e15] border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Total Collected</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-heading font-black text-white mt-1">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-emerald-400">
            {stats.totalCount} Recorded Payments
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#060e15] border border-cyan-500/30">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Security Deposits</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-heading font-black text-cyan-300 mt-1">
            {stats.depositsCount} Secured
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            ${stats.depositsCount * 200} Locked Spots
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#060e15] border border-amber-500/30">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Artist Tips</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-heading font-black text-amber-300 mt-1">
            ${stats.totalTips.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-amber-400">
            Direct Needle Tips
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#060e15] border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Cash App Route</span>
            <Smartphone className="w-4 h-4 text-[#00D632]" />
          </div>
          <div className="text-2xl font-heading font-black text-white mt-1">
            {profile.cashAppHandle || '$texxx360'}
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            {stats.cashAppCount} Paid via Cash App
          </span>
        </div>
      </div>

      {/* STUDIO CASH APP HANDLE CONFIGURATION BOX */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#070d18] border border-emerald-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <span className="text-emerald-400">$</span>
              <span>STUDIO CASH APP INTEGRATION SETTINGS</span>
            </h4>
            <p className="text-xs text-gray-400 font-mono">
              Configure your primary Cash App $Cashtag for all automated deposit and checkout links
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://cash.app/${profile.cashAppHandle || '$texxx360'}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold hover:bg-emerald-950 transition flex items-center gap-1.5"
            >
              <span>Test Cash App URL</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={handleCopyCashtag}
              className="px-3 py-1.5 rounded-lg bg-black border border-gray-700 text-gray-300 font-mono text-xs font-bold hover:text-white transition flex items-center gap-1"
            >
              {copiedCashtag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCashtag ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveCashtag} className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-2.5 text-emerald-400 font-heading font-bold">$</span>
            <input
              type="text"
              required
              value={editCashtag.replace(/^\$/, '')}
              onChange={e => setEditCashtag(`$${e.target.value}`)}
              placeholder="LightsOutTattooTex"
              className="w-full pl-7 pr-3 py-2 rounded-xl bg-black border border-emerald-500/30 text-white font-mono text-xs focus:border-emerald-400 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition"
          >
            Update $Cashtag
          </button>
        </form>
      </div>

      {/* QUICK PENDING BOOKING PAYMENTS BAR */}
      {bookings.filter(b => b.securityDepositStatus === 'unpaid').length > 0 && (
        <div className="p-4 rounded-2xl bg-[#160c11] border border-red-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-sm text-red-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span>Pending $200 Deposits Awaiting Collection ({bookings.filter(b => b.securityDepositStatus === 'unpaid').length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {bookings
              .filter(b => b.securityDepositStatus === 'unpaid')
              .slice(0, 3)
              .map(b => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-black/80 border border-red-900/40 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-heading font-bold text-xs text-white truncate block">
                      {b.clientName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono truncate block">
                      {(b.tattooIdea || '').slice(0, 24)}...
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPosForBooking(b)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#00D632] hover:bg-emerald-400 text-black font-mono text-xs font-black shrink-0 transition"
                  >
                    Ring $200
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TRANSACTION LEDGER & SEARCH */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="font-heading font-black text-base text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <span>Studio Transaction Ledger ({filteredTxs.length})</span>
          </h4>

          {/* Search & Method Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-black border border-gray-700 text-white font-mono text-xs outline-none focus:border-cyan-400 w-44"
              />
            </div>

            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-black border border-gray-700 text-xs font-mono text-gray-300"
            >
              <option value="all">All Methods</option>
              <option value="cash_app">Cash App</option>
              <option value="card_pos">Card POS</option>
              <option value="cash">Studio Cash</option>
            </select>
          </div>
        </div>

        {filteredTxs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#080d18] border border-gray-800 text-gray-400 font-mono text-xs">
            No transactions found. Click &quot;Launch POS Keypad&quot; to ring up your first payment.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTxs.map(tx => (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl bg-[#070c17] border border-cyan-500/20 hover:border-cyan-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-bold text-sm text-white">
                      {tx.clientName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black text-cyan-300 border border-cyan-500/30 font-bold">
                      {tx.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        tx.paymentMethod === 'cash_app'
                          ? 'bg-[#00D632]/20 text-[#00D632] border border-[#00D632]/40'
                          : tx.paymentMethod === 'card_pos'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      }`}
                    >
                      {tx.paymentMethod === 'cash_app'
                        ? 'Cash App'
                        : tx.paymentMethod === 'card_pos'
                        ? 'POS Card'
                        : 'Cash'}
                    </span>
                    {tx.bookingId && (
                      <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        Booking: {tx.bookingId}
                      </span>
                    )}
                  </div>
                  {tx.note && <p className="text-[11px] text-gray-400">{tx.note}</p>}
                  <div className="text-[10px] text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-heading font-black text-emerald-400">
                      ${tx.totalPaid.toFixed(2)}
                    </div>
                    {tx.tipAmount > 0 && (
                      <div className="text-[10px] text-cyan-300">
                        (Incl. ${tx.tipAmount} Tip)
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingReceipt(tx)}
                    className="p-2 rounded-lg bg-black border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition"
                    title="View & Print Receipt"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RE-PRINT RECEIPT MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#070c17] border-2 border-cyan-500/50 rounded-2xl p-6 space-y-4 shadow-[0_0_35px_rgba(0,240,255,0.2)]">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
                LIGHTS OUT TATTOO STUDIO
              </span>
              <h3 className="text-2xl font-heading font-black text-white">
                Official Studio Receipt
              </h3>
              <p className="text-xs text-gray-400 font-mono">Winchester, VA • Lead Artist: Tex</p>
            </div>

            <div className="p-4 rounded-xl bg-black/70 border border-gray-800 font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Tx Code:</span>
                <span className="text-cyan-300 font-bold">{viewingReceipt.id}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Client:</span>
                <span className="text-white font-bold">{viewingReceipt.clientName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Payment Type:</span>
                <span className="text-emerald-400 uppercase">{viewingReceipt.paymentType}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Channel:</span>
                <span className="text-white uppercase">{viewingReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Date:</span>
                <span className="text-gray-300">
                  {new Date(viewingReceipt.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 flex justify-between text-base font-bold text-emerald-400">
                <span>Total Paid:</span>
                <span>${viewingReceipt.totalPaid.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white font-mono text-xs font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS KEYPAD MODAL */}
      <LightsOutPayPortal
        isOpen={isPosPortalOpen}
        onClose={() => setIsPosPortalOpen(false)}
        profile={profile}
        initialAmount={presetAmountForPay}
        initialBooking={selectedBookingForPay}
        paymentType={selectedBookingForPay ? 'deposit' : 'session_balance'}
        onPaymentCompleted={handlePaymentDone}
      />
    </div>
  );
};
