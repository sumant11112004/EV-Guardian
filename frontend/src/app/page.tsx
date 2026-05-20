'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, ArrowDown, Zap, MapPin, CreditCard, ShieldCheck, Wrench } from 'lucide-react';
import Navbar from '@/components/Navbar';
import NearestStations from '@/components/NearestStations';
import Testimonials from '@/components/Testimonials';
import MarketOpportunity from '@/components/MarketOpportunity';
import ComparisonSection from '@/components/ComparisonSection';
import { useStore } from '@/store/useStore';
import { mechanicAPI, stationAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { io as socketIO } from 'socket.io-client';
import Footer from '@/components/Footer';

export default function HomePage() {
   const [showMechanicModal, setShowMechanicModal] = useState(false);
   const [problemDesc, setProblemDesc] = useState('');
   const [requestingMechanic, setRequestingMechanic] = useState(false);
   const [fetchingStations, setFetchingStations] = useState(false);
   const [nearbyStations, setNearbyStations] = useState<any[]>([]);
   const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
   const [activeRequest, setActiveRequest] = useState<any>(null);
   const [mechanicLocation, setMechanicLocation] = useState<any>(null);
   const socketRef = useRef<any>(null);
   const { isAuthenticated } = useStore();

   useEffect(() => {
      if (activeRequest) {
         const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
         socketRef.current = socketIO(socketUrl, { transports: ['websocket', 'polling'] });

         socketRef.current.on('mechanic-request-updated', (data: any) => {
            if (data.request._id === activeRequest._id) {
               setActiveRequest(data.request);
               if (data.request.status === 'accepted') {
                  toast.success('Mechanic accepted your request and is on the way!');
                  setMechanicLocation({
                     lat: activeRequest.location.coordinates[1] + 0.01,
                     lng: activeRequest.location.coordinates[0] + 0.01
                  });
               }
            }
         });

         return () => { socketRef.current?.disconnect(); };
      }
   }, [activeRequest]);

   useEffect(() => {
      if (activeRequest?.status === 'accepted' && mechanicLocation) {
         const interval = setInterval(() => {
            setMechanicLocation((prev: any) => {
               if (!prev) return prev;
               const targetLat = activeRequest.location.coordinates[1];
               const targetLng = activeRequest.location.coordinates[0];
               const latDiff = targetLat - prev.lat;
               const lngDiff = targetLng - prev.lng;
               if (Math.abs(latDiff) < 0.0005 && Math.abs(lngDiff) < 0.0005) return prev;
               return { lat: prev.lat + latDiff * 0.1, lng: prev.lng + lngDiff * 0.1 };
            });
         }, 2000);
         return () => clearInterval(interval);
      }
   }, [activeRequest?.status]);

   const openMechanicModal = () => {
      if (!isAuthenticated) { toast.error('Sign in to request mechanic'); return; }
      setShowMechanicModal(true);
      setFetchingStations(true);
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            try {
               const res = await stationAPI.getNearby({ lat, lng, radius: 50 });
               setNearbyStations(res.data.stations.slice(0, 3));
               if (res.data.stations.length > 0) setSelectedStationId(res.data.stations[0]._id);
            } catch (e) {
               toast.error('Failed to find nearby stations');
            }
            setFetchingStations(false);
         }, () => {
            toast.error('Location access required');
            setFetchingStations(false);
         }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      } else {
         setFetchingStations(false);
      }
   };

   const handleRequestMechanic = async () => {
      if (!isAuthenticated) { toast.error('Sign in to request mechanic'); return; }
      if (!problemDesc) { toast.error('Please describe your problem'); return; }

      setRequestingMechanic(true);
      try {
         if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
               const lat = position.coords.latitude;
               const lng = position.coords.longitude;

               const res = await mechanicAPI.create({
                  stationId: selectedStationId || null,
                  problemDescription: problemDesc,
                  coordinates: [lng, lat]
               });

               setActiveRequest(res.data.request);
               toast.success('Mechanic requested successfully! Help is on the way.');
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
         toast.error(err?.response?.data?.message || 'Failed to request mechanic');
         setRequestingMechanic(false);
      }
   };

   return (
      <div className="min-h-screen font-sans bg-transparent text-white overflow-x-clip relative selection:bg-green-200">


         <div className="relative z-10">

            {/* Original Navbar */}
            <Navbar />

            {/* Hero Section */}
            <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pt-0 pb-16 lg:pb-0 min-h-[60vh] flex flex-col justify-start overflow-hidden">
               <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

                  {/* Left Content */}
                  <div className="max-w-2xl relative z-30 flex flex-col justify-start pt-4 lg:pt-6 xl:pt-10 h-full">
                     <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-6 w-fit">
                        <ShieldCheck size={18} className="text-[#8cc63f]" />
                        <span className="text-white text-sm font-semibold tracking-wide">
                           AI-Powered EV Protection & Smart Charging Ecosystem
                        </span>
                     </div>

                     <h1 className="text-5xl sm:text-6xl xl:text-[4.2rem] leading-[1.1] font-black text-white mb-6 drop-shadow-sm tracking-tight">
                        Protect. Predict. <br className="hidden sm:block" />
                        <span className="text-[#fff]">Power Your EV Journey</span>
                     </h1>

                     <p className="text-white/95 text-lg sm:text-xl leading-relaxed font-medium max-w-xl">
                        EV Guardian is an intelligent EV ecosystem that combines AI, IoT, and smart charging technology to protect battery health, predict issues before they happen, and deliver seamless charging experiences across India.
                     </p>
                  </div>

                  {/* Right Animation Area */}
                  <div className="relative w-full flex justify-end mt-12 lg:mt-0 h-[500px] sm:h-[550px] lg:h-[650px] lg:-mr-16 xl:-mr-32">
                     <div className="absolute bottom-0 right-0 w-[700px] h-[600px] origin-bottom-right scale-[0.55] sm:scale-[0.75] lg:scale-100 flex items-center justify-center">

                        {/* Floating Cards (like image) */}


                        {/* Customer Reviews */}
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 1, delay: 1.4 }}
                           className="absolute bottom-[25%] right-[0%] z-30 bg-transparent flex flex-col items-end"
                        >
                           <div className="flex -space-x-2 mb-2">
                              <img src="https://i.pravatar.cc/100?img=1" alt="user" className="w-8 h-8 rounded-full border-2 border-[#111c2e]" />
                              <img src="https://i.pravatar.cc/100?img=2" alt="user" className="w-8 h-8 rounded-full border-2 border-[#111c2e]" />
                              <img src="https://i.pravatar.cc/100?img=3" alt="user" className="w-8 h-8 rounded-full border-2 border-[#111c2e]" />
                              <div className="w-8 h-8 rounded-full bg-black border-2 border-[#111c2e] flex items-center justify-center text-white text-xs font-bold">+</div>
                           </div>
                           <h4 className="text-white font-black text-2xl leading-none">102K+</h4>
                           <p className="text-white/70 text-sm">Customer Review</p>
                        </motion.div>

                        {/* Charging Station Image */}
                        <motion.div
                           initial={{ opacity: 0, scale: 0.9, y: 20 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           transition={{ duration: 1, delay: 0.2 }}
                           className="absolute z-10 h-[400px] bottom-[40%] -right-[25%] -translate-x-1/2 flex items-center justify-center pointer-events-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
                        >
                           <img
                              src="/ev_guardian_station.png"
                              alt="EV Guardian Station"
                              className="h-full w-auto object-contain"
                              onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.parentElement!.innerHTML += '<div class="h-full w-[150px] bg-white/10 backdrop-blur-md rounded-[2rem] shadow-2xl flex flex-col items-center justify-center font-bold text-white/50 border border-white/20 text-center p-4">EV GUARDIAN STATION</div>';
                              }}
                           />
                        </motion.div>

                        {/* The EV Car */}
                        <motion.div
                           initial={{ x: '60vw', opacity: 0, scale: 0.9 }}
                           animate={{ x: -40, opacity: 1, scale: 1 }}
                           transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                           className="absolute bottom-[10%] right-[5%] z-20 w-[530px] pointer-events-none"
                        >
                           <img
                              src="/car.png"
                              alt="Premium EV Car"
                              className="w-full h-auto drop-shadow-[0_20px_25px_rgba(0,0,0,0.3)] scale-x-[-1]"
                              onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.parentElement!.innerHTML += '<div class="w-full h-[200px] bg-white/5 dark:bg-[#111c2e]/50 rounded-3xl shadow-2xl flex items-center justify-center font-bold text-gray-400">EV CAR</div>';
                              }}
                           />
                        </motion.div>

                     </div>
                  </div>
               </div>
            </div>

            {/* Stats Section - Placed over the hero gradient */}
            <div className="container mx-auto max-w-[1400px] px-6 sm:px-10 relative z-20 pb-20 lg:pb-32 -mt-4 lg:-mt-12">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
                  <div className="bg-white/10 backdrop-blur-md rounded-[30px] p-6 sm:p-8 text-center border border-white/20 shadow-2xl hover:-translate-y-1 transition-transform">
                     <div className="text-3xl sm:text-4xl font-black text-white mb-2">15<span className="text-[#1a1a1a]">K+</span></div>
                     <div className="text-white/90 font-medium text-sm sm:text-base">Charging Stations</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-[30px] p-6 sm:p-8 text-center border border-white/20 shadow-2xl hover:-translate-y-1 transition-transform">
                     <div className="text-3xl sm:text-4xl font-black text-white mb-2">120<span className="text-[#1a1a1a]">K+</span></div>
                     <div className="text-white/90 font-medium text-sm sm:text-base">Happy Users</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-[30px] p-6 sm:p-8 text-center border border-white/20 shadow-2xl hover:-translate-y-1 transition-transform">
                     <div className="text-3xl sm:text-4xl font-black text-white mb-2">5<span className="text-[#1a1a1a]">M+</span></div>
                     <div className="text-white/90 font-medium text-sm sm:text-base">kWh Delivered</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-[30px] p-6 sm:p-8 text-center border border-white/20 shadow-2xl hover:-translate-y-1 transition-transform">
                     <div className="text-3xl sm:text-4xl font-black text-white mb-2">100<span className="text-[#1a1a1a]">%</span></div>
                     <div className="text-white/90 font-medium text-sm sm:text-base">Green Energy</div>
                  </div>
               </div>
            </div>

            {/* Battery Health Section */}
            <div className="relative mt-8 sm:mt-16 bg-[#f7faf5] dark:bg-[#0b1320] rounded-[40px] sm:rounded-[70px] py-16 sm:py-24 px-6 sm:px-10 z-30 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
               <div onClick={(e) => e.currentTarget.parentElement?.scrollIntoView({ behavior: 'smooth' })} className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all shadow-xl border-[8px] sm:border-[10px] border-white group">
                  <ArrowDown size={28} className="group-hover:animate-bounce" />
               </div>
               <div className="container mx-auto max-w-[1400px]">
                  <div className="grid md:grid-cols-2 gap-10 items-center">
                     <div>
                        <div className="rounded-[30px] overflow-hidden border-2 border-gray-200 dark:border-gray-800 shadow-2xl">
                           <img src="/battery_health.png" alt="Battery Health Diagnostics" className="w-full h-[300px] sm:h-[400px] object-cover" />
                        </div>
                     </div>
                     <div className="flex flex-col h-full justify-center">
                        <div className="flex items-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-4">
                           <span className="w-2 h-2 rounded-full bg-[#8cc63f] animate-pulse" />
                           Diagnostic Tools
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                           EV Battery <span className="text-[#8cc63f]">Health Check</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
                           Ensure your vehicle's battery is performing at its best. Our advanced diagnostic integration provides real-time insights into your battery's capacity, health metrics, and projected lifespan. Catch potential issues before they leave you stranded.
                        </p>
                        <div className="flex justify-start mt-auto pt-4">
                           <a href="https://devbatteryguardian.vercel.app/" target="_blank" rel="noopener noreferrer" className="bg-[#8cc63f] text-black dark:text-white px-8 py-4 rounded-full font-bold hover:bg-[#679e24] transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(140,198,63,0.3)] hover:-translate-y-1">
                              Check Battery Health <span className="text-xl leading-none">›</span>
                           </a>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Services Section */}
            <div className="relative mt-8 sm:mt-16 bg-[#f7faf5] dark:bg-[#0b1320] rounded-[40px] sm:rounded-[70px] py-16 sm:py-24 px-6 sm:px-10 z-30 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
               <div onClick={(e) => e.currentTarget.parentElement?.scrollIntoView({ behavior: 'smooth' })} className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all shadow-xl border-[8px] sm:border-[10px] border-white group">
                  <ArrowDown size={28} className="group-hover:animate-bounce" />
               </div>
               <div className="container mx-auto max-w-[1400px]">
                  <div className="grid md:grid-cols-2 gap-10 items-center">
                     <div className="order-2 md:order-1 flex flex-col h-full justify-center">
                        <div className="flex items-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-4">
                           <span className="w-2 h-2 rounded-full bg-[#8cc63f] animate-pulse" />
                           Comprehensive Services
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                           Complete <span className="text-[#8cc63f]">EV Care</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
                           Whether you need a quick top-up or emergency assistance on the road, our unified platform has you covered. Book a charging slot in advance, request a specialized EV mechanic to your exact location, or explore our vast network of stations.
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-auto pt-4">
                           <Link href="/stations" className="bg-[#1a1a1a] flex-1 sm:flex-none justify-center text-white px-6 py-4 rounded-full font-bold hover:bg-black transition-all flex items-center gap-2 shadow-xl hover:-translate-y-1">
                              Book Now
                           </Link>
                           <button onClick={openMechanicModal} className="bg-[#8cc63f] flex-1 sm:flex-none justify-center text-black dark:text-white px-6 py-4 rounded-full font-bold hover:bg-[#679e24] transition-all flex items-center gap-2 shadow-xl hover:-translate-y-1">
                              <Wrench size={18} /> Book Mechanic
                           </button>
                           <Link href="/map" className="bg-white dark:bg-[#111c2e] border border-gray-200 dark:border-gray-800 flex-1 sm:flex-none justify-center text-gray-900 dark:text-white px-6 py-4 rounded-full font-bold hover:bg-gray-50 dark:bg-gray-900 transition-all flex items-center gap-2 shadow-xl hover:-translate-y-1">
                              <MapPin size={18} /> Explore Map
                           </Link>
                        </div>
                     </div>
                     <div className="order-1 md:order-2 flex justify-center items-center">
                        <motion.img
                           initial={{ opacity: 0, scale: 0.9, y: 20 }}
                           whileInView={{ opacity: 1, scale: 1, y: 0 }}
                           viewport={{ once: true }}
                           transition={{ duration: 0.8, ease: "easeOut" }}
                           src="/user_car_image.png"
                           alt="EV Services"
                           className="w-full max-w-lg object-contain drop-shadow-2xl"
                        />
                     </div>
                  </div>
               </div>
            </div>


            {/* Pricing Section Layer (White) */}
            <div className="relative mt-8 sm:mt-16 bg-white dark:bg-[#111c2e] rounded-[40px] sm:rounded-[70px] pt-20 sm:pt-28 px-6 sm:px-10 pb-24 z-30 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
               {/* Center Arrow Button */}
               <div onClick={(e) => e.currentTarget.parentElement?.scrollIntoView({ behavior: 'smooth' })} className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all shadow-xl border-[8px] sm:border-[10px] border-white group">
                  <ArrowDown size={28} className="group-hover:animate-bounce" />
               </div>


               {/* Features Section */}
               <div id="features" className="container mx-auto max-w-[1400px] mb-24 lg:mb-32">
                  <div className="text-center mb-12 sm:mb-16">
                     <div className="flex items-center justify-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-4">
                        <span className="w-2 h-2 rounded-full bg-[#8cc63f]" />
                        Why Choose Us
                     </div>
                     <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                        Premium <span className="text-[#8cc63f]">Features</span>
                     </h2>
                     <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">Everything you need for a seamless and intelligent EV charging experience.</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
                     {/* Feature 1 */}
                     <div className="bg-white dark:bg-[#111c2e] rounded-[30px] p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white group-hover:bg-[#8cc63f] group-hover:text-black dark:text-white transition-all mb-6">
                           <Zap size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ultra-Fast Charging</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Power up your vehicle in minutes, not hours, with our next-gen DC fast chargers.</p>
                     </div>
                     {/* Feature 2 */}
                     <div className="bg-white dark:bg-[#111c2e] rounded-[30px] p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white group-hover:bg-[#8cc63f] group-hover:text-black dark:text-white transition-all mb-6">
                           <MapPin size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Navigation</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Instantly locate available stations along your route with real-time availability tracking.</p>
                     </div>
                     {/* Feature 3 */}
                     <div className="bg-white dark:bg-[#111c2e] rounded-[30px] p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white group-hover:bg-[#8cc63f] group-hover:text-black dark:text-white transition-all mb-6">
                           <CreditCard size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Seamless Payments</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Pay automatically through the app with zero hidden fees and transparent live pricing.</p>
                     </div>
                     {/* Feature 4 */}
                     <div className="bg-white dark:bg-[#111c2e] rounded-[30px] p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white group-hover:bg-[#8cc63f] group-hover:text-black dark:text-white transition-all mb-6">
                           <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">24/7 Security</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Charge with peace of mind. All stations are continuously monitored for your safety.</p>
                     </div>
                  </div>
               </div>

               {/* Comparison Section */}
               <ComparisonSection />

               <div id="pricing" className="container mx-auto max-w-[1400px]">
                  <div className="text-center mb-12 sm:mb-16">
                     <div className="flex items-center justify-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-4">
                        <span className="w-2 h-2 rounded-full bg-[#8cc63f]" />
                        Flexible Plans
                     </div>
                     <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                        Transparent <span className="text-[#8cc63f]">Pricing</span>
                     </h2>
                     <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">Choose the perfect plan to keep your vehicle powered up without breaking the bank.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                     {/* Basic Plan */}
                     <div className="bg-gray-50 dark:bg-gray-900 rounded-[30px] p-8 sm:p-10 border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pay-As-You-Go</h3>
                        <div className="text-gray-500 dark:text-gray-400 mb-6">Perfect for occasional charging</div>
                        <div className="text-5xl font-black text-gray-900 dark:text-white mb-8">$0<span className="text-xl text-gray-500 dark:text-gray-400 font-medium">/mo</span></div>
                        <ul className="space-y-4 mb-10 text-gray-600 dark:text-gray-400 font-medium">
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> Standard rates apply</li>
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> Pay per kWh</li>
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> Real-time station availability</li>
                        </ul>
                        <button className="w-full py-4 rounded-full border-2 border-gray-900 text-gray-900 dark:text-white font-bold hover:bg-gray-900 hover:text-white transition-all">Choose Basic</button>
                     </div>

                     {/* Pro Plan */}
                     <div className="bg-gray-900 rounded-[30px] p-8 sm:p-10 shadow-2xl relative transform md:-translate-y-4 border border-gray-800">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#8cc63f] text-black dark:text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">MOST POPULAR</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Pro Member</h3>
                        <div className="text-gray-400 mb-6">For daily commuters</div>
                        <div className="text-5xl font-black text-white mb-8">$19<span className="text-xl text-gray-400 font-medium">/mo</span></div>
                        <ul className="space-y-4 mb-10 text-gray-300 font-medium">
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> 20% off all charging rates</li>
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> Reserve stations in advance</li>
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> Free overnight charging</li>
                        </ul>
                        <button className="w-full py-4 rounded-full bg-[#8cc63f] text-black dark:text-white font-bold hover:bg-[#679e24] transition-all shadow-[0_10px_20px_rgba(140,198,63,0.3)]">Get Pro</button>
                     </div>

                     {/* Premium Plan */}
                     <div className="bg-gray-50 dark:bg-gray-900 rounded-[30px] p-8 sm:p-10 border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fleet Premium</h3>
                        <div className="text-gray-500 dark:text-gray-400 mb-6">For heavy usage & business</div>
                        <div className="text-5xl font-black text-gray-900 dark:text-white mb-8">$49<span className="text-xl text-gray-500 dark:text-gray-400 font-medium">/mo</span></div>
                        <ul className="space-y-4 mb-10 text-gray-600 dark:text-gray-400 font-medium">
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> 50% off all charging rates</li>
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> Priority fast-charging lane</li>
                           <li className="flex items-center gap-3"><Zap size={18} className="text-[#8cc63f]" /> 24/7 dedicated mechanic support</li>
                        </ul>
                        <button className="w-full py-4 rounded-full border-2 border-gray-900 text-gray-900 dark:text-white font-bold hover:bg-gray-900 hover:text-white transition-all">Choose Premium</button>
                     </div>
                  </div>
               </div>
            </div>

            <MarketOpportunity />
            <Testimonials />

         </div>

         {/* Mechanic Modal */}
         {showMechanicModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0b1320] rounded-[24px] border border-[#1a2b42] w-full max-w-md p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 rounded-full bg-[#8cc63f]/20 flex items-center justify-center text-[#8cc63f]">
                        <Wrench size={20} />
                     </div>
                     <h2 className="text-white font-black text-2xl">Book Mechanic</h2>
                  </div>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed font-medium">Describe your issue. We'll use your live GPS location so the nearest mechanic can reach you with the right tools.</p>

                  <div className="space-y-4">
                     <div>
                        <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 block">Select Nearest Station</label>
                        {fetchingStations ? (
                           <div className="w-full bg-[#111c2e] border border-[#1a2b42] text-gray-400 rounded-xl p-4 text-sm flex items-center justify-center h-[70px]">
                              Locating nearby stations...
                           </div>
                        ) : nearbyStations.length > 0 ? (
                           <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                              {nearbyStations.map(station => (
                                 <div
                                    key={station._id}
                                    onClick={() => setSelectedStationId(station._id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedStationId === station._id ? 'bg-[#8cc63f]/10 border-[#8cc63f] text-[#8cc63f]' : 'bg-[#111c2e] border-[#1a2b42] text-gray-300 hover:border-[#8cc63f]/50'}`}
                                 >
                                    <p className="font-bold text-sm truncate">{station.name}</p>
                                    <p className="text-xs opacity-70 truncate">{station.address?.street}, {station.address?.city}</p>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="w-full bg-[#111c2e] border border-rose-500/30 text-rose-400 rounded-xl p-4 text-xs">
                              No stations found nearby. Request will be sent globally to all available mechanics.
                           </div>
                        )}
                     </div>

                     <div>
                        <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 mt-4 block">Problem Description *</label>
                        <textarea
                           value={problemDesc}
                           onChange={e => setProblemDesc(e.target.value)}
                           placeholder="E.g., Flat tire, battery drained completely..."
                           className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-4 text-sm h-28 resize-none focus:outline-none focus:border-[#8cc63f] transition-colors"
                           required
                        />
                     </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                     <button onClick={() => setShowMechanicModal(false)} className="bg-transparent border-2 border-[#1a2b42] text-white flex-1 justify-center py-3 rounded-full font-bold hover:bg-[#1a2b42] transition-colors">Cancel</button>
                     <button onClick={handleRequestMechanic} disabled={requestingMechanic || !problemDesc} className="bg-[#8cc63f] text-black dark:text-white flex-1 justify-center py-3 rounded-full font-bold shadow-[0_10px_20px_rgba(140,198,63,0.3)] hover:bg-[#679e24] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {requestingMechanic ? 'Sending...' : 'Send Request'}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}

         {/* Mechanic Tracking Overlay */}
         {activeRequest && activeRequest.status !== 'completed' && activeRequest.status !== 'cancelled' && (
            <div className="fixed bottom-6 right-6 z-50 w-80 bg-[#0b1320] border border-[#1a2b42] rounded-2xl shadow-2xl p-5">
               <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Wrench size={16} className="text-[#8cc63f]" /> Mechanic Request</h3>
               {activeRequest.status === 'pending' ? (
                  <div className="flex flex-col gap-3">
                     <p className="text-sm text-gray-400">Waiting for a mechanic to accept your request...</p>
                     <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#8cc63f] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-[#8cc63f] font-bold">Broadcasting...</span>
                     </div>
                  </div>
               ) : (
                  <div>
                     <p className="text-sm text-[#8cc63f] font-bold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8cc63f] animate-pulse"></span> Mechanic is on the way!
                     </p>
                     <div className="h-32 bg-[#111c2e] rounded-xl border border-[#1a2b42] relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #8cc63f 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                        {/* Simulate map */}
                        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_blue] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" title="You">
                           <span className="absolute -bottom-5 text-[9px] text-blue-400 font-bold">YOU</span>
                        </div>
                        {mechanicLocation && (
                           <motion.div
                              animate={{
                                 x: (mechanicLocation.lng - activeRequest.location.coordinates[0]) * 10000,
                                 y: -(mechanicLocation.lat - activeRequest.location.coordinates[1]) * 10000
                              }}
                              className="absolute top-1/2 left-1/2 w-6 h-6 text-rose-500 -ml-3 -mt-3 z-10 flex flex-col items-center"
                           >
                              <MapPin fill="currentColor" size={24} />
                              <span className="absolute -bottom-4 text-[9px] text-rose-400 font-bold">MECHANIC</span>
                           </motion.div>
                        )}
                     </div>
                     <button onClick={() => setActiveRequest(null)} className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-2 text-xs rounded-lg font-bold transition-colors">Close Tracker</button>
                  </div>
               )}
            </div>
         )}
         <Footer />

      </div>

   );
}
