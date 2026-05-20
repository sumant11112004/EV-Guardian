'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, ShieldCheck, AlertTriangle, HelpCircle, FileText, Landmark, Zap } from 'lucide-react';

export default function TermsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-terms-modal', handleOpen);
    return () => {
      window.removeEventListener('open-terms-modal', handleOpen);
    };
  }, []);

  const handleClose = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          {/* Backdrop click closer */}
          <div className="absolute inset-0" onClick={handleClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-[#0b1320] border border-[#1a2b42] rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] text-white"
          >
            {/* Header */}
            <div className="flex justify-between items-start p-8 border-b border-[#1a2b42] shrink-0">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <ShieldCheck className="text-[#8cc63f]" size={28} /> Terms & Conditions
                </h3>
                <p className="text-gray-400 text-xs mt-1 font-bold">
                  Last Updated: May 20, 2026 • Platform Rules & Guidelines
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors hover:scale-105 active:scale-95 duration-100"
              >
                <XCircle size={28} />
              </button>
            </div>

            {/* Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              
              {/* Highlighted Rules (Refund / Cancellation) - Top Section */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 space-y-3">
                <h4 className="text-rose-400 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={18} /> Booking Cancellation & Refund Policy (Critical)
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Please review our standard reservation terms carefully before booking any charging session:
                </p>
                <ul className="list-disc pl-5 text-gray-300 text-xs space-y-2 font-medium">
                  <li>
                    <strong className="text-rose-400">15-Minute No-Show Cancellation:</strong> If you do not check in at the station or start your charging session within <span className="text-white font-bold">15 minutes</span> of your scheduled start time, the system will automatically cancel your booking.
                  </li>
                  <li>
                    <strong className="text-rose-400">Online Payments Refund:</strong> In the event of a late cancellation (no-show), a <span className="text-white font-bold">10% cancellation fee</span> will be withheld. The remaining 90% of your pre-authorized payment will be auto-refunded to your source account.
                  </li>
                  <li>
                    <strong className="text-rose-400">Manual User Cancellation:</strong> If you manually cancel a booking from your dashboard before the start time, a <span className="text-white font-bold">5% processing fee</span> is retained, and 95% is refunded.
                  </li>
                  <li>
                    <strong className="text-rose-400">Cash Payment Cancellations:</strong> For users opting for Cash payment, no initial payments are charged. If you miss your window, the booking status transitions to cancelled and is voided immediately.
                  </li>
                </ul>
              </div>

              {/* Rules and Regulations */}
              <div className="space-y-4">
                <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <FileText className="text-[#8cc63f]" size={16} /> 1. User Registration & Eligibility
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed font-medium">
                  By registering an account with EV Guardian, you represent that you are at least 18 years of age and hold a valid driving permit in your state of residence. You agree to provide accurate, current, and complete details, including a valid mobile number and vehicle registration plate matching the charging vehicle.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Landmark className="text-[#8cc63f]" size={16} /> 2. Cash and Online Payments
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed font-medium">
                  EV Guardian supports both online payment integration (via Razorpay) and cash payments at the charging station. Cash reservation bookings remain in a <span className="text-[#fbbf24] font-bold">Payment Pending</span> state until verified and marked as paid by a station manager or administrator. You agree to complete cash payments immediately upon arrival.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Zap className="text-[#8cc63f]" size={16} /> 3. Charging Station Conduct & Safety
                </h4>
                <ul className="list-disc pl-5 text-gray-300 text-xs space-y-2 font-medium">
                  <li>Ensure your vehicle's connector type is fully compatible with the reserved charger index prior to plugging in.</li>
                  <li>Do not tamper with, force, or modify other users' vehicle plugs or charging connectors.</li>
                  <li>Always return the charger gun/connector to its designated cradle after completing your charging session.</li>
                  <li>Follow all safety warnings and guidance provided by the respective Station Manager.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="text-[#8cc63f]" size={16} /> 4. Carbon Offsets & Loyalty Points
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed font-medium">
                  Carbon offset metrics are estimated values calculated based on national averages of carbon savings compared to internal combustion engines. Loyalty points are awarded at a rate of <strong>0.02 points per kg of CO₂ saved</strong>. Loyalty points have no direct cash value and are solely redeemable for coupon discounts within the platform.
                </p>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-8 border-t border-[#1a2b42] shrink-0 bg-[#080d16] flex justify-end gap-3 rounded-b-[32px]">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-[#8cc63f] hover:bg-[#679e24] text-black font-black text-xs rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#8cc63f]/10"
              >
                I Understand & Agree
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
