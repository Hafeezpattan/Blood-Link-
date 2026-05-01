import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Bell, Check, Trash2, ShieldAlert, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, cn } from '../lib/utils';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { isRead: true });
  };

  const removeNotification = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return <ShieldAlert className="text-amber-500" size={18} />;
      case 'match': return <Heart className="text-rose-500" size={18} />;
      case 'chat': return <MessageCircle className="text-blue-500" size={18} />;
      default: return <Bell className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
              className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <Bell className="mx-auto mb-2 opacity-20" size={32} />
                    <p className="text-xs font-medium">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={cn(
                        "p-4 flex gap-3 group transition-colors",
                        n.isRead ? "opacity-60" : "bg-rose-50/10"
                      )}
                    >
                      <div className="shrink-0 pt-1">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">{n.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(n.createdAt?.toDate ? n.createdAt.toDate() : new Date())}
                          </span>
                          <div className="flex gap-2">
                             {!n.isRead && (
                               <button 
                                 onClick={() => markAsRead(n.id)}
                                 className="text-[10px] font-bold text-emerald-600 hover:underline"
                               >
                                 Read
                               </button>
                             )}
                             <button 
                               onClick={() => removeNotification(n.id)}
                               className="text-slate-300 hover:text-rose-600 transition-colors"
                             >
                               <Trash2 size={12} />
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
