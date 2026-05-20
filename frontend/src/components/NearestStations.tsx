'use client';
import { useState, useEffect } from 'react';
import { MapPin, ArrowDown, Zap, Star, Clock, Navigation, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { stationAPI } from '@/lib/api';
import { motion } from 'framer-motion';

function getDirectionsUrl(lat: number, lng: number, name: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
}

export default function NearestStations() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await stationAPI.getAll({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              limit: 3,
              radius: 50000 // 50km
            });
            setStations(res.data.stations || []);
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        },
        () => {
          // Geolocation failed or denied
          setLocationError(true);
          // Fallback: just fetch 3 generic stations
          stationAPI.getAll({ limit: 3 }).then(res => {
            setStations(res.data.stations || []);
          }).finally(() => setLoading(false));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError(true);
      stationAPI.getAll({ limit: 3 }).then(res => {
        setStations(res.data.stations || []);
      }).finally(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center bg-[#f7faf5] dark:bg-[#0b1320] rounded-t-[40px] sm:rounded-t-[70px] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] relative z-20">
        <div className="w-10 h-10 border-4 border-[#8cc63f] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs">Locating nearest stations...</p>
      </div>
    );
  }

  if (stations.length === 0) return null;

  return (
    <div id="stations" className="bg-[#f7faf5] dark:bg-[#0b1320] pt-16 pb-4 relative z-20 rounded-t-[40px] rounded-b-[60px] sm:rounded-t-[70px] sm:rounded-b-[80px] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] px-6 sm:px-10">
      <div onClick={(e) => e.currentTarget.parentElement?.scrollIntoView({ behavior: 'smooth' })} className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all shadow-xl border-[8px] sm:border-[10px] border-white group">
        <ArrowDown size={28} className="group-hover:animate-bounce" />
      </div>
      <div className="container mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#8cc63f] animate-pulse" />
              {locationError ? 'Featured Stations' : 'Near You'}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
              {locationError ? 'Popular' : 'Nearest'} <span className="text-[#8cc63f]">Stations</span>
            </h2>
          </div>
          <Link href="/#stations" className="flex items-center gap-2 text-gray-900 dark:text-white font-bold hover:text-[#679e24] transition-colors group px-6 py-3 bg-white dark:bg-[#111c2e] rounded-full border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md">
            View All Stations <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {stations.map((station, i) => {
            const totalFree = station.chargers?.reduce((a: number, c: any) => a + (c.availableSlots || 0), 0) || 0;
            const minPrice = station.chargers?.reduce((a: number, c: any) => Math.min(a, c.pricePerKwh), Infinity);
            const lat = station.location?.coordinates?.[1];
            const lng = station.location?.coordinates?.[0];

            return (
              <motion.div
                key={station._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-[#111c2e] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:border-[#8cc63f]/30 transition-all group flex flex-col"
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 dark:bg-gray-800 relative overflow-hidden shrink-0">
                  {station.images?.[0] ? (
                    <img src={station.images[0]} alt={station.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Zap size={40} className="text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 flex gap-2 flex-col items-start">
                    {station.status === 'maintenance' ? (
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Maintenance</span>
                    ) : station.status === 'inactive' ? (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Offline</span>
                    ) : totalFree > 0 ? (
                      <span className="bg-[#8cc63f] text-black dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                        {totalFree} Slots Free
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Full</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-gray-900 dark:text-white font-black text-lg mb-1.5 truncate">{station.name}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-4">
                    <MapPin size={12} className="text-[#8cc63f] shrink-0" />
                    <span className="truncate">{station.address?.city}, {station.address?.state}</span>
                  </div>

                  <div className="flex items-center justify-between mb-5 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-900 dark:text-white font-bold text-sm">{station.avgRating?.toFixed(1) || 'New'}</span>
                      <span className="text-gray-400 text-xs">({station.totalReviews || 0})</span>
                    </div>
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium text-xs">
                      <Clock size={12} className="text-[#8cc63f]" />
                      <span>{station.operatingHours?.is24x7 ? '24/7' : `${station.operatingHours?.open} – ${station.operatingHours?.close}`}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Price From</p>
                      <p className="text-[#679e24] font-black text-lg">
                        ₹{minPrice === Infinity ? '--' : minPrice}<span className="text-gray-400 font-medium text-xs">/kWh</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {lat && lng && (
                        <a href={getDirectionsUrl(lat, lng, station.name)} target="_blank" rel="noopener noreferrer"
                          className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:text-white hover:border-black hover:bg-gray-50 dark:bg-gray-900 transition-all"
                          title="Get Directions">
                          <Navigation size={16} />
                        </a>
                      )}
                      <Link href={`/stations/${station._id}`} className="bg-black text-white font-bold text-xs py-2.5 px-5 rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5">
                        {station.status === 'active' ? 'Book Slot' : 'View'}
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
