'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, MapPin, Phone, Mail, Clock, CheckCircle, Navigation, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { mechanicAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { useStore } from '@/store/useStore';

function MechanicDashboardContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [completeModalData, setCompleteModalData] = useState<any>(null);
  const [completionCost, setCompletionCost] = useState<string>('');
  const { user } = useStore();

  const loadRequests = async () => {
    try {
      const res = await mechanicAPI.getRequests();
      setRequests(res.data.requests);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    if (user && user._id) {
      const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000');
      socket.emit('join-mechanic', user._id);

      socket.on('new-mechanic-request', (data) => {
        toast.success('New mechanic request received!');
        setRequests((prev) => [data.request, ...prev]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const updateStatus = async (id: string, newStatus: string, cost?: number) => {
    try {
      await mechanicAPI.updateStatus(id, newStatus, cost);
      toast.success(`Request marked as ${newStatus}`);
      setRequests(requests.map((r) => r._id === id ? { ...r, status: newStatus, cost: cost || r.cost } : r));
      if (newStatus === 'completed') setCompleteModalData(null);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (completeModalData) {
      updateStatus(completeModalData._id, 'completed', Number(completionCost));
    }
  };

  const statusColors: Record<string, string> = {
    pending: '#fbbf24',
    accepted: '#22d3ee',
    in_progress: '#a855f7',
    completed: '#8cc63f',
    cancelled: '#f43f5e',
  };

  const filteredRequests = (requests || []).filter(r => 
    r.problemDescription?.toLowerCase().includes(search.toLowerCase()) || 
    r.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3 drop-shadow-sm">
            <Wrench className="text-white" /> Mechanic Dashboard
          </h1>
          <p className="text-white/90 font-medium">View and manage assistance requests from users.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] shadow-xl hover:-translate-y-1 transition-all">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Requests</p>
            <p className="text-3xl font-black text-white">{requests.length}</p>
          </div>
          <div className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] shadow-xl hover:-translate-y-1 transition-all">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Pending</p>
            <p className="text-3xl font-black text-yellow-400">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] shadow-xl hover:-translate-y-1 transition-all">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">In Progress</p>
            <p className="text-3xl font-black text-purple-400">{requests.filter(r => r.status === 'in_progress').length}</p>
          </div>
          <div className="bg-[#0b1320] rounded-[24px] p-6 border border-[#1a2b42] shadow-xl hover:-translate-y-1 transition-all">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Completed</p>
            <p className="text-3xl font-black text-[#8cc63f]">{requests.filter(r => r.status === 'completed').length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 bg-[#0b1320] rounded-full px-6 py-4 border border-[#1a2b42] mb-10 max-w-lg shadow-xl focus-within:border-[#8cc63f] transition-all">
          <Search size={18} className="text-gray-500 shrink-0" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by name or problem..." 
            className="bg-transparent outline-none text-white placeholder:text-gray-500 flex-1 text-sm font-medium" 
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-[#0b1320] rounded-[32px] border border-[#1a2b42] animate-pulse" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-[#0b1320] rounded-[32px] border border-[#1a2b42] shadow-2xl">
            <CheckCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">No Requests</h3>
            <p className="text-gray-400 font-medium">You're all caught up! There are no pending requests right now.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((req, i) => (
              <motion.div 
                key={req._id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden flex flex-col shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-5">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold capitalize border"
                      style={{ 
                        color: statusColors[req.status] || '#fff', 
                        borderColor: `${statusColors[req.status] || '#fff'}40`,
                        backgroundColor: `${statusColors[req.status] || '#fff'}10`
                      }}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 mt-1">
                      <Clock size={12} />
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-white font-black text-xl mb-4">{req.user?.name || 'Unknown User'}</h3>
                  
                  <div className="space-y-3 mb-6">
                    <p className="text-gray-300 font-medium text-sm flex items-center gap-2">
                      <Phone size={16} className="text-[#8cc63f]" /> 
                      <a href={`tel:${req.user?.phone}`} className="hover:underline">{req.user?.phone || 'No phone'}</a>
                    </p>
                    <p className="text-gray-300 font-medium text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-[#8cc63f]" /> 
                      {req.station?.name ? `Near ${req.station.name}` : 'Unknown location'}
                    </p>
                  </div>

                  <div className="p-4 bg-[#111c2e] rounded-2xl border border-[#1a2b42] mb-5">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Reported Problem</p>
                    <p className="text-white font-medium text-sm line-clamp-3">{req.problemDescription}</p>
                  </div>

                  {req.cost > 0 && req.status === 'completed' && (
                    <div className="p-4 bg-[#8cc63f]/10 rounded-2xl border border-[#8cc63f]/20 mt-auto">
                      <p className="text-[#8cc63f] text-xs uppercase tracking-wider mb-1 font-bold">Charged Amount</p>
                      <p className="text-white text-2xl font-black flex items-center gap-1">
                        ₹{req.cost}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-[#1a2b42] bg-[#111c2e]/50 flex gap-3">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${req.location.coordinates[1]},${req.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-transparent border-2 border-[#1a2b42] text-white font-bold justify-center py-3 rounded-full hover:bg-[#111c2e] transition-colors flex items-center gap-2 text-xs"
                  >
                    <Navigation size={16} /> Navigate
                  </a>

                  {req.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(req._id, 'accepted')}
                      className="flex-1 bg-[#8cc63f] text-black font-black py-3 rounded-full hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)] text-xs"
                    >
                      Accept
                    </button>
                  )}
                  {req.status === 'accepted' && (
                    <button 
                      onClick={() => updateStatus(req._id, 'in_progress')}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-black py-3 rounded-full transition-all shadow-[0_5px_15px_rgba(168,85,247,0.3)] text-xs"
                    >
                      Start Work
                    </button>
                  )}
                  {req.status === 'in_progress' && (
                    <button 
                      onClick={() => {
                        setCompleteModalData(req);
                        setCompletionCost('');
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-full transition-all shadow-[0_5px_15px_rgba(74,222,128,0.3)] text-xs flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> Complete
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {completeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-white font-black text-2xl mb-6">Complete Request</h2>
            
            <div className="p-4 bg-[#111c2e] rounded-2xl border border-[#1a2b42] mb-6">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Reported Problem</p>
              <p className="text-white font-medium text-sm">{completeModalData.problemDescription}</p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-6">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Service Cost (₹) *</label>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  value={completionCost} 
                  onChange={e => setCompletionCost(e.target.value)} 
                  placeholder="Enter amount charged..." 
                  className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" 
                  required
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setCompleteModalData(null)} className="flex-1 bg-transparent border-2 border-[#1a2b42] text-white font-bold py-4 rounded-full hover:bg-[#111c2e] transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[#8cc63f] text-black font-black py-4 rounded-full hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.3)]">
                  Mark as Complete
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function MechanicDashboard() {
  return (
    <AuthGuard>
      <MechanicDashboardContent />
    </AuthGuard>
  );
}
