'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Zap, Eye, Search, X, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { stationAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

function AdminStationsContent() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStation, setEditStation] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', street: '', city: '', state: '', pincode: '', lat: '', lng: '', status: 'active', is24x7: true, chargers: [{ type: 'AC Level 2', power: '22', price: '15', slots: '1' }], amenities: '', managerEmail: '', mechanicEmail: '' });
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const { user } = useStore();

  useEffect(() => { load(); }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { search: search || undefined, limit: 50, status: 'all' };
      if (user?.role === 'manager') params.manager = user._id;
      const res = await stationAPI.getAll(params);
      setStations(res.data.stations);
    } catch { toast.error('Failed to load stations'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditStation(null); setImages([]); setForm({ name: '', description: '', street: '', city: '', state: '', pincode: '', lat: '', lng: '', status: 'active', is24x7: true, chargers: [{ type: 'AC Level 2', power: '22', price: '15', slots: '1' }], amenities: '', managerEmail: '', mechanicEmail: '' }); setShowModal(true); };
  const openEdit = (s: any) => {
    setEditStation(s);
    setImages([]);
    const loadedChargers = s.chargers?.length ? s.chargers.map((c: any) => ({ type: c.type, power: c.power.toString(), price: c.pricePerKwh.toString(), slots: c.totalSlots.toString() })) : [{ type: 'AC Level 2', power: '22', price: '15', slots: '1' }];
    setForm({ name: s.name, description: s.description || '', street: s.address?.street, city: s.address?.city, state: s.address?.state, pincode: s.address?.pincode, lat: s.location?.coordinates?.[1]?.toString(), lng: s.location?.coordinates?.[0]?.toString(), status: s.status, is24x7: s.operatingHours?.is24x7, chargers: loadedChargers, amenities: s.amenities?.join(', ') || '', managerEmail: s.manager?.email || '', mechanicEmail: s.mechanic?.email || '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('status', form.status);
    formData.append('managerEmail', form.managerEmail);
    formData.append('mechanicEmail', form.mechanicEmail);
    formData.append('address', JSON.stringify({ street: form.street, city: form.city, state: form.state, pincode: form.pincode }));
    formData.append('coordinates', JSON.stringify([parseFloat(form.lng), parseFloat(form.lat)]));
    formData.append('operatingHours', JSON.stringify({ is24x7: form.is24x7 }));
    formData.append('chargers', JSON.stringify(form.chargers.map(c => ({ type: c.type, power: Number(c.power), connectorType: c.type, pricePerKwh: Number(c.price), totalSlots: Number(c.slots), availableSlots: Number(c.slots) }))));
    formData.append('amenities', JSON.stringify(form.amenities.split(',').map(a => a.trim()).filter(Boolean)));
    images.forEach(img => formData.append('images', img));

    try {
      if (editStation) { await stationAPI.update(editStation._id, formData); toast.success('Station updated'); }
      else { await stationAPI.create(formData as any); toast.success('Station created'); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await stationAPI.delete(id); toast.success('Station deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const statusColor: Record<string, string> = { active: '#4ade80', inactive: '#f43f5e', maintenance: '#fbbf24' };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-1 drop-shadow-sm">Manage Stations</h1>
            <p className="text-white/90 font-medium">{stations.length} charging stations</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2.5 px-5 rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 text-sm">← Dashboard</Link>
            {user?.role !== 'manager' && (
              <button onClick={openAdd} className="bg-[#1a1a1a] text-white font-black py-2.5 px-5 rounded-full hover:bg-black transition-all shadow-xl flex items-center gap-2 text-sm"><Plus size={16} /> Add Station</button>
            )}
          </div>
        </motion.div>

        {/* Search */}
        <div className="flex items-center gap-4 bg-[#0b1320] rounded-full px-6 py-4 border border-[#1a2b42] mb-8 max-w-lg shadow-xl focus-within:border-[#8cc63f] transition-all">
          <Search size={18} className="text-gray-500 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stations..." className="bg-transparent outline-none text-white placeholder:text-gray-500 flex-1 text-sm font-medium" />
          {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-500 hover:text-white" /></button>}
        </div>

        {/* Table */}
        <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2b42] text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <th className="text-left px-5 py-4 font-medium">Station</th>
                  <th className="text-left px-5 py-4 font-medium hidden md:table-cell">Location</th>
                  <th className="text-left px-5 py-4 font-medium hidden lg:table-cell">Chargers</th>
                  <th className="text-left px-5 py-4 font-medium">Status</th>
                  <th className="text-left px-5 py-4 font-medium">Rating</th>
                  <th className="text-right px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2b42]">
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-[#111c2e] rounded w-40" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 bg-[#111c2e] rounded w-28" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-[#111c2e] rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-5 bg-[#111c2e] rounded-full w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[#111c2e] rounded w-10" /></td>
                    <td className="px-5 py-4"><div className="h-8 bg-[#111c2e] rounded w-20 ml-auto" /></td>
                  </tr>
                )) : stations.map((s, i) => (
                  <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-[#111c2e] transition-colors">
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#8cc63f]/10 border border-[#8cc63f]/20 flex items-center justify-center shrink-0">
                          <Zap size={18} className="text-[#8cc63f]" />
                        </div>
                        <div>
                          <p className="text-white font-black text-base truncate max-w-[180px]">{s.name}</p>
                          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">{s.networkProvider}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 hidden md:table-cell">
                      <p className="text-gray-300 text-sm font-medium flex items-center gap-1.5"><MapPin size={14} className="text-[#8cc63f]" />{s.address?.city}, {s.address?.state}</p>
                    </td>
                    <td className="px-5 py-5 hidden lg:table-cell">
                      <p className="text-gray-300 font-bold text-xs bg-[#111c2e] px-3 py-1.5 rounded-full inline-block border border-[#1a2b42]">{s.chargers?.length || 0} types</p>
                    </td>
                    <td className="px-5 py-5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ background: `${statusColor[s.status]}15`, color: statusColor[s.status], border: `1px solid ${statusColor[s.status]}30` }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <span className="text-yellow-400 text-sm font-black bg-yellow-400/10 px-2.5 py-1 rounded-lg">{s.avgRating?.toFixed(1) || '--'}</span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/stations/${s._id}`} className="p-2.5 rounded-xl bg-transparent border-2 border-[#1a2b42] text-gray-400 hover:text-white hover:bg-[#111c2e] transition-all">
                          <Eye size={16} />
                        </Link>
                        <button onClick={() => openEdit(s)} className="p-2.5 rounded-xl bg-transparent border-2 border-[#1a2b42] text-gray-400 hover:text-[#8cc63f] hover:border-[#8cc63f]/30 hover:bg-[#8cc63f]/10 transition-all">
                          <Edit size={16} />
                        </button>
                        {user?.role !== 'manager' && (
                          <button onClick={() => handleDelete(s._id, s.name)} className="p-2.5 rounded-xl bg-transparent border-2 border-[#1a2b42] text-gray-400 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10 transition-all">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!loading && stations.length === 0 && (
              <div className="text-center py-20">
                <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-white font-black text-2xl mb-2">{user?.role === 'manager' ? 'No Assigned Stations' : 'No stations found'}</p>
                {user?.role === 'manager' ? (
                  <p className="text-gray-400 font-bold text-sm max-w-md mx-auto leading-relaxed">
                    You do not have any charging stations assigned to your account. Please contact the administrator to assign a station to you.
                  </p>
                ) : (
                  <>
                    <p className="text-gray-400 font-medium mb-6">Add your first charging station</p>
                    <button onClick={openAdd} className="bg-[#8cc63f] text-black font-black py-3 px-8 rounded-full hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.3)] flex items-center justify-center mx-auto gap-2 text-sm"><Plus size={16} /> Add Station</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white font-black text-2xl">{editStation ? 'Edit Station' : 'Add New Station'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white bg-[#111c2e] p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Station Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tata Power Koramangala" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={2} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Street *</label>
                  <input required value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="Street address" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">City *</label>
                  <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">State *</label>
                  <input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="State" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Pincode *</label>
                  <input required value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} placeholder="560001" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Latitude *</label>
                  <input required type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="12.9716" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Longitude *</label>
                  <input required type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="77.5946" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white font-black text-sm">Chargers</label>
                  <button type="button" onClick={() => setForm({ ...form, chargers: [...form.chargers, { type: 'AC Level 2', power: '22', price: '15', slots: '1' }] })} className="text-[#8cc63f] font-bold text-xs hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Another
                  </button>
                </div>
                {form.chargers.map((charger, idx) => (
                  <div key={idx} className="p-4 border border-[#1a2b42] rounded-2xl bg-[#111c2e] relative">
                    {idx > 0 && (
                      <button type="button" onClick={() => setForm({ ...form, chargers: form.chargers.filter((_, i) => i !== idx) })} className="absolute top-3 right-3 text-gray-500 hover:text-rose-400 bg-[#0b1320] p-1.5 rounded-full transition-colors">
                        <X size={14} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 font-bold block">Type</label>
                        <select value={charger.type} onChange={e => { const newC = [...form.chargers]; newC[idx].type = e.target.value; setForm({ ...form, chargers: newC }); }} className="w-full bg-[#0b1320] border border-[#1a2b42] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#8cc63f] transition-colors">
                          <option value="AC Level 1">AC Level 1</option>
                          <option value="AC Level 2">AC Level 2</option>
                          <option value="DC Fast">DC Fast</option>
                          <option value="CCS">CCS</option>
                          <option value="CHAdeMO">CHAdeMO</option>
                          <option value="Type2">Type 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 font-bold block">Slots</label>
                        <input required type="number" min="1" value={charger.slots} onChange={e => { const newC = [...form.chargers]; newC[idx].slots = e.target.value; setForm({ ...form, chargers: newC }); }} className="w-full bg-[#0b1320] border border-[#1a2b42] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#8cc63f] transition-colors" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 font-bold block">Power (kW)</label>
                        <input required type="number" min="1" value={charger.power} onChange={e => { const newC = [...form.chargers]; newC[idx].power = e.target.value; setForm({ ...form, chargers: newC }); }} className="w-full bg-[#0b1320] border border-[#1a2b42] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#8cc63f] transition-colors" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 font-bold block">Price (₹/kWh)</label>
                        <input required type="number" min="0" step="any" value={charger.price} onChange={e => { const newC = [...form.chargers]; newC[idx].price = e.target.value; setForm({ ...form, chargers: newC }); }} className="w-full bg-[#0b1320] border border-[#1a2b42] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#8cc63f] transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Amenities (comma separated)</label>
                <input value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="e.g. WiFi, Cafe, Restroom" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Manager Email (Optional)</label>
                <input type="email" disabled={user?.role === 'manager'} value={form.managerEmail} onChange={e => setForm({ ...form, managerEmail: e.target.value })} placeholder="manager@example.com" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Mechanic Email (Optional)</label>
                <input type="email" value={form.mechanicEmail} onChange={e => setForm({ ...form, mechanicEmail: e.target.value })} placeholder="mechanic@example.com" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
              </div>
              {editStation && editStation.images && editStation.images.length > 0 && (
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Current Station Images ({editStation.images.length}/5)</label>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {editStation.images.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-[#1a2b42]">
                        <img src={imgUrl} alt={`Station image ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-[10px] font-bold mt-1">Uploading new images will append them, up to a maximum of 5 (oldest images will be evicted FIFO).</p>
                </div>
              )}
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Upload New Images (Max 5)</label>
                <input type="file" multiple accept="image/*" onChange={e => { if (e.target.files) setImages(Array.from(e.target.files).slice(0, 5)); }} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8cc63f] file:text-black hover:file:bg-[#74af2b]" />
                {images.length > 0 && <p className="text-[#8cc63f] text-xs mt-2">{images.length} file(s) selected.</p>}
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${form.is24x7 ? 'bg-[#8cc63f] border-[#8cc63f]' : 'bg-transparent border-[#1a2b42]'}`}>
                  {form.is24x7 && <Check size={14} className="text-black font-black" />}
                </div>
                <span className="text-white font-bold text-sm">Open 24/7</span>
              </label>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-transparent border-2 border-[#1a2b42] text-white font-bold py-4 rounded-full hover:bg-[#111c2e] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#8cc63f] text-black font-black py-4 rounded-full hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.3)]">
                  {saving ? 'Saving...' : editStation ? 'Update Station' : 'Create Station'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function AdminStationsPage() {
  return <AuthGuard requireAdmin><AdminStationsContent /></AuthGuard>;
}
