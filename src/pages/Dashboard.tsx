import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Droplets, MapPin, CheckCircle2, XCircle, Search, MessageSquare, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    let q;
    if (filter === 'my') {
      q = query(collection(db, 'requests'), where('requesterId', '==', user?.uid), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'requests'), where('status', '==', 'open'), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Dashboard requests listener error:", error);
    });
    return () => unsubscribe();
  }, [filter, user]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'requests', id), { status, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartChat = (req: any) => {
    const chatId = [req.requesterId, user?.uid].sort().join('_');
    navigate(`/chats/${chatId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Blood Requests</h1>
          <p className="text-slate-500">Manage and respond to active requirements.</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 self-start md:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              filter === 'all' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Public Feed
          </button>
          <button
            onClick={() => setFilter('my')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              filter === 'my' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
            )}
          >
            My Requests
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {requests.map((req) => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-start"
            >
              <div className={cn(
                "w-full md:w-24 h-24 rounded-3xl flex flex-col items-center justify-center shrink-0 border-2",
                req.status === 'open' ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100 opacity-50"
              )}>
                <span className="text-2xl font-black text-rose-600">{req.bloodGroup}</span>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">Required</span>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{req.hospitalName}</h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                      <MapPin size={14} /> {req.address}
                    </p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    req.urgency === 'emergency' ? "bg-rose-600 text-white border-rose-600" : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {req.urgency}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Units</span>
                    <span className="font-bold text-slate-700">{req.units} Units</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <span className="font-bold text-slate-700 capitalize">{req.status}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Posted</span>
                    <span className="font-bold text-slate-700">{formatDate(req.createdAt?.toDate?.() || new Date())}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {user?.uid === req.requesterId ? (
                    <>
                      {req.status === 'open' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'fulfilled')}
                          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                        >
                          <CheckCircle2 size={16} /> Mark Fulfilled
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                        className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartChat(req)}
                        className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                      >
                        <MessageSquare size={16} /> Contact Requester
                      </button>
                      <a
                        href={`tel:${req.contactInfo}`}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                      >
                        <Phone size={16} /> Call Now
                      </a>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {requests.length === 0 && (
          <div className="bg-white p-20 rounded-[2rem] border-2 border-dashed border-slate-200 text-center space-y-4">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Search className="text-slate-300" size={32} />
            </div>
            <div>
              <p className="text-slate-500 font-medium">No results found for this selection.</p>
              <p className="text-slate-400 text-sm">New requests will appear here in real-time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
