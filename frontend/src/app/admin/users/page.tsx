'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Search, X, UserCheck, UserX, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { adminAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useStore();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !['admin', 'superadmin'].includes(user?.role || '')) {
      router.push('/auth/login'); return;
    }
    load();
  }, [isAuthenticated, search, page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ search: search || undefined, page, limit: 15 });
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const toggleUser = async (id: string, name: string, isActive: boolean) => {
    if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} "${name}"?`)) return;
    setToggling(id);
    try {
      await adminAPI.toggleUser(id);
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed'); }
    finally { setToggling(null); }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-1 drop-shadow-sm">User Management</h1>
            <p className="text-white/90 font-medium">{total} registered users</p>
          </div>
          <Link href="/admin" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2.5 px-5 rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 text-sm">← Dashboard</Link>
        </motion.div>

        <div className="flex items-center gap-4 bg-[#0b1320] rounded-full px-6 py-4 border border-[#1a2b42] mb-8 max-w-lg shadow-xl focus-within:border-[#8cc63f] transition-all">
          <Search size={18} className="text-gray-500 shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..." className="bg-transparent outline-none text-white placeholder:text-gray-500 flex-1 text-sm font-medium" />
          {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-500 hover:text-white" /></button>}
        </div>

        <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2b42] text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <th className="text-left px-6 py-5 font-medium">User</th>
                  <th className="text-left px-6 py-5 font-medium hidden lg:table-cell">Vehicle</th>
                  <th className="text-left px-6 py-5 font-medium">Role</th>
                  <th className="text-left px-6 py-5 font-medium">Status</th>
                  <th className="text-left px-6 py-5 font-medium hidden md:table-cell">Joined</th>
                  <th className="text-right px-6 py-5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2b42]">
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-[#111c2e]" /><div className="space-y-2"><div className="h-3 bg-[#111c2e] rounded w-32" /><div className="h-2 bg-[#111c2e] rounded w-40" /></div></div></td>
                    <td className="px-6 py-5 hidden lg:table-cell"><div className="h-3 bg-[#111c2e] rounded w-24" /></td>
                    <td className="px-6 py-5"><div className="h-5 bg-[#111c2e] rounded-full w-16" /></td>
                    <td className="px-6 py-5"><div className="h-5 bg-[#111c2e] rounded-full w-20" /></td>
                    <td className="px-6 py-5 hidden md:table-cell"><div className="h-3 bg-[#111c2e] rounded w-20" /></td>
                    <td className="px-6 py-5"><div className="h-10 bg-[#111c2e] rounded-xl w-24 ml-auto" /></td>
                  </tr>
                )) : users.map((u, i) => (
                  <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-[#111c2e] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#8cc63f] flex items-center justify-center text-black font-black text-lg shrink-0 shadow-[0_0_15px_rgba(140,198,63,0.3)]">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{u.name}</p>
                          <p className="text-gray-500 font-medium text-xs mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <p className="text-gray-300 font-bold text-xs">{u.vehicle?.make ? `${u.vehicle.make} ${u.vehicle.model}` : '—'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1 w-fit ${u.role === 'admin' ? 'bg-[#8cc63f]/20 text-[#8cc63f] border border-[#8cc63f]/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                        {u.role === 'admin' && <Shield size={12} />}{u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {u.isActive ? <span className="bg-[#8cc63f]/20 text-[#8cc63f] px-3 py-1 rounded-full text-xs font-bold border border-[#8cc63f]/30">Active</span> : <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20">Inactive</span>}
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        <button onClick={() => toggleUser(u._id, u.name, u.isActive)}
                          disabled={toggling === u._id || u.role === 'admin'}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${u.isActive ? 'text-rose-500 border-rose-500 hover:bg-rose-500/10' : 'text-[#8cc63f] border-[#8cc63f] hover:bg-[#8cc63f]/10'}`}>
                          {toggling === u._id ? '...' : u.isActive ? <><UserX size={14} />Deactivate</> : <><UserCheck size={14} />Activate</>}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!loading && users.length === 0 && (
              <div className="text-center py-20">
                <Users size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-medium text-sm">No users found</p>
              </div>
            )}
          </div>
        </div>

        {pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-5 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-500 font-bold hover:text-black hover:border-gray-300 disabled:opacity-40 text-sm transition-all shadow-sm">Previous</button>
            <span className="px-4 py-2 text-gray-500 font-bold text-sm">Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-5 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-500 font-bold hover:text-black hover:border-gray-300 disabled:opacity-40 text-sm transition-all shadow-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
