import React from 'react';
import { supabase } from '../lib/supabase';
import { Clock, LogOut } from 'lucide-react';

export const PendingView: React.FC = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-center p-8">
        <div className="w-20 h-20 rounded-full bg-amber-50 border-8 border-amber-100/50 text-amber-500 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Akun Pending Aktivasi</h2>
        
        <p className="text-slate-600 mb-8 leading-relaxed">
          Akun Anda berhasil terdaftar dan saat ini sedang menunggu aktivasi dari Admin. 
          Silakan konfirmasi pembayaran jika belum, atau tunggu proses verifikasi.
        </p>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};
