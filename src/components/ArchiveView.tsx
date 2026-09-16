import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  PlusCircle,
  Copy,
  Trash2,
  FileSpreadsheet,
  Calendar,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Edit,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Assessment } from '../types';
import { exportAssessmentToExcel } from '../utils/excelExport';
import { computeOverallStats } from '../utils/assessmentCalculations';

interface ArchiveViewProps {
  assessments: Assessment[];
  activeId: string | null;
  onSelectAssessment: (id: string) => void;
  onOpenNewModal: () => void;
  onDuplicateAssessment: (assessment: Assessment) => void;
  onDeleteAssessment: (id: string) => void;
  onEditAssessment: (assessment: Assessment) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  assessments,
  activeId,
  onSelectAssessment,
  onOpenNewModal,
  onDuplicateAssessment,
  onDeleteAssessment,
  onEditAssessment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  const subjects = Array.from(new Set(assessments.map((a) => a.subject).filter(Boolean)));

  const filtered = assessments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.className.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (filterSubject !== 'all' && a.subject !== filterSubject) return false;
    return true;
  });

  const confirmDelete = () => {
    if (assessmentToDelete) {
      onDeleteAssessment(assessmentToDelete.id);
      setAssessmentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Penyimpanan Penilaian
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              Total {assessments.length} Dokumen Asesmen
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Arsip Analisis Asesmen
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola, buka kembali, perbarui data identitas & bobot, salin format penilaian, atau hapus dokumen asesmen.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Asesmen Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari materi, kelas, atau mapel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-500">
          Menampilkan <strong>{filtered.length}</strong> asesmen
        </span>
      </div>

      {/* Grid of assessments */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
          <FolderArchive className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-slate-700">Tidak ada arsip yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ubah kata kunci pencarian atau buat analisis asesmen baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((asm) => {
            const stats = computeOverallStats(asm);
            const isActive = asm.id === activeId;

            return (
              <div
                key={asm.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700">
                      {asm.subject}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {asm.date}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-2">
                    {asm.title}
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <div>
                      {asm.className} ({asm.phase}) · {asm.semester} {asm.schoolYear}
                    </div>
                    <div>
                      KKTP: <strong className="text-slate-700">{asm.passingGrade}</strong> · {asm.pgCount} PG · {asm.essayCount} Uraian
                    </div>
                  </div>

                  {/* Micro stats */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Siswa</span>
                      <strong className="text-slate-800 font-bold">{stats.totalStudents}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Rata-rata</span>
                      <strong className="text-blue-700 font-bold">{stats.averageScore.toFixed(1)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ketuntasan</span>
                      <strong className="text-emerald-700 font-bold">{stats.passPercentage}%</strong>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions: Tersusun rapi dengan Duplikat, Ubah, Hapus, dan Lihat/Aktif */}
                <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateAssessment(asm)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 border border-slate-200/80 bg-white transition-colors"
                      title="Buat salinan asesmen ini"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Duplikat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditAssessment(asm)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 border border-amber-200/70 bg-amber-50/40 transition-colors"
                      title="Ubah identitas, mapel, KKTP, atau bobot asesmen"
                    >
                      <Edit className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ubah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssessmentToDelete(asm)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Hapus asesmen & seluruh hasil nilai"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => exportAssessmentToExcel(asm)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Download Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectAssessment(asm.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-2xs ${
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <span>{isActive ? 'Aktif' : 'Buka'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Asesmen */}
      {assessmentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Hapus Dokumen Asesmen?
                  </h3>
                  <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 mb-4 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">{assessmentToDelete.title}</div>
                <div className="text-slate-600">
                  {assessmentToDelete.subject} · {assessmentToDelete.className} ({assessmentToDelete.schoolYear})
                </div>
                <div className="text-slate-500">
                  Jumlah Siswa: {assessmentToDelete.results?.length ?? 0} data nilai
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Seluruh data identitas asesmen, lembar jawaban siswa, skor uraian, dan hasil analisis butir soal pada dokumen ini akan dihapus secara permanen dari daftar arsip.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssessmentToDelete(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Asesmen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
