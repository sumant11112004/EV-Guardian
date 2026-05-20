'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Calendar, MapPin, Clock, XCircle, CheckCircle, AlertCircle, Search, Filter, Star, MessageSquare } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { bookingAPI, paymentAPI, stationAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Payment Pending', color: '#fbbf24', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: '#22d3ee', icon: CheckCircle },
  active: { label: 'Active', color: '#8cc63f', icon: Zap },
  completed: { label: 'Completed', color: '#10b981', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#f43f5e', icon: XCircle },
};

const PREDEFINED_TAGS = ['Fast Charging', 'Good Location', 'Clean', 'Helpful Staff', 'Safe', 'Well Lit'];

export default function BookingsPage() {
  const { isAuthenticated, user } = useStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Review Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    load();
  }, [isAuthenticated, status]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getMy({ status: status || undefined, limit: 20 });
      setBookings(res.data.bookings);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await bookingAPI.cancel(id, 'Cancelled by user');
      toast.success('Booking cancelled');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally { setCancelling(null); }
  };

  const payNow = async (b: any) => {
    const isLoaded = await loadRazorpay();
    if (!isLoaded) { toast.error('Razorpay SDK failed to load'); return; }

    try {
      const orderRes = await paymentAPI.createOrder(b._id);
      const { orderId, amount, currency, keyId, stationName } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'EV Guardian',
        description: `Booking for ${stationName}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await paymentAPI.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: b._id
            });
            toast.success('Payment successful!');
            load();
          } catch (err) { toast.error('Payment verification failed.'); }
        },
        prefill: {
          name: user?.name || "User",
          email: user?.email || "",
          contact: "9999999999"
        },
        theme: { color: '#8cc63f' }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        console.error('Razorpay Error:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Card declined'}`);
      });
      paymentObject.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  const payCash = async (b: any) => {
    if (!confirm('Opt for cash payment? You will pay at the station.')) return;
    try {
      await paymentAPI.payCash(b._id);
      toast.success('Cash payment opted! Booking confirmed.');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to opt for cash');
    }
  };

  const openReviewModal = (booking: any) => {
    setSelectedBookingForReview(booking);
    setRating(5);
    setComment('');
    setSelectedTags([]);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedBookingForReview(null);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const submitReview = async () => {
    if (!selectedBookingForReview) return;
    setSubmittingReview(true);
    try {
      await stationAPI.addReview(selectedBookingForReview.station._id, {
        rating,
        comment,
        tags: selectedTags,
        bookingId: selectedBookingForReview._id,
      });
      toast.success('Review submitted successfully!');
      setReviewedBookings(prev => [...prev, selectedBookingForReview._id]);
      closeReviewModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-black text-white mb-1 drop-shadow-sm">Booking History</h1>
          <p className="text-white/90 font-medium">Track all your EV charging sessions</p>
        </motion.div>

        {/* Status filter */}
        <div className="flex gap-3 flex-wrap mb-6">
          {[{ v: '', l: 'All' }, { v: 'confirmed', l: 'Confirmed' }, { v: 'active', l: 'Active' }, { v: 'completed', l: 'Completed' }, { v: 'cancelled', l: 'Cancelled' }].map(s => (
            <button key={s.v} onClick={() => setStatus(s.v)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${status === s.v ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-lg' : 'bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/40'}`}>
              {s.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-[#0b1320] rounded-[24px] h-32 border border-[#1a2b42] animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-[#0b1320] rounded-[32px] border border-[#1a2b42] shadow-2xl">
            <Calendar size={60} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-black text-2xl mb-2">No bookings found</h3>
            <p className="text-gray-400 font-medium mb-6">Book your first charging session today!</p>
            <Link href="/stations" className="bg-[#8cc63f] text-black font-black px-8 py-3 rounded-full hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)]">Find a Station</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((b, i) => {
              let sm = STATUS_MAP[b.status] || STATUS_MAP.pending;
              if (b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show'))) {
                sm = { label: 'No-Show', color: '#f97316', icon: XCircle };
              }
              const isReviewed = reviewedBookings.includes(b._id);
              return (
                <motion.div key={b._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] p-6 shadow-xl hover:-translate-y-1 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#8cc63f]/10 border border-[#8cc63f]/20 flex items-center justify-center shrink-0">
                      <Zap size={24} className="text-[#8cc63f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-white font-black text-xl">{b.station?.name || 'Station'}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                          style={{ background: `${sm.color}15`, color: sm.color, border: `1px solid ${sm.color}30` }}>
                          {sm.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-gray-400 font-medium text-xs">
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#8cc63f]" />{b.station?.address?.city}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#8cc63f]" />{new Date(b.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#8cc63f]" />{new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-gray-500 font-bold text-xs mt-2 uppercase tracking-wider">Ref: {b.bookingRef} · {b.chargerType}</p>
                    </div>
                    
                    {/* Check-In PIN Card */}
                    {b.pin && ['confirmed', 'pending'].includes(b.status) && (
                      <div className="hidden sm:flex flex-col items-center justify-center shrink-0 px-6 border-l border-[#1a2b42] min-w-[140px]">
                        <div className="bg-[#101b2b]/80 border border-[#8cc63f]/30 rounded-2xl p-3 text-center shadow-lg w-full relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8cc63f] to-transparent animate-pulse" />
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-in PIN</p>
                          <span className="font-mono text-2xl font-black tracking-widest text-[#8cc63f] select-all block">{b.pin}</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 mt-2 uppercase tracking-wider text-center">Share with Manager</p>
                      </div>
                    )}

                    <div className="flex flex-col items-end justify-center gap-2 shrink-0 md:w-32">
                      <p className="text-[#8cc63f] font-black text-2xl font-mono font-bold">₹{b.estimatedCost?.toFixed(0)}</p>
                      <p className="text-gray-400 font-bold text-xs">{b.duration} min · ~{b.estimatedEnergy?.toFixed(1)} kWh</p>
                      {b.status === 'pending' && (
                        <div className="flex flex-col gap-1.5 w-full mt-1">
                          <button onClick={() => payNow(b)}
                            className="bg-[#8cc63f] text-black font-black py-2 px-5 rounded-full text-xs w-full hover:bg-[#679e24] transition-colors">
                            Pay Now
                          </button>
                          <p className="text-[10px] text-gray-500 font-bold text-center mt-0.5">Or pay cash at station</p>
                        </div>
                      )}
                      {b.status === 'completed' && (
                        isReviewed ? (
                          <span className="text-[#8cc63f] font-bold text-xs mt-1 w-full text-center block py-2 border border-[#8cc63f]/20 rounded-full bg-[#8cc63f]/5">
                            Reviewed
                          </span>
                        ) : (
                          <button onClick={() => openReviewModal(b)}
                            className="bg-[#8cc63f] text-black font-black py-2 px-5 rounded-full text-xs mt-1 w-full hover:bg-[#679e24] transition-colors">
                            Write Review
                          </button>
                        )
                      )}
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button onClick={() => cancel(b._id)} disabled={cancelling === b._id}
                          className="text-rose-500 hover:text-rose-400 font-bold text-xs flex items-center justify-end w-full gap-1 disabled:opacity-50 transition-colors mt-1">
                          <XCircle size={14} /> {cancelling === b._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                  {b.carbonSaved > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#1a2b42] flex items-center gap-2 text-[#8cc63f] font-bold text-xs">
                      🌱 You saved {b.carbonSaved.toFixed(2)} kg CO₂ with this session
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {reviewModalOpen && selectedBookingForReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1320] border border-[#1a2b42] rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <MessageSquare className="text-[#8cc63f]" /> Share Your Experience
                  </h3>
                  <p className="text-gray-400 text-xs mt-1 font-bold">
                    Reviewing {selectedBookingForReview.station?.name || 'Charging Station'}
                  </p>
                </div>
                <button
                  onClick={closeReviewModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Star Rating Selection */}
              <div className="mb-6 text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Overall Rating</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => {
                    const active = star <= (hoveredRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform active:scale-95 duration-100"
                      >
                        <Star
                          size={36}
                          className={`transition-colors duration-150 ${
                            active ? 'fill-[#8cc63f] text-[#8cc63f] drop-shadow-[0_0_8px_rgba(140,198,63,0.5)]' : 'text-gray-600 hover:text-gray-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs text-gray-500 font-bold block mt-2">
                  {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
                </span>
              </div>

              {/* Predefined Tags */}
              <div className="mb-6">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">What went well? (Select tags)</p>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                          isSelected
                            ? 'bg-[#8cc63f] text-black border-[#8cc63f] shadow-md shadow-[#8cc63f]/25'
                            : 'bg-[#101b2b] text-gray-300 border-[#1a2b42] hover:border-gray-500'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment text-area */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Your Review</label>
                  <span className="text-[10px] text-gray-500 font-bold">{comment.length}/500</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Tell us about the charging speed, service, location, safety..."
                  rows={4}
                  className="w-full bg-[#101b2b] text-white border-2 border-[#1a2b42] rounded-2xl p-4 text-sm font-semibold placeholder:text-gray-500 focus:outline-none focus:border-[#8cc63f]/60 transition-all resize-none"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={closeReviewModal}
                  className="flex-1 py-3 px-6 rounded-full border-2 border-[#1a2b42] text-gray-300 hover:text-white font-black text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="flex-1 py-3 px-6 rounded-full bg-[#8cc63f] text-black font-black text-sm hover:bg-[#679e24] disabled:opacity-50 shadow-lg shadow-[#8cc63f]/25 transition-all flex items-center justify-center gap-1.5"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
