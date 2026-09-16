import React, { useState, useEffect } from 'react';
import { X, School, Check, Building2 } from 'lucide-react';
import { SchoolProfile } from '../types';

interface SchoolProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SchoolProfile;
  onSave: (profile: SchoolProfile) => void;
}

export const SchoolProfileModal: React.FC<SchoolProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [schoolName, setSchoolName] = useState(profile.schoolName || '');
  const [teacherName, setTeacherName] = useState(profile.teacherName || '');
  const [teacherNip, setTeacherNip] = useState(profile.teacherNip || '');
  const [principalName, setPrincipalName] = useState(profile.principalName || '');
  const [principalNip, setPrincipalNip] = useState(profile.principalNip || '');
  const [cityName, setCityName] = useState(profile.cityName || 'Slemped');

  useEffect(() => {
    if (isOpen) {
      try {
        const draft = localStorage.getItem('draft_school_profile');
        if (draft) {
          const parsed = JSON.parse(draft);
          setSchoolName(parsed.schoolName ?? profile.schoolName ?? '');
          setTeacherName(parsed.teacherName ?? profile.teacherName ?? '');
          setTeacherNip(parsed.teacherNip ?? profile.teacherNip ?? '');
          setPrincipalName(parsed.principalName ?? profile.principalName ?? '');
          setPrincipalNip(parsed.principalNip ?? profile.principalNip ?? '');
          setCityName(parsed.cityName ?? profile.cityName ?? 'Slemped');
          return;
        }
      } catch (e) {
        // Ignore parse error
      }
      setSchoolName(profile.schoolName || '');
      setTeacherName(profile.teacherName || '');
      setTeacherNip(profile.teacherNip || '');
      setPrincipalName(profile.principalName || '');
      setPrincipalNip(profile.principalNip || '');
      setCityName(profile.cityName || 'Slemped');
    }
  }, [profile, isOpen]);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_school_profile', JSON.stringify({
        schoolName, teacherName, teacherNip, principalName, principalNip, cityName
      }));
    }
  }, [schoolName, teacherName, teacherNip, principalName, principalNip, cityName, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem('draft_school_profile');
    onSave({
      schoolName: schoolName.trim() || 'SD Negeri 06 Slemped',
      teacherName: teacherName.trim() || 'Guru Kelas',
      teacherNip: teacherNip.trim(),
      principalName: principalName.trim() || 'Kepala Sekolah',
      principalNip: principalNip.trim(),
      cityName: cityName.trim() || 'Tempat',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Profil Sekolah & Data Guru
              </h3>
              <p className="text-xs text-slate-500">
                Data ini dicantumkan pada kop dan lembar tanda tangan laporan resmi.
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Satuan Pendidikan / Sekolah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: SD Negeri 06 Slemped"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tempat / Kota Titimangsa Tanda Tangan
            </label>
            <input
              type="text"
              placeholder="Contoh: Slemped / Karanggintung / Jakarta"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Guru / Wali Kelas
              </label>
              <input
                type="text"
                placeholder="Nama Lengkap & Gelar"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP Guru
              </label>
              <input
                type="text"
                placeholder="NIP (bila ada)"
                value={teacherNip}
                onChange={(e) => setTeacherNip(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                placeholder="Nama Lengkap & Gelar"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                placeholder="NIP (bila ada)"
                value={principalNip}
                onChange={(e) => setPrincipalNip(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
            >
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
