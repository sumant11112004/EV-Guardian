'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Zap, Star, Clock, SlidersHorizontal, ChevronDown, X, Navigation } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { stationAPI } from '@/lib/api';
import { io as socketIO } from 'socket.io-client';
import toast from 'react-hot-toast';

const CHARGER_TYPES = ['All', 'AC Level 1', 'AC Level 2', 'DC Fast', 'CCS', 'CHAdeMO', 'Type2'];
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function getDirectionsUrl(lat: number, lng: number, name: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
}

function StationCard({ station, index }: { station: any; index: number }) {
  const totalFree = station.chargers?.reduce((a: number, c: any) => a + (c.availableSlots || 0), 0) || 0;
  const minPrice = station.chargers?.reduce((a: number, c: any) => Math.min(a, c.pricePerKwh), Infinity);
  const lat = station.location?.coordinates?.[1];
  const lng = station.location?.coordinates?.[0];

  return (

    <motion.div
      key={station._id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className="bg-[#0b1320] rounded-[24px] overflow-hidden border border-[#1a2b42] shadow-2xl group flex flex-col hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}

      <div className="h-44 bg-[#111c2e] relative overflow-hidden shrink-0">
        {station.images?.[0] ? (
          <img src={station.images[0]} alt={station.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Zap size={48} className="text-[#8cc63f]/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b18]/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2 flex-col items-start">
          {station.status === 'maintenance' ? (
            <span className="badge-busy">Maintenance</span>
          ) : station.status === 'inactive' ? (
            <span className="badge-offline">Inactive</span>
          ) : totalFree > 0 ? (
            <span className="badge-available"><span className="pulse-dot" />{totalFree} Slots Free</span>
          ) : (
            <span className="badge-offline">All Full</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-[#8cc63f]/20 px-2 py-1 rounded-lg text-xs text-[#8cc63f] font-bold border border-[#8cc63f]/30">
            {station.chargers?.[0]?.type || 'AC/DC'}
          </span>
        </div>
        {lat && lng && (
          <a
            href={getDirectionsUrl(lat, lng, station.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 bg-white text-[#060b18] text-xs font-black px-3 py-1.5 rounded-lg shadow-lg hover:bg-[#8cc63f] hover:text-black transition-colors"
          >
            <Navigation size={12} /> Directions
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-white font-black text-lg mb-1 truncate">{station.name}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3 font-medium">
          <MapPin size={12} className="text-[#8cc63f] shrink-0" />
          <span className="truncate">{station.address?.city}, {station.address?.state}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Star size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-medium">{station.avgRating?.toFixed(1) || 'New'}</span>
            <span className="text-slate-500 text-xs">({station.totalReviews || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock size={12} />
            <span>{station.operatingHours?.is24x7 ? '24/7' : `${station.operatingHours?.open} – ${station.operatingHours?.close}`}</span>
          </div>
        </div>

        {/* Charger type pills */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {station.chargers?.slice(0, 3).map((c: any, i: number) => (
            <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#111c2e] text-gray-300 border border-[#1a2b42]">{c.type}</span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">From</p>
            <p className="text-[#8cc63f] font-black text-lg">
              ₹{minPrice === Infinity ? '--' : minPrice}<span className="text-gray-500 font-bold text-xs ml-1">/kWh</span>
            </p>
          </div>
          <div className="flex gap-2">
            {lat && lng && (
              <a href={getDirectionsUrl(lat, lng, station.name)} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-2.5 rounded-xl border-2 border-[#1a2b42] text-gray-400 hover:text-[#8cc63f] hover:border-[#8cc63f]/30 hover:bg-[#8cc63f]/10 transition-all"
                title="Get Directions">
                <Navigation size={16} />
              </a>
            )}
            <Link href={`/stations/${station._id}`} className="bg-[#8cc63f] text-black font-black text-xs py-2.5 px-5 rounded-full hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.3)]">
              {station.status === 'active' ? 'Book Now' : 'View'}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StationsContent() {
  const searchParams = useSearchParams();
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [chargerType, setChargerType] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [location, setLocation] = useState<any>(null);
  const socketRef = useRef<any>(null);
  const [liveUpdate, setLiveUpdate] = useState<string | null>(null);

  // Get user GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { }, // fail silently
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Load stations
  useEffect(() => { loadStations(); }, [search, chargerType, maxPrice, page, location]);

  // Socket.IO real-time updates
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = socketIO(socketUrl, { transports: ['websocket', 'polling'] });

    socketRef.current.on('station:created', ({ station }: any) => {
      setStations(prev => {
        if (prev.find(s => s._id === station._id)) return prev;
        setLiveUpdate(`✨ New station added: ${station.name}`);
        setTimeout(() => setLiveUpdate(null), 4000);
        return [station, ...prev];
      });
      setTotal(t => t + 1);
    });

    socketRef.current.on('station:updated', ({ station }: any) => {
      setStations(prev => prev.map(s => s._id === station._id ? station : s));
      setLiveUpdate(`🔄 Station updated: ${station.name}`);
      setTimeout(() => setLiveUpdate(null), 3000);
    });

    socketRef.current.on('station:deleted', ({ stationId }: any) => {
      setStations(prev => {
        const deleted = prev.find(s => s._id === stationId);
        if (deleted) {
          setLiveUpdate(`🗑️ Station removed: ${deleted.name}`);
          setTimeout(() => setLiveUpdate(null), 3000);
        }
        return prev.filter(s => s._id !== stationId);
      });
      setTotal(t => Math.max(0, t - 1));
    });

    socketRef.current.on('slot-update', ({ stationId, chargers }: any) => {
      setStations(prev => prev.map(s => s._id === stationId ? { ...s, chargers } : s));
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  const loadStations = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12, search: search || undefined, status: 'all' };
      if (chargerType !== 'All') params.type = chargerType;
      if (maxPrice) params.maxPrice = maxPrice;
      if (location) { params.lat = location.lat; params.lng = location.lng; params.radius = 50000; }
      const res = await stationAPI.getAll(params);
      setStations(res.data.stations);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { setStations([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 drop-shadow-sm">Find Charging Stations</h1>
            <p className="text-white/90 font-medium">{total} stations found{search ? ` for "${search}"` : ''}</p>
          </div>
          {location && (
            <div className="flex items-center gap-2 text-sm text-[#1a1a1a] bg-white/20 px-4 py-2 rounded-xl font-bold backdrop-blur-sm">
              <MapPin size={16} /> Using your location · sorted by nearest
            </div>
          )}
        </motion.div>

        {/* Live update toast */}
        <AnimatePresence>
          {liveUpdate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-3 bg-black/20 border border-black/10 rounded-xl px-4 py-3 text-white font-bold text-sm backdrop-blur-sm shadow-xl">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />{liveUpdate}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filters */}
        <div className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 bg-[#111c2e] rounded-xl px-4 py-3 border border-[#1a2b42] focus-within:border-[#8cc63f] transition-all">
              <Search size={18} className="text-gray-500 shrink-0" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search city, area, or station name..."
                className="bg-transparent outline-none text-white placeholder-gray-500 flex-1 text-sm font-medium" />
              {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-500 hover:text-white" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3 bg-[#111c2e] rounded-xl border border-[#1a2b42] text-white font-bold hover:bg-[#1a2b42] transition-all text-sm">
              <SlidersHorizontal size={16} /> Filters
              <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-5 pt-5 border-t border-[#1e3a5f] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 block">Charger Type</label>
                    <div className="flex flex-wrap gap-2">
                      {CHARGER_TYPES.map(t => (
                        <button key={t} onClick={() => { setChargerType(t); setPage(1); }}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${chargerType === t ? 'bg-[#8cc63f] text-black border-[#8cc63f]' : 'bg-[#111c2e] border-[#1a2b42] text-gray-400 hover:text-white'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Max Price (₹/kWh)</label>
                      <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                        placeholder="e.g. 25" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                    </div>
                    <button onClick={() => { setSearch(''); setChargerType('All'); setMaxPrice(''); setPage(1); }}
                      className="bg-transparent border-2 border-[#1a2b42] text-white font-bold text-xs py-3 px-6 rounded-xl hover:bg-[#1a2b42] whitespace-nowrap">Clear All</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0b1320] rounded-[24px] overflow-hidden border border-[#1a2b42] animate-pulse">
                <div className="h-44 bg-[#111c2e]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#111c2e] rounded w-3/4" />
                  <div className="h-3 bg-[#111c2e] rounded w-1/2" />
                  <div className="h-3 bg-[#111c2e] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-20 bg-[#0b1320] rounded-[24px] border border-[#1a2b42] shadow-xl">
            <MapPin size={60} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-black text-2xl mb-2">No stations found</h3>
            <p className="text-gray-400 mb-6 font-medium">Try a different search or expand your area.</p>
            <button onClick={() => { setSearch(''); setChargerType('All'); setMaxPrice(''); }} className="bg-[#8cc63f] text-black font-bold px-8 py-3 rounded-full hover:bg-[#679e24] transition-colors shadow-[0_5px_15px_rgba(140,198,63,0.2)]">Clear Filters</button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map((station, i) => (
                <StationCard key={station._id} station={station} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-6 py-3 rounded-full border-2 border-[#1a2b42] text-gray-500 hover:text-black hover:bg-[#8cc63f] hover:border-[#8cc63f] disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all bg-white">
              Previous
            </button>
            <span className="text-gray-500 font-bold px-4">Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
              className="px-6 py-3 rounded-full border-2 border-[#1a2b42] text-gray-500 hover:text-black hover:bg-[#8cc63f] hover:border-[#8cc63f] disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all bg-white">
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function StationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-transparent text-white">
        <div className="w-10 h-10 rounded-full border-4 border-[#8cc63f] border-t-transparent animate-spin" />
      </div>
    }>
      <StationsContent />
    </Suspense>
  );
}
