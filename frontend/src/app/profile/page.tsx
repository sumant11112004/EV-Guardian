'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Car, Bell, Save, Camera, Shield, Leaf } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { authAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

const CONNECTOR_TYPES = ['CCS', 'CHAdeMO', 'Type2', 'Type1', 'GB/T'];

export default function ProfilePage() {
  const { user, isAuthenticated, setAuth, token } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<'profile' | 'vehicle' | 'notifications' | 'security'>('profile');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '', connectorType: '', batteryCapacity: '' });
  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, bookingReminders: true, slotStatus: true, paymentUpdates: true });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user) {
      setForm({ name: user.name || '', phone: (user as any).phone || '' });
      if ((user as any).vehicle) setVehicle({ ...vehicle, ...(user as any).vehicle });
      if ((user as any).notificationPreferences) setNotifPrefs({ ...notifPrefs, ...(user as any).notificationPreferences });
    }
  }, [isAuthenticated, user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await authAPI.updateProfile({ name: form.name, phone: form.phone, vehicle, notificationPreferences: notifPrefs });
      setAuth(res.data.user, token!);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'vehicle', label: 'My Vehicle', icon: Car },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="container-xl pt-8 pb-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-black text-white mb-1 drop-shadow-sm">Account Settings</h1>
          <p className="text-white/90 font-medium">Manage your profile and preferences</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] p-6 text-center mb-6 shadow-2xl">
              <div className="relative inline-block mb-3">
                <div className="w-20 h-20 rounded-full bg-[#8cc63f] flex items-center justify-center text-black font-black text-3xl mx-auto shadow-xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-[#0b1320]">
                  <Camera size={14} className="text-black" />
                </button>
              </div>
              <p className="text-white font-black text-lg">{user?.name}</p>
              <p className="text-gray-400 text-xs font-medium">{user?.email}</p>
              <div className="mt-4 pt-4 border-t border-[#1a2b42] flex justify-around">
                <div className="text-center">
                  <p className="text-white font-black text-base">{(user as any)?.loyaltyPoints || 0}</p>
                  <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-[#8cc63f] font-black text-base flex items-center gap-1 justify-center"><Leaf size={12} />{((user as any)?.carbonSaved || 0).toFixed(0)}kg</p>
                  <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">CO₂ Saved</p>
                </div>
              </div>
            </div>
            <nav className="space-y-2">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-[16px] text-sm font-bold transition-all ${tab === t.key ? 'bg-[#0b1320] text-[#8cc63f] shadow-lg border border-[#1a2b42]' : 'text-gray-500 hover:text-black hover:bg-gray-100 border border-transparent'}`}>
                  <t.icon size={18} /> {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-[#0b1320] rounded-[32px] border border-[#1a2b42] p-8 shadow-2xl">

              {/* Profile Tab */}
              {tab === 'profile' && (
                <form onSubmit={saveProfile} className="space-y-6">
                  <h2 className="text-white font-black text-2xl mb-6">Personal Information</h2>
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input value={user?.email} disabled className="w-full bg-[#111c2e]/50 border border-[#1a2b42]/50 text-gray-500 rounded-xl py-3 pl-12 pr-4 text-sm cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors placeholder:text-gray-600" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="bg-[#8cc63f] text-black font-black text-sm py-3 px-8 rounded-full flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)] disabled:opacity-50 hover:-translate-y-0.5">
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}

              {/* Vehicle Tab */}
              {tab === 'vehicle' && (
                <form onSubmit={saveProfile} className="space-y-6">
                  <h2 className="text-white font-black text-2xl mb-6">Vehicle Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[{ label: 'Make', key: 'make', placeholder: 'e.g. Tata' }, { label: 'Model', key: 'model', placeholder: 'e.g. Nexon EV' }, { label: 'Year', key: 'year', placeholder: '2023' }, { label: 'Battery Capacity (kWh)', key: 'batteryCapacity', placeholder: '40.5' }].map(f => (
                      <div key={f.key}>
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">{f.label}</label>
                        <input value={(vehicle as any)[f.key]} onChange={e => setVehicle({ ...vehicle, [f.key]: e.target.value })} placeholder={f.placeholder} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors placeholder:text-gray-600" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Connector Type</label>
                    <select value={vehicle.connectorType} onChange={e => setVehicle({ ...vehicle, connectorType: e.target.value })} className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors appearance-none">
                      <option value="">Select connector type</option>
                      {CONNECTOR_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={saving} className="bg-[#8cc63f] text-black font-black text-sm py-3 px-8 rounded-full flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)] disabled:opacity-50 hover:-translate-y-0.5">
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Vehicle'}
                  </button>
                </form>
              )}

              {/* Notifications Tab */}
              {tab === 'notifications' && (
                <form onSubmit={saveProfile} className="space-y-6">
                  <h2 className="text-white font-black text-2xl mb-6">Notification Preferences</h2>
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'push', label: 'Push Notifications', desc: 'Browser push alerts' },
                    { key: 'bookingReminders', label: 'Booking Reminders', desc: '15 mins before your slot' },
                    { key: 'slotStatus', label: 'Slot Status Updates', desc: 'When your slot becomes available' },
                    { key: 'paymentUpdates', label: 'Payment Updates', desc: 'Transaction confirmations' },
                  ].map(n => (
                    <div key={n.key} className="flex items-center justify-between py-4 border-b border-[#1a2b42] last:border-0">
                      <div>
                        <p className="text-white text-base font-bold">{n.label}</p>
                        <p className="text-gray-400 text-xs font-medium mt-1">{n.desc}</p>
                      </div>
                      <button type="button" onClick={() => setNotifPrefs({ ...notifPrefs, [n.key]: !(notifPrefs as any)[n.key] })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${(notifPrefs as any)[n.key] ? 'bg-[#8cc63f]' : 'bg-[#111c2e] border border-[#1a2b42]'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(notifPrefs as any)[n.key] ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                  <button type="submit" disabled={saving} className="bg-[#8cc63f] text-black font-black text-sm py-3 px-8 rounded-full flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)] disabled:opacity-50 hover:-translate-y-0.5">
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </form>
              )}

              {/* Security Tab */}
              {tab === 'security' && (
                <form onSubmit={changePassword} className="space-y-6">
                  <h2 className="text-white font-black text-2xl mb-6">Change Password</h2>
                  {[{ label: 'Current Password', key: 'currentPassword' }, { label: 'New Password', key: 'newPassword' }, { label: 'Confirm New Password', key: 'confirm' }].map(f => (
                    <div key={f.key}>
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">{f.label}</label>
                      <input type="password" value={(pwForm as any)[f.key]} onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })} placeholder="••••••••" className="w-full bg-[#111c2e] border border-[#1a2b42] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#8cc63f] transition-colors" required />
                    </div>
                  ))}
                  <button type="submit" disabled={saving} className="bg-[#8cc63f] text-black font-black text-sm py-3 px-8 rounded-full flex items-center gap-2 hover:bg-[#679e24] transition-all shadow-[0_5px_15px_rgba(140,198,63,0.2)] disabled:opacity-50 hover:-translate-y-0.5">
                    <Shield size={16} /> {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
