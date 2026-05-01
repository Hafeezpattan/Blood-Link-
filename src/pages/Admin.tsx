import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Shield, Trash2, CheckCircle, AlertTriangle, Users, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';

export default function AdminPanel() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');

  // Simple admin check - in real app would use custom claims or restricted doc
  const isAdmin = profile?.email === 'hafeezpattan7@gmail.com'; // User's email from runtime

  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => 
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubReqs = onSnapshot(collection(db, 'requests'), (s) => 
      setRequests(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubUsers(); unsubReqs(); };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <Shield className="mx-auto text-slate-200 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500">Only administrators can view this panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="bg-slate-900 p-3 rounded-2xl text-white">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control</h1>
          <p className="text-slate-500">Monitor activity and manage system resources.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Users size={24} /></div>
          <div><div className="text-2xl font-bold">{users.length}</div><div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Users</div></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-2xl text-rose-600"><Activity size={24} /></div>
          <div><div className="text-2xl font-bold">{requests.length}</div><div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Requests</div></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><Shield size={24} /></div>
          <div><div className="text-2xl font-bold">Safe</div><div className="text-xs text-slate-400 font-bold uppercase tracking-wider">System Status</div></div>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          Requests
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Information</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activeTab === 'users' ? users.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.role} • {u.bloodGroup}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {u.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <button onClick={() => deleteDoc(doc(db, 'users', u.id))} className="text-slate-300 hover:text-rose-600 transition-colors">
                     <Trash2 size={18} />
                   </button>
                </td>
              </tr>
            )) : requests.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{r.hospitalName}</div>
                  <div className="text-xs text-slate-500">{r.bloodGroup} • {formatDate(r.createdAt?.toDate?.() || new Date())}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'open' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <button onClick={() => deleteDoc(doc(db, 'requests', r.id))} className="text-slate-300 hover:text-rose-600 transition-colors">
                     <Trash2 size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
