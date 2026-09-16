import {
  Assessment,
  StudentAssessmentResult,
  ItemDifficulty,
  EssayItemAnalysis,
  AssessmentOverallStats,
  OptionChoice,
} from '../types';

/**
 * Computes maximum possible scores for PG and Essay
 */
export function calculateMaxScores(assessment: Pick<Assessment, 'pgCount' | 'pgWeight' | 'essayCount' | 'essayMaxScores'>) {
  const pgMax = (assessment.pgCount || 0) * (assessment.pgWeight || 1);
  const essayMax = (assessment.essayMaxScores || []).slice(0, assessment.essayCount || 0).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalMax = pgMax + essayMax;
  return { pgMax, essayMax, totalMax: totalMax > 0 ? totalMax : 100 };
}

/**
 * Calculates a single student's score and evaluation details
 */
export function evaluateStudentResult(
  result: StudentAssessmentResult,
  assessment: Pick<Assessment, 'pgCount' | 'pgWeight' | 'essayCount' | 'essayMaxScores' | 'answerKeys' | 'passingGrade'>
): StudentAssessmentResult {
  if (result.attendance !== 'Hadir') {
    return {
      ...result,
      pgCorrectCount: 0,
      pgScore: 0,
      essayTotalScore: 0,
      finalScore: 0,
      isPassed: false,
      remedialQuestions: [],
    };
  }

  const keys = assessment.answerKeys || [];
  const answers = result.pgAnswers || [];
  let correctCount = 0;
  const incorrectQuestions: number[] = [];

  for (let i = 0; i < assessment.pgCount; i++) {
    const studentAns = answers[i] || '';
    const key = keys[i] || '';
    if (studentAns !== '' && studentAns === key) {
      correctCount++;
    } else {
      incorrectQuestions.push(i + 1);
    }
  }

  const { pgWeight, essayCount, essayMaxScores, passingGrade } = assessment;
  const pgScoreAcquired = correctCount * (pgWeight || 1);

  const essayScores = result.essayScores || [];
  let essayTotalAcquired = 0;
  for (let i = 0; i < essayCount; i++) {
    const max = essayMaxScores[i] ?? 3;
    const score = Math.max(0, Math.min(Number(essayScores[i]) || 0, max));
    essayTotalAcquired += score;
  }

  const { totalMax } = calculateMaxScores(assessment);
  const acquiredTotal = pgScoreAcquired + essayTotalAcquired;
  const computedScore = totalMax > 0 ? (acquiredTotal / totalMax) * 100 : 0;
  const finalScore = Math.round(computedScore * 100) / 100;

  return {
    ...result,
    pgCorrectCount: correctCount,
    pgScore: pgScoreAcquired,
    essayTotalScore: essayTotalAcquired,
    finalScore,
    isPassed: finalScore >= (passingGrade || 70),
    remedialQuestions: incorrectQuestions,
  };
}

/**
 * Performs full item analysis for Multiple Choice (PG) questions
 */
export function analyzePgItems(assessment: Assessment): ItemDifficulty[] {
  const presentResults = assessment.results
    .filter((r) => r.attendance === 'Hadir')
    .map((r) => evaluateStudentResult(r, assessment));

  const totalN = presentResults.length;
  const items: ItemDifficulty[] = [];

  // Sort students by total score for discrimination index (Kelompok Atas vs Kelompok Bawah)
  const sortedStudents = [...presentResults].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
  
  // Group size: 27% (Kelly's rule) or half if sample size is small (< 10)
  const groupSize = totalN >= 10 ? Math.max(1, Math.round(totalN * 0.27)) : Math.max(1, Math.floor(totalN / 2));
  const upperGroup = sortedStudents.slice(0, groupSize);
  const lowerGroup = sortedStudents.slice(-groupSize);

  for (let i = 0; i < assessment.pgCount; i++) {
    const qNum = i + 1;
    const correctKey = assessment.answerKeys[i] || '';
    
    // Distractor counters
    const distractorCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, Kosong: 0 };
    let correctTotal = 0;

    presentResults.forEach((r) => {
      const ans = r.pgAnswers[i] || '';
      if (!ans) {
        distractorCounts['Kosong']++;
      } else {
        distractorCounts[ans] = (distractorCounts[ans] || 0) + 1;
      }
      if (ans !== '' && ans === correctKey) {
        correctTotal++;
      }
    });

    // Difficulty Index: P = B / N
    const p = totalN > 0 ? correctTotal / totalN : 0;
    let diffCategory: 'Sukar' | 'Sedang' | 'Mudah' = 'Sedang';
    if (p < 0.3) diffCategory = 'Sukar';
    else if (p > 0.7) diffCategory = 'Mudah';

    // Discrimination Index: D = (BA / NA) - (BB / NB)
    let correctUpper = 0;
    upperGroup.forEach((r) => {
      if ((r.pgAnswers[i] || '') === correctKey && correctKey !== '') correctUpper++;
    });

    let correctLower = 0;
    lowerGroup.forEach((r) => {
      if ((r.pgAnswers[i] || '') === correctKey && correctKey !== '') correctLower++;
    });

    const propUpper = upperGroup.length > 0 ? correctUpper / upperGroup.length : 0;
    const propLower = lowerGroup.length > 0 ? correctLower / lowerGroup.length : 0;
    const d = propUpper - propLower;

    let discCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Jelek' = 'Cukup';
    let recommendation: 'Diterima' | 'Revisi Butir' | 'Dibuang/Diganti' = 'Diterima';

    if (d >= 0.4) {
      discCategory = 'Sangat Baik';
      recommendation = 'Diterima';
    } else if (d >= 0.3) {
      discCategory = 'Baik';
      recommendation = 'Diterima';
    } else if (d >= 0.2) {
      discCategory = 'Cukup';
      recommendation = 'Revisi Butir';
    } else {
      discCategory = 'Jelek';
      recommendation = 'Dibuang/Diganti';
    }

    items.push({
      questionIndex: i,
      questionNumber: qNum,
      correctAnswer: correctKey,
      correctCount: correctTotal,
      totalParticipants: totalN,
      difficultyIndex: Math.round(p * 100) / 100,
      difficultyCategory: diffCategory,
      discriminationIndex: Math.round(d * 100) / 100,
      discriminationCategory: discCategory,
      recommendation,
      distractorCounts,
    });
  }

  return items;
}

