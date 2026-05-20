'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Zap, Battery, Shield, ChevronLeft, Heart, Share2, CheckCircle, Calendar, ArrowRight, Navigation } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { stationAPI, authAPI, bookingAPI, paymentAPI, mechanicAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useStore();

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
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState(0);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');

  // Mechanic state
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [problemDesc, setProblemDesc] = useState('');
  const [requestingMechanic, setRequestingMechanic] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => {
    stationAPI.getOne(id as string).then(r => { setStation(r.data.station); setLoading(false); })
      .catch(() => { toast.error('Station not found'); router.push('/stations'); });
  }, [id]);

  const toggleFav = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    try {
      const res = await authAPI.toggleFavorite(id as string);
      setIsFav(res.data.isFavorite);
      toast.success(res.data.isFavorite ? '❤️ Added to favorites' : 'Removed from favorites');
    } catch { toast.error('Failed'); }
  };

  const handleBook = async () => {
    if (!isAuthenticated) { toast.error('Sign in to book'); router.push('/auth/login'); return; }
    if (!date || !startTime) { toast.error('Select date and time'); return; }
    if (!vehicleNumber) { toast.error('Please enter your vehicle number'); return; }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(start.getTime() + duration * 60000);
    setBooking(true);
    try {
      const res = await bookingAPI.create({ stationId: station._id, chargerIndex: selectedCharger, startTime: start.toISOString(), endTime: end.toISOString(), duration, vehicleNumber, paymentMethod });
      const bookingObj = res.data.booking;

      if (paymentMethod === 'cash') {
        toast.success('Slot reserved! Please pay cash at the station.');
        router.push('/bookings');
        return;
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const orderRes = await paymentAPI.createOrder(bookingObj._id);
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
              bookingId: bookingObj._id
            });
            toast.success('Payment successful! Booking confirmed.');
            router.push('/bookings');
          } catch (err) {
            toast.error('Payment verification failed.');
            router.push('/bookings');
          }
        },
        prefill: {
          name: user?.name || "User",
          email: user?.email || "",
          contact: "9999999999"
        },
        theme: {
          color: '#8cc63f'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        console.error('Razorpay Error:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Card declined'}`);
        router.push('/bookings');
      });
      paymentObject.open();

    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally { setBooking(false); }
  };

  const handleRequestMechanic = async () => {
    if (!isAuthenticated) { toast.error('Sign in to request mechanic'); router.push('/auth/login'); return; }
    if (!problemDesc) { toast.error('Please describe your problem'); return; }

    setRequestingMechanic(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          await mechanicAPI.create({
            stationId: station._id,
            problemDescription: problemDesc,
            coordinates: [lng, lat]
          });

          toast.success('Mechanic requested successfully!');
          setShowMechanicModal(false);
          setProblemDesc('');
          setRequestingMechanic(false);
        }, () => {
          toast.error('Location access is required to send to the mechanic.');
          setRequestingMechanic(false);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      } else {
        toast.error('Geolocation is not supported by your browser.');
        setRequestingMechanic(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request mechanic');
      setRequestingMechanic(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const charger = station?.chargers?.[selectedCharger];
  const estCost = charger ? ((charger.power * duration / 60) * charger.pricePerKwh).toFixed(0) : 0;

  if (loading) return (
    <div className="min-h-screen bg-transparent text-white"><Navbar />
      <div className="container-xl pt-24"><div className="animate-pulse space-y-6">
        <div className="h-72 bg-[#111c2e] rounded-[40px]" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-[#111c2e] rounded-[40px]" />
          <div className="h-64 bg-[#111c2e] rounded-[40px]" />
        </div>
      </div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-32 md:pt-40 pb-16">
        <Link href="/stations" className="inline-flex items-center gap-2 text-gray-900 hover:text-white font-bold text-sm mb-6 transition-colors relative z-20 w-fit">
          <ChevronLeft size={16} /> Back to Stations
        </Link>

        {/* Hero */}
        <div className="h-64 md:h-[400px] rounded-[40px] overflow-hidden mb-8 relative shadow-2xl group">
          {station.images && station.images.length > 0
            ? (
              <>
                <img src={station.images[activeImg]} alt={station.name} className="w-full h-full object-cover transition-opacity duration-500" />
                {station.images.length > 1 && (
                  <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
                    {station.images.map((_: any, i: number) => (
                      <button key={i} onClick={() => setActiveImg(i)} className={`h-2.5 rounded-full transition-all ${activeImg === i ? 'bg-[#8cc63f] w-8' : 'bg-white/50 w-2.5 hover:bg-white'}`} />
                    ))}
                  </div>
                )}
              </>
            )
            : <div className="w-full h-full bg-[#111c2e] flex items-center justify-center"><Zap size={80} className="text-[#8cc63f]/20" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{station.name}</h1>
            <p className="text-gray-300 text-sm font-medium flex items-center gap-2"><MapPin size={16} className="text-[#8cc63f]" />{station.address?.city}, {station.address?.state}</p>
          </div>
          <div className="absolute top-6 right-6 flex gap-3">
            <button onClick={toggleFav} className={`p-3 rounded-xl bg-black/40 backdrop-blur-md border transition-all ${isFav ? 'border-rose-500 text-rose-500' : 'border-white/20 text-white hover:bg-white/10'}`}>
              <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 transition-all">
              <Share2 size={20} />
            </button>
          </div>
          <div className="absolute top-6 left-6">
            {station.status === 'active' ? <span className="bg-[#8cc63f] text-black px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full animate-pulse" />Active</span>
              : station.status === 'maintenance' ? <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-bold">Maintenance</span>
                : <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold">Inactive</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Rating', value: station.avgRating?.toFixed(1) || 'New', icon: Star, color: '#fbbf24', sub: `${station.totalReviews} reviews` },
                { label: 'Hours', value: station.operatingHours?.is24x7 ? '24/7' : 'Limited', icon: Clock, color: '#8cc63f', sub: 'Operating' },
                { label: 'Chargers', value: station.chargers?.length || 0, icon: Battery, color: '#8cc63f', sub: 'types' },
              ].map((s, i) => (
                <div key={i} className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] text-center shadow-xl">
                  <s.icon size={24} className="mx-auto mb-3" style={{ color: s.color }} />
                  <p className="text-white font-black text-2xl mb-1">{s.value}</p>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Chargers */}
            <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#1a2b42]"><h2 className="text-white font-black text-xl">Charger Types</h2></div>
              {station.chargers?.map((c: any, i: number) => (
                <button key={i} onClick={() => setSelectedCharger(i)}
                  className={`w-full flex items-center gap-5 p-6 transition-colors text-left border-b border-[#1a2b42] last:border-0 ${selectedCharger === i ? 'bg-[#8cc63f]/5 border-l-4 border-l-[#8cc63f]' : 'hover:bg-[#111c2e]'}`}>
                  <div className="w-12 h-12 rounded-xl bg-[#8cc63f]/10 flex items-center justify-center shrink-0">
                    <Zap size={20} className="text-[#8cc63f]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base mb-1">{c.type} · {c.connectorType}</p>
                    <p className="text-gray-400 text-xs font-medium">{c.power} kW · ₹{c.pricePerKwh}/kWh</p>
                  </div>
                  {c.availableSlots > 0
                    ? <span className="bg-[#8cc63f]/20 text-[#8cc63f] px-3 py-1 rounded-full text-xs font-bold border border-[#8cc63f]/30">{c.availableSlots}/{c.totalSlots} Free</span>
                    : <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20">Full</span>}
                </button>
              ))}
            </div>

            {/* Amenities */}
            {station.amenities?.length > 0 && (
              <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] p-6 shadow-2xl">
                <h2 className="text-white font-black text-xl mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {station.amenities.map((a: string, i: number) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-[#111c2e] border border-[#1a2b42] text-gray-300 font-bold text-xs flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#8cc63f]" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Google Maps */}
            {(() => {
              const lat = station.location?.coordinates?.[1];
              const lng = station.location?.coordinates?.[0];
              const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
              const directionsUrl = lat && lng ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null;
              const embedUrl = lat && lng && mapsKey
                ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${lat},${lng}&zoom=15`
                : lat && lng
                  ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
                  : null;
              return embedUrl ? (
                <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-[#1a2b42] flex items-center justify-between">
                    <h2 className="text-white font-black text-xl flex items-center gap-2">
                      <MapPin size={20} className="text-[#8cc63f]" /> Location & Directions
                    </h2>
                    {directionsUrl && (
                      <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                        className="bg-[#8cc63f] text-black font-bold text-xs py-3 px-5 rounded-full flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-xl hover:-translate-y-0.5">
                        <Navigation size={16} /> Get Directions
                      </a>
                    )}
                  </div>
                  <div className="relative" style={{ height: '320px' }}>
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="320"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map for ${station.name}`}
                      className="w-full h-full"
                    />
                    {/* Overlay with address */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-[20px] px-5 py-3 border border-white/10 shadow-2xl">
                      <p className="text-white text-sm font-black">{station.name}</p>
                      <p className="text-gray-400 text-xs font-medium">{station.address?.street}, {station.address?.city}</p>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Reviews */}
            <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#1a2b42] flex items-center justify-between">
                <h2 className="text-white font-black text-xl">Reviews</h2>
                <span className="text-yellow-400 flex items-center gap-1 text-base font-bold"><Star size={18} fill="currentColor" />{station.avgRating?.toFixed(1) || '--'} <span className="text-gray-500 font-medium text-xs ml-1">({station.totalReviews})</span></span>
              </div>
              {station.reviews?.length === 0
                ? <div className="p-10 text-center text-gray-500 text-sm font-medium">No reviews yet. Be the first!</div>
                : station.reviews?.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className="p-6 border-b border-[#1a2b42] last:border-0 hover:bg-[#111c2e] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#8cc63f] flex items-center justify-center text-black font-black text-sm shrink-0">{r.user?.name?.charAt(0) || '?'}</div>
                      <div>
                        <p className="text-white text-sm font-bold">{r.user?.name || 'User'}</p>
                        <div className="flex text-yellow-400 text-xs mt-1 tracking-widest">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                      </div>
                    </div>
                    {r.comment && <p className="text-gray-400 text-sm font-medium leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
            </div>
          </div>

          {/* Booking Panel */}
          <div>
            <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] shadow-2xl p-8 sticky top-24">
              <h2 className="text-white font-black text-2xl mb-2">Book a Slot</h2>
              {charger && <p className="text-[#8cc63f] font-bold text-sm mb-6">{charger.type} · {charger.power}kW · ₹{charger.pricePerKwh}/kWh</p>}
              <div className="space-y-5">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Date</label>
                  <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Vehicle Number</label>
                  <input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="e.g. MH 12 AB 1234" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'online' ? 'bg-[#8cc63f] text-black border-[#8cc63f] shadow-lg' : 'bg-[#111c2e] border-[#1a2b42] text-gray-300 hover:text-white'}`}
                    >
                      Online (Razorpay)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'cash' ? 'bg-[#8cc63f] text-black border-[#8cc63f] shadow-lg' : 'bg-[#111c2e] border-[#1a2b42] text-gray-300 hover:text-white'}`}
                    >
                      Cash (Pay at Station)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Duration: <span className="text-[#8cc63f]">{duration} min</span></label>
                  <input type="range" min={30} max={240} step={30} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-[#8cc63f] cursor-pointer" />
                  <div className="flex justify-between text-gray-500 font-bold text-xs mt-2"><span>30 min</span><span>4 hrs</span></div>
                </div>
              </div>
              <div className="mt-6 p-5 rounded-2xl bg-[#8cc63f]/10 border border-[#8cc63f]/20 space-y-3">
                <div className="flex justify-between text-sm font-medium"><span className="text-gray-400">Est. Energy</span><span className="text-white">{charger ? (charger.power * duration / 60).toFixed(1) : '--'} kWh</span></div>
                <div className="flex justify-between text-sm font-medium"><span className="text-gray-400">Duration</span><span className="text-white">{duration} min</span></div>
                <div className="flex justify-between font-black border-t border-[#8cc63f]/20 pt-3 mt-3"><span className="text-gray-300">Est. Cost</span><span className="text-[#8cc63f] text-xl">₹{estCost}</span></div>
              </div>
              <button onClick={handleBook} disabled={booking || station.status !== 'active' || !charger?.availableSlots}
                className="w-full bg-[#8cc63f] text-black justify-center mt-6 py-4 rounded-full font-black flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-[0_10px_20px_rgba(140,198,63,0.3)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {booking ? 'Creating...' : !charger?.availableSlots ? 'No Slots' : <><Calendar size={18} />Reserve Slot<ArrowRight size={18} /></>}
              </button>
              <div className="mt-5 flex items-center justify-center gap-2 text-gray-500 font-medium text-xs">
                <Shield size={14} className="text-[#8cc63f]" /> Secure booking · Free cancellation
              </div>

              <div className="mt-8 border-t border-[#1a2b42] pt-8 text-center">
                <h3 className="text-white font-black text-lg mb-2">Need Help on the Way?</h3>
                <p className="text-gray-400 text-sm font-medium mb-5">Vehicle stopped or facing an issue? Request our station mechanic.</p>
                <button onClick={() => setShowMechanicModal(true)} className="w-full bg-transparent border-2 border-[#1a2b42] text-white font-bold justify-center py-4 rounded-full hover:bg-[#111c2e] transition-colors">
                  Request Mechanic
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mechanic Modal */}
      {showMechanicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] shadow-2xl w-full max-w-md p-8">
            <h2 className="text-white font-black text-2xl mb-2">Request Mechanic</h2>
            <p className="text-gray-400 font-medium text-sm mb-6">Describe your issue. We'll use your location so the mechanic can reach you with the right tools.</p>

            <div className="space-y-5">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Problem Description *</label>
                <textarea
                  value={problemDesc}
                  onChange={e => setProblemDesc(e.target.value)}
                  placeholder="E.g., Flat tire, battery drained completely..."
                  className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-4 text-sm h-32 resize-none focus:outline-none focus:border-[#8cc63f] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={() => setShowMechanicModal(false)} className="flex-1 bg-transparent border-2 border-[#1a2b42] text-white font-bold py-4 rounded-full hover:bg-[#111c2e] transition-colors">Cancel</button>
              <button onClick={handleRequestMechanic} disabled={requestingMechanic || !problemDesc} className="flex-1 bg-[#8cc63f] text-black font-black py-4 rounded-full hover:bg-[#679e24] transition-all shadow-[0_10px_20px_rgba(140,198,63,0.3)] disabled:opacity-50 hover:-translate-y-0.5">
                {requestingMechanic ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
