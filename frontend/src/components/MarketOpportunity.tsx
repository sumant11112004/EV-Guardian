import React from 'react';
import { ArrowDown } from 'lucide-react';

const MarketOpportunity = () => {
   return (
      <div className="bg-[#f7faf5] dark:bg-[#0b1320] pt-16 pb-24 relative z-20 rounded-[40px] sm:rounded-[70px] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] px-6 sm:px-10 mt-16 sm:mt-24 mb-24 lg:mb-32">
         <div onClick={(e) => e.currentTarget.parentElement?.scrollIntoView({ behavior: 'smooth' })} className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all shadow-xl border-[8px] sm:border-[10px] border-white group">
            <ArrowDown size={28} className="group-hover:animate-bounce" />
         </div>
         <div className="container mx-auto max-w-[1400px]">
         {/* Header Area */}
         <div className="mb-12 sm:mb-20 text-center lg:text-left">
            <div className="inline-block border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-full px-4 py-1.5 mb-8">
               <span className="text-[#679e24] font-bold text-xs tracking-[0.15em] uppercase">Market Opportunity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] tracking-tight">
               <div className="text-gray-900 dark:text-white mb-1">A massive market</div>
               <div className="text-[#8cc63f]">massively underserved</div>
            </h2>
         </div>

         {/* Content Grid */}
         <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* Left Card */}
            <div className="lg:col-span-7">
               <div className="bg-white dark:bg-[#111c2e] rounded-[32px] p-12 sm:p-20 text-center border border-gray-200 dark:border-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.06)] relative overflow-hidden group hover:shadow-[0_30px_80px_rgba(140,198,63,0.15)] transition-all duration-700">
                  {/* Glow effect inside */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#8cc63f]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#8cc63f]/10 transition-all duration-700" />
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                     <h3 className="text-5xl sm:text-6xl md:text-[6rem] font-black text-gray-900 dark:text-white mb-4 tracking-tighter leading-none" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        $28.1B
                     </h3>
                     <p className="text-gray-800 dark:text-gray-200 text-base sm:text-lg font-black mb-2 tracking-wide">
                        Global BMS Market by 2030
                     </p>
                     <p className="text-gray-500 dark:text-gray-400 text-sm font-bold tracking-wide">
                        Grand View Research, 2024
                     </p>
                  </div>
               </div>
            </div>

            {/* Right Stats */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-8">
               {/* Stat 1 */}
               <div className="flex flex-col relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#8cc63f] rounded-full" />
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">19.8%</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-bold leading-relaxed">CAGR — BMS market 2024–2030</div>
               </div>

               {/* Stat 2 */}
               <div className="flex flex-col relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#8cc63f] rounded-full" />
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">$4.2B</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-bold leading-relaxed">Addressable market for sub-$100 BMS hardware</div>
               </div>

               {/* Stat 3 */}
               <div className="flex flex-col relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#8cc63f] rounded-full" />
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">14M+</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-bold leading-relaxed">Electric two-wheelers sold annually</div>
               </div>

               {/* Stat 4 */}
               <div className="flex flex-col relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#8cc63f] rounded-full" />
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">$15</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-bold leading-relaxed">Our hardware cost vs $500–$50K alternatives</div>
               </div>
            </div>

         </div>
         </div>
      </div>
   );
};

export default MarketOpportunity;
