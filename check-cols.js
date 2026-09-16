import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ddaudswxkxzmpqvoiuss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXVkc3d4a3h6bXBxdm9pdXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTczNTEsImV4cCI6MjEwNTA3MzM1MX0.agwd-zj-stiF5we-liIDXlVQ23RRQ_ssEcQrzm6ccME'
);

async function check() {
  const { data: siswaData, error: siswaErr } = await supabase.from('asesmen_siswa').select('nama, jenis_kelamin').limit(1);
  console.log('siswa:', siswaErr || siswaData);

  const { data: siswaData2, error: siswaErr2 } = await supabase.from('asesmen_siswa').select('name, gender').limit(1);
  console.log('siswa2:', siswaErr2 || siswaData2);

  const { data: profil, error: profErr } = await supabase.from('asesmen_profil').select('school_name, teacher_name, teacher_nip, principal_name, principal_nip, city_name').limit(1);
  console.log('profil:', profErr || profil);

  const { data: jadwal, error: jadErr } = await supabase.from('asesmen_jadwal').select('id, title, subject, class_name, phase, semester, school_year, assessment_type, date, passing_grade, pg_count, pg_weight, has_option_e, answer_keys, essay_count, essay_max_scores, learning_objectives, created_at, updated_at').limit(1);
  console.log('jadwal:', jadErr || jadwal);
  
  const { data: hasil, error: hasilErr } = await supabase.from('asesmen_hasil').select('id, assessment_id, student_id, student_name, student_nis, gender, attendance, pg_answers, essay_scores').limit(1);
  console.log('hasil:', hasilErr || hasil);
}
check();
