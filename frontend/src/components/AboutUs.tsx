'use client';
import { Zap, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import ComparisonSection from '@/components/ComparisonSection';

export default function AboutUs() {
   return (
      <div className="relative mt-8 sm:mt-12 bg-[#f7faf5] rounded-t-[40px] rounded-b-[60px] sm:rounded-t-[70px] sm:rounded-b-[80px] pt-20 sm:pt-28 px-6 sm:px-10 pb-20 z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">

         {/* About Us Section (At Top) */}
         <div id="about" className="container mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
            <div className="pl-0 sm:pl-4 lg:pl-16">
               <div className="flex items-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-4 sm:mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#8cc63f]" />
                  About Us
               </div>
               <h2 className="text-4xl sm:text-[3.5rem] font-black text-gray-900 leading-[1.1] mb-6 sm:mb-8">
                  Driving Innovation <br className="hidden sm:block" /><span className="text-[#8cc63f]">In Every Charge</span>
               </h2>
               <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-md font-medium">
                  We are dedicated to building a sustainable future by providing accessible, fast, and intelligent EV charging networks across the nation. Join the revolution.
               </p>
               <button className="w-full sm:w-auto border-2 border-gray-900 text-gray-900 px-10 py-4 rounded-full font-bold hover:bg-gray-900 hover:text-white transition-all text-lg shadow-sm hover:shadow-xl">
                  Learn More
               </button>
            </div>
            <div className="relative rounded-[30px] sm:rounded-[40px] overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px] shadow-2xl hidden lg:block">
               <img
                  src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Charging Station Infrastructure"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
         </div>

         {/* Features Section (At Bottom) */}
         <div id="features" className="container mx-auto max-w-[1400px]">
            <div className="text-center mb-12 sm:mb-16">
               <div className="flex items-center justify-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#8cc63f]" />
                  Why Choose Us
               </div>
               <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
                  Premium <span className="text-[#8cc63f]">Features</span>
               </h2>
               <p className="text-gray-500 text-lg max-w-2xl mx-auto">Everything you need for a seamless and intelligent EV charging experience.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
               {/* Feature 1 */}
               <div className="bg-white rounded-[30px] p-8 border border-gray-100 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 group-hover:bg-[#8cc63f] group-hover:text-black transition-all mb-6">
                     <Zap size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Ultra-Fast Charging</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">Power up your vehicle in minutes, not hours, with our next-gen DC fast chargers.</p>
               </div>
               {/* Feature 2 */}
               <div className="bg-white rounded-[30px] p-8 border border-gray-100 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 group-hover:bg-[#8cc63f] group-hover:text-black transition-all mb-6">
                     <MapPin size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Navigation</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">Instantly locate available stations along your route with real-time availability tracking.</p>
               </div>
               {/* Feature 3 */}
               <div className="bg-white rounded-[30px] p-8 border border-gray-100 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 group-hover:bg-[#8cc63f] group-hover:text-black transition-all mb-6">
                     <CreditCard size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Seamless Payments</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">Pay automatically through the app with zero hidden fees and transparent live pricing.</p>
               </div>
               {/* Feature 4 */}
               <div className="bg-white rounded-[30px] p-8 border border-gray-100 hover:shadow-2xl hover:border-[#8cc63f]/30 transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 group-hover:bg-[#8cc63f] group-hover:text-black transition-all mb-6">
                     <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Security</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">Charge with peace of mind. All stations are continuously monitored for your safety.</p>
               </div>
            </div>
         </div>

         {/* Comparison Section */}
         <ComparisonSection />
      </div>
   );
}
