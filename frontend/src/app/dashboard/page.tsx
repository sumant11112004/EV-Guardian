'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Zap, TrendingUp, Leaf, Clock, ArrowRight, Star, Battery, Navigation, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import { bookingAPI, stationAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isAuthenticated } = useStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [nearbyStations, setNearbyStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; title: string } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    loadData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(userLoc);
          setLocLoading(false);
          stationAPI.getNearby({ lat: userLoc.lat, lng: userLoc.lng, radius: 5 })
            .then(r => setNearbyStations(r.data.stations || []))
            .catch(() => {});
        },
        () => {
          setLocLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocLoading(false);
    }

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [bRes] = await Promise.all([bookingAPI.getMy({ limit: 10 })]);
      setBookings(bRes.data.bookings);
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!loading && !locLoading) {
      const activeB = bookings.find(b => b.status === 'active');
      const upcomingB = bookings.find(b => b.status === 'confirmed');

      if (activeB && activeB.station?.location?.coordinates) {
        setMapCenter({
          lat: activeB.station.location.coordinates[1],
          lng: activeB.station.location.coordinates[0],
          title: activeB.station.name
        });
      } else if (upcomingB && upcomingB.station?.location?.coordinates) {
        setMapCenter({
          lat: upcomingB.station.location.coordinates[1],
          lng: upcomingB.station.location.coordinates[0],
          title: upcomingB.station.name
        });
      } else if (location) {
        setMapCenter({
          lat: location.lat,
          lng: location.lng,
          title: "Your Location"
        });
      } else if (nearbyStations.length > 0 && nearbyStations[0].location?.coordinates) {
        setMapCenter({
          lat: nearbyStations[0].location.coordinates[1],
          lng: nearbyStations[0].location.coordinates[0],
          title: nearbyStations[0].name
        });
      } else {
        setMapCenter({
          lat: 12.9716,
          lng: 77.5946,
          title: "Explore Charging Stations"
        });
      }
    }
  }, [loading, locLoading, bookings, location, nearbyStations]);

  const statusColor: Record<string, string> = { 
    confirmed: '#22d3ee', 
    pending: '#fbbf24', 
    active: '#8cc63f', 
    completed: '#10b981', 
    cancelled: '#f43f5e' 
  };

  const activeBooking = bookings.find(b => b.status === 'active');
  const upcomingBooking = bookings.find(b => ['confirmed', 'pending'].includes(b.status));

  // Stats calculation
  const stats = [
    { 
      label: 'Total Sessions', 
      value: bookings.filter(b => b.status === 'completed').length, 
      icon: Zap, 
      color: '#8cc63f' 
    },
    { 
      label: 'Active/Upcoming', 
      value: bookings.filter(b => ['confirmed', 'active', 'pending'].includes(b.status)).length, 
      icon: Calendar, 
      color: '#22d3ee' 
    },
    { 
      label: 'CO₂ Saved (kg)', 
      value: (user?.carbonSaved || 0).toFixed(1), 
      icon: Leaf, 
      color: '#a78bfa' 
    },
    { 
      label: 'Loyalty Points', 
      value: user?.loyaltyPoints || 0, 
      icon: Star, 
      color: '#fb923c' 
    },
  ];

  // Map settings
  let mapLat = 12.9716; // default Bangalore
  let mapLng = 77.5946;
  let mapTitle = "Explore Charging Stations";

  if (activeBooking && activeBooking.station?.location?.coordinates) {
    mapLng = activeBooking.station.location.coordinates[0];
    mapLat = activeBooking.station.location.coordinates[1];
    mapTitle = activeBooking.station.name;
  } else if (upcomingBooking && upcomingBooking.station?.location?.coordinates) {
    mapLng = upcomingBooking.station.location.coordinates[0];
    mapLat = upcomingBooking.station.location.coordinates[1];
    mapTitle = upcomingBooking.station.name;
  } else if (location) {
    mapLat = location.lat;
    mapLng = location.lng;
    mapTitle = "Your Location";
  } else if (nearbyStations.length > 0 && nearbyStations[0].location?.coordinates) {
    mapLng = nearbyStations[0].location.coordinates[0];
    mapLat = nearbyStations[0].location.coordinates[1];
    mapTitle = nearbyStations[0].name;
  }

  const getProgress = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const current = now.getTime();
    if (current >= end) return 100;
    if (current <= start) return 0;
    return ((current - start) / (end - start)) * 100;
  };

  const getRemainingMinutes = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const current = now.getTime();
    const diff = end - current;
    if (diff <= 0) return 0;
    return Math.ceil(diff / 60000);
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-1 drop-shadow-sm flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
              </span>
              <span className="text-black dark:text-[#8cc63f]">
                {user?.name?.split(' ')[0] || 'Driver'}
              </span>
              {user?.role && user.role !== 'user' && (
                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest select-none shadow-sm inline-flex items-center justify-center h-6 ${
                  user.role === 'admin' || user.role === 'superadmin' ? 'bg-black text-[#8cc63f] dark:bg-[#8cc63f] dark:text-black' :
                  user.role === 'manager' ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white' :
                  'bg-orange-600 text-white dark:bg-orange-500 dark:text-white'
                }`}>
                  {user.role}
                </span>
              )}
              <span>👋</span>
            </h1>
            <p className="text-gray-150 dark:text-gray-400 font-medium">Welcome to your EV Guardian dashboard.</p>
          </div>
          {user?.vehicle?.make && (
            <div className="bg-white/90 dark:bg-[#0b1320] border border-gray-200 dark:border-[#1a2b42] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-md backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#8cc63f]/10 border border-[#8cc63f]/20 flex items-center justify-center">
                <Battery className="text-black dark:text-[#8cc63f]" size={16} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider">Active Vehicle</p>
                <p className="text-xs text-gray-900 dark:text-white font-bold">{user.vehicle.year} {user.vehicle.make} {user.vehicle.model}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Dynamic Map & Live Booking Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Active / Upcoming / Fallback Card (Left Column, Span 2) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="lg:col-span-2 bg-[#0b1320] border border-[#1a2b42] rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-2xl overflow-hidden relative animate-fadeIn"
          >
            {activeBooking ? (
              // Active Charging Session View
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#8cc63f]/10 border border-[#8cc63f]/30 text-[#8cc63f] uppercase tracking-wider animate-pulse flex items-center gap-1.5 w-fit">
                        <span className="w-2 h-2 rounded-full bg-[#8cc63f] inline-block animate-ping" />
                        Charging Active
                      </span>
                      <h2 className="text-2xl font-black mt-3 text-white">{activeBooking.station?.name || 'Charging Station'}</h2>
                      <p className="text-gray-400 text-xs font-bold mt-1 flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#8cc63f]" /> {activeBooking.station?.address?.street}, {activeBooking.station?.address?.city}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-[#8cc63f]/10 border border-[#8cc63f]/20 flex items-center justify-center shrink-0">
                      <Zap size={32} className="text-[#8cc63f] animate-pulse" />
                    </div>
                  </div>

                  {/* Charging Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#101b2b] rounded-2xl p-4 border border-[#1a2b42]">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Delivered</p>
                      <p className="text-lg font-black text-[#8cc63f] font-mono">
                        ~{((activeBooking.estimatedEnergy || 0) * (getProgress(activeBooking.startTime, activeBooking.endTime) / 100)).toFixed(2)} <span className="text-xs text-gray-400 font-bold">kWh</span>
                      </p>
                    </div>
                    <div className="bg-[#101b2b] rounded-2xl p-4 border border-[#1a2b42]">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Power Output</p>
                      <p className="text-lg font-black text-white font-mono">
                        {activeBooking.station?.chargers?.[activeBooking.chargerIndex]?.power || 50} <span className="text-xs text-gray-400 font-bold">kW</span>
                      </p>
                    </div>
                    <div className="bg-[#101b2b] rounded-2xl p-4 border border-[#1a2b42]">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Plug Type</p>
                      <p className="text-lg font-black text-[#22d3ee] truncate">
                        {activeBooking.chargerType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Countdown */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400 font-bold">Charging Progress</span>
                    <span className="text-xs font-black text-[#8cc63f] font-mono">
                      {getProgress(activeBooking.startTime, activeBooking.endTime).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#101b2b] rounded-full overflow-hidden border border-[#1a2b42] mb-4">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#8cc63f] to-[#22d3ee] rounded-full" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${getProgress(activeBooking.startTime, activeBooking.endTime)}%` }} 
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 font-bold">
                    <span className="flex items-center gap-1"><Clock size={12} /> Remaining Time</span>
                    <span className="text-white font-black text-sm font-mono">{getRemainingMinutes(activeBooking.endTime)} min</span>
                  </div>
                </div>
              </div>
            ) : upcomingBooking ? (
              // Upcoming / Confirmed Booking View
              <div className="h-full flex flex-col justify-between animate-fadeIn">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        upcomingBooking.status === 'pending'
                          ? 'bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[#fbbf24]'
                          : 'bg-[#22d3ee]/10 border border-[#22d3ee]/30 text-[#22d3ee]'
                      }`}>
                        {upcomingBooking.status === 'pending' ? 'Payment Pending' : 'Confirmed Booking'}
                      </span>
                      <h2 className="text-2xl font-black mt-3 text-white">{upcomingBooking.station?.name || 'Charging Station'}</h2>
                      <p className="text-gray-400 text-xs font-bold mt-1 flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#8cc63f]" /> {upcomingBooking.station?.address?.street}, {upcomingBooking.station?.address?.city}
                      </p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                      upcomingBooking.status === 'pending'
                        ? 'bg-[#fbbf24]/10 border border-[#fbbf24]/20'
                        : 'bg-[#22d3ee]/10 border border-[#22d3ee]/20'
                    }`}>
                      <Calendar size={32} className={upcomingBooking.status === 'pending' ? 'text-[#fbbf24]' : 'text-[#22d3ee]'} />
                    </div>
                  </div>

                  <div className="bg-[#101b2b] rounded-2xl p-5 border border-[#1a2b42] flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Check-In PIN</p>
                      <span className="font-mono text-3xl font-black tracking-widest text-[#8cc63f] select-all block">{upcomingBooking.pin}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Starts At</p>
                      <p className="text-sm text-white font-black font-mono">{new Date(upcomingBooking.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{new Date(upcomingBooking.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/bookings" className="flex-1 py-3 bg-[#101b2b] hover:bg-[#15243b] text-white border border-[#1a2b42] font-black text-xs text-center rounded-xl transition-colors">
                    Manage Booking
                  </Link>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${upcomingBooking.station?.location?.coordinates?.[1] || mapCenter?.lat || 12.9716},${upcomingBooking.station?.location?.coordinates?.[0] || mapCenter?.lng || 77.5946}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 py-3 bg-[#8cc63f] hover:bg-[#679e24] text-black font-black text-xs text-center rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Navigation size={14} /> Get Directions
                  </a>
                </div>
              </div>
            ) : (
              // Fallback / Idle View
              <div className="h-full flex flex-col justify-between">
                <div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-white/5 border border-white/10 text-gray-400 uppercase tracking-wider">
                    Ready to Charge
                  </span>
                  <h2 className="text-3xl font-black mt-4 text-white">Find Your Next Charger</h2>
                  <p className="text-gray-400 text-sm font-medium mt-2 leading-relaxed max-w-md">
                    Explore available stations near you, lock in slots in advance, and earn double loyalty points for completed eco-friendly sessions!
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link href="/stations" className="py-3.5 px-8 bg-[#8cc63f] hover:bg-[#679e24] text-black font-black text-sm rounded-xl transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)] flex items-center justify-center gap-2">
                    <MapPin size={16} /> Explore Charging Stations
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-bold self-center sm:self-auto">
                    <ShieldCheck size={16} className="text-[#8cc63f]" /> 100% Verified Locations
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Interactive Google Map (Right Column, Span 1) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.15 }}
            className="bg-[#0b1320] border border-[#1a2b42] rounded-[32px] overflow-hidden shadow-2xl relative min-h-[300px] flex flex-col justify-between p-4"
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs text-white font-black uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-[#8cc63f]" /> Location Details
              </span>
              <span className="text-[10px] text-gray-500 font-bold truncate max-w-[150px]">{mapCenter?.title || "Explore Charging Stations"}</span>
            </div>
            
            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-[#1a2b42] shadow-inner relative flex items-center justify-center bg-[#060b18]">
              {mapCenter ? (
                <iframe
                  title="Station Location Map"
                  src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  className="border-0 opacity-80 hover:opacity-100 transition-opacity"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#8cc63f] animate-spin mb-2" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Acquiring accurate GPS...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-3xl font-black text-white mb-1 font-mono">{s.value}</p>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1a2b42]">
              <h2 className="text-white font-black text-xl">Recent Bookings</h2>
              <Link href="/bookings" className="text-[#8cc63f] font-bold text-xs hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
            </div>
            <div className="divide-y divide-[#1a2b42]">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 flex gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-[#111c2e] shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-[#111c2e] rounded w-2/3" />
                      <div className="h-3 bg-[#111c2e] rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : bookings.length === 0 ? (
                <div className="p-12 text-center">
                  <Zap size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-6 font-medium">No bookings yet. Start charging!</p>
                  <Link href="/stations" className="bg-[#8cc63f] text-black font-bold px-6 py-3 rounded-full hover:bg-[#679e24] transition-all">Find a Station</Link>
                </div>
              ) : bookings.slice(0, 5).map((b, i) => (
                <div key={i} className="p-6 flex items-center gap-5 hover:bg-[#111c2e] transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#8cc63f]/10 border border-[#8cc63f]/20 flex items-center justify-center shrink-0">
                    <Zap size={20} className="text-[#8cc63f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-base font-bold truncate mb-1">{b.station?.name || 'Station'}</p>
                    <p className="text-gray-400 text-xs font-medium">{b.chargerType} · {new Date(b.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ 
                        background: `${(b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show')) ? '#f97316' : statusColor[b.status] || '#64748b')}15`, 
                        color: b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show')) ? '#f97316' : statusColor[b.status] || '#64748b', 
                        border: `1px solid ${(b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show')) ? '#f97316' : statusColor[b.status] || '#64748b')}30` 
                      }}>
                      {b.status === 'pending' 
                        ? 'Payment Pending' 
                        : b.status === 'cancelled' && (b.cancellationReason?.toLowerCase().includes('auto-cancelled') || b.cancellationReason?.toLowerCase().includes('no-show'))
                          ? 'No-Show' 
                          : b.status}
                    </span>
                    <p className="text-gray-400 font-bold text-sm mt-2 font-mono">₹{b.estimatedCost?.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Nearby Stations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1a2b42]">
              <h2 className="text-white font-black text-xl">Nearby Stations</h2>
              <Link href="/stations" className="text-[#8cc63f] font-bold text-xs hover:underline flex items-center gap-1">Explore <ArrowRight size={14} /></Link>
            </div>
            <div className="divide-y divide-[#1a2b42]">
              {nearbyStations.length === 0 ? (
                <div className="p-8 text-center">
                  <MapPin size={40} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">Enable location to see nearby stations</p>
                </div>
              ) : nearbyStations.slice(0, 4).map((s, i) => {
                const available = s.chargers?.some((c: any) => c.availableSlots > 0);
                return (
                  <Link key={i} href={`/stations/${s._id}`} className="flex items-center gap-4 p-5 hover:bg-[#111c2e] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#8cc63f]/10 border border-[#8cc63f]/20 flex items-center justify-center shrink-0">
                      <Battery size={18} className="text-[#8cc63f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate mb-1">{s.name}</p>
                      <p className="text-gray-400 font-medium text-xs">{s.address?.city}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${available ? 'bg-[#8cc63f]/20 text-[#8cc63f]' : 'bg-red-500/20 text-red-500'}`}>{available ? 'Free' : 'Busy'}</span>
                  </Link>
                );
              })}
            </div>
            <div className="p-5 border-t border-[#1a2b42]">
              <Link href="/stations" className="w-full bg-[#8cc63f] text-black font-black justify-center text-sm py-3 rounded-xl flex items-center gap-2 hover:bg-[#679e24] transition-colors">
                <MapPin size={16} /> Find Stations
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
