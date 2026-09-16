import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Clipboard, Download, Upload, Trash2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Gender } from '../types';
import { downloadStudentTemplate } from '../utils/excelExport';

interface StudentsManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSaveStudents: (students: Student[]) => void;
  onSyncToActiveAssessment?: (students: Student[]) => void;
}

export const StudentsManageModal: React.FC<StudentsManageModalProps> = ({
  isOpen,
  onClose,
  students,
  onSaveStudents,
  onSyncToActiveAssessment,
}) => {
  const [list, setList] = useState<Student[]>([...students]);
  const [newName, setNewName] = useState('');
  const [newNis, setNewNis] = useState('');
  const [newGender, setNewGender] = useState<Gender>('L');

  const [showBatchPaste, setShowBatchPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Sync list when opened or students prop changes
  useEffect(() => {
    if (isOpen) {
      setList([...students]);
    }
  }, [students, isOpen]);

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const nextStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      nis: newNis.trim(),
      gender: newGender,
    };

    const updated = [...list, nextStudent];
    setList(updated);
    setNewName('');
    setNewNis('');
  };

  const handleBatchPaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const parsed: Student[] = lines.map((line, idx) => {
      // Check if separated by tab or comma (NIS, Name, Gender)
      const parts = line.split(/[\t,;]/).map((p) => p.trim());
      let name = line;
      let nis = '';
      let gender: Gender = 'L';

      if (parts.length >= 2) {
        if (/^\d+$/.test(parts[0])) {
          nis = parts[0];
          name = parts[1];
          if (parts[2] && parts[2].toUpperCase().startsWith('P')) gender = 'P';
        } else {
          name = parts[0];
          if (parts[1] && parts[1].toUpperCase().startsWith('P')) gender = 'P';
        }
      }

      return {
        id: `std-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        nis,
        gender,
      };
    });

    const updated = [...list, ...parsed];
    setList(updated);
    setPasteText('');
    setShowBatchPaste(false);
  };

  const handleDelete = (id: string) => {
    setList(list.filter((s) => s.id !== id));
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

        const imported: Student[] = [];
        // Skip header if contains 'Nama'
        const startIndex = rows.length > 0 && String(rows[0][0] || '').toLowerCase().includes('nis') ? 1 : 0;

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          let nis = '';
          let name = '';
          let gender: Gender = 'L';

          if (row.length === 1) {
            name = String(row[0]).trim();
          } else if (row.length === 2) {
            name = String(row[0]).trim();
            if (String(row[1]).toUpperCase().startsWith('P')) gender = 'P';
          } else {
            nis = String(row[0]).trim();
            name = String(row[1]).trim();
            if (String(row[2]).toUpperCase().startsWith('P')) gender = 'P';
          }

          if (name) {
            imported.push({
              id: `std-${Date.now()}-${i}`,
              nis,
              name,
              gender,
            });
          }
        }

        if (imported.length > 0) {
          setList([...list, ...imported]);
        }
      } catch (err) {
        console.error('Error importing excel:', err);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSaveAll = () => {
    onSaveStudents(list);
    if (onSyncToActiveAssessment) {
      onSyncToActiveAssessment(list);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Master Data Siswa ({list.length} Siswa)
              </h3>
              <p className="text-xs text-slate-500">
                Daftar siswa ini dapat digunakan kembali pada berbagai mata pelajaran dan ulangan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBatchPaste(!showBatchPaste)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Tempel Banyak Siswa Sekaligus</span>
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel / CSV</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>

          <button
            onClick={downloadStudentTemplate}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template Excel</span>
          </button>
        </div>

        {/* Batch Paste Box */}
        {showBatchPaste && (
          <div className="p-4 bg-blue-50/70 border-b border-blue-200 text-xs">
            <p className="font-semibold text-blue-900 mb-1">
              Tempel daftar nama siswa (satu nama per baris dari Excel / Word / Catatan):
            </p>
            <textarea
              rows={4}
              placeholder="Contoh:&#10;Ahmad Pratama&#10;Bunga Lestari&#10;Citra Kirana"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowBatchPaste(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded-md text-slate-700 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchPaste}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold"
              >
                Tambahkan Siswa
              </button>
            </div>
          </div>
        )}

        {/* Add single student bar */}
        <form onSubmit={handleAddSingle} className="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="NIS (Opsional)"
            value={newNis}
            onChange={(e) => setNewNis(e.target.value)}
            className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
          />
          <input
            type="text"
            required
            placeholder="Nama Lengkap Siswa Baru..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
          />
          <select
            value={newGender}
            onChange={(e) => setNewGender(e.target.value as Gender)}
            className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
          >
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </form>

        {/* Table of students */}
        <div className="p-6 overflow-y-auto flex-1">
          {list.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Belum ada daftar siswa.</p>
              <p className="text-xs mt-1">Gunakan form di atas atau tempel nama sekaligus.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="py-2 px-3 w-12 text-center">No</th>
                  <th className="py-2 px-3 w-28">NIS</th>
                  <th className="py-2 px-3">Nama Siswa</th>
                  <th className="py-2 px-3 w-20 text-center">L/P</th>
                  <th className="py-2 px-3 w-16 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-center text-slate-500 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {s.nis || '-'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {s.name}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-600">
                      <span className={`px-2 py-0.5 rounded-full ${s.gender === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                        {s.gender}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                        title="Hapus siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total {list.length} siswa dalam database kelas
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAll}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
            >
              Simpan & Terapkan Data Siswa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
