import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import RequestBlood from './pages/RequestBlood';
import SearchDonors from './pages/SearchDonors';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Admin from './pages/Admin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/auth" />;
  if (!profile && window.location.pathname !== '/profile') return <Navigate to="/profile" />;
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/request-blood" element={<PrivateRoute><RequestBlood /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><SearchDonors /></PrivateRoute>} />
        <Route path="/chats" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/chats/:chatId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}
