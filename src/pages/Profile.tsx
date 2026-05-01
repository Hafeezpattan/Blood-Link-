import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Droplets, Calendar } from 'lucide-react';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Profile() {
  const { user, profile, setProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    role: 'donor' as 'donor' | 'recipient',
    bloodGroup: '',
    address: '',
    isAvailable: true,
    lastDonationDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone || '',
        role: profile.role,
        bloodGroup: profile.bloodGroup,
        address: profile.location?.address || '',
        isAvailable: profile.isAvailable,
        lastDonationDate: profile.lastDonationDate || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const profileData = {
        uid: user.uid,
        email: user.email!,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        bloodGroup: formData.bloodGroup,
        isAvailable: formData.isAvailable,
        lastDonationDate: formData.lastDonationDate,
        location: { lat: 0, lng: 0, address: formData.address },
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      setProfile(profileData as any);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert("Failed to update profile. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Complete Profile</h1>
        <p className="text-slate-500">Tell us more about yourself to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
              <select
                required
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium appearance-none"
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Donation Date</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={formData.lastDonationDate?.split('T')[0] || ''}
                  onChange={e => setFormData({ ...formData, lastDonationDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium appearance-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a</label>
            <select
              required
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium appearance-none"
            >
              <option value="donor">Donor</option>
              <option value="recipient">Recipient</option>
            </select>
          </div>

          {formData.role === 'donor' && (
            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-5 h-5 text-rose-600 rounded-md focus:ring-rose-500"
              />
              <label htmlFor="isAvailable" className="text-sm font-medium text-slate-700">
                Show me as available for donations
              </label>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
