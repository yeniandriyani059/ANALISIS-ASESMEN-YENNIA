export type Gender = 'L' | 'P';
export type Attendance = 'Hadir' | 'Tidak Hadir' | 'Sakit' | 'Izin';
export type OptionChoice = 'A' | 'B' | 'C' | 'D' | 'E' | '';

export interface SchoolProfile {
  schoolName: string;
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  cityName: string; // Tempat titimangsa tanda tangan
}

export interface Student {
  id: string;
  nis?: string;
  name: string;
  gender: Gender;
}

export interface StudentAssessmentResult {
  studentId: string;
  studentName: string;
  studentNis?: string;
  gender: Gender;
  attendance: Attendance;
  pgAnswers: OptionChoice[]; // array length = assessment.pgCount
  essayScores: number[]; // array length = assessment.essayCount
  // Computed fields:
  pgCorrectCount?: number;
  pgScore?: number;
  essayTotalScore?: number;
  finalScore?: number;
  isPassed?: boolean;
  remedialQuestions?: number[]; // question numbers (1-based) answered incorrectly
  remedialScore?: number;
}

export type AssessmentType = 
  | 'Sumatif Lingkup Materi'
  | 'Sumatif Tengah Semester'
  | 'Sumatif Akhir Semester'
  | 'Asesmen Formatif'
  | 'Penilaian Harian';

export interface Assessment {
  id: string;
  title: string; // e.g. "Sumatif Bab 3: Menulis Surat Singkat"
  subject: string; // e.g. "Bahasa Indonesia"
  className: string; // e.g. "Kelas II"
  phase: string; // e.g. "Fase A"
  semester: 'Ganjil' | 'Genap';
  schoolYear: string; // e.g. "2024/2025"
  assessmentType: AssessmentType;
  date: string; // YYYY-MM-DD
  passingGrade: number; // KKTP / KKM, e.g. 75
  
  // School & Teacher Info snapshot
  schoolName: string;
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  cityName: string;

  // Questions Configuration
  pgCount: number; // e.g. 20
  pgWeight: number; // weight per PG question, e.g. 1
  hasOptionE: boolean; // false for A-D, true for A-E
  answerKeys: OptionChoice[]; // e.g. ['A', 'B', 'C', ...]
  
  essayCount: number; // e.g. 5
  essayMaxScores: number[]; // e.g. [3, 3, 3, 3, 3]
  
  learningObjectives?: string; // Capaian Pembelajaran / Tujuan Pembelajaran

  // Results
  results: StudentAssessmentResult[];

  createdAt: string;
  updatedAt: string;
}

export interface ItemDifficulty {
  questionIndex: number; // 0-based
  questionNumber: number; // 1-based
  correctAnswer: OptionChoice;
  correctCount: number;
  totalParticipants: number;
  difficultyIndex: number; // P = B / N
  difficultyCategory: 'Sukar' | 'Sedang' | 'Mudah';
  discriminationIndex: number; // D = (BA/NA) - (BB/NB)
  discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Jelek';
  recommendation: 'Diterima' | 'Revisi Butir' | 'Dibuang/Diganti';
  distractorCounts: Record<string, number>; // counts for A, B, C, D, E, kosong
}

export interface EssayItemAnalysis {
  questionIndex: number; // 0-based
  questionNumber: number; // 1-based
  maxScore: number;
  totalScoreAcquired: number;
  averageScore: number;
  percentageScore: number;
  category: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
}

export interface AssessmentOverallStats {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  passedCount: number;
  remedialCount: number;
  passPercentage: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  topStudentName?: string;
  lowestStudentName?: string;
  scoreDistribution: {
    excellent: number; // >= 85
    good: number;      // 75 - 84
    fair: number;      // 60 - 74
    poor: number;      // < 60
  };
}
