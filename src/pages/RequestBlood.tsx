import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Droplets, MapPin, AlertCircle, Building, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = [
  { id: 'low', label: 'Low', color: 'bg-blue-100 text-blue-600' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-600' },
  { id: 'emergency', label: 'Emergency', color: 'bg-rose-100 text-rose-600' },
];

export default function RequestBlood() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: '',
    units: 1,
    hospitalName: '',
    urgency: 'medium',
    contactInfo: '',
    address: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'requests'), {
        ...formData,
        requesterId: user.uid,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        location: { lat: 0, lng: 0, address: formData.address }, // Simplified for demo
      });
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert("Failed to create request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Request</h1>
        <p className="text-slate-500">Your request will be broadcasted to all matching donors nearby.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
          {/* Blood Group Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Droplets size={18} className="text-rose-500" />
              Required Blood Group
            </label>
            <div className="grid grid-cols-4 gap-3">
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                  className={cn(
                    "py-3 rounded-2xl font-bold transition-all border-2",
                    formData.bloodGroup === bg 
                      ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100" 
                      : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Units Required</label>
              <input
                type="number"
                min="1"
                required
                value={formData.units}
                onChange={e => setFormData({ ...formData, units: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Hospital/Clinic Name</label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.hospitalName}
                  onChange={e => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                  placeholder="General Hospital"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-4">Urgency Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {URGENCY_LEVELS.map(level => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: level.id })}
                  className={cn(
                    "py-3 px-2 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2",
                    formData.urgency === level.id 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                      : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", formData.urgency === level.id ? "bg-white" : level.color.split(' ')[1])} />
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Contact Information</label>
            <input
              type="text"
              required
              value={formData.contactInfo}
              onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              placeholder="Full name & phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Specific Address/Location</label>
            <textarea
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium h-24 resize-none"
              placeholder="Floor, Ward number, landmark..."
            ></textarea>
          </div>
        </div>

        <div className="bg-rose-50 rounded-2xl p-4 flex gap-3 items-start border border-rose-100">
          <AlertCircle className="text-rose-500 shrink-0" size={20} />
          <p className="text-rose-700 text-xs leading-relaxed">
            Please only create genuine requests. False information can misdirect critical resources and put lives at risk.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.bloodGroup}
          className="w-full bg-rose-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? 'Publishing...' : 'Broadcast Emergency'}
        </button>
      </form>
    </div>
  );
}
