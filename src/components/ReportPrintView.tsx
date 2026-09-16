import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  Info,
  Layers,
  FileDown,
  Loader2,
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Assessment, Student } from '../types';
import {
  evaluateStudentResult,
  analyzePgItems,
  analyzeEssayItems,
  computeOverallStats,
} from '../utils/assessmentCalculations';
import { exportAssessmentToExcel } from '../utils/excelExport';

interface ReportPrintViewProps {
  assessment: Assessment;
  students?: Student[];
  onBack: () => void;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({ assessment, students = [], onBack }) => {
  const [reportType, setReportType] = useState<'all' | 'scores' | 'items' | 'remedial'>('all');
  const [pageOrientation, setPageOrientation] = useState<'auto' | 'landscape' | 'portrait'>('auto');
  const [pageSize, setPageSize] = useState<'A4' | 'Folio'>('A4');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isPrintInvoked, setIsPrintInvoked] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const printButtonRef = useRef<HTMLButtonElement>(null);
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const isPrintingLockRef = useRef(false);

  const evaluated = assessment.results.map((r) => evaluateStudentResult(r, assessment));
  const stats = computeOverallStats(assessment);
  const pgItems = analyzePgItems(assessment);
  const essayItems = analyzeEssayItems(assessment);

  const remedialList = evaluated.filter((r) => r.attendance === 'Hadir' && !r.isPassed);
  const enrichmentList = evaluated.filter((r) => r.attendance === 'Hadir' && r.isPassed);

  // Determine effective orientation based on selection or content type
  // Rekap/Analisis contain wide tables -> landscape, Remedial report -> portrait
  const effectiveOrientation: 'landscape' | 'portrait' =
    pageOrientation === 'auto'
      ? reportType === 'remedial'
        ? 'portrait'
        : 'landscape'
      : pageOrientation;

  const pageMargin =
    effectiveOrientation === 'landscape' ? '12mm 15mm 15mm 15mm' : '15mm 15mm 15mm 15mm';
  const paperDimension = pageSize === 'Folio' ? '215mm 330mm' : 'A4';

