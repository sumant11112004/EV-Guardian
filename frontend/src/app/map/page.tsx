'use client';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';

// Dynamically import MapComponent with SSR disabled to prevent Leaflet window errors
const Map = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent text-white">
      <div className="w-16 h-16 border-4 border-[#8cc63f] border-t-transparent rounded-full animate-spin mb-6 shadow-lg" />
      <div className="flex items-center gap-2 text-gray-600 font-black tracking-widest uppercase text-sm">
         <MapPin className="animate-bounce text-[#8cc63f]" size={20} />
         Loading Stations...
      </div>
    </div>
  )
});

export default function MapPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-transparent text-white">
      <Navbar />
      
      <div className="flex-1 relative pt-[72px]">
        {/* Floating Back Button */}
        <div className="absolute top-24 left-6 sm:left-10 z-[1000]">
           <Link href="/" className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 text-gray-700 hover:text-black hover:bg-white transition-all hover:-translate-y-1 group font-bold text-sm">
             <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
             Back to Home
           </Link>
        </div>

        {/* Floating Header */}
        <div className="absolute top-24 right-6 sm:right-10 z-[1000] hidden sm:flex">
           <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 font-black text-gray-900 text-sm">
             <span className="w-2.5 h-2.5 rounded-full bg-[#8cc63f] animate-pulse" />
             Live Station Map
           </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-full rounded-t-[40px] overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.1)] relative z-10 border-t-[6px] border-[#8cc63f]">
          <Map />
        </div>
      </div>
    </div>
  );
}
