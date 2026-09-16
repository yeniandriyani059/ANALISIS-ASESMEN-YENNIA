import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Sparkles,
  Printer,
  FolderArchive,
  PlusCircle,
  KeyRound,
  Users,
  Settings,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { Assessment } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'settings_key'
  | 'sheet'
  | 'itemAnalysis'
  | 'recap'
  | 'remedial'
  | 'report'
  | 'archive';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  assessments?: Assessment[];
  activeAssessment: Assessment | null;
  onSelectAssessment?: (id: string) => void;
  onOpenNewModal: () => void;
  onOpenKeyModal: () => void;
  onOpenStudentsModal: () => void;
  onOpenProfileModal: () => void;
  onExportExcel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeAssessment,
  onOpenNewModal,
  onOpenKeyModal,
  onOpenStudentsModal,
  onOpenProfileModal,
  onExportExcel,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings_key', label: 'Pengaturan & Kunci', icon: KeyRound },
    { id: 'sheet', label: 'Lembar Jawaban & Nilai', icon: FileSpreadsheet },
    { id: 'itemAnalysis', label: 'Analisis Butir Soal', icon: BarChart3 },
    { id: 'recap', label: 'Rekap & Statistik', icon: TrendingUp },
    { id: 'remedial', label: 'Remedial & Pengayaan', icon: Sparkles },
    { id: 'report', label: 'Cetak Laporan Resmi', icon: Printer },
    { id: 'archive', label: 'Arsip Penilaian', icon: FolderArchive },
  ];

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Baris Pertama: Header Utama (Judul di kiri, Tombol Aksi di kanan) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Sisi Kiri: Logo & Judul Aplikasi */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base md:text-lg">
                  ANALISIS ASESMEN <span className="text-blue-600 font-semibold text-xs sm:text-sm">by Bu Guru Yennia</span>
                </span>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 uppercase tracking-wider">
                  Kurikulum Merdeka
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                {activeAssessment?.schoolName || 'Sistem Evaluasi Pembelajaran & Butir Soal'}
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Deretan Tombol Aksi Merapat ke Ujung Kanan */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Asesmen Baru (Aksi Utama) */}
            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
              title="Buat Analisis Asesmen Baru"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Asesmen Baru</span>
            </button>

            {/* Tombol Kunci Jawaban PG */}
            {activeAssessment && (
              <button
                onClick={onOpenKeyModal}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-semibold transition-colors cursor-pointer"
                title="Atur Kunci Jawaban Pilihan Ganda"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Kunci PG</span>
              </button>
            )}

            {/* Tombol Export Excel */}
            {activeAssessment && (
              <button
                onClick={onExportExcel}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold transition-colors cursor-pointer"
                title="Download Dokumen Excel Lengkap (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            )}

            {/* Tombol Kelola Data Siswa */}
            <button
              onClick={onOpenStudentsModal}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80 transition-colors cursor-pointer"
              title="Kelola Master Data Siswa"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Tombol Pengaturan Profil Sekolah */}
            <button
              onClick={onOpenProfileModal}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80 transition-colors cursor-pointer"
              title="Pengaturan Kop Sekolah & Tanda Tangan"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-slate-200 mx-0.5 hidden sm:block"></div>

            {/* Tombol Logout */}
            <button
              onClick={async () => {
                const { supabase } = await import('../lib/supabase');
                await supabase.auth.signOut();
              }}
              className="p-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/80 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline-block text-xs font-bold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Baris Kedua: Menu Tab Navigasi Horizontal */}
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 bg-slate-50/70">
        <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

