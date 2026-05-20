'use client';
import Link from 'next/link';
import { Zap, Mail, Phone, MapPin } from 'lucide-react';

// Custom social SVG icons
const SocialIcons = {
  X: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Linkedin: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  Github: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
    </svg>
  ),
  Instagram: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
};

export default function Footer() {
  return (
    <footer className="mt-20 md:mt-28 border-t border-white/10 bg-transparent text-white transition-colors duration-300 relative z-10">
      <div className="container-xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all shadow-md">
                <Zap size={20} className="text-[#8cc63f]" fill="currentColor" />
              </div>
              <span className="font-black text-2xl tracking-tight">
                <span className="text-white drop-shadow-sm">EV </span>
                <span className="text-black dark:text-[#8cc63f] drop-shadow-sm transition-colors">Guardian</span>
              </span>
            </Link>
            <p className="text-white text-sm leading-relaxed mb-6 font-medium">
              India's smartest EV charging platform. Find, book, and charge — all in one place.
            </p>
            <div className="flex gap-3">
              {([
                { Icon: SocialIcons.X, href: '#' },
                { Icon: SocialIcons.Linkedin, href: '#' },
                { Icon: SocialIcons.Github, href: '#' },
                { Icon: SocialIcons.Instagram, href: '#' }
              ] as const).map((social, i) => (
                <a key={i} href={social.href} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all hover:-translate-y-0.5 shadow-sm">
                  <social.Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-wider mb-5">Platform</h4>
            <ul className="space-y-4">
              {[
                { label: 'Find Stations', href: '/stations' },
                { label: 'Book a Slot', href: '/stations' },
                { label: 'User Dashboard', href: '/dashboard' },
                { label: 'Booking History', href: '/bookings' },
                { 
                  label: 'Terms & Conditions', 
                  href: '#', 
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-terms-modal'));
                  }
                },
              ].map(item => (
                <li key={item.label}>
                  {item.onClick ? (
                    <a 
                      href={item.href} 
                      onClick={item.onClick} 
                      className="text-white hover:text-white/80 text-sm font-medium transition-colors cursor-pointer"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className="text-white hover:text-white/80 text-sm font-medium transition-colors">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-wider mb-5">Company</h4>
            <ul className="space-y-4">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Pricing Plans', href: '#' },
                { label: 'Partner With Us', href: '#' },
                { label: 'Blog', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Press Kit', href: '#' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white hover:text-white/80 text-sm font-medium transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-wider mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white hover:text-white/80 text-sm font-medium transition-colors">
                <Mail size={16} className="text-white shrink-0" />
                <span>support@evguardian.in</span>
              </li>
              <li className="flex items-center gap-3 text-white hover:text-white/80 text-sm font-medium transition-colors">
                <Phone size={16} className="text-white shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3 text-white hover:text-white/80 text-sm font-medium transition-colors">
                <MapPin size={16} className="text-white shrink-0 mt-0.5" />
                <span>Bengaluru, Karnataka, India 560001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white font-medium text-sm">
            © 2026 EV Guardian. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <a key={item} href="#" className="text-white hover:text-white/80 text-sm font-medium transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
