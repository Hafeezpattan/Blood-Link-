import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Search, MessageSquare, User, LogOut, PlusCircle, Bell, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import NotificationCenter from './NotificationCenter';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Heart },
    { name: 'Requests', path: '/dashboard', icon: Bell },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Chat', path: '/chats', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Simple admin check
  const isAdmin = profile?.email === 'hafeezpattan7@gmail.com';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0 md:pl-64">
      {/* Desktop Header */}
      <header className="hidden md:flex sticky top-0 right-0 left-64 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 z-10 items-center justify-between">
        <div className="text-slate-400 text-sm font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-6">
          <NotificationCenter />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">{profile?.name}</div>
              <div className="text-[10px] font-black uppercase text-rose-500 tracking-wider">
                {profile?.bloodGroup} {profile?.role}
              </div>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
        <Link to="/" className="text-rose-600 font-black text-xl flex items-center gap-2">
          <Heart size={24} className="fill-rose-600" />
          <span>LifeLink</span>
        </Link>
        <NotificationCenter />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-20">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-rose-600 font-bold text-2xl">
            <Heart className="fill-rose-600" size={28} />
            <span>LifeLink</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-rose-50 text-rose-600 font-medium" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon size={20} className={isActive ? "text-rose-600" : "text-slate-400"} />
                {item.name}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === '/admin' 
                  ? "bg-slate-100 text-slate-900 font-medium" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Shield size={20} className={location.pathname === '/admin' ? "text-slate-900" : "text-slate-400"} />
              Admin Control
            </Link>
          )}
        </nav>

        {user && (
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => auth.signOut()}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 group font-medium"
            >
              <LogOut size={20} className="group-hover:text-rose-600" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1">
              <Icon 
                size={24} 
                className={isActive ? "text-rose-600" : "text-slate-400"} 
              />
              <span className={cn("text-[10px]", isActive ? "text-rose-600 font-medium" : "text-slate-400")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Global Action Button (Floating for mobile) */}
      {profile?.role === 'recipient' && (
        <Link 
          to="/request-blood"
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-rose-600 text-white p-4 rounded-full shadow-lg shadow-rose-200 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform z-40"
        >
          <PlusCircle size={24} />
          <span className="hidden md:inline font-medium">New Request</span>
        </Link>
      )}
    </div>
  );
}
