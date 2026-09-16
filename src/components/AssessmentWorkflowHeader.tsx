import React from 'react';
import { Assessment, Student } from '../types';

interface AssessmentWorkflowHeaderProps {
  assessment: Assessment;
  activeWorkflowTab: 'identity' | 'students' | 'settings_key' | 'input' | 'analysis';
  onNavigateTab: (tab: 'settings_key' | 'sheet' | 'itemAnalysis') => void;
  onOpenIdentityModal: () => void;
  onOpenStudentsModal: () => void;
}

export const AssessmentWorkflowHeader: React.FC<AssessmentWorkflowHeaderProps> = ({
  assessment,
  activeWorkflowTab,
  onNavigateTab,
  onOpenIdentityModal,
  onOpenStudentsModal,
}) => {
  const studentCount = assessment.results?.length ?? 0;

  return (
    <div className="no-print bg-white border-b border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-12 px-4 sm:px-6 lg:px-8 2xl:px-12 -mt-6 mb-6">
      <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none py-1">
        
        {/* Tab 1: Identitas */}
        <button
          type="button"
          onClick={onOpenIdentityModal}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeWorkflowTab === 'identity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          title="Klik untuk melihat / mengubah Identitas Asesmen (Judul, Mapel, Kelas, KKTP)"
        >
          Identitas
        </button>

        {/* Tab 2: Data Siswa */}
        <button
          type="button"
          onClick={onOpenStudentsModal}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
            activeWorkflowTab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          title="Klik untuk mengelola siswa di kelas ini"
        >
          <span>Data Siswa</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {studentCount}
          </span>
        </button>

        {/* Tab 3: Pengaturan & Kunci */}
        <button
          type="button"
          onClick={() => onNavigateTab('settings_key')}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeWorkflowTab === 'settings_key'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          title="Pengaturan Komposisi Soal & Kunci Jawaban"
        >
          Pengaturan & Kunci
        </button>

        {/* Tab 4: Input Jawaban */}
        <button
          type="button"
          onClick={() => onNavigateTab('sheet')}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeWorkflowTab === 'input'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          title="Lembar Jawaban & Penilaian Siswa"
        >
          Input Jawaban
        </button>

        {/* Tab 5: Hasil & Analisis */}
        <button
          type="button"
          onClick={() => onNavigateTab('itemAnalysis')}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeWorkflowTab === 'analysis'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          title="Analisis Butir Soal, Daya Beda & Statistik"
        >
          Hasil & Analisis
        </button>

      </div>
    </div>
  );
};
