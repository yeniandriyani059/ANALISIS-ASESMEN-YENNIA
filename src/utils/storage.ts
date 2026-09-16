import { Assessment, SchoolProfile, Student, OptionChoice } from '../types';

const STORAGE_KEYS = {
  ASSESSMENTS: 'analisis_asesmen_list_v1',
  ACTIVE_ID: 'analisis_asesmen_active_id_v1',
  PROFILE: 'analisis_asesmen_profile_v1',
  STUDENTS: 'analisis_asesmen_students_v1',
};

export const DEFAULT_PROFILE: SchoolProfile = {
  schoolName: 'SD Negeri 06 Slemped',
  teacherName: 'Nurul Hidayati, S.Pd.',
  teacherNip: '19880612 201402 2 003',
  principalName: 'Drs. H. Bambang Suprayitno, M.Pd.',
  principalNip: '19720915 199803 1 004',
  cityName: 'Slemped',
};

export const DEFAULT_STUDENTS: Student[] = [
  { id: 'std-1', nis: '2024001', name: 'Aditya Pratama Putra', gender: 'L' },
  { id: 'std-2', nis: '2024002', name: 'Aisyah Putri Azzahra', gender: 'P' },
  { id: 'std-3', nis: '2024003', name: 'Alif Kurniawan', gender: 'L' },
  { id: 'std-4', nis: '2024004', name: 'Anindya Kirana Larasati', gender: 'P' },
  { id: 'std-5', nis: '2024005', name: 'Bagas Danuarta', gender: 'L' },
  { id: 'std-6', nis: '2024006', name: 'Bilqis Humaira', gender: 'P' },
  { id: 'std-7', nis: '2024007', name: 'Dimas Setiawan', gender: 'L' },
  { id: 'std-8', nis: '2024008', name: 'Fadhil Muhammad', gender: 'L' },
  { id: 'std-9', nis: '2024009', name: 'Hafizah Nailatul Izzah', gender: 'P' },
  { id: 'std-10', nis: '2024010', name: 'Ibrahim Faruq', gender: 'L' },
  { id: 'std-11', nis: '2024011', name: 'Khadijah Zahra', gender: 'P' },
  { id: 'std-12', nis: '2024012', name: 'Muhammad Rizky Ramadhan', gender: 'L' },
  { id: 'std-13', nis: '2024013', name: 'Naura Salsabila', gender: 'P' },
  { id: 'std-14', nis: '2024014', name: 'Raffi Ahmad Prasetyo', gender: 'L' },
  { id: 'std-15', nis: '2024015', name: 'Salma Nur Azizah', gender: 'P' },
  { id: 'std-16', nis: '2024016', name: 'Tegar Dwi Wicaksono', gender: 'L' },
];

export const INITIAL_ANSWER_KEYS: OptionChoice[] = [
  'A', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'C',
  'B', 'A', 'D', 'C', 'B', 'A', 'C', 'D', 'B', 'A'
];

export function generateDefaultAssessment(): Assessment {
  const pgCount = 20;
  const essayCount = 5;
  const answerKeys = INITIAL_ANSWER_KEYS;

  // Realistic sample answers
  const results = DEFAULT_STUDENTS.map((std, idx) => {
    // Variations in accuracy
    const answers: OptionChoice[] = [];
    const accuracyFactor = [0.95, 0.9, 0.85, 0.8, 0.65, 0.75, 0.55, 0.7, 0.9, 0.6, 0.85, 0.75, 0.8, 0.5, 0.9, 0.7][idx] ?? 0.75;
    
    for (let q = 0; q < pgCount; q++) {
      const correct = answerKeys[q];
      const rand = Math.random();
      if (rand < accuracyFactor) {
        answers.push(correct);
      } else {
        const wrongPool: OptionChoice[] = (['A', 'B', 'C', 'D'] as OptionChoice[]).filter((c) => c !== correct);
        answers.push(wrongPool[Math.floor(Math.random() * wrongPool.length)]);
      }
    }

    const essayScores = [
      Math.min(3, Math.max(1, Math.round(accuracyFactor * 3))),
      Math.min(3, Math.max(1, Math.round(accuracyFactor * 3 + (Math.random() > 0.5 ? 0 : -1)))),
      Math.min(3, Math.max(0, Math.round(accuracyFactor * 3))),
      Math.min(3, Math.max(1, Math.round(accuracyFactor * 3))),
      Math.min(3, Math.max(0, Math.round(accuracyFactor * 3 + (Math.random() > 0.5 ? 0 : -1)))),
    ];

    return {
      studentId: std.id,
      studentName: std.name,
      studentNis: std.nis,
      gender: std.gender,
      attendance: 'Hadir' as const,
      pgAnswers: answers,
      essayScores,
    };
  });

  return {
    id: 'sample-assessment-1',
    title: 'Sumatif Bab 2: Menjaga Kesehatan Tubuh & Kalimat Ajakan',
    subject: 'Bahasa Indonesia',
    className: 'Kelas II',
    phase: 'Fase A',
    semester: 'Ganjil',
    schoolYear: '2024/2025',
    assessmentType: 'Sumatif Lingkup Materi',
    date: new Date().toISOString().split('T')[0],
    passingGrade: 75,
    schoolName: DEFAULT_PROFILE.schoolName,
    teacherName: DEFAULT_PROFILE.teacherName,
    teacherNip: DEFAULT_PROFILE.teacherNip,
    principalName: DEFAULT_PROFILE.principalName,
    principalNip: DEFAULT_PROFILE.principalNip,
    cityName: DEFAULT_PROFILE.cityName,
    pgCount,
    pgWeight: 1,
    hasOptionE: false,
    answerKeys,
    essayCount,
    essayMaxScores: [3, 3, 3, 3, 3],
    learningObjectives: 'Peserta didik mampu mengidentifikasi kosakata kesehatan, memahami isi teks bacaan sederhana, dan membuat kalimat ajakan yang santun.',
    results,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function loadAssessments(): Assessment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    if (!raw) {
      const initial = [generateDefaultAssessment()];
      saveAssessments(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [generateDefaultAssessment()];
  } catch (err) {
    console.error('Failed to load assessments:', err);
    return [generateDefaultAssessment()];
  }
}

export function saveAssessments(list: Assessment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save assessments:', err);
  }
}

export function loadActiveAssessmentId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveActiveAssessmentId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  } catch (err) {
    console.error('Failed to save active id:', err);
  }
}

export function loadSchoolProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(err);
  }
  return DEFAULT_PROFILE;
}

export function saveSchoolProfile(profile: SchoolProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error(err);
  }
}

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error(err);
  }
  return DEFAULT_STUDENTS;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error(err);
  }
}
