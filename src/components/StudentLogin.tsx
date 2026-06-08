import React, { useState } from "react";
import { LogIn, Key, User, ShieldAlert, BookOpen, GraduationCap } from "lucide-react";
import { Participant, ExamSession } from "../types";

interface StudentLoginProps {
  participants: Participant[];
  session: ExamSession;
  onLoginSuccess: (student: Participant, enteredToken: string, selectedSubject?: string, selectedClass?: string) => void;
  onToggleAdmin: () => void;
}

export default function StudentLogin({
  participants,
  session,
  onLoginSuccess,
  onToggleAdmin,
}: StudentLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const uniqueClasses = Array.from(new Set(participants.map((p) => p.className))).sort();

  const baseSubjects = [
    "Informatika / Ilmu Komputer",
    "Matematika",
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "Fisika",
    "Kimia",
    "Biologi",
    "Sejarah Indonesia",
    "Pendidikan Pancasila (PPKn)"
  ];

  const subjects = [...baseSubjects];
  if (session && session.name && !subjects.includes(session.name)) {
    subjects.unshift(session.name);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username || !password || !token || !selectedClass || !selectedSubject) {
      setErrorMessage("Harap lengkapi semua kolom input (Mata Pelajaran, Kelas, Username, Password, dan Token Ujian).");
      return;
    }

    // Verify student exists and password is correct
    const matchedStudent = participants.find(
      (p) => p.username === username.trim()
    );

    if (!matchedStudent) {
      setErrorMessage("Username atau Nomor Peserta tidak terdaftar.");
      return;
    }

    if (matchedStudent.passwordHash !== password) {
      setErrorMessage("Password yang Anda masukkan salah.");
      return;
    }

    if (matchedStudent.className !== selectedClass) {
      setErrorMessage(`Siswa "${matchedStudent.name}" terdaftar di kelas "${matchedStudent.className}", bukan kelas "${selectedClass}".`);
      return;
    }

    // Verify token matches current active session (case insensitive)
    if (token.trim().toUpperCase() !== session.token.toUpperCase()) {
      setErrorMessage("Token Ujian tidak valid atau salah untuk sesi ini.");
      return;
    }

    // Auth Success
    onLoginSuccess(matchedStudent, token.trim().toUpperCase(), selectedSubject, selectedClass);
  };

  return (
    <div id="cbt-login-container" className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Banner (Header khas ANBK KEMENDIKBUD) */}
      <header id="anbk-header" className="bg-[#1e3c72] text-white py-4 px-6 md:px-12 flex justify-between items-center border-b-4 border-yellow-500 shadow-md">
        <div id="brand-left" className="flex items-center gap-3">
          <div className="bg-yellow-500 text-[#1e3c72] rounded-full p-2 h-10 w-10 flex items-center justify-center font-bold text-lg shadow-inner">
            AN
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base tracking-wide uppercase">Asesmen Nasional</h1>
            <p className="text-xs text-yellow-300 font-semibold uppercase">Kementrian Pendidikan, Kebudayaan, Riset, dan Teknologi</p>
          </div>
        </div>
        <div id="brand-right" className="hidden md:block text-right">
          <p className="text-xs bg-blue-800 py-1 px-3 rounded-full text-white font-medium border border-blue-500">
            CBT-ANBK • VERSION 2.6
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main id="login-main-area" className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div id="login-card" className="bg-white flex flex-col md:flex-row rounded-lg shadow-2xl border border-slate-300 max-w-4xl w-full overflow-hidden transition-all duration-300 hover:shadow-yellow-100">
          
          {/* Sisi Kiri: Background Informasi */}
          <div id="login-sidebar-info" className="md:w-1/2 bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <span className="bg-yellow-500 text-[#1e3c72] block w-max text-xs font-bold px-3 py-1 rounded">
                INFORMASI PENTING
              </span>
              <h2 className="text-2xl font-bold leading-tight">Sistem Computer Based Test (CBT)</h2>
              <p className="text-slate-200 text-sm leading-relaxed">
                Silakan masuk menggunakan nomor peserta dan password yang tertera pada Kartu Ujian Anda. Pastikan Token Ujian diperoleh dari Pengawas / Proktor ruang ujian Anda.
              </p>
              
              <div className="space-y-3 pt-4 border-t border-blue-400">
                <div className="flex items-start gap-2 text-xs">
                  <div className="p-1 bg-blue-800 rounded">✔️</div>
                  <p className="text-slate-200">Setiap jawaban tersimpan secara otomatis langsung ke server (Antisipasi padam listrik).</p>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <div className="p-1 bg-blue-800 rounded">✔️</div>
                  <p className="text-slate-200">Hindari keluar browser atau merubah ukuran jendela browser untuk menghindari kegagalan sistem otomatis.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-blue-800 text-xs text-yellow-400 font-medium">
              Sesi Ujian Aktif: <strong className="text-white bg-blue-800 px-2 py-0.5 rounded">{session.name}</strong>
            </div>
          </div>

          {/* Sisi Kanan: Form input login */}
          <form id="login-form-fields" onSubmit={handleLogin} className="md:w-1/2 p-8 flex flex-col justify-center space-y-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-extrabold text-[#1e3c72]">Masuk Pengguna</h3>
              <p className="text-slate-400 text-sm">Gunakan kredensial resmi ujian semester Anda</p>
            </div>

            {errorMessage && (
              <div id="error-message-box" className="bg-rose-50 border-l-4 border-rose-600 text-rose-800 p-3 rounded text-sm flex gap-2 items-start shadow-sm">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
                <p className="font-medium leading-tight">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Pilih Kelas
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <select
                      id="select-kelas"
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#1e3c72] focus:border-[#1e3c72] font-semibold text-slate-800 text-sm h-[38px] cursor-pointer"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {uniqueClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Pilih Mata Pelajaran
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <select
                      id="select-subject"
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#1e3c72] focus:border-[#1e3c72] font-semibold text-slate-800 text-sm h-[38px] cursor-pointer"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="">-- Pilih Mapel --</option>
                      {subjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Username / No. Peserta
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    id="input-username"
                    type="text"
                    placeholder="Contoh: 20260101"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#1e3c72] focus:border-[#1e3c72] font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Password Ujian
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Key className="h-5 w-5" />
                  </span>
                  <input
                    id="input-password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#1e3c72] focus:border-[#1e3c72] font-semibold text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                  <span>Token Ujian</span>
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Minta ke Proktor / Pengawas
                  </span>
                </label>
                <input
                  id="input-token"
                  type="text"
                  maxLength={6}
                  placeholder="Contoh: ANBK26"
                  className="w-full bg-amber-50 border border-amber-300 rounded px-3 py-2 text-center text-xl font-black uppercase tracking-widest text-[#1e3c72] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-[#1e3c72] hover:text-black transition-colors py-3 rounded-md font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md text-base"
            >
              <LogIn className="h-5 w-5" />
              MASUK (LOGIN)
            </button>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <p className="text-xs text-slate-500">Anda seorang Proktor/Guru?</p>
              <button
                id="btn-goto-admin"
                type="button"
                onClick={onToggleAdmin}
                className="text-xs font-bold text-[#1e3c72] hover:underline"
              >
                Kembali ke Dashboard Proktor
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Khas PUSMENDIK */}
      <footer id="anbk-footer" className="bg-[#172d54] text-slate-400 py-3 text-center text-xs border-t border-blue-900">
        <p className="font-semibold">
          © 2026 Pusat Asesmen dan Pembelajaran (PUSMENDIK) • KEMENDIKBUDRISTEK
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          Didesain eksklusif untuk UI/UX Ulangan Semester Terintegrasi ANBK
        </p>
      </footer>
    </div>
  );
}
