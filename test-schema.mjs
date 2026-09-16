import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddaudswxkxzmpqvoiuss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXVkc3d4a3h6bXBxdm9pdXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTczNTEsImV4cCI6MjEwNTA3MzM1MX0.agwd-zj-stiF5we-liIDXlVQ23RRQ_ssEcQrzm6ccME';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const tables = ['asesmen_profil', 'asesmen_siswa', 'asesmen_jadwal', 'asesmen_hasil'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(table, error);
    } else {
      console.log(table, data && data[0] ? Object.keys(data[0]) : 'empty, no schema via select * limit 1');
    }
  }
}

check();
