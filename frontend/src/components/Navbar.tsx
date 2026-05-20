'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, Bell, User, LogOut, Settings, ChevronDown, MapPin, Wrench, Moon, Sun } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { notifAPI } from '@/lib/api';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { user, isAuthenticated, logout, notifications, unreadCount, setNotifications } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      notifAPI.getAll().then(r => setNotifications(r.data.notifications, r.data.unread)).catch(() => { });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setUserDropdown(false);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: 'https://devbatteryguardian.vercel.app/', label: 'Battery Health Check', external: true },
    { href: '/stations', label: 'Slot Booking' },
    { href: '/about', label: 'About' },
  ];

  const getNavLinks = () => {
    const links = [...navLinks];
    if (isAuthenticated && user) {
      if (user.role === 'mechanic') {
        links.push({ href: '/mechanic/dashboard', label: 'Mechanic Panel' });
      } else if (['admin', 'superadmin'].includes(user.role)) {
        links.push({ href: '/admin', label: 'Admin Panel' });
      } else if (user.role === 'manager') {
        links.push({ href: '/admin', label: 'Manager Panel' });
      }
    }
    return links;
  };

  const getDisplayName = () => {
    if (!user) return '';
    const name = user.name || '';
    if (name.includes('@')) {
      const parts = name.split('@');
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    if (user.role === 'admin' && (name.toLowerCase().includes('admin') || name.length > 15)) return 'Admin';
    if (user.role === 'manager' && (name.toLowerCase().includes('manager') || name.length > 15)) return 'Manager';
    if (user.role === 'mechanic' && (name.toLowerCase().includes('mechanic') || name.length > 15)) return 'Mechanic';
    return name.split(' ')[0];
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
      ? 'bg-[#679e24]/95 dark:bg-[#060b13]/95 backdrop-blur-md shadow-lg py-2 pointer-events-auto'
      : 'bg-transparent py-4 pointer-events-none'
      }`}>
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pointer-events-auto">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all shadow-md">
              <Zap size={18} className="text-[#8cc63f]" fill="currentColor" />
            </div>
            <span className="font-black text-xl tracking-tight">
              <span className="text-white drop-shadow-sm">EV </span>
              <span className="text-black dark:text-[#8cc63f] drop-shadow-sm">Guardian</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 bg-black/10 rounded-full px-1.5 py-1.5 backdrop-blur-sm border border-white/10 shadow-inner">
            {getNavLinks().map(link => (
              <Link key={link.href} href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${pathname === link.href
                  ? 'bg-white text-[#416823] shadow-sm'
                  : 'text-white hover:text-white hover:bg-white/20'
                  }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2.5 rounded-full bg-black/10 text-white hover:bg-black/20 border border-white/10 transition-all shadow-sm">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2.5 rounded-full bg-black/10 text-white hover:bg-black/20 border border-white/10 transition-all shadow-sm">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-transparent">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                        className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/80">
                          <h3 className="font-black text-gray-900 text-sm">Notifications</h3>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-gray-400 font-medium text-sm text-center py-8">No notifications</p>
                          ) : notifications.slice(0, 6).map((n: any) => (
                            <div key={n._id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-[#f7faf5]' : ''}`}>
                              <p className="text-sm font-bold text-gray-900">{n.title}</p>
                              <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                          ))}
                        </div>
                        <Link href="/notifications" className="block p-3 text-center text-[#679e24] font-bold text-xs hover:bg-gray-50 transition-colors" onClick={() => setNotifOpen(false)}>
                          View all notifications →
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-black/10 hover:bg-black/20 border border-white/10 transition-all shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#416823] font-black text-sm shadow-sm shrink-0">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5">
                      <span className="text-xs text-white font-black truncate max-w-[90px] drop-shadow-sm">{getDisplayName()}</span>
                      {user?.role && user.role !== 'user' && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          user.role === 'admin' || user.role === 'superadmin' ? 'bg-[#8cc63f] text-black' :
                          user.role === 'manager' ? 'bg-blue-500 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    <ChevronDown size={14} className={`text-white transition-transform shrink-0 ${userDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {userDropdown && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                        className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/80">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 font-black text-sm truncate">{user?.name}</p>
                            {user?.role && user.role !== 'user' && (
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                                user.role === 'admin' || user.role === 'superadmin' ? 'bg-[#8cc63f] text-black' :
                                user.role === 'manager' ? 'bg-blue-500 text-white' :
                                'bg-orange-500 text-white'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 font-medium text-xs truncate mt-1">{user?.email}</p>
                        </div>
                        <div className="py-2">
                          {[
                            { href: '/dashboard', label: 'Dashboard', icon: MapPin },
                            { href: '/profile', label: 'Profile', icon: User },
                            ...(user?.role === 'mechanic' ? [{ href: '/mechanic/dashboard', label: 'Mechanic Dashboard', icon: Wrench }] : []),
                            ...(['admin', 'superadmin', 'manager'].includes(user?.role || '') ? [{ href: '/admin', label: user?.role === 'manager' ? 'Manager Panel' : 'Admin Panel', icon: Settings }] : []),
                          ].map((item, i) => (
                            <Link key={i} href={item.href}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors text-sm font-bold"
                              onClick={() => setUserDropdown(false)}>
                              <item.icon size={16} /> {item.label}
                            </Link>
                          ))}
                        </div>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-black border-t border-gray-100">
                          <LogOut size={16} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-white font-bold text-sm px-4 py-2 hover:bg-white/10 rounded-full transition-colors drop-shadow-sm">Sign In</Link>
                <Link href="/auth/register" className="bg-black text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-xl hover:bg-gray-800 hover:-translate-y-0.5 transition-all">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger & Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-white bg-black/10 rounded-full hover:bg-black/20 transition-colors">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-white bg-black/10 rounded-full hover:bg-black/20 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white shadow-2xl border-t border-gray-100 rounded-b-3xl absolute w-full top-full">
            <div className="w-full max-w-[1600px] mx-auto px-6 py-6 flex flex-col gap-2">
              {getNavLinks().map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="px-4 py-3 rounded-xl text-gray-700 hover:text-black hover:bg-gray-50 transition-colors text-sm font-bold">
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="flex-1 bg-[#679e24] text-white rounded-xl text-center font-bold text-sm py-3 shadow-md" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                    <button onClick={handleLogout} className="flex-1 bg-gray-100 text-gray-900 rounded-xl text-center font-bold text-sm py-3">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="flex-1 bg-gray-100 text-gray-900 rounded-xl text-center font-bold text-sm py-3" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    <Link href="/auth/register" className="flex-1 bg-black text-white rounded-xl text-center font-bold text-sm py-3 shadow-md" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
