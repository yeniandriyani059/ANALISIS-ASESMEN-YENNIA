import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ddaudswxkxzmpqvoiuss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXVkc3d4a3h6bXBxdm9pdXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTczNTEsImV4cCI6MjEwNTA3MzM1MX0.agwd-zj-stiF5we-liIDXlVQ23RRQ_ssEcQrzm6ccME'
);

// mock payload
const payload = [
  {
    id: 1,
    asesmen_id: 1,
    siswa_id: 1,
    jawaban_pg: ['A'],
    skor_uraian: [3],
    nilai_akhir: NaN
  }
];

async function check() {
  const { data, error } = await supabase.from('asesmen_hasil').upsert(payload);
  console.log('NaN test error:', error);
}
check();
