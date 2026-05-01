import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Heart, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        navigate('/dashboard');
      } else {
        navigate('/profile');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-600 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-rose-100 p-4 rounded-full">
            <Heart className="text-rose-600 fill-rose-600" size={48} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">LifeLink</h1>
        <p className="text-slate-500 mb-8">Connecting blood donors with those in need, in real-time.</p>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 px-6 rounded-2xl hover:bg-slate-800 transition-colors font-medium"
          >
            <Chrome size={20} />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Coming soon</span>
            </div>
          </div>

          <button
            disabled
            className="w-full flex items-center justify-center gap-3 bg-slate-50 text-slate-300 py-4 px-6 rounded-2xl cursor-not-allowed font-medium border border-slate-100"
          >
            Sign up with Email
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          By continuing, you agree to LifeLink's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
