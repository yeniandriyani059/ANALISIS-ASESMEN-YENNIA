/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SheetInputView } from './components/SheetInputView';
import { ItemAnalysisView } from './components/ItemAnalysisView';
import { RecapStatsView } from './components/RecapStatsView';
import { RemedialEnrichmentView } from './components/RemedialEnrichmentView';
import { ReportPrintView } from './components/ReportPrintView';
import { ArchiveView } from './components/ArchiveView';
import { AssessmentFormModal } from './components/AssessmentFormModal';
import { AnswerKeyModal } from './components/AnswerKeyModal';
import { StudentsManageModal } from './components/StudentsManageModal';
import { SchoolProfileModal } from './components/SchoolProfileModal';
import { AssessmentSettingsKeyView } from './components/AssessmentSettingsKeyView';

import {
  Assessment,
  SchoolProfile,
  Student,
  StudentAssessmentResult,
  OptionChoice,
} from './types';
import {
  loadAssessments,
  saveAssessments,
  loadActiveAssessmentId,
  saveActiveAssessmentId,
  loadSchoolProfile,
  saveSchoolProfile,
  loadStudents,
  saveStudents,
  generateDefaultAssessment,
} from './utils/storage';
import { exportAssessmentToExcel } from './utils/excelExport';

export default function App() {
  const [assessments, setAssessments] = useState<Assessment[]>(() => loadAssessments());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = loadActiveAssessmentId();
    const initial = loadAssessments();
    if (saved && initial.some((a) => a.id === saved)) return saved;
    return initial.length > 0 ? initial[0].id : null;
  });

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => loadSchoolProfile());
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active Assessment
  const activeAssessment = assessments.find((a) => a.id === activeId) || assessments[0] || null;

  // Persist assessments on change
  useEffect(() => {
    saveAssessments(assessments);
  }, [assessments]);

  // Persist active ID on change
  useEffect(() => {
    if (activeId) {
      saveActiveAssessmentId(activeId);
    }
  }, [activeId]);

  // Select Assessment
  const handleSelectAssessment = (id: string) => {
    setActiveId(id);
  };

  // Save new or edited assessment
  const handleSaveAssessment = (assessment: Assessment) => {
    const exists = assessments.some((a) => a.id === assessment.id);
    let updated: Assessment[];

    if (exists) {
      updated = assessments.map((a) => (a.id === assessment.id ? assessment : a));
    } else {
      updated = [assessment, ...assessments];
    }

    setAssessments(updated);
    setActiveId(assessment.id);
    setEditingAssessment(null);
    setActiveTab('sheet');
  };

  // Duplicate assessment
  const handleDuplicateAssessment = (source: Assessment) => {
    const duplicated: Assessment = {
      ...source,
      id: `asm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${source.title} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [duplicated, ...assessments];
    setAssessments(updated);
    setActiveId(duplicated.id);
    setActiveTab('sheet');
  };

  // Delete assessment
  const handleDeleteAssessment = (id: string) => {
    let updated = assessments.filter((a) => a.id !== id);
    if (updated.length === 0) {
      const fresh = generateDefaultAssessment();
      updated = [fresh];
    }
    setAssessments(updated);
    if (activeId === id || !updated.some((a) => a.id === activeId)) {
      setActiveId(updated[0].id);
    }
  };

  // Update student results inside active assessment
  const handleUpdateResults = (newResults: StudentAssessmentResult[]) => {
    if (!activeAssessment) return;

    const updatedAssessment: Assessment = {
      ...activeAssessment,
      results: newResults,
      updatedAt: new Date().toISOString(),
    };

    const nextList = assessments.map((a) =>
      a.id === updatedAssessment.id ? updatedAssessment : a
    );
    setAssessments(nextList);
  };

  // Save answer keys
  const handleSaveKeys = (keys: OptionChoice[], hasOptionE: boolean) => {
    if (!activeAssessment) return;

    const updatedAssessment: Assessment = {
      ...activeAssessment,
      answerKeys: keys,
      hasOptionE,
      updatedAt: new Date().toISOString(),
    };

    const nextList = assessments.map((a) =>
      a.id === updatedAssessment.id ? updatedAssessment : a
    );
    setAssessments(nextList);
  };

  // Full configuration update: PG count, PG weight, Keys, Essay count, Individual essay max scores
  const handleUpdateAssessmentConfig = (updated: {
    pgCount: number;
    pgWeight: number;
    hasOptionE: boolean;
    answerKeys: OptionChoice[];
    essayCount: number;
    essayMaxScores: number[];
  }) => {
    if (!activeAssessment) return;

    // Adjust each student's results in real time so arrays match new pgCount and essayCount
    const updatedResults = (activeAssessment.results || []).map((r) => {
      const nextPg = [...(r.pgAnswers || [])];
      while (nextPg.length < updated.pgCount) nextPg.push('');
      const trimmedPg = nextPg.slice(0, updated.pgCount);

      const nextEssay = [...(r.essayScores || [])];
      while (nextEssay.length < updated.essayCount) nextEssay.push(0);
      const trimmedEssay = nextEssay.slice(0, updated.essayCount).map((score, i) => {
        const max = updated.essayMaxScores[i] ?? 3;
        return Math.min(score, max);
      });

      return {
        ...r,
        pgAnswers: trimmedPg,
        essayScores: trimmedEssay,
      };
    });

    const updatedAssessment: Assessment = {
      ...activeAssessment,
      pgCount: updated.pgCount,
      pgWeight: updated.pgWeight,
      hasOptionE: updated.hasOptionE,
      answerKeys: updated.answerKeys,
      essayCount: updated.essayCount,
      essayMaxScores: updated.essayMaxScores,
      results: updatedResults,
      updatedAt: new Date().toISOString(),
    };

    const nextList = assessments.map((a) =>
      a.id === updatedAssessment.id ? updatedAssessment : a
    );
    setAssessments(nextList);
  };

  // Save Master Students
  const handleSaveStudents = (newList: Student[]) => {
    setStudents(newList);
    saveStudents(newList);
  };

  // Synchronize master students to current assessment sheet
  const handleSyncStudentsToActive = (studentList: Student[]) => {
    if (!activeAssessment) return;

    const currentResults = [...(activeAssessment.results || [])];
    const updatedResults: StudentAssessmentResult[] = [];

    studentList.forEach((std) => {
      const existing = currentResults.find((r) => r.studentId === std.id || r.studentName === std.name);
      if (existing) {
        updatedResults.push({
          ...existing,
          studentName: std.name,
          gender: std.gender,
        });
      } else {
        updatedResults.push({
          studentId: std.id,
          studentName: std.name,
          gender: std.gender,
          attendance: 'Hadir',
          pgAnswers: Array.from({ length: activeAssessment.pgCount }, () => '' as OptionChoice),
          essayScores: Array.from({ length: activeAssessment.essayCount }, () => 0),
        });
      }
    });

    handleUpdateResults(updatedResults);
  };

  // Save School Profile
  const handleSaveProfile = (newProfile: SchoolProfile) => {
    setSchoolProfile(newProfile);
    saveSchoolProfile(newProfile);

    // Also update signatures on active assessment
    if (activeAssessment) {
      const updatedAssessment: Assessment = {
        ...activeAssessment,
        schoolName: newProfile.schoolName,
        teacherName: newProfile.teacherName,
        teacherNip: newProfile.teacherNip,
        principalName: newProfile.principalName,
        principalNip: newProfile.principalNip,
        cityName: newProfile.cityName,
      };
      setAssessments(assessments.map((a) => (a.id === updatedAssessment.id ? updatedAssessment : a)));
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!activeAssessment) return;
    exportAssessmentToExcel(activeAssessment);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        assessments={assessments}
        activeAssessment={activeAssessment}
        onSelectAssessment={handleSelectAssessment}
        onOpenNewModal={() => {
          setEditingAssessment(null);
          setIsNewModalOpen(true);
        }}
        onOpenKeyModal={() => setActiveTab('settings_key')}
        onOpenStudentsModal={() => setIsStudentsModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onExportExcel={handleExportExcel}
      />

      {/* Main Content Area (Full Width) */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            assessments={assessments}
            activeAssessment={activeAssessment}
            students={students}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenNewModal={() => {
              setEditingAssessment(null);
              setIsNewModalOpen(true);
            }}
            onOpenKeyModal={() => setActiveTab('settings_key')}
            onExportExcel={handleExportExcel}
            onSelectAssessment={handleSelectAssessment}
          />
        )}

        {activeTab === 'settings_key' && activeAssessment && (
          <AssessmentSettingsKeyView
            assessment={activeAssessment}
            onUpdateAssessmentConfig={handleUpdateAssessmentConfig}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenIdentityModal={() => {
              setEditingAssessment(activeAssessment);
              setIsNewModalOpen(true);
            }}
            onOpenStudentsModal={() => setIsStudentsModalOpen(true)}
          />
        )}

        {activeTab === 'sheet' && activeAssessment && (
          <SheetInputView
            assessment={activeAssessment}
            onUpdateResults={handleUpdateResults}
            onOpenKeyModal={() => setActiveTab('settings_key')}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenIdentityModal={() => {
              setEditingAssessment(activeAssessment);
              setIsNewModalOpen(true);
            }}
            onOpenStudentsModal={() => setIsStudentsModalOpen(true)}
          />
        )}

        {activeTab === 'itemAnalysis' && activeAssessment && (
          <ItemAnalysisView assessment={activeAssessment} />
        )}

        {activeTab === 'recap' && activeAssessment && (
          <RecapStatsView assessment={activeAssessment} />
        )}

        {activeTab === 'remedial' && activeAssessment && (
          <RemedialEnrichmentView
            assessment={activeAssessment}
            onUpdateResults={handleUpdateResults}
            onPrintRequest={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && activeAssessment && (
          <ReportPrintView
            assessment={activeAssessment}
            onBack={() => setActiveTab('sheet')}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveView
            assessments={assessments}
            activeId={activeId}
            onSelectAssessment={handleSelectAssessment}
            onOpenNewModal={() => {
              setEditingAssessment(null);
              setIsNewModalOpen(true);
            }}
            onDuplicateAssessment={handleDuplicateAssessment}
            onDeleteAssessment={handleDeleteAssessment}
            onEditAssessment={(asm) => {
              setActiveId(asm.id);
              setEditingAssessment(asm);
              setIsNewModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      {isNewModalOpen && (
        <AssessmentFormModal
          isOpen={isNewModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingAssessment(null);
          }}
          onSave={handleSaveAssessment}
          initialData={editingAssessment}
          schoolProfile={schoolProfile}
          availableStudents={students}
        />
      )}

      {isKeyModalOpen && activeAssessment && (
        <AnswerKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          assessment={activeAssessment}
          onSaveKeys={handleSaveKeys}
          onSaveFullConfig={handleUpdateAssessmentConfig}
        />
      )}

      {isStudentsModalOpen && (
        <StudentsManageModal
          isOpen={isStudentsModalOpen}
          onClose={() => setIsStudentsModalOpen(false)}
          students={students}
          onSaveStudents={handleSaveStudents}
          onSyncToActiveAssessment={handleSyncStudentsToActive}
        />
      )}

      {isProfileModalOpen && (
        <SchoolProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={schoolProfile}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
