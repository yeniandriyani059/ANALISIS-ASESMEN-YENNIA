import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ddaudswxkxzmpqvoiuss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXVkc3d4a3h6bXBxdm9pdXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTczNTEsImV4cCI6MjEwNTA3MzM1MX0.agwd-zj-stiF5we-liIDXlVQ23RRQ_ssEcQrzm6ccME'
);

async function check() {
  const hasilPayload = [
    {
      id: 99999,
      asesmen_id: 88888,
      siswa_id: 77777,
      jawaban_pg: ['A', 'B', ''],
      skor_uraian: [1, 2, 0],
      nilai_akhir: 80
    }
  ];
  
  try {
    const { data, error } = await supabase.from('asesmen_hasil').upsert(hasilPayload, { onConflict: 'id' });
    console.log('error:', error);
  } catch(e) {
    console.error('caught:', e);
  }
}
check();
