import React, { useState, useRef, useEffect } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { Assessment, StudentAssessmentResult, OptionChoice, Attendance } from '../types';
import { evaluateStudentResult, calculateMaxScores } from '../utils/assessmentCalculations';
import { AssessmentWorkflowHeader } from './AssessmentWorkflowHeader';
import { useStudentsContext } from '../contexts/StudentContext';

interface SheetInputViewProps {
  assessment: Assessment;
  onUpdateResults: (results: StudentAssessmentResult[]) => void;
  onOpenKeyModal: () => void;
  onNavigateTab?: (tab: 'settings_key' | 'sheet' | 'itemAnalysis') => void;
  onOpenIdentityModal?: () => void;
  onOpenStudentsModal?: () => void;
}

export const SheetInputView: React.FC<SheetInputViewProps> = ({
  assessment,
  onUpdateResults,
  onOpenKeyModal,
  onNavigateTab,
  onOpenIdentityModal,
  onOpenStudentsModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'remedial' | 'absen'>('all');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentAssessmentResult | null>(null);

  const { students, isLoading, refreshStudents } = useStudentsContext();

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Evaluate results
  const evaluatedResults = assessment.results.map((r) => {
    const student = students.find((s) => s.id === r.studentId);
    const enrichedResult = {
      ...r,
      studentName: student?.name || r.studentName || '-',
      studentNis: student?.nis || r.studentNis || '-',
      gender: student?.gender || r.gender || 'L'
    };
    return evaluateStudentResult(enrichedResult, assessment);
  });
  const { totalMax, pgMax, essayMax } = calculateMaxScores(assessment);

  // Filtered results
  const filtered = evaluatedResults.filter((r) => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'tuntas') return r.attendance === 'Hadir' && r.isPassed;
    if (filterStatus === 'remedial') return r.attendance === 'Hadir' && !r.isPassed;
    if (filterStatus === 'absen') return r.attendance !== 'Hadir';
    return true;
  });

  // Handle single PG answer change
  const handlePgAnswerChange = (studentId: string, qIndex: number, value: string) => {
    const upper = value.toUpperCase().trim();
    const validChoices = assessment.hasOptionE ? ['A', 'B', 'C', 'D', 'E', ''] : ['A', 'B', 'C', 'D', ''];
    const finalVal = validChoices.includes(upper) ? (upper as OptionChoice) : '';

    const nextResults = assessment.results.map((r) => {
      if (r.studentId !== studentId) return r;
      const nextAnswers = [...(r.pgAnswers || [])];
      while (nextAnswers.length < assessment.pgCount) nextAnswers.push('');
      nextAnswers[qIndex] = finalVal;
      return {
        ...r,
        pgAnswers: nextAnswers,
      };
    });

    onUpdateResults(nextResults);
  };

  // Handle Essay score change
  const handleEssayScoreChange = (studentId: string, essayIndex: number, value: number) => {
    const max = assessment.essayMaxScores[essayIndex] ?? 3;
    const clamped = Math.max(0, Math.min(value, max));

    const nextResults = assessment.results.map((r) => {
      if (r.studentId !== studentId) return r;
      const nextEssays = [...(r.essayScores || [])];
      while (nextEssays.length < assessment.essayCount) nextEssays.push(0);
      nextEssays[essayIndex] = clamped;
      return {
        ...r,
        essayScores: nextEssays,
      };
    });

    onUpdateResults(nextResults);
  };

  // Handle Attendance change
  const handleAttendanceChange = (studentId: string, attendance: Attendance) => {
    const nextResults = assessment.results.map((r) => {
      if (r.studentId !== studentId) return r;
      return {
        ...r,
        attendance,
      };
    });
    onUpdateResults(nextResults);
  };

  // Quick mark all present
  const handleMarkAllPresent = () => {
    const nextResults = assessment.results.map((r) => ({
      ...r,
      attendance: 'Hadir' as Attendance,
    }));
    onUpdateResults(nextResults);
  };

  // Excel Paste Matrix Handler
  const handlePasteIntoCell = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startStudentId: string,
    startQIndex: number
  ) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) {
      return; // normal single character paste
    }

    e.preventDefault();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((r) => r.split('\t'));

    const startStudentIndex = assessment.results.findIndex((r) => r.studentId === startStudentId);
    if (startStudentIndex === -1) return;

    const nextResults = [...assessment.results];

    rows.forEach((rowValues, rOffset) => {
      const targetStudentIdx = startStudentIndex + rOffset;
      if (targetStudentIdx >= nextResults.length) return;

      const currentStudent = { ...nextResults[targetStudentIdx] };
      const currentAnswers = [...(currentStudent.pgAnswers || [])];
      while (currentAnswers.length < assessment.pgCount) currentAnswers.push('');

      rowValues.forEach((val, cOffset) => {
        const targetQ = startQIndex + cOffset;
        if (targetQ < assessment.pgCount) {
          const clean = val.trim().toUpperCase();
          if (/^[ABCDE]$/.test(clean)) {
            currentAnswers[targetQ] = clean as OptionChoice;
          }
        }
      });

      currentStudent.pgAnswers = currentAnswers;
      nextResults[targetStudentIdx] = currentStudent;
    });

    onUpdateResults(nextResults);
  };

  // Key navigation for PG inputs
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIdx: number,
    qIdx: number
  ) => {
    if (['ArrowRight', 'Tab'].includes(e.key) && !e.shiftKey) {
      if (qIdx < assessment.pgCount - 1) {
        e.preventDefault();
        const nextInput = document.getElementById(`pg-cell-${studentIdx}-${qIdx + 1}`);
        nextInput?.focus();
      }
    } else if (['ArrowLeft'].includes(e.key) || (e.key === 'Tab' && e.shiftKey)) {
      if (qIdx > 0) {
        e.preventDefault();
        const prevInput = document.getElementById(`pg-cell-${studentIdx}-${qIdx - 1}`);
        prevInput?.focus();
      }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const downInput = document.getElementById(`pg-cell-${studentIdx + 1}-${qIdx}`);
      downInput?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const upInput = document.getElementById(`pg-cell-${studentIdx - 1}-${qIdx}`);
      upInput?.focus();
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub Navigation Bar: Identitas | Data Siswa | Pengaturan & Kunci | Input Jawaban | Hasil & Analisis */}
      {onNavigateTab && onOpenIdentityModal && onOpenStudentsModal && (
        <AssessmentWorkflowHeader
          assessment={assessment}
          activeWorkflowTab="input"
          onNavigateTab={onNavigateTab}
          onOpenIdentityModal={onOpenIdentityModal}
          onOpenStudentsModal={onOpenStudentsModal}
        />
      )}

      {/* Top Banner / Assessment Identity Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              {assessment.subject}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-600">
              {assessment.className} ({assessment.phase})
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              {assessment.semester} {assessment.schoolYear}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {assessment.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            KKTP: <strong className="text-blue-700 font-bold">{assessment.passingGrade}</strong> · 
            Pilihan Ganda: <strong>{assessment.pgCount} Butir</strong> (Bobot {assessment.pgWeight}) · 
            Uraian: <strong>{assessment.essayCount} Butir</strong> · Total Maksimal Skor: <strong>{totalMax}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenKeyModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Kunci Jawaban PG</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filter, Search, Zoom, Batch Tools */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({evaluatedResults.length})
            </button>
            <button
              onClick={() => setFilterStatus('tuntas')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === 'tuntas' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Tuntas ({evaluatedResults.filter((r) => r.attendance === 'Hadir' && r.isPassed).length})
            </button>
            <button
              onClick={() => setFilterStatus('remedial')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === 'remedial' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Remedial ({evaluatedResults.filter((r) => r.attendance === 'Hadir' && !r.isPassed).length})
            </button>
            <button
              onClick={() => setFilterStatus('absen')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === 'absen' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absen ({evaluatedResults.filter((r) => r.attendance !== 'Hadir').length})
            </button>
          </div>
        </div>

        {/* Right: Quick actions & Table Zoom */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllPresent}
            className="text-slate-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
            title="Set semua siswa hadir"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Semua Hadir</span>
          </button>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Zoom:</span>
            <input
              type="range"
              min="85"
              max="125"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-20 accent-blue-600 cursor-pointer"
            />
            <span className="w-8 font-mono text-[10px]">{zoomLevel}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Sheet Table */}
      <div
        ref={tableContainerRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[68vh] relative">
          <table
            style={{ fontSize: `${(zoomLevel / 100) * 0.75}rem` }}
            className="w-full border-collapse select-none"
          >
            {/* Header */}
            <thead>
              <tr className="bg-slate-800 text-white uppercase text-[11px] tracking-wider font-bold">
                <th className="py-2.5 px-2 text-center sticky left-0 z-20 bg-slate-800 min-w-[44px] border-r border-slate-700">
                  No
                </th>
                <th className="py-2.5 px-3 text-left sticky left-[44px] z-20 bg-slate-800 min-w-[190px] border-r border-slate-700">
                  Nama Siswa
                </th>
                <th className="py-2.5 px-2 text-center border-r border-slate-700 min-w-[70px]">
                  Hadir
                </th>
                
                {/* Question numbers */}
                {Array.from({ length: assessment.pgCount }, (_, i) => {
                  const key = assessment.answerKeys[i] || '-';
                  return (
                    <th
                      key={`th-pg-${i}`}
                      className="py-2 px-1 text-center min-w-[34px] border-r border-slate-700 font-semibold"
                      title={`Soal #${i + 1} (Kunci: ${key})`}
                    >
                      <div className="text-[10px] opacity-80">#{i + 1}</div>
                      <div className="text-amber-400 font-extrabold text-xs">{key}</div>
                    </th>
                  );
                })}

                <th className="py-2.5 px-2 text-center border-r border-slate-700 bg-slate-900/60 min-w-[60px]">
                  PG Benar
                </th>

                {/* Essay numbers */}
                {Array.from({ length: assessment.essayCount }, (_, i) => (
                  <th
                    key={`th-es-${i}`}
                    className="py-2 px-1 text-center min-w-[42px] border-r border-slate-700 bg-slate-850"
                    title={`Uraian #${i + 1} (Maks: ${assessment.essayMaxScores[i] ?? 3})`}
                  >
                    <div className="text-[10px] opacity-80">U{i + 1}</div>
                    <div className="text-blue-300 text-[10px]">M:{assessment.essayMaxScores[i] ?? 3}</div>
                  </th>
                ))}

                <th className="py-2.5 px-2 text-center border-r border-slate-700 bg-slate-900/60 min-w-[64px]">
                  Uraian
                </th>
                <th className="py-2.5 px-3 text-center border-r border-slate-700 bg-blue-900 min-w-[76px]">
                  Nilai Akhir
                </th>
                <th className="py-2.5 px-3 text-center min-w-[95px] bg-slate-850">
                  Ketuntasan
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={assessment.pgCount + assessment.essayCount + 7} className="py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      Memuat data siswa...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={assessment.pgCount + assessment.essayCount + 7}
                    className="py-12 text-center text-slate-400"
                  >
                    Tidak ada data siswa yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((student, sIdx) => {
                  const isAbsent = student.attendance !== 'Hadir';

                  return (
                    <tr
                      key={student.studentId}
                      className={`transition-colors hover:bg-blue-50/40 ${
                        isAbsent ? 'bg-slate-100/60 opacity-65' : sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      {/* No (Sticky) */}
                      <td className="py-1.5 px-2 text-center font-bold text-slate-500 sticky left-0 z-10 bg-inherit border-r border-slate-200">
                        {sIdx + 1}
                      </td>

                      {/* Name (Sticky) */}
                      <td className="py-1.5 px-3 font-semibold text-slate-900 sticky left-[44px] z-10 bg-inherit border-r border-slate-200 truncate max-w-[200px]">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForDetail(student)}
                          className="hover:text-blue-600 text-left font-medium w-full truncate"
                          title="Klik untuk lihat detail analisis siswa"
                        >
                          {student.studentName}
                        </button>
                      </td>

                      {/* Attendance Select */}
                      <td className="py-1.5 px-1 text-center border-r border-slate-200">
                        <select
                          value={student.attendance}
                          onChange={(e) => handleAttendanceChange(student.studentId, e.target.value as Attendance)}
                          className="px-1.5 py-1 text-[11px] rounded border border-slate-200 bg-white font-medium focus:outline-hidden"
                        >
                          <option value="Hadir">Hadir</option>
                          <option value="Sakit">Sakit</option>
                          <option value="Izin">Izin</option>
                          <option value="Tidak Hadir">Alpa</option>
                        </select>
                      </td>

                      {/* PG Answer Cells */}
                      {Array.from({ length: assessment.pgCount }, (_, qIdx) => {
                        const ans = student.pgAnswers[qIdx] || '';
                        const key = assessment.answerKeys[qIdx] || '';
                        const isCorrect = ans !== '' && ans === key;
                        const isWrong = ans !== '' && ans !== key;

                        let cellClass = 'bg-white text-slate-800 border-slate-200';
                        if (!isAbsent) {
                          if (isCorrect) cellClass = 'bg-emerald-100/80 text-emerald-900 font-bold border-emerald-300';
                          else if (isWrong) cellClass = 'bg-rose-100/80 text-rose-900 font-bold border-rose-300';
                        }

                        return (
                          <td
                            key={`pg-${student.studentId}-${qIdx}`}
                            className="p-0.5 text-center border-r border-slate-100"
                          >
                            <input
                              id={`pg-cell-${sIdx}-${qIdx}`}
                              type="text"
                              maxLength={1}
                              disabled={isAbsent}
                              value={ans}
                              onChange={(e) => {
                                handlePgAnswerChange(student.studentId, qIdx, e.target.value);
                                // Auto advance to next input on typing valid letter
                                if (/^[ABCDE]$/i.test(e.target.value) && qIdx < assessment.pgCount - 1) {
                                  const next = document.getElementById(`pg-cell-${sIdx}-${qIdx + 1}`);
                                  next?.focus();
                                }
                              }}
                              onKeyDown={(e) => handleKeyDown(e, sIdx, qIdx)}
                              onPaste={(e) => handlePasteIntoCell(e, student.studentId, qIdx)}
                              className={`w-7 h-7 text-center rounded border text-xs uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${cellClass}`}
                            />
                          </td>
                        );
                      })}

                      {/* PG Correct Count */}
                      <td className="py-1.5 px-2 text-center font-bold text-slate-800 bg-slate-50 border-r border-slate-200">
                        {isAbsent ? '-' : student.pgCorrectCount}
                      </td>

                      {/* Essay Scores */}
                      {Array.from({ length: assessment.essayCount }, (_, eIdx) => {
                        const max = assessment.essayMaxScores[eIdx] ?? 3;
                        const score = student.essayScores[eIdx] ?? 0;

                        return (
                          <td
                            key={`essay-${student.studentId}-${eIdx}`}
                            className="p-0.5 text-center border-r border-slate-100"
                          >
                            <input
                              type="number"
                              min="0"
                              max={max}
                              disabled={isAbsent}
                              value={isAbsent ? '' : score}
                              onChange={(e) =>
                                handleEssayScoreChange(student.studentId, eIdx, Number(e.target.value))
                              }
                              className="w-8 h-7 text-center rounded border border-slate-200 bg-white text-xs font-semibold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        );
                      })}

                      {/* Essay Total */}
                      <td className="py-1.5 px-2 text-center font-bold text-blue-900 bg-slate-50 border-r border-slate-200">
                        {isAbsent ? '-' : student.essayTotalScore}
                      </td>

                      {/* Final Score */}
                      <td className="py-1.5 px-2 text-center font-extrabold text-sm border-r border-slate-200 bg-blue-50/50">
                        {isAbsent ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <span className={student.isPassed ? 'text-emerald-700' : 'text-rose-600'}>
                            {student.finalScore?.toFixed(1)}
                          </span>
                        )}
                      </td>

                      {/* Completion Status */}
                      <td className="py-1.5 px-2 text-center">
                        {isAbsent ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            {student.attendance}
                          </span>
                        ) : student.isPassed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            TUNTAS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertCircle className="w-3 h-3" />
                            REMIDI
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Instructions / Legend footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">Keterangan Warna:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-200 border border-emerald-400 inline-block"></span>
              <span>Jawaban Benar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-200 border border-rose-400 inline-block"></span>
              <span>Jawaban Salah</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block"></span>
              <span>Belum Diisi</span>
            </div>
          </div>

          <div className="text-slate-500 italic">
            💡 Tips: Ketik huruf <strong>A, B, C, D</strong> langsung melompat ke butir soal berikutnya. Gunakan panah keyboard untuk navigasi cepat.
          </div>
        </div>
      </div>

      {/* Student Detail Diagnostic Modal */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">
                  Kartu Hasil Belajar Peserta Didik
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedStudentForDetail.studentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 mb-1">Pilihan Ganda</div>
                  <div className="text-lg font-extrabold text-slate-800">
                    {selectedStudentForDetail.pgCorrectCount} / {assessment.pgCount}
                  </div>
                  <div className="text-[10px] text-slate-400">Jawaban Benar</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 mb-1">Skor Uraian</div>
                  <div className="text-lg font-extrabold text-blue-800">
                    {selectedStudentForDetail.essayTotalScore} / {essayMax}
                  </div>
                  <div className="text-[10px] text-slate-400">Total Skor Diperoleh</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-900">Nilai Akhir Asesmen</div>
                  <div className="text-2xl font-black text-blue-800">
                    {selectedStudentForDetail.finalScore?.toFixed(1)}
                  </div>
                </div>
                <div>
                  {selectedStudentForDetail.isPassed ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
                      ✓ TUNTAS (≥ {assessment.passingGrade})
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-bold text-xs shadow-xs">
                      ⚠ REMEDIAL (&lt; {assessment.passingGrade})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1.5">
                  Nomor Butir Soal yang Perlu Dipelajari Kembali:
                </h4>
                {selectedStudentForDetail.remedialQuestions && selectedStudentForDetail.remedialQuestions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudentForDetail.remedialQuestions.map((q) => (
                      <span
                        key={q}
                        className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200"
                      >
                        Soal #{q}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-emerald-700 font-semibold">
                    Luar biasa! Tidak ada soal yang salah (skor PG sempurna).
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-700 mb-1">Rekomendasi Tindak Lanjut:</p>
                <p className="text-slate-600 leading-relaxed">
                  {selectedStudentForDetail.isPassed
                    ? 'Peserta didik telah melampaui KKTP. Disarankan mengikuti program pengayaan berupa soal-soal HOTS dan dapat diberdayakan sebagai tutor sebaya.'
                    : 'Peserta didik belum mencapai KKTP. Direkomendasikan melakukan remedial pada indikator soal yang belum benar serta diberikan bimbingan perorangan.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs"
              >
                Tutup Kartu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
