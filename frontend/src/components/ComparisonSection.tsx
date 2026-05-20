'use client';

import { motion } from 'framer-motion';

interface ComparisonPair {
   id: number;
   leftNum: string;
   leftTitle: string;
   leftDesc: string;
   rightNum: string;
   rightTitle: string;
   rightDesc: string;
}

export default function ComparisonSection() {
   const comparisonPairs: ComparisonPair[] = [
      {
         id: 1,
         leftNum: "01",
         leftTitle: "Battery-Aware Ecosystem:",
         leftDesc: "Combines real-time battery health diagnostics, smart charging speeds, slot booking, and roadside mechanic support in one unified platform.",
         rightNum: "02",
         rightTitle: "Single-Focus Apps:",
         rightDesc: "Fragmented tools that only offer charging or only battery monitoring, with zero integration and separate user experiences."
      },
      {
         id: 2,
         leftNum: "03",
         leftTitle: "AI-Powered Intelligence:",
         leftDesc: "Real-time predictive machine learning models to analyze State of Charge (SoC), State of Health (SoH), battery degradation, and safety risks.",
         rightNum: "04",
         rightTitle: "Basic Telemetry:",
         rightDesc: "Standard static dashboard indicators showing basic percentages with no predictive capabilities or proactive hazard alerts."
      },
      {
         id: 3,
         leftNum: "05",
         leftTitle: "Real-Time Slot Booking:",
         leftDesc: "Live charger availability tracking, predictive queue time estimators, and instant slot reservations to ensure seamless charging.",
         rightNum: "06",
         rightTitle: "No Reservation System:",
         rightDesc: "First-come, first-served queues that result in unexpected waiting times at busy chargers, with zero calendar visibility."
      }
   ];

   return (
      <div id="comparison" className="w-full relative py-20 sm:py-28 bg-[#faf9f6] dark:bg-[#0b1320] border-t border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">

         <div className="container mx-auto max-w-[1400px] px-6 sm:px-10 relative z-10">

            {/* Header / Titles (Identical layout to Image 2) */}
            <div className="text-center mb-16 lg:mb-20">
               <motion.h4
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-gray-900 dark:text-gray-200 font-extrabold text-2xl sm:text-3xl tracking-tight mb-2"
               >
                  What Makes Us Different:
               </motion.h4>
               <motion.h2
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-[3.2rem] leading-none font-black text-[#8cc63f] dark:text-[#8cc63f] mb-6"
               >
                  6 Key Pillars of EV Guardian
               </motion.h2>
               <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-3xl mx-auto font-medium leading-relaxed px-4"
               >
                  We don't just show data &mdash; We understand, predict, and act. Discover how EV Guardian provides a fully intelligent, protective charging network designed for the mobility of tomorrow.
               </motion.p>
            </div>

            {/* Main Visual Layout Grid */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-center max-w-7xl mx-auto">

               {/* Center Image Column (Slightly larger, identical position to Image 2) */}
               <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4/12 hidden lg:flex items-center justify-center pointer-events-none z-10">
                  <motion.div
                     animate={{ y: [0, -10, 0] }}
                     transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                     className="relative flex items-center justify-center w-full"
                  >
                     {/* Subtle soft backdrop glow matching light/dark mode */}
                     <div className="absolute w-[260px] h-[400px] bg-[#8cc63f]/10 dark:bg-[#8cc63f]/15 rounded-full blur-[80px] -z-10" />

                     <img
                        src="/ev_guardian.png"
                        alt="EV Guardian Smart Charger"
                        className="h-[800px] lg:h-[850px] xl:h-[900px] w-auto object-contain select-none drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_30px_50px_rgba(140,198,63,0.1)]"
                        onError={(e) => {
                           e.currentTarget.style.display = 'none';
                        }}
                     />
                  </motion.div>
               </div>

               {/* Left Column (01, 03, 05) - EV Guardian (Right-aligned) */}
               <div className="col-span-1 lg:col-span-5 space-y-12 sm:space-y-16 lg:space-y-24 z-20">
                  <div className="text-center lg:text-right lg:hidden">
                     <span className="text-xs font-black bg-[#8cc63f]/10 text-[#679e24] px-4 py-1.5 rounded-full tracking-wider uppercase">
                        EV Guardian Advantage
                     </span>
                  </div>

                  {comparisonPairs.map((pair, idx) => (
                     <motion.div
                        key={`left-${pair.id}`}
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: idx * 0.1 }}
                        className="flex flex-col items-end text-right pr-0 lg:pr-8 group"
                     >
                        {/* Number */}
                        <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-none mb-2 tracking-tight">
                           {pair.leftNum}
                        </span>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white mb-2 group-hover:text-[#679e24] transition-colors duration-300">
                           {pair.leftTitle}
                        </h3>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium max-w-md ml-auto">
                           {pair.leftDesc}
                        </p>

                        {/* Underline separator */}
                        <div className="border-b border-gray-200 dark:border-gray-800/80 pt-6 w-full opacity-80" />
                     </motion.div>
                  ))}
               </div>

               {/* Central Spacer column for desktop to respect the charger image area */}
               <div className="col-span-1 lg:col-span-2 h-16 lg:h-full hidden lg:block" />

               {/* Right Column (02, 04, 06) - Others (Left-aligned) */}
               <div className="col-span-1 lg:col-span-5 space-y-12 sm:space-y-16 lg:space-y-24 z-20">
                  <div className="text-center lg:text-left lg:hidden mt-8">
                     <span className="text-xs font-black bg-gray-100 text-gray-400 dark:bg-gray-900 px-4 py-1.5 rounded-full tracking-wider uppercase">
                        Standard Traditional Apps
                     </span>
                  </div>

                  {comparisonPairs.map((pair, idx) => (
                     <motion.div
                        key={`right-${pair.id}`}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: idx * 0.1 }}
                        className="flex flex-col items-start text-left pl-0 lg:pl-8 group"
                     >
                        {/* Number */}
                        <span className="text-3xl sm:text-4xl font-extrabold text-gray-400 dark:text-gray-600 leading-none mb-2 tracking-tight">
                           {pair.rightNum}
                        </span>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white mb-2 group-hover:text-gray-500 transition-colors duration-300">
                           {pair.rightTitle}
                        </h3>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium max-w-md mr-auto">
                           {pair.rightDesc}
                        </p>

                        {/* Underline separator */}
                        <div className="border-b border-gray-200 dark:border-gray-800/80 pt-6 w-full opacity-80" />
                     </motion.div>
                  ))}
               </div>

            </div>

            {/* Bottom Capsule Banner */}
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="mt-20 lg:mt-28 max-w-4xl mx-auto"
            >
               <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-[#111c2e] dark:via-[#16253b] dark:to-[#111c2e] text-white px-8 py-6 rounded-[30px] border border-white/5 shadow-2xl flex flex-col sm:flex-row items-center justify-center gap-4 text-center overflow-hidden group">
                  <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />

                  <div className="w-10 h-10 rounded-full bg-[#8cc63f]/25 flex items-center justify-center text-[#8cc63f] flex-shrink-0 animate-bounce">
                     <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192L12 .587z" />
                     </svg>
                  </div>

                  <p className="text-lg sm:text-xl font-bold tracking-wide">
                     We don't just show data &mdash; We <span className="text-[#8cc63f] underline decoration-2 underline-offset-4 font-black">understand</span>, <span className="text-[#8cc63f] font-black">predict</span> &amp; <span className="text-[#8cc63f] font-black">act!</span>
                  </p>
               </div>
            </motion.div>
         </div>
      </div>
   );
}
