import React, { useState, useEffect } from 'react';
import { X, PlusCircle, BookCheck, School, HelpCircle } from 'lucide-react';
import { Assessment, AssessmentType, SchoolProfile, Student, OptionChoice } from '../types';

interface AssessmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assessment: Assessment) => void;
  initialData?: Assessment | null;
  schoolProfile: SchoolProfile;
  availableStudents: Student[];
}

const COMMON_SUBJECTS = [
  'Bahasa Indonesia',
  'Matematika',
  'Pendidikan Pancasila',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Seni Rupa',
  'Seni Musik / Tari / Teater',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Bahasa Inggris',
  'Bahasa Daerah (Jawa / Sunda)',
  'Informatika',
];

const ASSESSMENT_TYPES: AssessmentType[] = [
  'Sumatif Lingkup Materi',
  'Sumatif Tengah Semester',
  'Sumatif Akhir Semester',
  'Asesmen Formatif',
  'Penilaian Harian',
];

export const AssessmentFormModal: React.FC<AssessmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  schoolProfile,
  availableStudents,
}) => {
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title || '');
  const [subject, setSubject] = useState(initialData?.subject || 'Bahasa Indonesia');
  const [customSubject, setCustomSubject] = useState('');
  const [className, setClassName] = useState(initialData?.className || 'Kelas II');
  const [phase, setPhase] = useState(initialData?.phase || 'Fase A');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(initialData?.semester || 'Ganjil');
  const [schoolYear, setSchoolYear] = useState(initialData?.schoolYear || '2024/2025');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(
    initialData?.assessmentType || 'Sumatif Lingkup Materi'
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [passingGrade, setPassingGrade] = useState(initialData?.passingGrade ?? 75);

  const [pgCount, setPgCount] = useState(initialData?.pgCount ?? 20);
  const [pgWeight, setPgWeight] = useState(initialData?.pgWeight ?? 1);
  const [hasOptionE, setHasOptionE] = useState(initialData?.hasOptionE ?? false);

  const [essayCount, setEssayCount] = useState(initialData?.essayCount ?? 5);
  const [essayMaxScores, setEssayMaxScores] = useState<number[]>(() => {
    if (initialData?.essayMaxScores && initialData.essayMaxScores.length > 0) {
      return [...initialData.essayMaxScores];
    }
    return Array.from({ length: initialData?.essayCount ?? 5 }, () => 3);
  });
  const [learningObjectives, setLearningObjectives] = useState(
    initialData?.learningObjectives || ''
  );

  const [includeExistingStudents, setIncludeExistingStudents] = useState(true);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && !isEdit) {
      try {
        const draft = localStorage.getItem('draft_assessment_form');
        if (draft && !isDraftLoaded) {
          const parsed = JSON.parse(draft);
          setTitle(parsed.title ?? '');
          setSubject(parsed.subject ?? 'Bahasa Indonesia');
          setCustomSubject(parsed.customSubject ?? '');
          setClassName(parsed.className ?? 'Kelas II');
          setPhase(parsed.phase ?? 'Fase A');
          setSemester(parsed.semester ?? 'Ganjil');
          setSchoolYear(parsed.schoolYear ?? '2024/2025');
          setAssessmentType(parsed.assessmentType ?? 'Sumatif Lingkup Materi');
          setDate(parsed.date ?? new Date().toISOString().split('T')[0]);
          setPassingGrade(parsed.passingGrade ?? 75);
          setPgCount(parsed.pgCount ?? 20);
          setPgWeight(parsed.pgWeight ?? 1);
          setHasOptionE(parsed.hasOptionE ?? false);
          setEssayCount(parsed.essayCount ?? 5);
          setLearningObjectives(parsed.learningObjectives ?? '');
          setIsDraftLoaded(true);
          return;
        }
      } catch (e) {}
    }

    if (isDraftLoaded && !isEdit) return;

    if (initialData) {
      setTitle(initialData.title);
      setSubject(COMMON_SUBJECTS.includes(initialData.subject) ? initialData.subject : 'Lainnya');
      if (!COMMON_SUBJECTS.includes(initialData.subject)) {
        setCustomSubject(initialData.subject);
      }
      setClassName(initialData.className);
      setPhase(initialData.phase);
      setSemester(initialData.semester);
      setSchoolYear(initialData.schoolYear);
      setAssessmentType(initialData.assessmentType);
      setDate(initialData.date);
      setPassingGrade(initialData.passingGrade);
      setPgCount(initialData.pgCount);
      setPgWeight(initialData.pgWeight);
      setHasOptionE(initialData.hasOptionE || false);
      setEssayCount(initialData.essayCount);
      setLearningObjectives(initialData.learningObjectives || '');
      
      const scores = [...(initialData.essayMaxScores || [])];
      while (scores.length < initialData.essayCount) {
        scores.push(3);
      }
      setEssayMaxScores(scores.slice(0, initialData.essayCount));
    }
  }, [initialData, isOpen, isDraftLoaded, isEdit]);

  useEffect(() => {
    if (isOpen && !isEdit && isDraftLoaded) {
      localStorage.setItem('draft_assessment_form', JSON.stringify({
        title, subject, customSubject, className, phase, semester, schoolYear,
        assessmentType, date, passingGrade, pgCount, pgWeight, hasOptionE, essayCount, learningObjectives
      }));
    }
  }, [title, subject, customSubject, className, phase, semester, schoolYear, assessmentType, date, passingGrade, pgCount, pgWeight, hasOptionE, essayCount, learningObjectives, isOpen, isEdit, isDraftLoaded]);

  const handleEssayCountChange = (count: number) => {
    const clamped = Math.max(0, Math.min(50, isNaN(count) ? 0 : count));
    setEssayCount(clamped);
    setEssayMaxScores((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push(3);
      return next.slice(0, clamped);
    });
  };

  const handleIndividualEssayScoreChange = (idx: number, val: number) => {
    const score = Math.max(1, Math.min(100, isNaN(val) ? 1 : val));
    const next = [...essayMaxScores];
    next[idx] = score;
    setEssayMaxScores(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem('draft_assessment_form');

    const finalSubject = subject === 'Lainnya' ? (customSubject.trim() || 'Mata Pelajaran') : subject;
    const finalTitle = title.trim() || `${assessmentType} ${finalSubject}`;

    // Prepare answer keys
    let keys: OptionChoice[] = initialData?.answerKeys ? [...initialData.answerKeys] : [];
    if (keys.length < pgCount) {
      while (keys.length < pgCount) {
        keys.push('A');
      }
    } else if (keys.length > pgCount) {
      keys = keys.slice(0, pgCount);
    }

    // Prepare essay max scores
    const finalEssayMaxScores = essayMaxScores.slice(0, essayCount);

    // Prepare results
    let results = initialData?.results ? [...initialData.results] : [];

    if (!isEdit && includeExistingStudents && availableStudents.length > 0) {
      results = availableStudents.map((std) => ({
        studentId: std.id,
        studentName: std.name,
        studentNis: std.nis,
        gender: std.gender,
        attendance: 'Hadir' as const,
        pgAnswers: Array.from({ length: pgCount }, () => '' as OptionChoice),
        essayScores: Array.from({ length: essayCount }, () => 0),
      }));
    } else if (isEdit) {
      // Adjust existing results lengths
      results = results.map((r) => {
        const nextPg = [...(r.pgAnswers || [])];
        while (nextPg.length < pgCount) nextPg.push('');
        const nextEssay = [...(r.essayScores || [])];
        while (nextEssay.length < essayCount) nextEssay.push(0);

        return {
          ...r,
          pgAnswers: nextPg.slice(0, pgCount),
          essayScores: nextEssay.slice(0, essayCount),
        };
      });
    }

    const newAssessment: Assessment = {
      id: initialData?.id || `asm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: finalTitle,
      subject: finalSubject,
      className,
      phase,
      semester,
      schoolYear,
      assessmentType,
      date,
      passingGrade: Number(passingGrade) || 75,
      schoolName: schoolProfile.schoolName,
      teacherName: schoolProfile.teacherName,
      teacherNip: schoolProfile.teacherNip,
      principalName: schoolProfile.principalName,
      principalNip: schoolProfile.principalNip,
      cityName: schoolProfile.cityName,
      pgCount: Number(pgCount) || 0,
      pgWeight: Number(pgWeight) || 1,
      hasOptionE,
      answerKeys: keys,
      essayCount: Number(essayCount) || 0,
      essayMaxScores: finalEssayMaxScores,
      learningObjectives,
      results,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newAssessment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Ubah Informasi Asesmen' : 'Buat Analisis Asesmen Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi identitas mata pelajaran, jumlah soal, dan Kriteria Ketercapaian (KKTP).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          
          {/* Section 1: Identitas Asesmen */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
              <span>1. Identitas Pembelajaran</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lingkup Materi / Judul Bab Asesmen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 2 - Mengenal Tubuh & Kalimat Ajakan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Asesmen
                </label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {ASSESSMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {COMMON_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Lainnya">+ Mata Pelajaran Lainnya</option>
                </select>
              </div>

              {subject === 'Lainnya' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ketik Nama Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama mapel custom..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kelas / Rombel
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelas II A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fase Kurikulum Merdeka
                </label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Fase A (Kelas 1-2 SD)">Fase A (Kelas 1-2 SD)</option>
                  <option value="Fase B (Kelas 3-4 SD)">Fase B (Kelas 3-4 SD)</option>
                  <option value="Fase C (Kelas 5-6 SD)">Fase C (Kelas 5-6 SD)</option>
                  <option value="Fase D (Kelas 7-9 SMP)">Fase D (Kelas 7-9 SMP)</option>
                  <option value="Fase E (Kelas 10 SMA)">Fase E (Kelas 10 SMA)</option>
                  <option value="Fase F (Kelas 11-12 SMA)">Fase F (Kelas 11-12 SMA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Pelajaran
                </label>
                <input
                  type="text"
                  placeholder="2024/2025"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Asesmen
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kriteria & Konfigurasi Soal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
              2. Standar Kelulusan & Konfigurasi Soal
            </h4>
            
            {/* KKTP & Opsi E */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  KKTP / KKM (Kriteria Ketuntasan)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={passingGrade}
                    onChange={(e) => setPassingGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">Poin</span>
                </div>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOptionE}
                    onChange={(e) => setHasOptionE(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Gunakan 5 Opsi Pilihan Ganda (A - E)</span>
                </label>
              </div>
            </div>

            {/* Kartu Komposisi Soal Berjejer Horizontal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jml. Soal Pilihan Ganda
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={pgCount}
                  onChange={(e) => setPgCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bobot / Soal PG
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={pgWeight}
                  onChange={(e) => setPgWeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jml. Soal Uraian
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={essayCount}
                  onChange={(e) => handleEssayCountChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Individual Essay Score Cards */}
            {essayCount > 0 && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 mb-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pengaturan Skor Maksimal Uraian Individual:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {Array.from({ length: essayCount }, (_, i) => (
                    <div
                      key={i}
                      className="bg-white border border-slate-200 rounded-lg p-2.5 text-center flex flex-col items-center justify-between"
                    >
                      <span className="text-[11px] font-semibold text-slate-600 mb-1">
                        Uraian {i + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Max:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={essayMaxScores[i] ?? 3}
                          onChange={(e) =>
                            handleIndividualEssayScoreChange(i, Number(e.target.value))
                          }
                          className="w-12 px-1 py-0.5 border border-slate-200 rounded text-center text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Tujuan Pembelajaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Capaian Pembelajaran / Tujuan Pembelajaran (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Peserta didik mampu..."
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Section 4: Siswa */}
          {!isEdit && availableStudents.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExistingStudents}
                  onChange={(e) => setIncludeExistingStudents(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-semibold text-blue-900">
                  Masukkan {availableStudents.length} siswa dari Data Siswa Tersimpan ke lembar asesmen ini secara otomatis
                </span>
              </label>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
            >
              {isEdit ? 'Simpan Perubahan' : 'Simpan & Buka Penilaian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
