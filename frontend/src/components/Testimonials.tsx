'use client';
import { useState, useEffect } from 'react';
import { Star, ArrowDown } from 'lucide-react';
import { stationAPI } from '@/lib/api';
import { motion } from 'framer-motion';

export default function Testimonials() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stationAPI.getGlobalReviews()
      .then(res => {
        setReviews(res.data.reviews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  if (loading) return null;
  return (
    <div className="bg-[#f7faf5] dark:bg-[#0b1320] pt-16 pb-24 relative z-20 rounded-t-[40px] rounded-b-[60px] sm:rounded-t-[70px] sm:rounded-b-[80px] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] px-6 sm:px-10 mt-16 mb-8">
      <div onClick={(e) => e.currentTarget.parentElement?.scrollIntoView({ behavior: 'smooth' })} className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all shadow-xl border-[8px] sm:border-[10px] border-white group">
        <ArrowDown size={28} className="group-hover:animate-bounce" />
      </div>
      <div className="container mx-auto max-w-[1400px]">
        <div className="text-center mb-16">
           <div className="flex items-center justify-center gap-3 text-[#679e24] font-bold text-sm tracking-wider uppercase mb-4">
              <span className="w-2 h-2 rounded-full bg-[#8cc63f]" />
              Rider Experiences
           </div>
           <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Loved by <span className="text-[#8cc63f]">EV Drivers</span>
           </h2>
        </div>


        {reviews.length === 0 ? (
          <div className="text-center py-16">
             <div className="w-16 h-16 bg-white dark:bg-[#111c2e] border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-400">
                <Star size={28} />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Reviews Yet</h3>
             <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-lg">Be the first to share your charging experience and help other EV drivers find the best stations!</p>
          </div>
        ) : reviews.length > 3 ? (
          <div className="overflow-hidden flex relative w-full group py-4">
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                animation: marquee 50s linear infinite;
                display: flex;
                width: max-content;
              }
              .group:hover .animate-marquee {
                animation-play-state: paused;
              }
            `}</style>
            <div className="animate-marquee gap-6">
              {[...reviews, ...reviews].map((review, i) => (
                <div
                  key={`${review._id}-${i}`}
                  className="w-[350px] sm:w-[400px] shrink-0 bg-[#0b1320] rounded-[24px] p-8 border border-[#1a2b42] flex flex-col h-full hover:border-[#8cc63f]/50 transition-colors shadow-2xl"
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, idx) => (
                      <Star 
                        key={idx} 
                        size={20} 
                        className={idx < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700 fill-gray-700"} 
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-300 text-lg font-medium leading-relaxed mb-8 flex-1">
                    "{review.comment || 'Great charging experience! Very fast and easy to use.'}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center gap-4 mt-auto">
                    {review.user?.avatar ? (
                      <img src={review.user.avatar} alt={review.user.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#1a2b42]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#00dfa2] text-black dark:text-white flex items-center justify-center font-black text-lg border-2 border-transparent shrink-0">
                        {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-base">{review.user?.name || 'EV Rider'}</span>
                      <span className="text-[#6b82a6] text-sm font-medium truncate max-w-[200px]">
                        {review.station?.name || 'EV Guardian Station'} {review.station?.address?.city ? `· ${review.station.address.city}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {reviews.map((review, i) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0b1320] rounded-[24px] p-8 border border-[#1a2b42] flex flex-col h-full hover:border-[#8cc63f]/50 transition-colors shadow-2xl"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      size={20} 
                      className={idx < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700 fill-gray-700"} 
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-gray-300 text-lg font-medium leading-relaxed mb-8 flex-1">
                  "{review.comment || 'Great charging experience! Very fast and easy to use.'}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4 mt-auto">
                  {review.user?.avatar ? (
                    <img src={review.user.avatar} alt={review.user.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#1a2b42]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#00dfa2] text-black dark:text-white flex items-center justify-center font-black text-lg border-2 border-transparent shrink-0">
                      {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">{review.user?.name || 'EV Rider'}</span>
                    <span className="text-[#6b82a6] text-sm font-medium truncate max-w-[200px]">
                      {review.station?.name || 'EV Guardian Station'} {review.station?.address?.city ? `· ${review.station.address.city}` : ''}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Call to Action Section */}
        <div className="mt-24 sm:mt-32 bg-gray-900 rounded-[40px] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[#8cc63f] opacity-10 blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
              Ready to <span className="text-[#8cc63f]">Power Up?</span>
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl mb-10 font-medium leading-relaxed">
              Join thousands of EV drivers who have already switched to a smarter, faster, and more reliable charging network.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/auth/register" className="w-full sm:w-auto bg-[#8cc63f] text-black dark:text-white px-10 py-4 rounded-full font-black text-lg hover:bg-white dark:bg-[#111c2e] transition-all duration-300 shadow-[0_10px_30px_rgba(140,198,63,0.3)] hover:shadow-[0_10px_30px_rgba(255,255,255,0.4)] hover:-translate-y-1">
                Get Started Free
              </a>
              <a href="/stations" className="w-full sm:w-auto bg-transparent text-white border-2 border-white/20 px-10 py-4 rounded-full font-black text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                Explore Stations
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
