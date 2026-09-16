import React from 'react';
import {
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  PlusCircle,
  KeyRound,
  Printer,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BarChart2,
  Layers,
} from 'lucide-react';
import { Assessment, Student } from '../types';
import { computeOverallStats, analyzePgItems } from '../utils/assessmentCalculations';

interface DashboardViewProps {
  assessments: Assessment[];
  activeAssessment: Assessment | null;
  students: Student[];
  onNavigateTab: (tab: any) => void;
  onOpenNewModal: () => void;
  onOpenKeyModal: () => void;
  onExportExcel: () => void;
  onSelectAssessment: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assessments,
  activeAssessment,
  students,
  onNavigateTab,
  onOpenNewModal,
  onOpenKeyModal,
  onExportExcel,
  onSelectAssessment,
}) => {
  const activeStats = activeAssessment ? computeOverallStats(activeAssessment) : null;
  const activePgItems = activeAssessment ? analyzePgItems(activeAssessment) : [];

  const hardestItem = activePgItems.length > 0
    ? [...activePgItems].sort((a, b) => a.difficultyIndex - b.difficultyIndex)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-32 bottom-0 translate-y-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistem Penilaian Guru Kurikulum Merdeka</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Selamat Datang di ANALISIS ASESMEN <span className="text-amber-300 font-semibold text-xl sm:text-2xl block sm:inline">by Bu Guru Yennia</span>
          </h1>
          <p className="text-sm sm:text-base text-blue-100 mt-2 font-normal leading-relaxed">
            Koreksi otomatis pilihan ganda dan uraian, evaluasi butir soal (kesukaran & daya beda), rekapitulasi nilai, serta penyusunan program remedial & pengayaan secara cepat dan akurat.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>Buat Analisis Asesmen Baru</span>
            </button>

            {activeAssessment && (
              <button
                onClick={() => onNavigateTab('sheet')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600/60 hover:bg-blue-600/80 text-white rounded-xl font-semibold text-sm border border-white/20 transition-colors"
              >
                <span>Buka Lembar Jawaban & Nilai</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum ada data asesmen</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Anda belum memiliki data asesmen. Silakan klik tombol "Buat Analisis Asesmen Baru" di atas untuk memulai.
          </p>
        </div>
      ) : (
        <>
          {/* Main KPI Stats Row */}
          {activeAssessment && activeStats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Statistik Asesmen Aktif ({activeAssessment.subject} - {activeAssessment.title})
            </h2>
            <button
              onClick={() => onNavigateTab('recap')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Lihat Detail Statistik</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-semibold">Peserta Didik</span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {activeStats.presentStudents}{' '}
                <span className="text-xs font-normal text-slate-400">/ {activeStats.totalStudents}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {activeStats.absentStudents > 0 ? `${activeStats.absentStudents} tdk hadir` : 'Semua hadir'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-semibold">Rata-rata Nilai</span>
              <div className="text-2xl font-black text-blue-700 mt-2">
                {activeStats.averageScore.toFixed(1)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                KKTP: <strong className="text-slate-700">{activeAssessment.passingGrade}</strong>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-semibold">Ketuntasan Klasikal</span>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                {activeStats.passPercentage}%
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                {activeStats.passedCount} siswa tuntas
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-slate-500 text-xs font-semibold">Perlu Remedial</span>
              <div className="text-2xl font-black text-amber-600 mt-2">
                {activeStats.remedialCount}
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1">
                {activeStats.presentStudents > 0
                  ? `${((activeStats.remedialCount / activeStats.presentStudents) * 100).toFixed(1)}% siswa`
                  : '0%'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-slate-500 text-xs font-semibold">Nilai Tertinggi</span>
              <div className="text-2xl font-black text-indigo-700 mt-2">
                {activeStats.highestScore.toFixed(1)}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-1" title={activeStats.topStudentName}>
                {activeStats.topStudentName || 'Peraih skor terbaik'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid 2 Columns: Quick Navigation & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Quick Action Modules */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Alur Pengerjaan Analisis Asesmen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigateTab('sheet')}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  1
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  Input Lembar Jawaban & Nilai
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ketik jawaban A-D/E atau tempel baris matriks dari Excel. Nilai dan ketuntasan dihitung seketika.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('itemAnalysis')}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  2
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                  Analisis Butir Soal & Pengecoh
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Evaluasi tingkat kesukaran (P), daya beda (D), dan sebaran pilihan jawaban untuk perbaikan butir soal.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('remedial')}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  3
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                  Program Remedial & Pengayaan
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Identifikasi otomatis butir soal yang belum dikuasai siswa serta rencana tindak lanjut pembelajarannya.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('report')}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  4
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                  Cetak Laporan & Export Excel
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dokumen resmi lengkap dengan kop sekolah, tanda tangan kepala sekolah & guru kelas format Kurikulum Merdeka.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Assessment & Class Roster Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Arsip Asesmen Lainnya
          </h2>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Daftar Asesmen</span>
              <button
                onClick={() => onNavigateTab('archive')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Lihat Semua ({assessments.length})
              </button>
            </div>

            <div className="space-y-2">
              {assessments.slice(0, 4).map((asm) => {
                const isSelected = asm.id === activeAssessment?.id;
                return (
                  <div
                    key={asm.id}
                    onClick={() => onSelectAssessment(asm.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-blue-700">{asm.subject}</span>
                      <span className="text-slate-400">{asm.date}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-900 truncate">
                      {asm.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {asm.className} · KKTP: {asm.passingGrade}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onOpenNewModal}
              className="w-full mt-2 py-2 border border-dashed border-slate-300 hover:border-blue-500 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Asesmen Baru</span>
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
