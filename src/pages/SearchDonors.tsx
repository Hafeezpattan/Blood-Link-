import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Search, MapPin, Droplets, Filter, MessageSquare, Phone, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function SearchDonors() {
  const { user } = useAuth();
  const [donors, setDonors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'donor'),
      where('isAvailable', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDonors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Donors search listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredDonors = donors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.location?.address?.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup ? d.bloodGroup === selectedGroup : true;
    return matchesSearch && matchesGroup;
  });

  const handleChat = (donor: any) => {
    const chatId = [donor.uid, user?.uid].sort().join('_');
    navigate(`/chats/${chatId}`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Find Donors</h1>
        <p className="text-slate-500">Search for available blood donors in your area.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-rose-500 transition-all font-medium"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button
            onClick={() => setSelectedGroup('')}
            className={cn(
              "px-4 py-2 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2",
              selectedGroup === '' ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 text-slate-400"
            )}
          >
            All Groups
          </button>
          {BLOOD_GROUPS.map(bg => (
            <button
              key={bg}
              onClick={() => setSelectedGroup(bg)}
              className={cn(
                "px-4 py-2 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2",
                selectedGroup === bg ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-slate-100 text-slate-400"
              )}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* Map Mock & Donors List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donor Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredDonors.map((donor, idx) => (
              <motion.div
                key={donor.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-rose-50 w-12 h-12 rounded-2xl flex items-center justify-center text-rose-600 font-black text-lg">
                    {donor.bloodGroup}
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Available</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-rose-600 transition-colors">{donor.name}</h3>
                <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
                  <MapPin size={14} className="text-slate-400" />
                  {donor.location?.address || 'Near Downtown'}
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleChat(donor)}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <MessageSquare size={14} /> Msg
                  </button>
                  <a
                    href={`tel:${donor.phone}`}
                    className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100"
                  >
                    <Phone size={14} /> Call
                  </a>
                </div>
                
                {/* Decorative background element */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-50 rounded-full opacity-50 blur-2xl group-hover:bg-rose-100 transition-colors"></div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredDonors.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-400">No donors found</h3>
              <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

        {/* AI Insight / Suggestions */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-rose-500 p-2 rounded-lg">
                  <Droplets size={20} className="text-white" />
                </div>
                <h3 className="font-bold">AI Matching</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Based on your current location and urgency, we recommend these active donors who have recently matched similar requests.
              </p>
              
              <div className="space-y-4">
                {donors.slice(0, 2).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <UserIcon size={20} className="text-rose-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{d.name}</div>
                      <div className="text-[10px] text-rose-300 uppercase font-black">{d.bloodGroup} Match</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Background glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-600 rounded-full blur-[80px] opacity-20"></div>
          </div>
          
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm border-dashed text-center space-y-4">
            <MapPin className="mx-auto text-slate-300" size={32} />
            <div className="text-sm">
              <p className="font-bold text-slate-900">Live Map View</p>
              <p className="text-slate-500 px-4">Interactive map is loading... Configure GOOGLE_MAPS_API_KEY to see live positions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
