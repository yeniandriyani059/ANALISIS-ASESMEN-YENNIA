import * as XLSX from 'xlsx';
import { Assessment } from '../types';
import {
  evaluateStudentResult,
  analyzePgItems,
  analyzeEssayItems,
  computeOverallStats,
} from './assessmentCalculations';

export function exportAssessmentToExcel(assessment: Assessment): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Identitas & Nilai Siswa
  const evaluatedResults = assessment.results.map((r) => evaluateStudentResult(r, assessment));
  const stats = computeOverallStats(assessment);

  const metaRows: (string | number)[][] = [
    ['LAPORAN HASIL ANALISIS ASESMEN PEMBELAJARAN'],
    ['Nama Sekolah', assessment.schoolName || 'SD Negeri 06 Slemped'],
    ['Mata Pelajaran', assessment.subject],
    ['Kelas / Fase', `${assessment.className} / ${assessment.phase}`],
    ['Semester / TP', `${assessment.semester} / ${assessment.schoolYear}`],
    ['Lingkup Materi', assessment.title],
    ['Jenis Asesmen', assessment.assessmentType],
    ['KKTP / KKM', assessment.passingGrade],
    ['Tanggal Pelaksanaan', assessment.date],
    ['Guru Pengampu', assessment.teacherName],
    ['NIP Guru', assessment.teacherNip || '-'],
    ['Kepala Sekolah', assessment.principalName || '-'],
    ['NIP Kepala Sekolah', assessment.principalNip || '-'],
    [''],
    ['REKAPITULASI PEROLEHAN NILAI SISWA'],
    ['No', 'NIS', 'Nama Siswa', 'L/P', 'Kehadiran', 'Benar PG', 'Skor Uraian', 'Nilai Akhir', 'Status Ketuntasan'],
  ];

  evaluatedResults.forEach((r, idx) => {
    metaRows.push([
      idx + 1,
      r.studentNis || '-',
      r.studentName,
      r.gender,
      r.attendance,
      r.attendance === 'Hadir' ? (r.pgCorrectCount ?? 0) : '-',
      r.attendance === 'Hadir' ? (r.essayTotalScore ?? 0) : '-',
      r.attendance === 'Hadir' ? Number((r.finalScore ?? 0).toFixed(1)) : '-',
      r.attendance === 'Hadir' ? (r.isPassed ? 'TUNTAS' : 'REMEDIAL') : 'TIDAK HADIR',
    ]);
  });

  metaRows.push(
    [''],
    ['RINGKASAN STATISTIK KELAS'],
    ['Jumlah Seluruh Siswa', stats.totalStudents],
    ['Siswa Hadir', stats.presentStudents],
    ['Siswa Tidak Hadir', stats.absentStudents],
    ['Siswa Tuntas', `${stats.passedCount} siswa (${stats.passPercentage}%)`],
    ['Siswa Remedial', `${stats.remedialCount} siswa (${(100 - stats.passPercentage).toFixed(1)}%)`],
    ['Nilai Rata-rata', stats.averageScore],
    ['Nilai Tertinggi', stats.highestScore],
    ['Nilai Terendah', stats.lowestScore],
    ['Nilai Median', stats.medianScore]
  );

  const ws1 = XLSX.utils.aoa_to_sheet(metaRows);
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 30 },
    { wch: 8 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Rekap Nilai');

  // 2. Sheet: Matriks Jawaban Lengkap
  const headerPg = Array.from({ length: assessment.pgCount }, (_, i) => `PG ${i + 1}`);
  const headerEssay = Array.from({ length: assessment.essayCount }, (_, i) => `Uraian ${i + 1}`);
  
  const matrixRows: (string | number)[][] = [
    ['MATRIKS JAWABAN & SKOR BUTIR LENGKAP'],
    ['Kunci PG & Maks Uraian', '', '', '', ...assessment.answerKeys, ...assessment.essayMaxScores.map((s) => `Maks ${s}`), ''],
    ['No', 'Nama Siswa', 'L/P', 'Kehadiran', ...headerPg, ...headerEssay, 'Nilai Akhir'],
  ];

  evaluatedResults.forEach((r, idx) => {
    const pgAnswers = Array.from({ length: assessment.pgCount }, (_, i) => r.pgAnswers[i] || '-');
    const essayScores = Array.from({ length: assessment.essayCount }, (_, i) => r.essayScores[i] ?? 0);
    matrixRows.push([
      idx + 1,
      r.studentName,
      r.gender,
      r.attendance,
      ...pgAnswers,
      ...essayScores,
      r.attendance === 'Hadir' ? Number((r.finalScore ?? 0).toFixed(1)) : '-',
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(matrixRows);
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 6 },
    { wch: 12 },
    ...headerPg.map(() => ({ wch: 8 })),
    ...headerEssay.map(() => ({ wch: 10 })),
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Matriks Jawaban');

  // 3. Sheet: Analisis Butir Soal PG
  const pgAnalysis = analyzePgItems(assessment);
  const pgRows: (string | number)[][] = [
    ['ANALISIS TINGKAT KESUKARAN & DAYA PEMBEDA SOAL PILIHAN GANDA'],
    ['Mata Pelajaran', assessment.subject],
    ['Kelas', assessment.className],
    ['KKTP', assessment.passingGrade],
    [''],
    [
      'No Soal',
      'Kunci',
      'Jml Benar',
      'Peserta Hadir',
      'Tingkat Kesukaran (P)',
      'Kategori Kesukaran',
      'Daya Pembeda (D)',
      'Kategori Daya Beda',
      'Rekomendasi Soal',
      'Pilihan A',
      'Pilihan B',
      'Pilihan C',
      'Pilihan D',
      'Pilihan E',
      'Kosong',
    ],
  ];

  pgAnalysis.forEach((item) => {
    pgRows.push([
      item.questionNumber,
      item.correctAnswer,
      item.correctCount,
      item.totalParticipants,
      item.difficultyIndex,
      item.difficultyCategory,
      item.discriminationIndex,
      item.discriminationCategory,
      item.recommendation,
      item.distractorCounts['A'] || 0,
      item.distractorCounts['B'] || 0,
      item.distractorCounts['C'] || 0,
      item.distractorCounts['D'] || 0,
      item.distractorCounts['E'] || 0,
      item.distractorCounts['Kosong'] || 0,
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(pgRows);
  ws3['!cols'] = [
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Analisis Soal PG');

  // 4. Sheet: Analisis Butir Soal Uraian
  const essayAnalysis = analyzeEssayItems(assessment);
  const essayRows: (string | number)[][] = [
    ['ANALISIS KETERCAPAIAN BUTIR SOAL URAIAN (KURIKULUM MERDEKA)'],
    ['Mata Pelajaran', assessment.subject],
    ['Kelas / Fase', `${assessment.className} / ${assessment.phase}`],
    ['Jumlah Siswa Hadir', stats.presentStudents],
    [''],
    [
      'Nomor Soal',
      'Skor Maksimal',
      'Total Perolehan Skor',
      'Rata-rata Skor',
      'Tingkat Pencapaian (%)',
      'Kategori Ketercapaian',
      'Status Pemahaman',
      'Rekomendasi Tindak Lanjut',
    ],
  ];

  if (essayAnalysis.length === 0) {
    essayRows.push(['Tidak ada soal uraian pada asesmen ini', '-', '-', '-', '-', '-', '-', '-']);
  } else {
    essayAnalysis.forEach((item) => {
      let status = '';
      let reco = '';
      if (item.category === 'Sangat Baik') {
        status = 'Sangat Menguasai';
        reco = 'Pertahankan instrumen soal; berikan materi pendalaman/HOTS';
      } else if (item.category === 'Baik') {
        status = 'Menguasai';
        reco = 'Instrumen soal baik dan representatif untuk asesmen lanjutan';
      } else if (item.category === 'Cukup') {
        status = 'Cukup Menguasai';
        reco = 'Perlu penekanan kembali pada konsep materi nomor ini';
      } else {
        status = 'Belum Menguasai';
        reco = 'Perlu bimbingan intensif/remedial & telaah kembali rumusan soal';
      }

      essayRows.push([
        `Uraian No ${item.questionNumber}`,
        item.maxScore,
        item.totalScoreAcquired,
        item.averageScore,
        item.percentageScore,
        item.category,
        status,
        reco,
      ]);
    });
  }

  const ws4 = XLSX.utils.aoa_to_sheet(essayRows);
  ws4['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 20 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Analisis Soal Uraian');

  // 5. Sheet: Program Remedial & Pengayaan
  const remedialStudents = evaluatedResults.filter((r) => r.attendance === 'Hadir' && !r.isPassed);
  const enrichmentStudents = evaluatedResults.filter((r) => r.attendance === 'Hadir' && r.isPassed);

  const followUpRows: (string | number)[][] = [
    ['PROGRAM TINDAK LANJUT ASESMEN: REMEDIAL & PENGAYAAN'],
    ['Mata Pelajaran', assessment.subject],
    ['Kelas', assessment.className],
    ['KKTP', assessment.passingGrade],
    [''],
    ['A. DAFTAR PESERTA DIDIK PROGRAM REMEDIAL (NILAI < KKTP ' + assessment.passingGrade + ')'],
    ['No', 'Nama Siswa', 'Nilai Awal', 'Soal Belum Dikuasai (Nomor PG)', 'Rencana Tindak Lanjut', 'Nilai Remedial', 'Keterangan'],
  ];

  if (remedialStudents.length === 0) {
    followUpRows.push(['-', 'Seluruh siswa telah mencapai KKTP (Tuntas)', '-', '-', '-', '-', 'Lengkap']);
  } else {
    remedialStudents.forEach((r, idx) => {
      const wrongList = (r.remedialQuestions || []).join(', ') || '-';
      followUpRows.push([
        idx + 1,
        r.studentName,
        Number((r.finalScore ?? 0).toFixed(1)),
        wrongList,
        'Bimbingan perorangan dan pendalaman konsep materi pada butir soal yang belum dikuasai',
        '',
        'Proses Remedial',
      ]);
    });
  }

  followUpRows.push(
    [''],
    ['B. DAFTAR PESERTA DIDIK PROGRAM PENGAYAAN (NILAI >= KKTP ' + assessment.passingGrade + ')'],
    ['No', 'Nama Siswa', 'Nilai', 'Bentuk Program Pengayaan', 'Keterangan']
  );

  if (enrichmentStudents.length === 0) {
    followUpRows.push(['-', 'Belum ada siswa yang tuntas', '-', '-', '-']);
  } else {
    enrichmentStudents.forEach((r, idx) => {
      followUpRows.push([
        idx + 1,
        r.studentName,
        Number((r.finalScore ?? 0).toFixed(1)),
        'Diberikan pendalaman materi lanjutan, soal penerapan tingkat tinggi (HOTS), dan tutor sebaya',
        'Tuntas',
      ]);
    });
  }

  const ws5 = XLSX.utils.aoa_to_sheet(followUpRows);
  ws5['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 12 },
    { wch: 30 },
    { wch: 50 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws5, 'Remedial & Pengayaan');

  // Generate filename safely
  const cleanSubject = assessment.subject.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanClass = assessment.className.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Asesmen_${cleanSubject}_${cleanClass}_${assessment.date}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Generates an Excel template for student list
 */
export function downloadStudentTemplate(): void {
  const wb = XLSX.utils.book_new();
  const rows = [
    ['NIS', 'Nama Siswa', 'Jenis Kelamin (L/P)'],
    ['2024001', 'Ahmad Farhan', 'L'],
    ['2024002', 'Bunga Citra', 'P'],
    ['2024003', 'Chandra Wijaya', 'L'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  XLSX.writeFile(wb, 'Template_Data_Siswa.xlsx');
}
