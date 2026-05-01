import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Heart, Droplets, MapPin, AlertCircle, Clock, ChevronRight, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatDate, cn } from '../lib/utils';
import { getEncouragementMessage } from '../services/geminiService';
import { getEligibilityStatus } from '../lib/eligibility';

export default function Home() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ requests: 0, donors: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [encouragement, setEncouragement] = useState<string>('');
  const [eligibility, setEligibility] = useState<any>(null);

  useEffect(() => {
    if (profile?.role === 'donor') {
      const status = getEligibilityStatus(profile.lastDonationDate);
      setEligibility(status);

      // Check if we should generate a notification
      if (status.isEligible && user) {
        checkAndCreateEligibilityNotification(user.uid);
      }
    }
  }, [profile, user]);

  const checkAndCreateEligibilityNotification = async (userId: string) => {
    // Basic check to prevent duplicate notifications for same eligibility window
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('type', '==', 'system'),
      where('requestId', '==', 'eligibility_reminder'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    // Only create if not recently created (e.g. today)
    if (snapshot.empty) {
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        title: "You are eligible to donate!",
        message: "It's been over 90 days since your last donation. Someone needs your help today.",
        type: 'system',
        isRead: false,
        requestId: 'eligibility_reminder',
        createdAt: serverTimestamp()
      });
    }
  };

  useEffect(() => {
    if (profile?.role) {
      getEncouragementMessage(profile.role).then(setEncouragement);
    }
  }, [profile?.role]);

  useEffect(() => {
    const q = query(collection(db, 'requests'), where('status', '==', 'open'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Home requests listener error:", error);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-rose-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold mb-4">Hello, {profile?.name.split(' ')[0]}!</h1>
          <p className="text-rose-100 text-lg mb-6">
            {profile?.role === 'donor' 
              ? "Your contribution can save up to 3 lives. Check nearby requests to start helping."
              : "Emergency blood needs can be shared instantly. Create a request to find matching donors."}
          </p>
          <div className="flex gap-4">
            {profile?.role === 'donor' ? (
              <Link 
                to="/search" 
                className="bg-white text-rose-600 px-6 py-3 rounded-2xl font-bold hover:bg-rose-50 transition-colors"
              >
                Find Requests
              </Link>
            ) : (
              <Link 
                to="/request-blood" 
                className="bg-white text-rose-600 px-6 py-3 rounded-2xl font-bold hover:bg-rose-50 transition-colors"
              >
                Emergency Link
              </Link>
            )}
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-3xl opacity-30 -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl opacity-10 translate-y-12 -translate-x-12"></div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Requests */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Active Requests</h2>
            <Link to="/dashboard" className="text-rose-600 font-medium text-sm hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {recentRequests.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
                No active requests right now.
              </div>
            ) : (
              recentRequests.map((req, idx) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-rose-50 p-3 rounded-2xl text-rose-600 font-bold text-lg">
                      {req.bloodGroup}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{req.hospitalName}</h3>
                        {req.urgency === 'emergency' && (
                          <span className="bg-rose-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse">
                            SOS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 text-xs font-medium">
                        <span className="flex items-center gap-1">
                          <Droplets size={14} className="text-rose-500" />
                          {req.units} Units
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(req.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Info Cards */}
        <section className="space-y-8">
          {profile?.role === 'donor' && eligibility && (
            <div className={cn(
              "rounded-[2rem] p-6 border shadow-sm flex items-center gap-4 transition-all",
              eligibility.isEligible 
                ? "bg-emerald-50 border-emerald-100 ring-2 ring-emerald-500/20" 
                : "bg-amber-50 border-amber-100"
            )}>
              <div className={cn(
                "p-4 rounded-2xl text-white shadow-lg",
                eligibility.isEligible ? "bg-emerald-500 shadow-emerald-100" : "bg-amber-500 shadow-amber-100"
              )}>
                <CalendarCheck size={24} />
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "font-bold text-lg mb-0.5",
                  eligibility.isEligible ? "text-emerald-900" : "text-amber-900"
                )}>
                  {eligibility.isEligible ? "Ready to Donate" : "Cooldown Active"}
                </h3>
                <p className="text-sm opacity-80 leading-snug">
                  {eligibility.isEligible 
                    ? "It's been over 90 days. You're eligible to save lives today!" 
                    : `${eligibility.daysLeft} days until you're eligible to donate blood again.`}
                </p>
                {!eligibility.isEligible && (
                  <div className="mt-3 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-600 transition-all duration-1000" 
                      style={{ width: `${((90 - eligibility.daysLeft) / 90) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {encouragement && (
            <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-sm"><Heart size={20} className="text-rose-600 fill-rose-600" /></div>
              <p className="text-rose-800 text-sm italic font-medium">"{encouragement}"</p>
            </div>
          )}

          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-100">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 mb-1 text-lg">Donation Tip</h3>
                <p className="text-emerald-700 text-sm leading-relaxed">
                  Drink plenty of water (about 500ml) just before your donation to stay hydrated and prevent dizziness.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <h3 className="font-bold text-slate-900 mb-2">Impact Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-2xl">
                <div className="text-2xl font-black text-rose-600 font-mono">1,240</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lives Saved</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-2xl">
                <div className="text-2xl font-black text-rose-600 font-mono">862</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Donors</div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 text-center italic">
              "Every drop counts in the journey of humanity."
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
