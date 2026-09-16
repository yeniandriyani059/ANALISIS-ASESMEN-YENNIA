const fs = require('fs');
const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
const tables = ['asesmen_profil', 'asesmen_siswa', 'asesmen_jadwal', 'asesmen_hasil'];
for (const t of tables) {
  if (schema.definitions[t]) {
    console.log(`\nTable ${t}:`);
    for (const [k, v] of Object.entries(schema.definitions[t].properties)) {
      console.log(` - ${k}: ${v.type || v.format}`);
    }
  } else {
    console.log(`Table ${t} not found in definitions.`);
  }
}
