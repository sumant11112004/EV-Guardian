'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Zap, TrendingUp, MapPin, Activity, AlertTriangle, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { adminAPI, bookingAPI, paymentAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

const COLORS = ['#8cc63f', '#4ade80', '#818cf8', '#fb923c', '#f472b6'];

function AdminDashboardContent() {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, revRes, pendingRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRevenue({ period: '30' }),
        bookingAPI.getAll({ status: 'pending', limit: 10 })
      ]);
      setStats(statsRes.data);
      setRevenue(revRes.data);
      setPendingBookings(pendingRes.data.bookings || []);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const handleMarkAsPaid = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to mark this booking as PAID? This will confirm the booking.")) return;
    try {
      await paymentAPI.payCash(bookingId);
      toast.success("Payment confirmed successfully!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to confirm payment");
    }
  };

  const statCards = stats ? [
    ...(user?.role !== 'manager' ? [{ label: 'Total Users', value: stats.stats.totalUsers, icon: Users, color: '#8cc63f', change: '+12%' }] : []),
    { label: 'Total Stations', value: stats.stats.totalStations, icon: MapPin, color: '#4ade80', change: '+3' },
    { label: 'Total Bookings', value: stats.stats.totalBookings, icon: Zap, color: '#818cf8', change: '+18%' },
    { label: 'Revenue (₹)', value: `₹${(stats.stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: '#fb923c', change: '+24%' },
    { label: 'Active Sessions', value: stats.stats.activeBookings, icon: Activity, color: '#4ade80', change: 'Live' },
    { label: 'Under Maintenance', value: stats.stats.stationsUnderMaintenance || 0, icon: AlertTriangle, color: '#f59e0b', change: '' },
    { label: 'Payment Pending', value: stats.stats.pendingBookings || 0, icon: AlertTriangle, color: '#fbbf24', change: 'Pending Cash' },
  ] : [];

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-1 drop-shadow-sm">{user?.role === 'manager' ? 'Manager Dashboard' : 'Admin Dashboard'}</h1>
            <p className="text-white/90 font-medium">EV Guardian Operations · Last 30 days</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/stations" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2.5 px-5 rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"><MapPin size={16} /> Stations</Link>
            <Link href="/admin/bookings" className="bg-[#1a1a1a] text-white font-black py-2.5 px-5 rounded-full hover:bg-black transition-all shadow-xl flex items-center gap-2 text-sm"><Zap size={16} /> Bookings</Link>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5 mb-8">
          {loading ? [...Array(7)].map((_, i) => <div key={i} className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] animate-pulse h-32" />) : (
            statCards.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] shadow-xl hover:-translate-y-1 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                  {s.change && <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">{s.change}</span>}
                </div>
                <p className="text-2xl font-black text-white mb-1">{s.value}</p>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-[#0b1320] rounded-[32px] border border-[#1a2b42] p-8 shadow-2xl">
            <h2 className="text-white font-black text-xl mb-6">Revenue (Last 30 Days)</h2>
            {revenue?.daily?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenue.daily} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                  <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #1a2b42', borderRadius: '16px', color: '#e2e8f0', fontWeight: 'bold' }} />
                  <Bar dataKey="revenue" fill="#8cc63f" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500 font-medium">No revenue data yet</div>
            )}
          </motion.div>

          {/* Peak Hours */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] p-8 shadow-2xl">
            <h2 className="text-white font-black text-xl mb-6">Peak Hours</h2>
            {revenue?.peakHours?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenue.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                  <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={h => `${h}:00`} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #1a2b42', borderRadius: '16px', color: '#e2e8f0', fontWeight: 'bold' }} formatter={(v, n) => [v, 'Bookings']} />
                  <Line type="monotone" dataKey="count" stroke="#8cc63f" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500 font-medium">No data yet</div>
            )}
          </motion.div>
        </div>

        {/* Top Stations & Recent Bookings */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1a2b42] flex items-center justify-between">
              <h2 className="text-white font-black text-xl">Top Revenue Stations</h2>
              <Link href="/admin/stations" className="text-[#8cc63f] font-bold text-xs hover:underline">Manage →</Link>
            </div>
            <div className="divide-y divide-[#1a2b42]">
              {revenue?.byStation?.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-5 hover:bg-[#111c2e] transition-colors">
                  <span className="text-gray-500 text-sm font-black w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-base font-bold truncate">{s.name}</p>
                    <p className="text-gray-400 font-medium text-xs mt-0.5">{s.count} bookings</p>
                  </div>
                  <span className="text-[#8cc63f] font-black text-base">₹{s.revenue?.toFixed(0)}</span>
                </div>
              )) || <div className="p-8 text-center text-gray-500 font-medium text-sm">No data available</div>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1a2b42] flex items-center justify-between">
              <h2 className="text-white font-black text-xl">Recent Bookings</h2>
              <Link href="/admin/bookings" className="text-[#8cc63f] font-bold text-xs hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-[#1a2b42]">
              {stats?.recentBookings?.map((b: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-5 hover:bg-[#111c2e] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#8cc63f]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#8cc63f] font-black text-sm">{b.user?.name?.charAt(0) || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{b.user?.name}</p>
                    <p className="text-gray-400 font-medium text-xs truncate mt-0.5">{b.station?.name} • {b.vehicleNumber}</p>
                  </div>
                  <span className="text-[10px] px-3 py-1 font-bold rounded-full capitalize"
                    style={{ background: b.status === 'confirmed' ? '#8cc63f20' : '#64748b15', color: b.status === 'confirmed' ? '#8cc63f' : '#64748b' }}>
                    {b.status}
                  </span>
                </div>
              )) || <div className="p-8 text-center text-gray-500 font-medium text-sm">No recent bookings</div>}
            </div>
          </motion.div>
        </div>

        {/* Payment Pending Queue (Full Width) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl mt-8"
        >
          <div className="p-6 border-b border-[#1a2b42] flex items-center justify-between bg-gradient-to-r from-[#fbbf24]/5 to-transparent">
            <div>
              <h2 className="text-white font-black text-xl flex items-center gap-2">
                <AlertTriangle className="text-[#fbbf24]" size={20} />
                Payment Pending Queue (Cash Verification)
              </h2>
              <p className="text-xs text-gray-400 mt-1">Pending cash collection bookings. Collect the payment and mark as paid to confirm the slot.</p>
            </div>
            <span className="bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider font-mono">
              {pendingBookings.length} pending
            </span>
          </div>

          <div className="overflow-x-auto">
            {pendingBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="text-[#10b981]" size={24} />
                </div>
                <h3 className="text-white font-bold text-base mb-1">All Clear!</h3>
                <p className="text-gray-400 text-xs font-medium">No pending payments require cash verification.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a2b42] text-[10px] text-gray-400 font-black uppercase tracking-wider bg-[#060b14]/50">
                    <th className="p-5 font-bold">Booking ID / PIN</th>
                    <th className="p-5 font-bold">User Details</th>
                    <th className="p-5 font-bold">Station</th>
                    <th className="p-5 font-bold">Scheduled Time</th>
                    <th className="p-5 font-bold text-right">Amount Due</th>
                    <th className="p-5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2b42]/60">
                  {pendingBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-[#111c2e]/40 transition-colors">
                      <td className="p-5">
                        <div className="font-mono text-sm font-black text-white">{b.bookingRef || b._id.slice(-6).toUpperCase()}</div>
                        <div className="text-[10px] text-[#8cc63f] font-black uppercase tracking-wider mt-0.5">PIN: {b.pin}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-bold text-white">{b.user?.name || 'Anonymous'}</div>
                        <div className="text-xs text-gray-400 font-medium">{b.user?.email || 'N/A'}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-bold text-white">{b.station?.name || 'Station'}</div>
                        <div className="text-xs text-gray-400 font-medium">{b.chargerType}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-bold text-white">
                          {new Date(b.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-5 text-right font-mono text-sm font-black text-[#fbbf24]">
                        ₹{b.estimatedCost?.toFixed(0)}
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => handleMarkAsPaid(b._id)}
                          className="px-4 py-2 bg-[#8cc63f] hover:bg-[#679e24] text-black text-xs font-black rounded-xl transition-all shadow-[0_4px_12px_rgba(140,198,63,0.2)] flex items-center gap-1.5 mx-auto"
                        >
                          <Check size={14} strokeWidth={3} /> Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return <AuthGuard requireAdmin><AdminDashboardContent /></AuthGuard>;
}
