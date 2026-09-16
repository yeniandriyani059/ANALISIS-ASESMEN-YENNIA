import { supabase } from './supabase';
import { Assessment, SchoolProfile, Student, StudentAssessmentResult, OptionChoice } from '../types';

function hashId(id: string): number {
  if (/^\d+$/.test(id)) return parseInt(id, 10);
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export const api = {
  async getProfile(): Promise<SchoolProfile | null> {
    const { data, error } = await supabase.from('asesmen_profil').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
    if (!data) return null;
    return {
      schoolName: data.nama_sekolah || '',
      teacherName: data.nama_guru || '',
      teacherNip: data.nip_guru || '',
      principalName: data.nama_kepsek || '',
      principalNip: data.nip_kepsek || '',
      cityName: 'Slemped',
    };
  },

  async saveProfile(profile: SchoolProfile) {
    const { data: existing } = await supabase.from('asesmen_profil').select('id').limit(1).single();
    const payload = {
      ...(existing ? { id: existing.id } : {}),
      nama_sekolah: profile.schoolName,
      nama_guru: profile.teacherName,
      nip_guru: profile.teacherNip,
      nama_kepsek: profile.principalName,
      nip_kepsek: profile.principalNip,
    };
    try {
      const { error } = await supabase.from('asesmen_profil').upsert(payload);
      if (error) console.error('Error saving profile:', error);
    } catch (e) {
      console.error('Exception saving profile:', e);
    }
  },

  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase.from('asesmen_siswa').select('*').order('nama_lengkap');
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    return (data || []).map(row => ({
      id: String(row.id),
      nis: row.nis || '',
      name: row.nama_lengkap || '',
      gender: row.jenis_kelamin || 'L',
    }));
  },

  async saveStudents(students: Student[]) {
    if (!students || students.length === 0) return;
    const payload = students.map(s => ({
      id: hashId(s.id),
      nis: s.nis,
      nama_lengkap: s.name,
      jenis_kelamin: s.gender,
    }));
    
    try {
      const chunks = chunkArray(payload, 50);
      for (const chunk of chunks) {
        const { error: upsertError } = await supabase.from('asesmen_siswa').upsert(chunk, { onConflict: 'id' });
        if (upsertError) console.error('Error upserting students chunk:', upsertError);
      }
      
      const validIds = payload.map(p => p.id);
      if (validIds.length > 0) {
        // Fetch existing IDs first to avoid long URL in NOT IN
        const { data: existingData } = await supabase.from('asesmen_siswa').select('id');
        if (existingData) {
          const idsToDelete = existingData.map(d => d.id).filter(id => !validIds.includes(id));
          if (idsToDelete.length > 0) {
            const deleteChunks = chunkArray(idsToDelete, 50);
            for (const c of deleteChunks) {
              await supabase.from('asesmen_siswa').delete().in('id', c);
            }
          }
        }
      }
    } catch (e) {
      console.error('Exception saving students:', e);
    }
  },

  async getAssessments(): Promise<Assessment[]> {
    const { data: jadwalData, error: jadwalError } = await supabase.from('asesmen_jadwal').select('*').order('created_at', { ascending: false });
    if (jadwalError) {
      console.error('Error fetching assessments:', jadwalError);
      return [];
    }
    
    const { data: hasilData, error: hasilError } = await supabase.from('asesmen_hasil').select('*');
    if (hasilError) {
      console.error('Error fetching results:', hasilError);
      return [];
    }

    return jadwalData.map(row => {
      let extra = row.kunci_uraian && !Array.isArray(row.kunci_uraian) ? row.kunci_uraian : {};
      let maxScores = Array.isArray(row.kunci_uraian) ? row.kunci_uraian : (extra.maxScores || []);

      const [phase = 'Fase A', className = 'Kelas I'] = (row.fase_kelas || '').split(' - ');
      
      const assessmentIdStr = String(row.id);
      const results = hasilData
        .filter(r => String(r.asesmen_id) === assessmentIdStr)
        .map(r => ({
          studentId: String(r.siswa_id),
          studentName: '', // Will be filled by UI if missing
          gender: 'L', // Will be synced with master students later
          attendance: 'Hadir',
          pgAnswers: (r.jawaban_pg || []) as OptionChoice[],
          essayScores: (r.skor_uraian || []) as number[],
          finalScore: r.nilai_akhir || 0,
        } as StudentAssessmentResult));

      return {
        id: assessmentIdStr,
        title: row.judul_asesmen || '',
        subject: row.mata_pelajaran || '',
        className: className.trim(),
        phase: phase.trim(),
        semester: row.semester || 'Ganjil',
        schoolYear: row.tahun_ajaran || '2024/2025',
        assessmentType: extra.assessmentType || 'Sumatif Lingkup Materi',
        date: extra.date || new Date().toISOString().split('T')[0],
        passingGrade: row.kkm || 75,
        pgCount: (row.kunci_pg || []).length,
        pgWeight: row.bobot_pg || 1,
        hasOptionE: row.bobot_uraian === 1,
        answerKeys: (row.kunci_pg || []) as OptionChoice[],
        essayCount: maxScores.length,
        essayMaxScores: maxScores,
        learningObjectives: extra.learningObjectives || '',
        schoolName: '', teacherName: '', teacherNip: '', principalName: '', principalNip: '', cityName: '', // Filled by App.tsx
        results,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
      } as Assessment;
    });
  },

  async saveAssessment(assessment: Assessment) {
    const { results } = assessment;
    const jadwalPayload = {
      id: hashId(assessment.id),
      judul_asesmen: assessment.title,
      mata_pelajaran: assessment.subject,
      fase_kelas: `${assessment.phase} - ${assessment.className}`,
      semester: assessment.semester,
      tahun_ajaran: assessment.schoolYear,
      kkm: assessment.passingGrade,
      bobot_pg: assessment.pgWeight,
      bobot_uraian: assessment.hasOptionE ? 1 : 0,
      kunci_pg: assessment.answerKeys,
      kunci_uraian: {
        maxScores: assessment.essayMaxScores,
        assessmentType: assessment.assessmentType,
        date: assessment.date,
        learningObjectives: assessment.learningObjectives
      },
    };
    
    try {
      const { error: jadwalError } = await supabase.from('asesmen_jadwal').upsert(jadwalPayload, { onConflict: 'id' });
      if (jadwalError) console.error('Error saving asesmen_jadwal:', jadwalError);

      if (results && results.length > 0) {
        const hasilPayload = results.map(r => ({
          id: hashId(`${assessment.id}_${r.studentId}`),
          asesmen_id: hashId(assessment.id),
          siswa_id: hashId(r.studentId),
          jawaban_pg: r.pgAnswers || [],
          skor_uraian: r.essayScores || [],
          nilai_akhir: isNaN(r.finalScore as number) ? 0 : (r.finalScore || 0),
        }));
        
        // Chunk the results to prevent "Failed to fetch" on large payload/URL
        const chunks = chunkArray(hasilPayload, 30);
        for (const chunk of chunks) {
          const { error: hasilError } = await supabase.from('asesmen_hasil').upsert(chunk, { onConflict: 'id' });
          if (hasilError) console.error('Error saving asesmen_hasil:', hasilError);
        }
        
        const validIds = hasilPayload.map(h => h.id);
        if (validIds.length > 0) {
          // Fetch existing IDs for this assessment to avoid long URL with NOT IN
          const { data: existingData } = await supabase.from('asesmen_hasil')
            .select('id')
            .eq('asesmen_id', hashId(assessment.id));
            
          if (existingData) {
            const idsToDelete = existingData.map(d => d.id).filter(id => !validIds.includes(id));
            if (idsToDelete.length > 0) {
              const deleteChunks = chunkArray(idsToDelete, 50);
              for (const c of deleteChunks) {
                await supabase.from('asesmen_hasil').delete().in('id', c);
              }
            }
          }
        }
      } else {
        await supabase.from('asesmen_hasil').delete().eq('asesmen_id', hashId(assessment.id));
      }
    } catch (e) {
      console.error('Exception saving assessment:', e);
    }
  },

  async deleteAssessment(id: string) {
    try {
      await supabase.from('asesmen_hasil').delete().eq('asesmen_id', hashId(id));
      const { error } = await supabase.from('asesmen_jadwal').delete().eq('id', hashId(id));
      if (error) console.error('Error deleting asesmen_jadwal:', error);
    } catch (e) {
      console.error('Exception deleting assessment:', e);
    }
  }
};

