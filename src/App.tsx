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
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { AuthView } from './components/AuthView';
import { PendingView } from './components/PendingView';

import {
  Assessment,
  SchoolProfile,
  Student,
  StudentAssessmentResult,
  OptionChoice,
} from './types';
import { EMPTY_PROFILE } from './utils/storage';
import { exportAssessmentToExcel } from './utils/excelExport';
import { api } from './lib/api';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { StudentProvider, useStudentsContext } from './contexts/StudentContext';


function MainApp({ session }: { session: Session }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(EMPTY_PROFILE);
  const { students, setStudents } = useStudentsContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [logoError, setLogoError] = useState(false);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsInitializing(true);
      try {
        const [prof, asms] = await Promise.all([
          api.getProfile(),
          api.getAssessments(),
        ]);
        
        setSchoolProfile(prof || EMPTY_PROFILE);
        setAssessments(asms || []);
        
        if (asms && asms.length > 0) {
          setActiveId(asms[0].id);
        } else {
          setActiveId(null);
        }
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    loadData();
  }, []);

  // Active Assessment
  const activeAssessment = assessments.find((a) => a.id === activeId) || assessments[0] || null;

  // Select Assessment
  const handleSelectAssessment = (id: string) => {
    setActiveId(id);
  };

  // Save new or edited assessment
  const handleSaveAssessment = async (assessment: Assessment) => {
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
    
    // Save to Supabase
    await api.saveAssessment(assessment);
  };

  // Duplicate assessment
  const handleDuplicateAssessment = async (source: Assessment) => {
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
    
    await api.saveAssessment(duplicated);
  };

  // Delete assessment
  const handleDeleteAssessment = async (id: string) => {
    const updated = assessments.filter((a) => a.id !== id);
    setAssessments(updated);
    
    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
      } else {
        setActiveId(null);
        setActiveTab('dashboard');
      }
    }
    
    await api.deleteAssessment(id);
  };

  // Update student results inside active assessment
  const handleUpdateResults = async (newResults: StudentAssessmentResult[]) => {
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
    
    await api.saveAssessment(updatedAssessment);
  };

  // Save answer keys
  const handleSaveKeys = async (keys: OptionChoice[], hasOptionE: boolean) => {
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
    
    await api.saveAssessment(updatedAssessment);
  };

  // Full configuration update
  const handleUpdateAssessmentConfig = async (updated: {
    pgCount: number;
    pgWeight: number;
    hasOptionE: boolean;
    answerKeys: OptionChoice[];
    essayCount: number;
    essayMaxScores: number[];
  }) => {
    if (!activeAssessment) return;

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
    
    await api.saveAssessment(updatedAssessment);
  };

  // Save Master Students
  const handleSaveStudents = async (newList: Student[]) => {
    setStudents(newList);
    await api.saveStudents(newList);
  };

  // Synchronize master students to current assessment sheet
  const handleSyncStudentsToActive = async (studentList: Student[]) => {
    if (!activeAssessment) return;

    const currentResults = [...(activeAssessment.results || [])];
    const updatedResults: StudentAssessmentResult[] = [];

    studentList.forEach((std) => {
      const existing = currentResults.find((r) => r.studentId === std.id || r.studentName === std.name);
      if (existing) {
        updatedResults.push({
          ...existing,
          studentName: std.name,
          studentNis: std.nis,
          gender: std.gender,
        });
      } else {
        updatedResults.push({
          studentId: std.id,
          studentName: std.name,
          studentNis: std.nis,
          gender: std.gender,
          attendance: 'Hadir',
          pgAnswers: Array.from({ length: activeAssessment.pgCount }, () => '' as OptionChoice),
          essayScores: Array.from({ length: activeAssessment.essayCount }, () => 0),
        });
      }
    });

    await handleUpdateResults(updatedResults);
  };

  // Save School Profile
  const handleSaveProfile = async (newProfile: SchoolProfile) => {
    setSchoolProfile(newProfile);
    await api.saveProfile(newProfile);

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
      await api.saveAssessment(updatedAssessment);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!activeAssessment) return;
    exportAssessmentToExcel(activeAssessment);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <h2 className="text-slate-800 font-bold text-lg">Memuat Data Supabase...</h2>
        <p className="text-slate-500 text-sm mt-1">Menyinkronkan data profil dan asesmen</p>
      </div>
    );
  }

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
            students={students}
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

        {!activeAssessment && !['dashboard', 'archive'].includes(activeTab) && (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Asesmen Aktif</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Menu ini membutuhkan data asesmen yang aktif. Silakan buat atau pilih asesmen terlebih dahulu dari menu Dashboard atau Arsip Penilaian.
            </p>
            <button
              onClick={() => {
                setActiveTab('dashboard');
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Kembali ke Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="print:hidden w-full py-6 mt-auto flex flex-col items-center justify-center gap-2 border-t border-slate-200 bg-white">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Powered by
        </span>
        {!logoError ? (
          <img 
            src="/LOGO BUGURUYENNIA.png" 
            alt="Bu Guru Yennia Logo" 
            className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-sm font-extrabold text-blue-600 tracking-tight">Bu Guru Yennia</span>
        )}
      </footer>

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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const checkProfileStatus = async (userId: string, showLoader: boolean = true) => {
    if (showLoader) setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('status').eq('user_id', userId).maybeSingle();
      if (data) {
        setProfileStatus(data.status);
      } else {
        // If profile not found, maybe they just registered, default to pending or wait for trigger
        setProfileStatus('pending');
      }
    } catch (e) {
      console.error(e);
    }
    if (showLoader) setIsAuthLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfileStatus(session.user.id, true);
      else setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (_event === 'TOKEN_REFRESHED') {
        return; // Do nothing, avoid re-rendering whole App on window focus
      }
      
      // If we already have a session and event is SIGNED_IN, it might be a spurious event from window focus.
      setSession((prevSession) => {
        if (prevSession && _event === 'SIGNED_IN') return prevSession;
        return newSession;
      });

      if (newSession) {
        if (_event === 'SIGNED_IN') {
          // Check if it's the same user to avoid redundant fetches
          setSession((prev) => {
             if (!prev || prev.user.id !== newSession.user.id) {
                 checkProfileStatus(newSession.user.id, true);
             }
             return prev; // We already updated it above
          });
        }
      }
      else {
        setProfileStatus(null);
        setIsAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat sesi...</p>
      </div>
    );
  }

  if (!session) return <AuthView />;
  if (profileStatus === 'pending') return <PendingView />;
  
  return (
    <StudentProvider>
      <MainApp session={session} />
    </StudentProvider>
  );
}
