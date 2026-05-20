'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}!`);
      if (res.data.user.role === 'mechanic') {
        router.push('/mechanic/dashboard');
      } else {
        router.push(res.data.user.role !== 'user' ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#8cc63f] opacity-[0.05] blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-black opacity-[0.03] blur-3xl mix-blend-multiply" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-[#0b1320] rounded-[40px] p-10 w-full max-w-md mx-4 border border-[#1a2b42] relative z-10 shadow-2xl">
        <Link href="/" className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-[#8cc63f]/20 flex items-center justify-center">
            <Zap size={22} className="text-[#8cc63f]" fill="currentColor" />
          </div>
          <span className="font-black text-2xl"><span className="text-[#8cc63f]">EV </span><span className="text-white">Guardian</span></span>
        </Link>

        <h1 className="text-3xl font-black text-white text-center mb-2">Welcome back</h1>
        <p className="text-gray-400 text-center text-sm mb-10 font-medium">Sign in to your EV Guardian account</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 block">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input id="login-email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input id="login-password" type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="text-right mt-2">
            <a href="#" className="text-[#8cc63f] text-xs hover:underline font-bold">Forgot password?</a>
          </div>
          <button id="login-submit" type="submit" disabled={loading} className="w-full bg-[#8cc63f] text-black justify-center py-4 rounded-full font-black flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-[0_10px_20px_rgba(140,198,63,0.3)] hover:-translate-y-1 mt-6 disabled:opacity-50">
            {loading ? 'Signing in...' : <><span>Sign In</span> <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-8 font-medium">
          Don't have an account? <Link href="/auth/register" className="text-[#8cc63f] hover:underline font-bold">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}
