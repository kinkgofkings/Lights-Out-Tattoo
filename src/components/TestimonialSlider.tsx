import React, { useState, useEffect } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Testimonial } from '../types';
import { storageService } from '../services/storage';

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  onReviewAdded: (newReview: Testimonial) => void;
}

export const TestimonialSlider: React.FC<TestimonialSliderProps> = ({
  testimonials,
  onReviewAdded
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // New review form state
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [tattooType, setTattooType] = useState('Black & Grey Realism');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return;
    const interval = setInterval(() => {
      if (!testimonials || testimonials.length === 0) return; setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    if (!testimonials || testimonials.length === 0) return; setCurrentIndex(prev => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    if (!testimonials || testimonials.length === 0) return; setCurrentIndex(prev => (prev + 1) % testimonials.length);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !content.trim()) return;

    const newReview = storageService.createTestimonial({
      clientName: clientName.trim(),
      city: city.trim() || 'Winchester, VA',
      rating,
      date: 'Just now',
      tattooType,
      content: content.trim(),
      verified: true
    });

    onReviewAdded(newReview);
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSubmitted(false);
      setClientName('');
      setContent('');
      setCity('');
    }, 1800);
  };

  const current = testimonials && testimonials.length > 0 ? (testimonials[currentIndex] || testimonials[0]) : null;

  return (
    <section className="py-8 px-4 sm:px-6 max-w-5xl mx-auto" id="testimonial-section">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-tech font-bold text-xs uppercase tracking-widest">
            <MessageSquareQuote className="w-4 h-4 text-cyan-400" />
            <span>Verified Client Stories • Northern Shenandoah</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
            CLIENT <span className="text-cyan-400">TESTIMONIALS</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
            Real feedback from clients throughout Winchester, Front Royal, Martinsburg, and beyond.
          </p>
        </div>

        <button
          onClick={() => setShowReviewModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900/80 text-xs font-mono font-bold transition shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <PlusCircle className="w-4 h-4 text-cyan-400" />
          <span>Leave a Review for Tex</span>
        </button>
      </div>

      {/* Main Slider Card */}
      <div
        className="relative rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_30px_rgba(0,240,255,0.15)] overflow-hidden"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Glow corner accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {current && (
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Client Avatar / Rating Column */}
            <div className="flex md:flex-col items-center gap-3 shrink-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border-2 border-cyan-400/60 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                {current.avatarUrl ? (
                  <img
                    src={current.avatarUrl}
                    alt={current.clientName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="font-heading font-black text-2xl text-cyan-300">
                    {(current?.clientName || 'A').charAt(0)}
                  </span>
                )}
              </div>

              <div className="text-left md:text-center">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-cyan-400 mt-1 block">
                  {current.date}
                </span>
              </div>
            </div>

            {/* Testimonial Quote Body */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading font-black text-lg text-white">
                  {current.clientName}
                </h3>
                <span className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{current.city}</span>
                </span>
                {current.verified && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Tattoo</span>
                  </span>
                )}
              </div>

              <span className="inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                Piece: {current.tattooType}
              </span>

              <p className="text-sm sm:text-base text-gray-200 leading-relaxed italic">
                "{current.content}"
              </p>
            </div>
          </div>
        )}

        {/* Navigation Dots & Prev/Next Arrows */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-cyan-500/20">
          <div className="flex items-center gap-1.5">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                    : 'w-2 bg-gray-700 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              aria-label="Previous review"
              className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next review"
              className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#091122] border-2 border-cyan-400/50 p-6 shadow-2xl relative">
            <h3 className="font-heading font-black text-xl text-white mb-1">
              Add Your Review for Tex
            </h3>
            <p className="text-xs text-gray-300 mb-4 font-tech">
              Share your experience with Lights Out Tattoo in Winchester, VA.
            </p>

            {reviewSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-heading font-bold text-white">Review Added!</h4>
                <p className="text-xs text-gray-300">Thanks for supporting Tex’s studio.</p>
              </div>
            ) : (
              <form onSubmit={handleAddReview} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Jesse R."
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      City / Area
                    </label>
                    <input
                      type="text"
                      placeholder="Winchester, VA"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Rating
                    </label>
                    <select
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    >
                      <option value={5}>★★★★★ (5 Stars)</option>
                      <option value={4}>★★★★☆ (4 Stars)</option>
                      <option value={3}>★★★☆☆ (3 Stars)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tattoo Subject / Style
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Forearm Wolf Realism or Tribal Cover-Up"
                    value={tattooType}
                    onChange={e => setTattooType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Your Testimonial *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="How was your session with Tex? How did the ink turn out?"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-bold text-xs uppercase hover:opacity-90"
                  >
                    Publish Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
