import React, { useState } from 'react';
import {
  HeartHandshake,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Printer,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import { Assessment, StudentAssessmentResult } from '../types';
import { evaluateStudentResult } from '../utils/assessmentCalculations';

import { useStudentsContext } from '../contexts/StudentContext';
import { useEffect } from 'react';

interface RemedialEnrichmentViewProps {
  assessment: Assessment;
  onUpdateResults: (results: StudentAssessmentResult[]) => void;
  onPrintRequest: () => void;
}

export const RemedialEnrichmentView: React.FC<RemedialEnrichmentViewProps> = ({
  assessment,
  onUpdateResults,
  onPrintRequest,
}) => {
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

  const evaluated = enrichedAssessment.results.map((r) => evaluateStudentResult(r, enrichedAssessment));

  const remedialList = evaluated.filter((r) => r.attendance === 'Hadir' && !r.isPassed);
  const enrichmentList = evaluated.filter((r) => r.attendance === 'Hadir' && r.isPassed);
  const totalPresent = remedialList.length + enrichmentList.length;

  const remedialPercentage = totalPresent > 0 ? (remedialList.length / totalPresent) * 100 : 0;

  // Track remedial test scores entered by teacher
  const handleRemedialScoreChange = (studentId: string, val: string) => {
    const num = val === '' ? undefined : Number(val);
    const nextResults = assessment.results.map((r) => {
      if (r.studentId !== studentId) return r;
      return {
        ...r,
        remedialScore: num,
      };
    });
    onUpdateResults(nextResults);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-500">Memuat data remedial siswa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Strategy Alert */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                Tindak Lanjut Asesmen
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                KKTP: <strong className="text-blue-700 font-bold">{assessment.passingGrade}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Program Remedial & Pengayaan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {assessment.subject} · {assessment.className} · {assessment.title}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrintRequest}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Program Tindak Lanjut</span>
            </button>
          </div>
        </div>

        {/* Pedagogical Guidance based on Permendikbud / Kurikulum Merdeka */}
        <div className="mt-5 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-900">
                Diagnosa & Strategi Pembelajaran Remedial:
              </p>
              <p className="text-blue-800 leading-relaxed">
                {remedialPercentage > 50
                  ? `Sebanyak ${remedialList.length} dari ${totalPresent} siswa (${remedialPercentage.toFixed(1)}%) belum mencapai KKTP (> 50%). Direkomendasikan melakukan Pembelajaran Ulang secara Klasikal dengan metode atau media yang berbeda sebelum tes ulang.`
                  : remedialPercentage >= 20
                  ? `Sebanyak ${remedialList.length} siswa (${remedialPercentage.toFixed(1)}%) memerlukan remedial. Direkomendasikan bimbingan dalam kelompok belajar kecil atau pemanfaatan tutor sebaya dari kelompok pengayaan.`
                  : remedialList.length > 0
                  ? `Hanya ${remedialList.length} siswa (${remedialPercentage.toFixed(1)}%) belum tuntas. Direkomendasikan bimbingan secara perorangan dan pemberian tugas khusus terarah pada indikator yang belum dikuasai.`
                  : `Hebat! Seluruh siswa telah mencapai KKTP. Seluruh kelas siap melanjutkan ke lingkup materi berikutnya atau diberikan proyek pengayaan kontekstual.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: Remedial vs Pengayaan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Remedial Section */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm">
                  Kelompok Siswa Remedial ({remedialList.length} Siswa)
                </h3>
                <p className="text-[11px] text-amber-700">
                  Peserta didik dengan perolehan nilai di bawah KKTP ({assessment.passingGrade})
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 overflow-x-auto">
            {remedialList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-700">Semua Siswa Tuntas!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tidak ada peserta didik yang memerlukan program remedial untuk asesmen ini.
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-center w-10">No</th>
                    <th className="py-2 px-2">Nama Siswa</th>
                    <th className="py-2 px-2 text-center w-16">Nilai Awal</th>
                    <th className="py-2 px-3">Butir Soal Belum Dikuasai</th>
                    <th className="py-2 px-2 text-center w-20">Nilai Remedi</th>
                    <th className="py-2 px-2 text-center w-20">Status Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {remedialList.map((s, idx) => {
                    const rawStudent = assessment.results.find((r) => r.studentId === s.studentId);
                    const remScore = rawStudent?.remedialScore;
                    const isNowPassed = remScore !== undefined && remScore >= assessment.passingGrade;

                    return (
                      <tr key={s.studentId} className="hover:bg-amber-50/40">
                        <td className="py-2.5 px-2 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-slate-900">
                          {s.studentName}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-rose-600">
                          {s.finalScore?.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3">
                          {s.remedialQuestions && s.remedialQuestions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.remedialQuestions.map((q) => (
                                <span
                                  key={q}
                                  className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]"
                                >
                                  #{q}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="-"
                            value={remScore ?? ''}
                            onChange={(e) => handleRemedialScoreChange(s.studentId, e.target.value)}
                            className="w-16 px-1.5 py-1 text-center font-bold border border-slate-300 rounded-md text-xs text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {isNowPassed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Tuntas
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Proses
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 bg-amber-50/40 border-t border-amber-100 text-xs text-amber-900">
            <strong>Rencana Tindak Lanjut:</strong> Pemberian penjelasan ulang konsep materi, penugasan latihan bertahap, dan asesmen ulang pada indikator yang belum tuntas.
          </div>
        </div>

        {/* Enrichment Section */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 bg-emerald-50/80 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  Kelompok Siswa Pengayaan ({enrichmentList.length} Siswa)
                </h3>
                <p className="text-[11px] text-emerald-700">
                  Peserta didik yang telah melampaui standar KKTP ({assessment.passingGrade})
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 overflow-x-auto">
            {enrichmentList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-semibold">Belum ada siswa yang tuntas.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-center w-10">No</th>
                    <th className="py-2 px-3">Nama Siswa</th>
                    <th className="py-2 px-2 text-center w-20">Nilai Akhir</th>
                    <th className="py-2 px-4">Bentuk Program Pengayaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {enrichmentList.map((s, idx) => (
                    <tr key={s.studentId} className="hover:bg-emerald-50/40">
                      <td className="py-2.5 px-2 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {s.studentName}
                      </td>
                      <td className="py-2.5 px-2 text-center font-extrabold text-emerald-700">
                        {s.finalScore?.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {idx % 2 === 0
                          ? 'Mengerjakan tugas pengayaan mandiri berbasis soal penerapan konteks nyata (HOTS)'
                          : 'Diberikan kesempatan menjadi tutor sebaya mendampingi rekan yang mengikuti remedial'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 bg-emerald-50/40 border-t border-emerald-100 text-xs text-emerald-900">
            <strong>Tujuan Pengayaan:</strong> Memperluas wawasan dan keterampilan analitis siswa melalui tugas eksploratif, pemecahan masalah kompleks, serta kepemimpinan teman sebaya.
          </div>
        </div>
      </div>
    </div>
  );
};