/**
 * Performs item analysis for Essay questions
 */
export function analyzeEssayItems(assessment: Assessment): EssayItemAnalysis[] {
  const presentResults = assessment.results.filter((r) => r.attendance === 'Hadir');
  const totalN = presentResults.length;
  const items: EssayItemAnalysis[] = [];

  for (let i = 0; i < assessment.essayCount; i++) {
    const maxScore = assessment.essayMaxScores[i] ?? 3;
    let totalScore = 0;

    presentResults.forEach((r) => {
      const score = Number(r.essayScores[i]) || 0;
      totalScore += Math.max(0, Math.min(score, maxScore));
    });

    const averageScore = totalN > 0 ? totalScore / totalN : 0;
    const maxPossibleTotal = totalN * maxScore;
    const percentage = maxPossibleTotal > 0 ? (totalScore / maxPossibleTotal) * 100 : 0;

    let category: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Cukup';
    if (percentage >= 80) category = 'Sangat Baik';
    else if (percentage >= 65) category = 'Baik';
    else if (percentage >= 50) category = 'Cukup';
    else category = 'Perlu Bimbingan';

    items.push({
      questionIndex: i,
      questionNumber: i + 1,
      maxScore,
      totalScoreAcquired: totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
      percentageScore: Math.round(percentage * 10) / 10,
      category,
    });
  }

  return items;
}

/**
 * Computes overall statistics for the assessment
 */
export function computeOverallStats(assessment: Assessment): AssessmentOverallStats {
  const evaluatedResults = assessment.results.map((r) => evaluateStudentResult(r, assessment));
  const totalStudents = evaluatedResults.length;
  const present = evaluatedResults.filter((r) => r.attendance === 'Hadir');
  const presentStudents = present.length;
  const absentStudents = totalStudents - presentStudents;

  if (presentStudents === 0) {
    return {
      totalStudents,
      presentStudents: 0,
      absentStudents,
      passedCount: 0,
      remedialCount: 0,
      passPercentage: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      medianScore: 0,
      scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    };
  }

  const scores = present.map((r) => r.finalScore ?? 0).sort((a, b) => a - b);
  const passedCount = present.filter((r) => r.isPassed).length;
  const remedialCount = presentStudents - passedCount;
  const passPercentage = Math.round((passedCount / presentStudents) * 1000) / 10;

  const totalSum = scores.reduce((sum, val) => sum + val, 0);
  const averageScore = Math.round((totalSum / presentStudents) * 100) / 100;
  const lowestScore = scores[0];
  const highestScore = scores[scores.length - 1];

  // Median
  const mid = Math.floor(scores.length / 2);
  const medianScore =
    scores.length % 2 !== 0
      ? scores[mid]
      : Math.round(((scores[mid - 1] + scores[mid]) / 2) * 100) / 100;

  // Find top and lowest student names
  const topStudent = present.find((r) => (r.finalScore ?? 0) === highestScore)?.studentName;
  const lowestStudent = present.find((r) => (r.finalScore ?? 0) === lowestScore)?.studentName;

  // Distribution
  const distribution = {
    excellent: present.filter((r) => (r.finalScore ?? 0) >= 85).length,
    good: present.filter((r) => (r.finalScore ?? 0) >= 75 && (r.finalScore ?? 0) < 85).length,
    fair: present.filter((r) => (r.finalScore ?? 0) >= 60 && (r.finalScore ?? 0) < 75).length,
    poor: present.filter((r) => (r.finalScore ?? 0) < 60).length,
  };

  return {
    totalStudents,
    presentStudents,
    absentStudents,
    passedCount,
    remedialCount,
    passPercentage,
    averageScore,
    highestScore,
    lowestScore,
    medianScore,
    topStudentName: topStudent,
    lowestStudentName: lowestStudent,
    scoreDistribution: distribution,
  };
}
