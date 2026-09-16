import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  CheckCircle2,
  Clipboard,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Sliders,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Assessment, OptionChoice } from '../types';
import { AssessmentWorkflowHeader } from './AssessmentWorkflowHeader';

interface AssessmentSettingsKeyViewProps {
  assessment: Assessment;
  onUpdateAssessmentConfig: (updated: {
    pgCount: number;
    pgWeight: number;
    hasOptionE: boolean;
    answerKeys: OptionChoice[];
    essayCount: number;
    essayMaxScores: number[];
  }) => void;
  onNavigateTab: (tab: 'settings_key' | 'sheet' | 'itemAnalysis') => void;
  onOpenIdentityModal: () => void;
  onOpenStudentsModal: () => void;
}

export const AssessmentSettingsKeyView: React.FC<AssessmentSettingsKeyViewProps> = ({
  assessment,
  onUpdateAssessmentConfig,
  onNavigateTab,
  onOpenIdentityModal,
  onOpenStudentsModal,
}) => {
  // Local state for real-time adjustments
  const [pgCount, setPgCount] = useState<number>(assessment.pgCount || 0);
  const [pgWeight, setPgWeight] = useState<number>(assessment.pgWeight || 1);
  const [essayCount, setEssayCount] = useState<number>(assessment.essayCount || 0);
  const [hasOptionE, setHasOptionE] = useState<boolean>(assessment.hasOptionE || false);
  const [answerKeys, setAnswerKeys] = useState<OptionChoice[]>(() => {
    const keys = [...(assessment.answerKeys || [])];
    while (keys.length < assessment.pgCount) {
      keys.push('A');
    }
    return keys.slice(0, assessment.pgCount);
  });

  const [essayMaxScores, setEssayMaxScores] = useState<number[]>(() => {
    const scores = [...(assessment.essayMaxScores || [])];
    while (scores.length < assessment.essayCount) {
      scores.push(3);
    }
    return scores.slice(0, assessment.essayCount);
  });

  const [pasteInput, setPasteInput] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [uniformScoreInput, setUniformScoreInput] = useState<number>(3);

  // References to square input elements for seamless auto-advance
  const keyInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update local state if active assessment changes
  useEffect(() => {
    setPgCount(assessment.pgCount || 0);
    setPgWeight(assessment.pgWeight || 1);
    setEssayCount(assessment.essayCount || 0);
    setHasOptionE(assessment.hasOptionE || false);

    const keys = [...(assessment.answerKeys || [])];
    while (keys.length < (assessment.pgCount || 0)) {
      keys.push('A');
    }
    setAnswerKeys(keys.slice(0, assessment.pgCount || 0));

    const scores = [...(assessment.essayMaxScores || [])];
    while (scores.length < (assessment.essayCount || 0)) {
      scores.push(3);
    }
    setEssayMaxScores(scores.slice(0, assessment.essayCount || 0));
  }, [assessment.id]);

  // Handler: Change PG Count (Real-time synchronization)
  const handlePgCountChange = (newCount: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(newCount) ? 0 : newCount));
    setPgCount(clamped);

    // Sync answerKeys array length in real time
    setAnswerKeys((prev) => {
      const next = [...prev];
      if (clamped > next.length) {
        while (next.length < clamped) {
          next.push('A');
        }
      } else if (clamped < next.length) {
        return next.slice(0, clamped);
      }
      return next;
    });
  };

  // Handler: Change Essay Count (Real-time synchronization)
  const handleEssayCountChange = (newCount: number) => {
    const clamped = Math.max(0, Math.min(50, isNaN(newCount) ? 0 : newCount));
    setEssayCount(clamped);

    // Sync essayMaxScores array length in real time
    setEssayMaxScores((prev) => {
      const next = [...prev];
      if (clamped > next.length) {
        while (next.length < clamped) {
          next.push(3);
        }
      } else if (clamped < next.length) {
        return next.slice(0, clamped);
      }
      return next;
    });
  };

  // Handler: Change individual Answer Key in square input
  const handleKeyInputChange = (index: number, val: string) => {
    const raw = val.toUpperCase().trim();
    if (!raw) {
      const next = [...answerKeys];
      next[index] = '';
      setAnswerKeys(next);
      return;
    }

    const lastChar = raw.slice(-1);
    const validLetters = hasOptionE ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

    if (validLetters.includes(lastChar)) {
      const next = [...answerKeys];
      next[index] = lastChar as OptionChoice;
      setAnswerKeys(next);

      // Auto-advance to next square box
      if (index < pgCount - 1) {
        keyInputRefs.current[index + 1]?.focus();
        keyInputRefs.current[index + 1]?.select();
      }
    }
  };

  // Handler: Keyboard navigation (Backspace to go back, Arrows to move)
  const handleKeyKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !answerKeys[index] && index > 0) {
      keyInputRefs.current[index - 1]?.focus();
      keyInputRefs.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < pgCount - 1) {
      keyInputRefs.current[index + 1]?.focus();
      keyInputRefs.current[index + 1]?.select();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      keyInputRefs.current[index - 1]?.focus();
      keyInputRefs.current[index - 1]?.select();
    }
  };

  // Handler: Change individual Essay Max Score
  const handleIndividualEssayScoreChange = (index: number, val: number) => {
    const score = Math.max(1, Math.min(100, isNaN(val) ? 1 : val));
    const next = [...essayMaxScores];
    next[index] = score;
    setEssayMaxScores(next);
  };

  // Quick Action: Set uniform score to all essay questions
  const handleApplyUniformEssayScore = () => {
    const val = Math.max(1, uniformScoreInput);
    setEssayMaxScores(Array.from({ length: essayCount }, () => val));
  };

  // Quick Action: Paste answers string (e.g. "ABCDABCD")
  const handleApplyPaste = () => {
    if (!pasteInput.trim()) return;
    const cleaned = pasteInput.toUpperCase().replace(/[^ABCDE]/g, '').split('') as OptionChoice[];
    if (cleaned.length === 0) return;

    const next = [...answerKeys];
    for (let i = 0; i < pgCount; i++) {
      if (cleaned[i]) {
        next[i] = cleaned[i];
      }
    }
    setAnswerKeys(next);
    setPasteInput('');
    setShowPasteBox(false);
  };

  // Quick Action: Pattern A-B-C-D or reset to A
  const handleApplyPattern = (pattern: string) => {
    const chars = pattern.split('') as OptionChoice[];
    const next: OptionChoice[] = [];
    for (let i = 0; i < pgCount; i++) {
      next.push(chars[i % chars.length]);
    }
    setAnswerKeys(next);
  };

  // Save Configuration to Assessment
  const handleSaveConfig = () => {
    onUpdateAssessmentConfig({
      pgCount,
      pgWeight: Number(pgWeight) || 1,
      hasOptionE,
      answerKeys,
      essayCount,
      essayMaxScores,
    });

    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
    }, 2800);
  };

  // Calculations for summary card
  const totalPgMax = pgCount * (Number(pgWeight) || 1);
  const totalEssayMax = essayMaxScores.slice(0, essayCount).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const grandTotalMax = totalPgMax + totalEssayMax;

  return (
    <div className="w-full">
      {/* Sub Navigation Bar: Identitas | Data Siswa | Pengaturan & Kunci | Input Jawaban | Hasil & Analisis */}
      <AssessmentWorkflowHeader
        assessment={assessment}
        activeWorkflowTab="settings_key"
        onNavigateTab={onNavigateTab}
        onOpenIdentityModal={onOpenIdentityModal}
        onOpenStudentsModal={onOpenStudentsModal}
      />

      {/* Alert Banner Sesuai Referensi Gambar */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 sm:p-4 mb-6">
        <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
          <strong className="font-bold text-blue-700">Pengaturan Komposisi Soal:</strong>{' '}
          Atur jumlah soal dan bobotnya. Perubahan jumlah soal akan mereset sebagian tampilan input.
        </p>
      </div>

      {/* Pengaturan Komposisi Soal: 3 Kartu Berjejer Horizontal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Kartu 1: Jml. Soal Pilihan Ganda */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Jml. Soal Pilihan Ganda
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={pgCount}
            onChange={(e) => handlePgCountChange(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-base sm:text-lg font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            placeholder="0"
          />
          <span className="text-[11px] text-slate-400 mt-1.5 block">
            Rentang umum: 10 - 50 soal PG
          </span>
        </div>

        {/* Kartu 2: Bobot / Soal PG */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Bobot / Soal PG
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={pgWeight}
            onChange={(e) => setPgWeight(parseFloat(e.target.value) || 1)}
            className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-base sm:text-lg font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            placeholder="1"
          />
          <span className="text-[11px] text-slate-400 mt-1.5 block">
            Nilai standar per butir benar: 1 poin
          </span>
        </div>

        {/* Kartu 3: Jml. Soal Uraian */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Jml. Soal Uraian
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={essayCount}
            onChange={(e) => handleEssayCountChange(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-base sm:text-lg font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            placeholder="0"
          />
          <span className="text-[11px] text-slate-400 mt-1.5 block">
            Rentang umum: 3 - 10 butir uraian
          </span>
        </div>
      </div>

      {/* Bagian Input Kunci Jawaban Pilihan Ganda (Kotak Horizontal Sesuai Referensi) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Input Kunci Jawaban Pilihan Ganda
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ketik huruf (A/B/C/D{hasOptionE ? '/E' : ''}) pada kotak. Kursor otomatis bergeser ke kotak berikutnya.
            </p>
          </div>

          {/* Tombol Alat Cepat Kunci PG */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 cursor-pointer text-slate-700 font-medium select-none transition-colors">
              <input
                type="checkbox"
                checked={hasOptionE}
                onChange={(e) => setHasOptionE(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Opsi E (SMA/SMK)</span>
            </label>

            <button
              type="button"
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              title="Tempel teks kunci sekaligus"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Tempel Kunci</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPattern('ABCD')}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              title="Isi otomatis pola A-B-C-D"
            >
              Pola A-B-C-D
            </button>

            <button
              type="button"
              onClick={() => handleApplyPattern('AAAA')}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              title="Reset semua kunci ke A"
            >
              Reset ke A
            </button>
          </div>
        </div>

        {/* Modal/Collapse Tempel Cepat */}
        {showPasteBox && (
          <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs">
            <label className="font-semibold text-amber-900 block mb-1">
              Tempel deretan kunci jawaban (Contoh: "ABCDA..." atau dipisah spasi):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder="Contoh: A B C D A B C D A..."
                className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg bg-white uppercase text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleApplyPaste}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}

        {/* Deretan Kotak Input Teks Tunggal Berjajar Rapi ke Samping */}
        {pgCount > 0 ? (
          <div className="overflow-x-auto pb-3 scrollbar-thin">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max py-1">
              {Array.from({ length: pgCount }, (_, i) => {
                const keyVal = answerKeys[i] || '';
                return (
                  <div key={i} className="flex flex-col items-center shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 mb-1 text-center select-none">
                      {i + 1}
                    </span>
                    <input
                      ref={(el) => (keyInputRefs.current[i] = el)}
                      type="text"
                      maxLength={1}
                      value={keyVal}
                      onChange={(e) => handleKeyInputChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className={`w-9 h-9 sm:w-10 sm:h-10 text-center uppercase font-bold text-sm sm:text-base border rounded-lg transition-all focus:outline-hidden shadow-2xs ${
                        keyVal
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                          : 'border-amber-300 bg-amber-50/50 text-amber-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                      title={`Kunci Jawaban Soal Nomor ${i + 1}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm italic">
            Jumlah soal Pilihan Ganda adalah 0. Tambah angka pada kolom Jml. Soal Pilihan Ganda di atas untuk memunculkan kotak kunci.
          </div>
        )}
      </div>

      {/* Bagian Pengaturan Skor Maksimal Uraian Individual (Sesuai Referensi Gambar) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Pengaturan Skor Maksimal Uraian
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur batas nilai maksimal pada setiap butir soal uraian secara individual dan fleksibel.
            </p>
          </div>

          {/* Quick Helper: Samakan Skor Semua Uraian */}
          {essayCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Set seragam:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={uniformScoreInput}
                onChange={(e) => setUniformScoreInput(parseInt(e.target.value, 10) || 1)}
                className="w-12 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleApplyUniformEssayScore}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                title="Terapkan angka ini ke semua soal uraian"
              >
                Terapkan ke Semua
              </button>
            </div>
          )}
        </div>

        {/* Kartu-Kartu Input Individual Batas Nilai Maksimal Uraian */}
        {essayCount > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
            {Array.from({ length: essayCount }, (_, i) => {
              const maxScore = essayMaxScores[i] ?? 3;
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-700 mb-2.5 text-center block">
                    Soal Uraian {i + 1}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-500 font-medium shrink-0">
                      Max Skor:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxScore}
                      onChange={(e) =>
                        handleIndividualEssayScoreChange(i, parseInt(e.target.value, 10))
                      }
                      className="w-16 px-2 py-1 text-center font-bold text-sm text-slate-900 border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden transition-colors"
                      title={`Batas Nilai Maksimal Soal Uraian ${i + 1}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm italic">
            Jumlah soal Uraian adalah 0. Tambah angka pada kolom Jml. Soal Uraian di atas untuk memunculkan kartu skor.
          </div>
        )}
      </div>

      {/* Ringkasan Bobot & Tombol Aksi Simpan */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-4 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Total Skor PG:</span>
            <span className="font-bold text-slate-900">{totalPgMax}</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Total Skor Uraian:</span>
            <span className="font-bold text-slate-900">{totalEssayMax}</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
            <span className="text-blue-700 font-medium">Grand Total Skor:</span>
            <span className="font-extrabold text-blue-800">{grandTotalMax} Poin</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {savedToast && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan & Kunci Berhasil Disimpan!</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveConfig}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan & Kunci</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('sheet')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-colors"
          >
            <span>Buka Input Jawaban</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
