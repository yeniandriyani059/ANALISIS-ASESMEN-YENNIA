import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ddaudswxkxzmpqvoiuss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXVkc3d4a3h6bXBxdm9pdXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTczNTEsImV4cCI6MjEwNTA3MzM1MX0.agwd-zj-stiF5we-liIDXlVQ23RRQ_ssEcQrzm6ccME'
);

async function check() {
  const validIds = [123, 456];
  const { data, error } = await supabase.from('asesmen_hasil')
    .delete()
    .eq('asesmen_id', 123)
    .not('id', 'in', `(${validIds.join(',')})`);
  console.log('string:', error || 'success');

  const { data: d2, error: e2 } = await supabase.from('asesmen_hasil')
    .delete()
    .eq('asesmen_id', 123)
    .not('id', 'in', validIds);
  console.log('array:', e2 || 'success');
}
check();