  // Inject dynamic @page print CSS rules directly into document head
  useEffect(() => {
    const styleId = 'official-report-page-print-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @page {
        size: ${paperDimension} ${effectiveOrientation};
        margin: ${pageMargin};
      }
    `;

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) {
        existing.remove();
      }
    };
  }, [paperDimension, effectiveOrientation, pageMargin]);

  // Robust print execution with fallback for iframe sandboxes
  const executePrint = (e?: React.MouseEvent | MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isPrintingLockRef.current) return;
    isPrintingLockRef.current = true;
    setTimeout(() => {
      isPrintingLockRef.current = false;
    }, 1200);

    setIsPrintInvoked(true);
    setTimeout(() => {
      setIsPrintInvoked(false);
    }, 3000);

    try {
      window.focus();
      window.print();
    } catch (printError) {
      console.warn('Direct window.print() exception, using iframe print fallback:', printError);
      try {
        const printableElement = document.getElementById('printable-report-area');
        if (printableElement) {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);

          const doc = iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Laporan Asesmen - ${assessment.subject}</title>
                  <style>
                    @page { size: ${paperDimension} ${effectiveOrientation}; margin: ${pageMargin}; }
                    body { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; margin: 0; padding: 0; color: #000; width: 100%; }
                    table { width: 100%; max-width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: auto; }
                    th, td { border: 1px solid #333; padding: 4px 6px; word-break: normal; }
                    tr, .summary-card, .metadata-card, .signature-block, .kop-surat { page-break-inside: avoid; break-inside: avoid; }
                    th { background-color: #f1f5f9 !important; font-weight: bold; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .no-print { display: none !important; }
                  </style>
                </head>
                <body>
                  ${printableElement.innerHTML}
                </body>
              </html>
            `);
            doc.close();
            setTimeout(() => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              setTimeout(() => {
                iframe.remove();
              }, 1500);
            }, 300);
          }
        }
      } catch (fallbackErr) {
        console.error('Print fallback failed:', fallbackErr);
      }
    }
  };

  // Clean and robust direct PDF download using html2pdf with fallback
  const handleDownloadPdf = async (e?: React.MouseEvent | MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setPdfSuccessMessage(null);

    const printableElement = document.getElementById('printable-report-area');
    if (!printableElement) {
      setIsDownloadingPdf(false);
      return;
    }

    const cleanSubject = (assessment.subject || 'Asesmen').replace(/[\s/\\:]+/g, '_');
    const cleanClass = (assessment.className || 'Kelas').replace(/[\s/\\:]+/g, '_');
    const filename = `Laporan_Asesmen_${cleanSubject}_${cleanClass}.pdf`;

    try {
      // @ts-ignore
      const html2pdfLib = typeof html2pdf === 'function' ? html2pdf : html2pdf?.default;
      if (html2pdfLib) {
        const opt = {
          margin: effectiveOrientation === 'landscape' ? [8, 10, 10, 10] : [10, 10, 10, 10],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          },
          jsPDF: {
            unit: 'mm',
            format: pageSize === 'Folio' ? [215, 330] : 'a4',
            orientation: effectiveOrientation,
            compress: true,
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        await html2pdfLib().set(opt).from(printableElement).save();
        setPdfSuccessMessage(`Berkas PDF "${filename}" berhasil diunduh ke komputer Anda!`);
        setTimeout(() => {
          setPdfSuccessMessage(null);
        }, 5000);
      } else {
        // Fallback: trigger print dialog (Save as PDF)
        executePrint();
      }
    } catch (err) {
      console.warn('PDF export encountered an error, falling back to print dialog:', err);
      executePrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Direct native DOM listener attachment for maximum test/script reliability
  useEffect(() => {
    const printBtn = printButtonRef.current;
    const pdfBtn = pdfButtonRef.current;

    const printClickHandler = (evt: MouseEvent) => {
      executePrint(evt);
    };
    const pdfClickHandler = (evt: MouseEvent) => {
      handleDownloadPdf(evt);
    };

    if (printBtn) printBtn.addEventListener('click', printClickHandler);
    if (pdfBtn) pdfBtn.addEventListener('click', pdfClickHandler);

    return () => {
      if (printBtn) printBtn.removeEventListener('click', printClickHandler);
      if (pdfBtn) pdfBtn.removeEventListener('click', pdfClickHandler);
    };
  }, [paperDimension, effectiveOrientation, assessment, reportType, pageSize, isDownloadingPdf]);

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportAssessmentToExcel(assessment);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    } finally {
      setTimeout(() => setIsExportingExcel(false), 800);
    }
  };

  const currentDateFormatted = new Date(assessment.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top action bar (hidden during print, high z-index to avoid overlay obstruction) */}
      <div className="no-print bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 relative z-20 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-to-sheet"
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Kembali ke Lembar Nilai"
            >
              <ArrowLeft className="w-5 h-5 pointer-events-none" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Pratinjau Cetak Laporan Resmi Asesmen
              </h2>
              <p className="text-xs text-slate-500">
                Format baku laporan Kurikulum Merdeka lengkap dengan rekap nilai, analisis butir PG & uraian, serta program remedial.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Download Excel Button */}
            <button
              id="btn-download-excel"
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="btn-download-excel relative z-30 inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer select-none pointer-events-auto disabled:opacity-50"
              title="Download seluruh data asesmen ke berkas Excel (.xlsx) dengan sheet terpisah"
            >
              <FileSpreadsheet className="w-4 h-4 pointer-events-none" />
              <span className="pointer-events-none">{isExportingExcel ? 'Mengunduh...' : 'Download Excel (.xlsx)'}</span>
            </button>

            {/* Tombol Khusus 1: Download PDF (Pustaka Ekspor PDF) */}
            <button
              ref={pdfButtonRef}
              id="btn-download-pdf"
              data-testid="btn-download-pdf"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="btn-download-pdf relative z-30 inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer select-none pointer-events-auto disabled:opacity-70"
              title="Unduh laporan secara langsung sebagai berkas dokumen PDF (.pdf) ke komputer"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin pointer-events-none" />
              ) : (
                <FileDown className="w-4 h-4 pointer-events-none" />
              )}
              <span className="pointer-events-none">{isDownloadingPdf ? 'Membuat PDF...' : 'Download PDF'}</span>
            </button>

            {/* Tombol Khusus 2: Cetak Dokumen (window.print()) */}
            <button
              ref={printButtonRef}
              id="btn-print-report"
              data-testid="btn-print-report"
              type="button"
              onClick={executePrint}
              className="btn-print-report relative z-30 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer select-none pointer-events-auto"
              title="Cetak langsung dokumen ke printer fisik atau dialog cetak sistem"
            >
              <Printer className="w-4 h-4 pointer-events-none" />
              <span className="pointer-events-none">Cetak Dokumen</span>
            </button>
          </div>
        </div>

        {/* Controls Ribbon: Filter & Print Page Settings */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Bagian Laporan:</span>
              <select
                id="select-report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">Dokumen Lengkap (Semua Bagian I, II, III)</option>
                <option value="scores">Hanya Bagian I: Rekapitulasi Nilai Siswa</option>
                <option value="items">Hanya Bagian II: Analisis Butir Soal (PG & Uraian)</option>
                <option value="remedial">Hanya Bagian III: Remedial & Pengayaan</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span>Tata Letak Cetak:</span>
              <select
                id="select-page-orientation"
                value={pageOrientation}
                onChange={(e) => setPageOrientation(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="auto">
                  Otomatis ({effectiveOrientation === 'landscape' ? 'Landscape' : 'Portrait'})
                </option>
                <option value="landscape">Landscape (Melebar - Disarankan untuk Tabel Luas)</option>
                <option value="portrait">Portrait (Tegak - Format Dokumen Standar)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span>Kertas:</span>
              <select
                id="select-page-size"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Folio">F4 / Folio (215 × 330 mm)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tip & Status for printing and PDF generation */}
        <div className="flex flex-col gap-2">
          {pdfSuccessMessage && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfSuccessMessage}</span>
            </div>
          )}
          {isPrintInvoked && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Perintah cetak terkirim (window.print). Dialog cetak browser sedang dibuka.</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-[11px]">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              <strong>Pilihan Output:</strong> Klik <strong>Download PDF</strong> untuk mengunduh berkas laporan digital langsung (.pdf), atau klik <strong>Cetak Dokumen</strong> untuk mencetak fisik ke printer dengan orientasi <strong>{effectiveOrientation === 'landscape' ? 'Landscape (Melebar)' : 'Portrait (Tegak)'}</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div id="printable-report-area" className="printable-sheet bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 w-full max-w-full text-slate-900 text-xs leading-normal relative z-10">
        
        {/* Official Kop Surat */}
        <div className="kop-surat text-center border-b-2 border-slate-900 pb-4 mb-6 print-break-inside-avoid">
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900">
            {assessment.schoolName || 'SD NEGERI 06 SLEMPED'}
          </h3>
          <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 mt-0.5">
            LAPORAN ANALISIS HASIL ASESMEN PEMBELAJARAN
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Tahun Ajaran {assessment.schoolYear} · Semester {assessment.semester}
          </p>
        </div>

        {/* Assessment Metadata Block */}
        <div className="metadata-card grid grid-cols-2 gap-x-8 gap-y-1.5 mb-6 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200 print:bg-transparent print:p-0 print:border-none print-break-inside-avoid">
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">Mata Pelajaran:</span>
            <strong className="text-slate-900">{assessment.subject}</strong>
          </div>
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">Jenis Asesmen:</span>
            <strong className="text-slate-900">{assessment.assessmentType}</strong>
          </div>
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">Kelas / Fase:</span>
            <strong className="text-slate-900">{assessment.className} / {assessment.phase}</strong>
          </div>
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">KKTP / KKM:</span>
            <strong className="text-slate-900 font-bold">{assessment.passingGrade}</strong>
          </div>
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">Lingkup Materi:</span>
            <strong className="text-slate-900">{assessment.title}</strong>
          </div>
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">Tanggal Pelaksanaan:</span>
            <strong className="text-slate-900">{currentDateFormatted}</strong>
          </div>
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">Komposisi Soal:</span>
            <span className="text-slate-800">
              {assessment.pgCount} Soal PG (Bobot {assessment.pgWeight}) + {assessment.essayCount} Soal Uraian
            </span>
          </div>
          <div>
            <span className="text-slate-500 w-36 inline-block font-semibold">Ketuntasan Klasikal:</span>
            <strong className="text-slate-900">{stats.passPercentage}% ({stats.passedCount} dari {stats.presentStudents} siswa hadir)</strong>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Section 1: Daftar Nilai Siswa */}
        {/* ==================================================================== */}
        {(reportType === 'all' || reportType === 'scores') && (
          <div className="mb-8 print-break-inside-avoid">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1.5 mb-2.5">
              I. Rekapitulasi Perolehan Nilai Siswa
            </h5>
            <div className="w-full overflow-x-auto print:overflow-visible">
              <table className="print-table w-full max-w-full border-collapse text-[11px] text-left border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 print-break-inside-avoid">
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-8">No</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-16">NIS</th>
                    <th className="py-1.5 px-2 border-r border-slate-400">Nama Lengkap Peserta Didik</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-10">L/P</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-14">Kehadiran</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-16">Benar PG</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-16">Skor Uraian</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-16">Nilai Akhir</th>
                    <th className="py-1.5 px-2 text-center w-24">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {evaluated.map((s, idx) => (
                    <tr key={s.studentId} className={`print-row print-break-inside-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center text-slate-600 font-mono text-[10px]">
                        {students.find(std => std.id === s.studentId)?.nis || s.studentNis || '-'}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 font-medium">
                        {s.studentName}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-semibold">
                        {s.gender}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center">
                        {s.attendance}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center">
                        {s.attendance === 'Hadir' ? s.pgCorrectCount : '-'}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center">
                        {s.attendance === 'Hadir' ? s.essayTotalScore : '-'}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                        {s.attendance === 'Hadir' ? s.finalScore?.toFixed(1) : '-'}
                      </td>
                      <td className="py-1 px-2 text-center font-bold">
                        {s.attendance !== 'Hadir' ? (
                          <span className="text-slate-500">Tidak Hadir</span>
                        ) : s.isPassed ? (
                          <span className="text-emerald-800">TUNTAS</span>
                        ) : (
                          <span className="text-rose-700">REMEDIAL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary statistics row */}
            <div className="summary-card grid grid-cols-4 gap-2 mt-3 p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-[11px] print-break-inside-avoid">
              <div>Rata-rata Kelas: <strong>{stats.averageScore.toFixed(1)}</strong></div>
              <div>Nilai Tertinggi: <strong>{stats.highestScore.toFixed(1)}</strong></div>
              <div>Nilai Terendah: <strong>{stats.lowestScore.toFixed(1)}</strong></div>
              <div>Tuntas: <strong>{stats.passedCount} Siswa ({stats.passPercentage}%)</strong></div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Section 2: Analisis Butir Soal (Pilihan Ganda & Uraian) */}
        {/* ==================================================================== */}
        {(reportType === 'all' || reportType === 'items') && (
          <div className="mb-8 print-break-inside-avoid">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1.5 mb-3">
              II. Analisis Kualitas Butir Soal Instrumen Asesmen
            </h5>

            {/* II.A Pilihan Ganda */}
            <div className="mb-6 print-break-inside-avoid">
              <h6 className="font-bold text-[11px] text-slate-800 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                A. Analisis Tingkat Kesukaran & Daya Pembeda Soal Pilihan Ganda ({assessment.pgCount} Butir)
              </h6>
              <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="print-table w-full max-w-full border-collapse text-[10px] text-left border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 print-break-inside-avoid">
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-8">No</th>
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-10">Kunci</th>
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-14">Jml Benar</th>
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-14">Indeks P</th>
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-20">Kesukaran</th>
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-14">Indeks D</th>
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-20">Daya Beda</th>
                      <th className="py-1.5 px-2 text-center w-28">Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {pgItems.map((item) => (
                      <tr key={item.questionNumber} className={`print-row print-break-inside-avoid ${item.questionNumber % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}`}>
                        <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                          {item.questionNumber}
                        </td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                          {item.correctAnswer}
                        </td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center">
                          {item.correctCount}
                        </td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center font-mono">
                          {item.difficultyIndex.toFixed(2)}
                        </td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center font-medium">
                          {item.difficultyCategory}
                        </td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center font-mono">
                          {item.discriminationIndex.toFixed(2)}
                        </td>
                        <td className="py-1 px-2 border-r border-slate-300 text-center font-medium">
                          {item.discriminationCategory}
                        </td>
                        <td className="py-1 px-2 text-center font-bold">
                          {item.recommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-1.5 text-[9.5px] text-slate-500 italic">
                *Keterangan: Indeks P = Tingkat Kesukaran (&gt;0.70 Mudah, 0.30–0.70 Sedang, &lt;0.30 Sukar); Indeks D = Daya Pembeda (&ge;0.40 Sangat Baik, 0.30–0.39 Baik, 0.20–0.29 Cukup, &lt;0.20 Jelek).
              </div>
            </div>

            {/* II.B Soal Uraian */}
            <div className="mt-4 print-break-inside-avoid">
              <h6 className="font-bold text-[11px] text-slate-800 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                B. Analisis Ketercapaian Butir Soal Uraian ({assessment.essayCount} Butir)
              </h6>
              {essayItems.length === 0 ? (
                <p className="text-slate-500 italic text-[11px] p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  Asesmen ini tidak menggunakan instrumen butir soal uraian (hanya soal pilihan ganda).
                </p>
              ) : (
                <>
                  <div className="w-full overflow-x-auto print:overflow-visible">
                    <table className="print-table w-full max-w-full border-collapse text-[10px] text-left border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 print-break-inside-avoid">
                          <th className="py-1.5 px-2 border-r border-slate-400 text-center w-12">No Soal</th>
                          <th className="py-1.5 px-2 border-r border-slate-400 text-center w-16">Skor Maks</th>
                          <th className="py-1.5 px-2 border-r border-slate-400 text-center w-24">Total Perolehan</th>
                          <th className="py-1.5 px-2 border-r border-slate-400 text-center w-20">Rata-rata</th>
                          <th className="py-1.5 px-2 border-r border-slate-400 text-center w-24">Pencapaian (%)</th>
                          <th className="py-1.5 px-2 border-r border-slate-400 text-center w-28">Kategori Ketercapaian</th>
                          <th className="py-1.5 px-2 text-left">Tindak Lanjut & Rekomendasi Kurikulum Merdeka</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {essayItems.map((item) => {
                          let badgeClass = 'text-slate-800 font-bold';
                          let recommendationText = '';
                          if (item.category === 'Sangat Baik') {
                            badgeClass = 'text-emerald-800 font-bold';
                            recommendationText = 'Pemahaman optimal (Sangat Baik); berikan materi pengayaan & soal penalaran tingkat tinggi (HOTS).';
                          } else if (item.category === 'Baik') {
                            badgeClass = 'text-blue-800 font-bold';
                            recommendationText = 'Ketercapaian baik; butir soal representatif dan dipertahankan untuk asesmen berikutnya.';
                          } else if (item.category === 'Cukup') {
                            badgeClass = 'text-amber-800 font-bold';
                            recommendationText = 'Cukup tercapai; perlu penegasan konsep kunci materi saat refleksi pembelajaran kelas.';
                          } else {
                            badgeClass = 'text-rose-800 font-bold';
                            recommendationText = 'Perlu bimbingan intensif; berikan remedial terfokus serta tinjau kembali kejelasan instruksi soal.';
                          }

                          return (
                            <tr key={item.questionNumber} className={`print-row print-break-inside-avoid ${item.questionNumber % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}`}>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold">
                                Uraian {item.questionNumber}
                              </td>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center font-semibold">
                                {item.maxScore}
                              </td>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center">
                                {item.totalScoreAcquired} <span className="text-slate-400">/ {stats.presentStudents * item.maxScore}</span>
                              </td>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-semibold">
                                {item.averageScore.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold font-mono">
                                {item.percentageScore.toFixed(1)}%
                              </td>
                              <td className={`py-1.5 px-2 border-r border-slate-300 text-center ${badgeClass}`}>
                                {item.category}
                              </td>
                              <td className="py-1.5 px-2 text-slate-700">
                                {recommendationText}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-1.5 text-[9.5px] text-slate-500 italic">
                    *Kriteria Ketercapaian Uraian: &ge;80% Sangat Baik, 65%–79% Baik, 50%–64% Cukup, &lt;50% Perlu Bimbingan.
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Section 3: Program Tindak Lanjut Remedial & Pengayaan */}
        {/* ==================================================================== */}
        {(reportType === 'all' || reportType === 'remedial') && (
          <div className="mb-8 print-break-inside-avoid">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1.5 mb-2.5">
              III. Program Tindak Lanjut: Remedial & Pengayaan
            </h5>

            {/* Remedial list */}
            <div className="mb-4 print-break-inside-avoid">
              <h6 className="font-bold text-[11px] text-rose-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                A. Daftar Peserta Didik Mengikuti Remedial (Nilai &lt; KKTP {assessment.passingGrade})
              </h6>
              {remedialList.length === 0 ? (
                <p className="text-slate-600 italic text-[11px] p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  Seluruh peserta didik telah mencapai kriteria ketuntasan (KKTP). Tidak ada peserta didik yang memerlukan program remedial.
                </p>
              ) : (
                <div className="w-full overflow-x-auto print:overflow-visible">
                  <table className="print-table w-full max-w-full border-collapse text-[10px] text-left border border-slate-400">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 print-break-inside-avoid">
                        <th className="py-1 px-2 border-r border-slate-400 text-center w-8">No</th>
                        <th className="py-1 px-2 border-r border-slate-400 w-48">Nama Peserta Didik</th>
                        <th className="py-1 px-2 border-r border-slate-400 text-center w-14">Nilai Awal</th>
                        <th className="py-1 px-2 border-r border-slate-400">Indikator Butir Belum Dikuasai</th>
                        <th className="py-1 px-2 border-r border-slate-400 text-center w-20">Rencana Bimbingan</th>
                        <th className="py-1 px-2 border-r border-slate-400 text-center w-16">Nilai Remedi</th>
                        <th className="py-1 px-2 text-center w-16">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {remedialList.map((s, idx) => {
                        const raw = assessment.results.find((r) => r.studentId === s.studentId);
                        return (
                          <tr key={s.studentId} className="print-row print-break-inside-avoid">
                            <td className="py-1 px-2 border-r border-slate-300 text-center">{idx + 1}</td>
                            <td className="py-1 px-2 border-r border-slate-300 font-medium">{s.studentName}</td>
                            <td className="py-1 px-2 border-r border-slate-300 text-center font-bold text-rose-700">
                              {s.finalScore?.toFixed(1)}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300">
                              Soal No: {(s.remedialQuestions || []).join(', ') || '-'}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 text-center text-slate-600">
                              Bimbingan Khusus
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                              {raw?.remedialScore !== undefined ? raw.remedialScore : '-'}
                            </td>
                            <td className="py-1 px-2 text-center font-bold">
                              {raw?.remedialScore !== undefined && raw.remedialScore >= assessment.passingGrade ? (
                                <span className="text-emerald-700">Tuntas</span>
                              ) : (
                                <span className="text-amber-700">Proses</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Enrichment list */}
            <div className="print-card print-break-inside-avoid">
              <h6 className="font-bold text-[11px] text-emerald-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                B. Program Pengayaan (Nilai &ge; KKTP {assessment.passingGrade})
              </h6>
              <p className="text-slate-700 mb-2 leading-relaxed">
                Sebanyak <strong>{enrichmentList.length} peserta didik ({stats.passPercentage}%)</strong> telah mencapai KKTP dan diberikan kegiatan pengayaan berupa tugas eksploratif terstruktur, pemecahan masalah kontekstual tingkat tinggi (HOTS), serta diberdayakan sebagai tutor sebaya bagi rekan-rekannya.
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Official Signatures Block */}
        {/* ==================================================================== */}
        <div id="signature-block" className="signature-block pt-8 mt-6 border-t-2 border-slate-300 print-break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala {assessment.schoolName || 'SD Negeri 06 Slemped'}</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline uppercase">
                {assessment.principalName || 'Drs. H. Bambang Suprayitno, M.Pd.'}
              </p>
              <p className="text-slate-600 text-[11px]">
                NIP. {assessment.principalNip || '19720915 199803 1 004'}
              </p>
            </div>

            <div>
              <p className="text-slate-600">
                {assessment.cityName || 'Slemped'}, {currentDateFormatted}
              </p>
              <p className="font-bold text-slate-900">Guru Kelas / Pengampu Mata Pelajaran</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline uppercase">
                {assessment.teacherName || 'Nurul Hidayati, S.Pd.'}
              </p>
              <p className="text-slate-600 text-[11px]">
                NIP. {assessment.teacherNip || '19880612 201402 2 003'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
