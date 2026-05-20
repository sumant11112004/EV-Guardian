'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Zap, Calendar, CreditCard, MapPin, Info, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { notifAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  booking_confirmed: { icon: Zap, color: '#8cc63f' },
  booking_reminder: { icon: Calendar, color: '#fbbf24' },
  slot_available: { icon: MapPin, color: '#8cc63f' },
  payment_success: { icon: CreditCard, color: '#8cc63f' },
  payment_failed: { icon: CreditCard, color: '#f43f5e' },
  booking_cancelled: { icon: X, color: '#f43f5e' },
  system: { icon: Info, color: '#818cf8' },
};

export default function NotificationsPage() {
  const { isAuthenticated, setNotifications, unreadCount } = useStore();
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notifAPI.getAll();
      setNotifs(res.data.notifications);
      setNotifications(res.data.notifications, res.data.unread);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const markRead = async (id: string) => {
    try {
      await notifAPI.markRead(id);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notifAPI.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotifications([], 0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed'); }
    finally { setMarkingAll(false); }
  };

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-black mb-1 flex items-center gap-3">
              Notifications
              {unread > 0 && <span className="px-3 py-1 rounded-full bg-[#8cc63f]/20 text-[#8cc63f] text-sm font-bold border border-[#8cc63f]/30">{unread}</span>}
            </h1>
            <p className="text-gray-500 font-medium">Stay updated on your bookings and payments</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} disabled={markingAll}
              className="bg-white border-2 border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 font-bold text-xs py-2 px-4 rounded-full flex items-center gap-2 disabled:opacity-50 transition-all">
              <CheckCheck size={14} /> {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] animate-pulse flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#111c2e] shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-[#111c2e] rounded w-3/4" />
                  <div className="h-3 bg-[#111c2e] rounded w-full" />
                  <div className="h-2 bg-[#111c2e] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 bg-[#0b1320] rounded-[32px] border border-[#1a2b42] shadow-2xl">
            <Bell size={60} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-black text-2xl mb-2">All caught up!</h3>
            <p className="text-gray-400 font-medium mb-6">No notifications yet. Book a charging session to get started.</p>
            <Link href="/stations" className="bg-[#8cc63f] text-black font-black px-8 py-3 rounded-full hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)] inline-block">Find Stations</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {notifs.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              return (
                <motion.div key={n._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`bg-[#0b1320] rounded-[24px] p-6 border transition-all cursor-pointer shadow-xl hover:-translate-y-0.5 ${!n.isRead ? 'border-[#8cc63f]/30 bg-[#8cc63f]/5' : 'border-[#1a2b42] hover:border-gray-600'}`}>
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                      <cfg.icon size={20} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-black text-base ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>{n.title}</p>
                        {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-[#8cc63f] shrink-0 mt-1 shadow-[0_0_8px_rgba(140,198,63,0.8)]" />}
                      </div>
                      <p className={`text-sm mt-1 leading-relaxed ${!n.isRead ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>{n.message}</p>
                      <p className="text-gray-600 font-bold text-xs mt-3 uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
