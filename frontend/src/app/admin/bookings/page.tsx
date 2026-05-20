'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, MapPin, Calendar, Clock, CheckCircle, XCircle, Search, ChevronDown, KeyRound, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { bookingAPI, paymentAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = { 
  pending: '#fbbf24', 
  confirmed: '#22d3ee', 
  active: '#8cc63f', 
  completed: '#10b981', 
  cancelled: '#f43f5e', 
  no_show: '#f97316' 
};

export default function AdminBookingsPage() {
  const { user, isAuthenticated } = useStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // PIN check-in states
  const [pin, setPin] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !['admin', 'superadmin', 'manager'].includes(user?.role || '')) { 
      router.push('/auth/login'); 
      return; 
    }
    load();
  }, [isAuthenticated, status, page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getAll({ status: status || undefined, page, limit: 15 });
      setBookings(res.data.bookings);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const handlePinCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length !== 6 || isNaN(Number(pin))) {
      toast.error('Please enter a valid 6-digit numeric PIN');
      return;
    }
    setSubmittingPin(true);
    try {
      await bookingAPI.startWithPin(pin.trim());
      toast.success('Check-in successful! Charging session has started.');
      setPin('');
      setPage(1);
      load(); // reload bookings
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    } finally {
      setSubmittingPin(false);
    }
  };

  const handleMarkAsPaid = async (bookingId: string) => {
    if (!confirm('Mark this booking as paid (Cash Payment)?')) return;
    try {
      await paymentAPI.payCash(bookingId);
      toast.success('Booking marked as Paid and Confirmed!');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-1 drop-shadow-sm">{user?.role === 'manager' ? 'Station Bookings' : 'All Bookings'}</h1>
            <p className="text-white/90 font-medium">{total} total bookings</p>
          </div>
          <Link href="/admin" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2.5 px-5 rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 text-sm">← Dashboard</Link>
        </motion.div>

        {/* PIN Check-In Admission Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#0b1320] border border-[#1a2b42] rounded-[32px] p-6 mb-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#8cc63f] to-[#22d3ee]" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <KeyRound className="text-[#8cc63f]" size={20} /> PIN-Based Admission Check-In
              </h2>
              <p className="text-gray-400 text-xs mt-1 font-bold">
                Enter the user's 6-digit charging PIN to start their scheduled charging session.
              </p>
            </div>
            
            <form onSubmit={handlePinCheckIn} className="flex gap-3 w-full lg:w-auto shrink-0 items-center">
              <div className="relative flex-1 lg:flex-none">
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit PIN"
                  className="w-full lg:w-60 bg-[#101b2b] text-[#8cc63f] font-mono text-lg font-black tracking-widest text-center border-2 border-[#1a2b42] rounded-full py-2.5 px-4 focus:outline-none focus:border-[#8cc63f]/60 placeholder:font-sans placeholder:text-xs placeholder:text-gray-500 placeholder:tracking-normal transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={submittingPin || pin.length !== 6}
                className="bg-[#8cc63f] text-black font-black text-xs py-3.5 px-6 rounded-full hover:bg-[#679e24] disabled:opacity-50 shadow-md shadow-[#8cc63f]/25 transition-all flex items-center gap-1.5 shrink-0"
              >
                {submittingPin ? 'Checking in...' : 'Start Session'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Status Filter */}
        <div className="flex gap-3 flex-wrap mb-8">
          {[{ v: '', l: 'All' }, { v: 'pending', l: 'Payment Pending' }, { v: 'confirmed', l: 'Confirmed' }, { v: 'active', l: 'Active' }, { v: 'completed', l: 'Completed' }, { v: 'cancelled', l: 'Cancelled' }].map(s => (
            <button key={s.v} onClick={() => { setStatus(s.v); setPage(1); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${status === s.v ? 'bg-[#8cc63f] text-black border-[#8cc63f] shadow-lg' : 'bg-white/10 border-[#1a2b42] text-gray-300 hover:text-white hover:border-gray-500'}`}>
              {s.l}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2b42] text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <th className="text-left px-6 py-5 font-medium">Booking Ref</th>
                  <th className="text-left px-6 py-5 font-medium hidden md:table-cell">User</th>
                  <th className="text-left px-6 py-5 font-medium hidden lg:table-cell">Station</th>
                  <th className="text-left px-6 py-5 font-medium">Date</th>
                  <th className="text-left px-6 py-5 font-medium">Status</th>
                  <th className="text-right px-6 py-5 font-medium">Amount</th>
                  <th className="text-center px-6 py-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2b42]">
                {loading ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[60, 80, 120, 70, 60, 50, 40].map((w, j) => (
                      <td key={j} className="px-6 py-5"><div className={`h-4 bg-[#111c2e] rounded`} style={{ width: w }} /></td>
                    ))}
                  </tr>
                )) : bookings.map((b, i) => {
                  const scColor = STATUS_COLORS[b.status] || '#64748b';
                  return (
                    <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-[#111c2e] transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-[#8cc63f] font-mono text-xs font-black">{b.bookingRef}</p>
                        <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mt-1">{b.chargerType}</p>
                      </td>
                      <td className="px-6 py-5 hidden md:table-cell">
                        <p className="text-white text-sm font-bold">{b.user?.name}</p>
                        <p className="text-gray-500 font-medium text-xs mt-0.5">{b.user?.email} • {b.vehicleNumber}</p>
                      </td>
                      <td className="px-6 py-5 hidden lg:table-cell">
                        <p className="text-gray-300 font-bold text-sm truncate max-w-[160px]">{b.station?.name}</p>
                        <p className="text-gray-500 font-medium text-xs mt-0.5">{b.station?.address?.city}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-gray-300 font-bold text-sm">{new Date(b.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        <p className="text-gray-500 font-medium text-xs mt-0.5">{new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                          style={{ 
                            background: `${(b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show')) ? '#f97316' : scColor)}15`, 
                            color: b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show')) ? '#f97316' : scColor, 
                            border: `1px solid ${(b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show')) ? '#f97316' : scColor)}30` 
                          }}>
                          {b.status === 'pending' 
                            ? 'Payment Pending' 
                            : b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show'))
                              ? 'No-Show' 
                              : b.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-white font-black text-base font-mono font-bold">₹{b.estimatedCost?.toFixed(0)}</p>
                        <p className="text-gray-500 font-medium text-xs mt-0.5">{b.duration} min</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(b._id)}
                            className="bg-[#8cc63f] text-black font-black text-xs py-1.5 px-4 rounded-full hover:bg-[#679e24] transition-colors shadow-md hover:-translate-y-0.5"
                          >
                            Paid
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && bookings.length === 0 && (
              <div className="text-center py-20 text-gray-400 font-medium">
                <Zap size={48} className="text-gray-600 mx-auto mb-4" />No bookings found
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-5 py-2.5 rounded-full border-2 border-[#1a2b42] bg-[#101b2b] text-gray-300 font-bold hover:text-white hover:border-gray-500 disabled:opacity-40 text-sm transition-all shadow-sm">Previous</button>
            <span className="px-4 py-2 text-gray-400 font-bold text-sm">Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-5 py-2.5 rounded-full border-2 border-[#1a2b42] bg-[#101b2b] text-gray-300 font-bold hover:text-white hover:border-gray-500 disabled:opacity-40 text-sm transition-all shadow-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
