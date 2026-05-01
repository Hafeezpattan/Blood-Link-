import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { Send, User as UserIcon, Phone, ChevronLeft, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Chat() {
  const { chatId } = useParams();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!chatId) return;

    // Determine other user's ID
    const uids = chatId.split('_');
    const otherId = uids.find(id => id !== user?.uid);

    if (otherId) {
      getDoc(doc(db, 'users', otherId)).then(snapshot => {
        if (snapshot.exists()) setOtherUser(snapshot.data());
      });
    }

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error("Chat messages listener error:", error);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
        status: 'sent'
      });
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  if (!chatId) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8 space-y-6">
        <div className="bg-rose-100 p-8 rounded-full">
          <Heart className="text-rose-600 fill-rose-600" size={64} />
        </div>
        <div className="max-w-xs">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">My Messages</h2>
          <p className="text-slate-500">Select a request or find a donor to start a conversation.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-rose-100 hover:scale-105 transition-transform"
        >
          View Requests
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] flex flex-col bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="md:hidden p-2 hover:bg-slate-50 rounded-xl">
            <ChevronLeft size={24} className="text-slate-400" />
          </button>
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
            <UserIcon size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 truncate max-w-[150px] md:max-w-xs">{otherUser?.name || 'Loading...'}</h2>
            <p className="text-[10px] font-black uppercase text-rose-500 tracking-wider">
              {otherUser?.bloodGroup} {otherUser?.role}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {otherUser?.phone && (
            <a href={`tel:${otherUser.phone}`} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
              <Phone size={18} />
            </a>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/50">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex w-full",
                msg.senderId === user?.uid ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[80%] md:max-w-[60%] p-4 rounded-3xl text-sm font-medium shadow-sm",
                msg.senderId === user?.uid 
                  ? "bg-rose-600 text-white rounded-br-none" 
                  : "bg-white text-slate-700 rounded-bl-none border border-slate-100"
              )}>
                {msg.text}
                <div className={cn(
                  "text-[10px] mt-1 opacity-70",
                  msg.senderId === user?.uid ? "text-right" : "text-left"
                )}>
                  {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-rose-600 text-white p-4 rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
