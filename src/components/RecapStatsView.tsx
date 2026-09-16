import React from 'react';
import {
  Award,
  TrendingUp,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Assessment } from '../types';
import { computeOverallStats, evaluateStudentResult } from '../utils/assessmentCalculations';
import { useStudentsContext } from '../contexts/StudentContext';
import { useEffect } from 'react';

interface RecapStatsViewProps {
  assessment: Assessment;
}

export const RecapStatsView: React.FC<RecapStatsViewProps> = ({ assessment }) => {
  const { students, isLoading, refreshStudents } = useStudentsContext();

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  // Enrich assessment results with real names from context before computing stats
  const enrichedAssessment = {
    ...assessment,
    results: assessment.results.map((r) => {
      const student = students.find(s => s.id === r.studentId);
      return {
        ...r,
        studentName: student?.name || r.studentName || '-',
        studentNis: student?.nis || r.studentNis || '-',
        gender: student?.gender || r.gender || 'L'
      };
    })
  };

  const stats = computeOverallStats(enrichedAssessment);
  const evaluatedResults = enrichedAssessment.results.map((r) => evaluateStudentResult(r, enrichedAssessment));

  // Sort by final score descending for rank list
  const ranked = [...evaluatedResults]
    .filter((r) => r.attendance === 'Hadir')
    .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

  const isClassMastered = stats.passPercentage >= 85;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-500">Memuat data siswa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Rekapitulasi Nilai & Ketuntasan Klasikal
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                KKTP: <strong className="text-blue-700 font-bold">{assessment.passingGrade}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Statistik Hasil Asesmen {assessment.subject}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {assessment.className} · {assessment.semester} {assessment.schoolYear} · {assessment.title}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 ${
                isClassMastered
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {isClassMastered ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Ketuntasan Klasikal
                </div>
                <div className="text-sm font-extrabold">
                  {stats.passPercentage}% ({isClassMastered ? 'Tuntas Klasikal ≥ 85%' : 'Belum Tuntas Klasikal'})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Grid Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 text-xs font-semibold block mb-1">Peserta Hadir</span>
            <div className="text-2xl font-black text-slate-900">
              {stats.presentStudents}{' '}
              <span className="text-xs text-slate-400 font-medium">/ {stats.totalStudents}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 text-xs font-semibold block mb-1">Rata-rata Nilai</span>
            <div className="text-2xl font-black text-blue-700">
              {stats.averageScore.toFixed(1)}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 text-xs font-semibold block mb-1">Nilai Tertinggi</span>
            <div className="text-2xl font-black text-emerald-600">
              {stats.highestScore.toFixed(1)}
            </div>
            {stats.topStudentName && (
              <div className="text-[10px] text-slate-500 truncate mt-0.5" title={stats.topStudentName}>
                {stats.topStudentName}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 text-xs font-semibold block mb-1">Nilai Terendah</span>
            <div className="text-2xl font-black text-rose-600">
              {stats.lowestScore.toFixed(1)}
            </div>
            {stats.lowestStudentName && (
              <div className="text-[10px] text-slate-500 truncate mt-0.5" title={stats.lowestStudentName}>
                {stats.lowestStudentName}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 text-xs font-semibold block mb-1">Nilai Median</span>
            <div className="text-2xl font-black text-slate-800">
              {stats.medianScore.toFixed(1)}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 text-xs font-semibold block mb-1">Siswa Remedial</span>
            <div className="text-2xl font-black text-amber-600">
              {stats.remedialCount}
            </div>
            <div className="text-[10px] text-slate-400">
              {stats.presentStudents > 0
                ? `${((stats.remedialCount / stats.presentStudents) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts: Score Distribution and Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribution Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Distribusi Rentang Nilai</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Klasifikasi tingkat penguasaan kompetensi siswa
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-emerald-800">Sangat Baik (≥ 85)</span>
                  <span className="font-bold">{stats.scoreDistribution.excellent} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${stats.presentStudents > 0 ? (stats.scoreDistribution.excellent / stats.presentStudents) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-blue-800">Baik (75 - 84)</span>
                  <span className="font-bold">{stats.scoreDistribution.good} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{
                      width: `${stats.presentStudents > 0 ? (stats.scoreDistribution.good / stats.presentStudents) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-amber-800">Cukup (60 - 74)</span>
                  <span className="font-bold">{stats.scoreDistribution.fair} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${stats.presentStudents > 0 ? (stats.scoreDistribution.fair / stats.presentStudents) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-rose-800">Perlu Bimbingan (&lt; 60)</span>
                  <span className="font-bold">{stats.scoreDistribution.poor} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{
                      width: `${stats.presentStudents > 0 ? (stats.scoreDistribution.poor / stats.presentStudents) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Target Kurikulum Merdeka:</strong> Pembelajaran berdiferensiasi diberikan kepada kelompok yang belum mencapai KKTP melalui intervensi bertahap.
          </div>
        </div>

        {/* Bar Visualizer per student */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Sebaran Skor Siswa Terhadap KKTP</span>
              </h3>
              <p className="text-xs text-slate-500">
                Garis merah menunjukkan batas kelulusan KKTP ({assessment.passingGrade})
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600">
              {ranked.length} Siswa Diurutkan Berdasarkan Nilai
            </div>
          </div>

          {/* Canvas Chart Area */}
          <div className="relative flex-1 min-h-[200px] flex items-end gap-1 pt-8 pb-4 border-b border-slate-200">
            {/* KKTP threshold line */}
            <div
              className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500 pointer-events-none z-10 flex items-center justify-end pr-2"
              style={{ bottom: `${assessment.passingGrade}%` }}
            >
              <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                KKTP: {assessment.passingGrade}
              </span>
            </div>

            {ranked.map((s, idx) => {
              const score = s.finalScore ?? 0;
              const isPassed = score >= assessment.passingGrade;

              return (
                <div
                  key={s.studentId}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {s.studentName}: <strong>{score.toFixed(1)}</strong> ({isPassed ? 'Tuntas' : 'Remedi'})
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isPassed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                    style={{ height: `${Math.max(4, score)}%` }}
                  />
                  <span className="text-[8px] text-slate-400 font-mono mt-1 select-none">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>Peringkat 1 (Tertinggi)</span>
            <span>Peringkat Terakhir</span>
          </div>
        </div>
      </div>

      {/* Full Ranked Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Daftar Peringkat Nilai Siswa
            </h3>
            <p className="text-xs text-slate-500">
              Diurutkan dari nilai akhir tertinggi ke terendah
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            {ranked.length} Siswa Hadir
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-14">Rank</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-2 text-center w-14">L/P</th>
                <th className="py-2.5 px-3 text-center w-24">PG Benar</th>
                <th className="py-2.5 px-3 text-center w-24">Skor Uraian</th>
                <th className="py-2.5 px-3 text-center w-28">Nilai Akhir</th>
                <th className="py-2.5 px-3 text-center w-28">Ketuntasan</th>
                <th className="py-2.5 px-4">Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {ranked.map((s, idx) => (
                <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {s.studentName}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-600">
                    {s.gender}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {s.pgCorrectCount} / {assessment.pgCount}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-900">
                    {s.essayTotalScore}
                  </td>
                  <td className="py-2.5 px-3 text-center font-extrabold text-sm">
                    <span className={s.isPassed ? 'text-emerald-700' : 'text-rose-600'}>
                      {s.finalScore?.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {s.isPassed ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        TUNTAS
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                        REMEDIAL
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {s.isPassed
                      ? 'Diberikan pengayaan / tugas lanjutan'
                      : `Remedial pada soal: ${(s.remedialQuestions || []).join(', ') || '-'}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
