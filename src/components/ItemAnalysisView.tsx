import React, { useState } from 'react';
import {
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileQuestion,
  Sparkles,
  Award,
} from 'lucide-react';
import { Assessment } from '../types';
import { analyzePgItems, analyzeEssayItems } from '../utils/assessmentCalculations';

interface ItemAnalysisViewProps {
  assessment: Assessment;
}

export const ItemAnalysisView: React.FC<ItemAnalysisViewProps> = ({ assessment }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pg' | 'essay'>('pg');

  const pgItems = analyzePgItems(assessment);
  const essayItems = analyzeEssayItems(assessment);

  // Summary counts
  const diffSummary = {
    sukar: pgItems.filter((i) => i.difficultyCategory === 'Sukar').length,
    sedang: pgItems.filter((i) => i.difficultyCategory === 'Sedang').length,
    mudah: pgItems.filter((i) => i.difficultyCategory === 'Mudah').length,
  };

  const discSummary = {
    sangatBaik: pgItems.filter((i) => i.discriminationCategory === 'Sangat Baik').length,
    baik: pgItems.filter((i) => i.discriminationCategory === 'Baik').length,
    cukup: pgItems.filter((i) => i.discriminationCategory === 'Cukup').length,
    jelek: pgItems.filter((i) => i.discriminationCategory === 'Jelek').length,
  };

  const recSummary = {
    diterima: pgItems.filter((i) => i.recommendation === 'Diterima').length,
    revisi: pgItems.filter((i) => i.recommendation === 'Revisi Butir').length,
    dibuang: pgItems.filter((i) => i.recommendation === 'Dibuang/Diganti').length,
  };

  // Find hardest & easiest questions
  const sortedByP = [...pgItems].sort((a, b) => a.difficultyIndex - b.difficultyIndex);
  const hardestQuestion = sortedByP[0];
  const easiestQuestion = sortedByP[sortedByP.length - 1];

  return (
    <div className="space-y-5">
      {/* Title & Stats Ribbon */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Analisis Kualitas Instrumen Soal
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                Metode Standar Evaluasi Pendidikan
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Tingkat Kesukaran & Daya Beda Soal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {assessment.title} ({assessment.subject} · {assessment.className})
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('pg')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSubTab === 'pg'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pilihan Ganda ({assessment.pgCount} Butir)
            </button>
            <button
              onClick={() => setActiveSubTab('essay')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSubTab === 'essay'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Soal Uraian ({assessment.essayCount} Butir)
            </button>
          </div>
        </div>

        {/* Quick summary cards for PG */}
        {activeSubTab === 'pg' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-semibold block mb-1">Tingkat Kesukaran (P)</span>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">{diffSummary.sukar} Sukar</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">{diffSummary.sedang} Sedang</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">{diffSummary.mudah} Mudah</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-semibold block mb-1">Daya Pembeda (D)</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-emerald-700 font-bold">{discSummary.sangatBaik + discSummary.baik} Baik</span>
                <span className="text-slate-300">·</span>
                <span className="text-amber-700 font-bold">{discSummary.cukup} Cukup</span>
                <span className="text-slate-300">·</span>
                <span className="text-rose-700 font-bold">{discSummary.jelek} Kurang</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-semibold block mb-1">Kelayakan Butir Soal</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold">
                  {recSummary.diterima} Diterima
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold">
                  {recSummary.revisi} Revisi
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80">
              <span className="text-blue-900 font-semibold block mb-1">Soal Paling Menantang</span>
              {hardestQuestion ? (
                <div className="font-extrabold text-blue-800">
                  Nomor #{hardestQuestion.questionNumber} (P: {hardestQuestion.difficultyIndex})
                </div>
              ) : (
                <div>-</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis Table */}
      {activeSubTab === 'pg' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-2 text-center w-14">Kunci</th>
                  <th className="py-3 px-2 text-center w-16">Jml Benar</th>
                  <th className="py-3 px-2 text-center w-20">Indeks P</th>
                  <th className="py-3 px-3 w-24">Kesukaran</th>
                  <th className="py-3 px-2 text-center w-20">Indeks D</th>
                  <th className="py-3 px-3 w-28">Daya Beda</th>
                  <th className="py-3 px-3 w-28">Rekomendasi</th>
                  <th className="py-3 px-4 text-center">Distribusi Jawaban Siswa (A / B / C / D / E)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {pgItems.map((item) => {
                  let pBadge = 'bg-blue-100 text-blue-800';
                  if (item.difficultyCategory === 'Sukar') pBadge = 'bg-rose-100 text-rose-800 font-bold';
                  if (item.difficultyCategory === 'Mudah') pBadge = 'bg-emerald-100 text-emerald-800 font-bold';

                  let dBadge = 'bg-slate-100 text-slate-800';
                  if (item.discriminationCategory === 'Sangat Baik' || item.discriminationCategory === 'Baik') {
                    dBadge = 'bg-emerald-100 text-emerald-800 font-bold';
                  } else if (item.discriminationCategory === 'Cukup') {
                    dBadge = 'bg-amber-100 text-amber-800 font-bold';
                  } else {
                    dBadge = 'bg-rose-100 text-rose-800 font-bold';
                  }

                  let recBadge = 'bg-emerald-600 text-white';
                  if (item.recommendation === 'Revisi Butir') recBadge = 'bg-amber-500 text-white';
                  if (item.recommendation === 'Dibuang/Diganti') recBadge = 'bg-rose-600 text-white';

                  const optionsList = assessment.hasOptionE ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

                  return (
                    <tr key={item.questionNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700 bg-slate-50/50">
                        #{item.questionNumber}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-extrabold inline-flex items-center justify-center text-xs">
                          {item.correctAnswer || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                        {item.correctCount} / {item.totalParticipants}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                        {item.difficultyIndex.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${pBadge}`}>
                          {item.difficultyCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                        {item.discriminationIndex.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${dBadge}`}>
                          {item.discriminationCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${recBadge}`}>
                          {item.recommendation}
                        </span>
                      </td>
                      
                      {/* Distractor frequencies */}
                      <td className="py-2 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {optionsList.map((opt) => {
                            const isKey = opt === item.correctAnswer;
                            const count = item.distractorCounts[opt] || 0;
                            return (
                              <div
                                key={opt}
                                className={`px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 ${
                                  isKey
                                    ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                    : count > 0
                                    ? 'bg-slate-100 text-slate-700 font-medium'
                                    : 'bg-slate-50 text-slate-300'
                                }`}
                                title={`Pilihan ${opt}: ${count} siswa`}
                              >
                                <span>{opt}:</span>
                                <strong>{count}</strong>
                              </div>
                            );
                          })}
                          {item.distractorCounts['Kosong'] > 0 && (
                            <span className="text-[10px] text-slate-400 italic">
                              ({item.distractorCounts['Kosong']} tdk jawab)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Educational Legend */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Pedoman Tingkat Kesukaran (P):</h4>
              <ul className="space-y-0.5 list-disc list-inside">
                <li><strong>P &lt; 0.30</strong> : Soal Sukar (Perlu telaah kejelasan materi / stimulasi)</li>
                <li><strong>0.30 ≤ P ≤ 0.70</strong> : Soal Sedang (Kategori butir soal ideal)</li>
                <li><strong>P &gt; 0.70</strong> : Soal Mudah (Sebagian besar siswa telah menguasai)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Pedoman Daya Pembeda (D):</h4>
              <ul className="space-y-0.5 list-disc list-inside">
                <li><strong>D ≥ 0.40</strong> : Sangat Baik (Mampu membedakan siswa pandai & kurang)</li>
                <li><strong>0.30 ≤ D &lt; 0.40</strong> : Baik (Diterima tanpa revisi)</li>
                <li><strong>0.20 ≤ D &lt; 0.30</strong> : Cukup (Perlu perbaikan redaksi / opsi pengecoh)</li>
                <li><strong>D &lt; 0.20</strong> : Jelek (Sebaiknya dibuang atau diganti butir baru)</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Essay Analysis View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 text-center w-14">Nomor</th>
                  <th className="py-3 px-3 text-center w-24">Skor Maks</th>
                  <th className="py-3 px-3 text-center w-28">Total Skor</th>
                  <th className="py-3 px-3 text-center w-28">Rata-rata Skor</th>
                  <th className="py-3 px-3 text-center w-28">Persentase</th>
                  <th className="py-3 px-4 w-36">Kategori Penguasaan</th>
                  <th className="py-3 px-4">Tindak Lanjut Pedagogik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {essayItems.map((item) => {
                  let badge = 'bg-blue-100 text-blue-800 font-bold';
                  if (item.category === 'Sangat Baik') badge = 'bg-emerald-100 text-emerald-800 font-bold';
                  if (item.category === 'Perlu Bimbingan') badge = 'bg-rose-100 text-rose-800 font-bold';

                  return (
                    <tr key={item.questionNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50/50">
                        Uraian #{item.questionNumber}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {item.maxScore}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-900">
                        {item.totalScoreAcquired}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {item.averageScore.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {item.percentageScore}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs ${badge}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.category === 'Sangat Baik'
                          ? 'Materi uraian dikuasai dengan baik oleh mayoritas siswa. Pertahankan model soal dan rubrik.'
                          : item.category === 'Baik'
                          ? 'Pemahaman siswa memadai. Perlu penguatan pada ketepatan perincian jawaban.'
                          : item.category === 'Cukup'
                          ? 'Perlu latihan menulis dan penyusunan argumen/jawaban sistematis.'
                          : 'Perlu pengulangan materi dan penjelasan langkah-langkah penyelesaian secara mendalam.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
