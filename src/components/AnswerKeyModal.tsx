import React, { useState, useEffect, useRef } from 'react';
import { X, KeyRound, Check, RefreshCw, Clipboard, Sparkles, Sliders } from 'lucide-react';
import { Assessment, OptionChoice } from '../types';

interface AnswerKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment;
  onSaveKeys: (keys: OptionChoice[], hasOptionE: boolean) => void;
  onSaveFullConfig?: (config: {
    pgCount: number;
    pgWeight: number;
    hasOptionE: boolean;
    answerKeys: OptionChoice[];
    essayCount: number;
    essayMaxScores: number[];
  }) => void;
}

export const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({
  isOpen,
  onClose,
  assessment,
  onSaveKeys,
  onSaveFullConfig,
}) => {
  // Configuration states with real-time sync
  const [pgCount, setPgCount] = useState<number>(assessment.pgCount || 0);
  const [pgWeight, setPgWeight] = useState<number>(assessment.pgWeight || 1);
  const [essayCount, setEssayCount] = useState<number>(assessment.essayCount || 0);
  const [hasOptionE, setHasOptionE] = useState<boolean>(assessment.hasOptionE || false);

  const [keys, setKeys] = useState<OptionChoice[]>(() => {
    const existing = [...(assessment.answerKeys || [])];
    while (existing.length < (assessment.pgCount || 0)) {
      existing.push('A');
    }
    return existing.slice(0, assessment.pgCount || 0);
  });

  const [essayMaxScores, setEssayMaxScores] = useState<number[]>(() => {
    const existing = [...(assessment.essayMaxScores || [])];
    while (existing.length < (assessment.essayCount || 0)) {
      existing.push(3);
    }
    return existing.slice(0, assessment.essayCount || 0);
  });

  const [pasteInput, setPasteInput] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [uniformScoreInput, setUniformScoreInput] = useState<number>(3);

  const keyInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Synchronize PG count changes in real-time
  const handlePgCountChange = (newCount: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(newCount) ? 0 : newCount));
    setPgCount(clamped);

    setKeys((prev) => {
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

  // Synchronize Essay count changes in real-time
  const handleEssayCountChange = (newCount: number) => {
    const clamped = Math.max(0, Math.min(50, isNaN(newCount) ? 0 : newCount));
    setEssayCount(clamped);

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

  // Handle single PG key square input
  const handleKeyInputChange = (index: number, val: string) => {
    const raw = val.toUpperCase().trim();
    if (!raw) {
      const next = [...keys];
      next[index] = '';
      setKeys(next);
      return;
    }

    const lastChar = raw.slice(-1);
    const validLetters = hasOptionE ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

    if (validLetters.includes(lastChar)) {
      const next = [...keys];
      next[index] = lastChar as OptionChoice;
      setKeys(next);

      // Auto advance to next square input
      if (index < pgCount - 1) {
        keyInputRefs.current[index + 1]?.focus();
        keyInputRefs.current[index + 1]?.select();
      }
    }
  };

  const handleKeyKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !keys[index] && index > 0) {
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

  // Individual essay score change
  const handleEssayScoreChange = (index: number, val: number) => {
    const score = Math.max(1, Math.min(100, isNaN(val) ? 1 : val));
    const next = [...essayMaxScores];
    next[index] = score;
    setEssayMaxScores(next);
  };

  const handleApplyUniformEssayScore = () => {
    const val = Math.max(1, uniformScoreInput);
    setEssayMaxScores(Array.from({ length: essayCount }, () => val));
  };

  const handleApplyPaste = () => {
    if (!pasteInput.trim()) return;
    const cleaned = pasteInput.toUpperCase().replace(/[^ABCDE]/g, '').split('') as OptionChoice[];
    if (cleaned.length === 0) return;

    const next = [...keys];
    for (let i = 0; i < pgCount; i++) {
      if (cleaned[i]) {
        next[i] = cleaned[i];
      }
    }
    setKeys(next);
    setPasteInput('');
    setShowPasteBox(false);
  };

  const handleQuickPattern = (pattern: string) => {
    const chars = pattern.split('') as OptionChoice[];
    const next: OptionChoice[] = [];
    for (let i = 0; i < pgCount; i++) {
      next.push(chars[i % chars.length]);
    }
    setKeys(next);
  };

  const handleSave = () => {
    if (onSaveFullConfig) {
      onSaveFullConfig({
        pgCount,
        pgWeight: Number(pgWeight) || 1,
        hasOptionE,
        answerKeys: keys,
        essayCount,
        essayMaxScores,
      });
    } else {
      onSaveKeys(keys, hasOptionE);
    }
    onClose();
  };

  const totalPgMax = pgCount * (Number(pgWeight) || 1);
  const totalEssayMax = essayMaxScores.slice(0, essayCount).reduce((a, b) => a + (Number(b) || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Pengaturan Komposisi Soal & Kunci Jawaban
              </h3>
              <p className="text-xs text-slate-500">
                {assessment.subject} · {assessment.className} ({assessment.title})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          
          {/* Alert Banner Sesuai Referensi Gambar */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-900">
              <strong className="font-bold text-blue-700">Pengaturan Komposisi Soal:</strong>{' '}
              Atur jumlah soal dan bobotnya. Perubahan jumlah soal akan mereset sebagian tampilan input.
            </p>
          </div>

          {/* Pengaturan Komposisi Soal: 3 Kartu Berjejer Horizontal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Jml. Soal Pilihan Ganda */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Jml. Soal Pilihan Ganda
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={pgCount}
                onChange={(e) => handlePgCountChange(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Card 2: Bobot / Soal PG */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Bobot / Soal PG
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={pgWeight}
                onChange={(e) => setPgWeight(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Card 3: Jml. Soal Uraian */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Jml. Soal Uraian
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={essayCount}
                onChange={(e) => handleEssayCountChange(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Section: Input Kunci Jawaban Pilihan Ganda (Kotak Horizontal) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                Input Kunci Jawaban Pilihan Ganda
              </h4>

              <div className="flex items-center flex-wrap gap-2 text-xs">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 cursor-pointer text-slate-700 font-medium">
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
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium inline-flex items-center gap-1"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Tempel Kunci</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPattern('ABCD')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Pola ABCD
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPattern('AAAA')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Reset A
                </button>
              </div>
            </div>

            {/* Paste box */}
            {showPasteBox && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex gap-2">
                <input
                  type="text"
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="Tempel: A B C D A B C..."
                  className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg bg-white uppercase text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold"
                >
                  Terapkan
                </button>
              </div>
            )}

            {/* Row of square input boxes */}
            {pgCount > 0 ? (
              <div className="overflow-x-auto pb-3 scrollbar-thin">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-max py-1">
                  {Array.from({ length: pgCount }, (_, i) => {
                    const keyVal = keys[i] || '';
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
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs italic">
                Jumlah soal PG adalah 0
              </div>
            )}
          </div>

          {/* Section: Pengaturan Skor Maksimal Uraian Individual */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                Pengaturan Skor Maksimal Uraian
              </h4>

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
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Terapkan
                  </button>
                </div>
              )}
            </div>

            {essayCount > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                {Array.from({ length: essayCount }, (_, i) => {
                  const maxScore = essayMaxScores[i] ?? 3;
                  return (
                    <div
                      key={i}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-blue-400 transition-colors flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-slate-700 mb-2 text-center block">
                        Soal Uraian {i + 1}
                      </span>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs text-slate-500 font-medium shrink-0">
                          Max Skor:
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={maxScore}
                          onChange={(e) =>
                            handleEssayScoreChange(i, parseInt(e.target.value, 10))
                          }
                          className="w-14 px-1.5 py-1 text-center font-bold text-sm text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs italic">
                Jumlah soal Uraian adalah 0
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Total Bobot: <span className="font-bold text-slate-900">{totalPgMax + totalEssayMax} Poin</span> (PG: {totalPgMax}, Uraian: {totalEssayMax})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors"
            >
              Simpan & Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
