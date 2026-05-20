'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      setAuth(res.data.user, res.data.token);
      toast.success('Account created! Welcome to EV Guardian 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const perks = ['Free slot booking', 'Real-time availability', 'Secure Razorpay payments', 'Carbon savings tracker'];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-10 bg-transparent text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#8cc63f] opacity-[0.05] blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-black opacity-[0.03] blur-3xl mix-blend-multiply" />
      </div>

      <div className="w-full max-w-5xl mx-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left info panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="hidden lg:block">
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <Zap size={22} className="text-[#8cc63f]" fill="currentColor" />
            </div>
            <span className="font-black text-2xl"><span className="text-black dark:text-white">EV </span><span className="text-[#8cc63f]">Guardian</span></span>
          </Link>
          <h2 className="text-5xl font-black text-black leading-[1.1] mb-6">Join the EV<br /><span className="text-[#8cc63f]">Revolution</span></h2>
          <p className="text-gray-500 mb-10 leading-relaxed font-medium text-lg max-w-md">Create your free account and get instant access to 500+ premium charging stations across India.</p>
          <ul className="space-y-5">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-4 text-gray-700 font-bold">
                <CheckCircle size={22} className="text-[#8cc63f] shrink-0" /> {perk}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="bg-[#0b1320] rounded-[40px] p-10 border border-[#1a2b42] shadow-2xl">
          <Link href="/" className="flex items-center gap-2 mb-8 justify-center lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[#8cc63f]/20 flex items-center justify-center">
              <Zap size={22} className="text-[#8cc63f]" fill="currentColor" />
            </div>
            <span className="font-black text-2xl"><span className="text-[#8cc63f]">EV </span><span className="text-white">Guardian</span></span>
          </Link>
          <h1 className="text-3xl font-black text-white text-center mb-2">Create Account</h1>
          <p className="text-gray-400 text-center text-sm mb-8 font-medium">Get started — it's completely free</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: 'reg-name', label: 'Full Name', key: 'name', type: 'text', icon: User, placeholder: 'Arjun Sharma' },
              { id: 'reg-email', label: 'Email Address', key: 'email', type: 'email', icon: Mail, placeholder: 'arjun@example.com' },
              { id: 'reg-phone', label: 'Phone Number', key: 'phone', type: 'tel', icon: Phone, placeholder: '+91 98765 43210' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 block">{field.label}</label>
                <div className="relative">
                  <field.icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input id={field.id} type={field.type} required={field.key !== 'phone'} value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
              </div>
            ))}

            <div>
              <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-password" type={show ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 block">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-confirm" type="password" required value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat password" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
              </div>
            </div>

            <div className="flex items-start gap-2.5 mt-4">
              <input 
                id="agree-terms" 
                type="checkbox" 
                required 
                className="mt-1 accent-[#8cc63f] h-4 w-4 bg-[#111c2e] border-[#1a2b42] rounded cursor-pointer" 
              />
              <label htmlFor="agree-terms" className="text-xs text-gray-400 font-medium leading-relaxed cursor-pointer select-none">
                I agree to the{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-terms-modal'));
                  }} 
                  className="text-[#8cc63f] hover:underline font-extrabold cursor-pointer"
                >
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-terms-modal'));
                  }} 
                  className="text-[#8cc63f] hover:underline font-extrabold cursor-pointer"
                >
                  Privacy Policy
                </a>.
              </label>
            </div>

            <button id="register-submit" type="submit" disabled={loading} className="w-full bg-[#8cc63f] text-black justify-center py-4 rounded-full font-black flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-[0_10px_20px_rgba(140,198,63,0.3)] hover:-translate-y-1 mt-4 disabled:opacity-50">
              {loading ? 'Creating account...' : <><span>Create Free Account</span> <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-8 font-medium">
            Already have an account? <Link href="/auth/login" className="text-[#8cc63f] hover:underline font-bold">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
