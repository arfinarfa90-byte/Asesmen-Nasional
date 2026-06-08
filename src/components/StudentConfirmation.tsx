import React, { useState } from "react";
import { User, ShieldAlert, CheckCircle, FileText, Calendar, Clock } from "lucide-react";
import { Participant, ExamSession } from "../types";

interface StudentConfirmationProps {
  student: Participant;
  session: ExamSession;
  onConfirmStart: () => void;
  onLogout: () => void;
}

export default function StudentConfirmation({
  student,
  session,
  onConfirmStart,
  onLogout,
}: StudentConfirmationProps) {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Konfirmasi Data Peserta, Step 2: Konfirmasi Tes
  const [enteredToken, setEnteredToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerifyParticipantData = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (enteredToken.trim().toUpperCase() !== session.token.toUpperCase()) {
      setErrorMsg("Token Ujian yang Anda ketik tidak cocok dengan token aktif.");
      return;
    }

    // Go to next confirmation step
    setStep(2);
  };

  return (
    <div id="cbt-confirmation-container" className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header id="confirm-header" className="bg-[#1e3c72] text-white py-4 px-6 md:px-12 flex justify-between items-center border-b-4 border-yellow-500 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-[#1e3c72] rounded-full p-2 h-10 w-10 flex items-center justify-center font-bold text-lg">
            AN
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base uppercase tracking-wider">CBT - ASESMEN NASIONAL</h1>
            <p className="text-xs text-yellow-300 font-semibold uppercase">Konfirmasi Kelayakan & Data Ujian</p>
          </div>
        </div>
        <button
          id="btn-logout-confirm"
          onClick={onLogout}
          className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded shadow transition-all cursor-pointer"
        >
          LOGOUT / KELUAR
        </button>
      </header>

      {/* Main Area */}
      <main id="confirm-main" className="flex-grow flex items-center justify-center p-4 md:p-8">
        {step === 1 ? (
          /* ================= STEP 1: KONFIRMASI DATA PESERTA ================= */
          <div id="panel-konfirmasi-peserta" className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-2xl w-full overflow-hidden">
            {/* Blue Banner Title */}
            <div className="bg-[#2a5298] p-4 text-white flex items-center gap-2">
              <User className="h-5 w-5 text-yellow-400" />
              <h2 className="font-bold text-lg">Konfirmasi Data Peserta</h2>
            </div>

            <form onSubmit={handleVerifyParticipantData} className="p-6 md:p-8 space-y-6">
              <p className="text-sm text-slate-500 border-b border-dashed border-slate-300 pb-3">
                Silakan periksa data diri Anda dengan teliti. Jika ada kesalahan, segera laporkan kepada pengawas/proktor ujian.
              </p>

              {errorMsg && (
                <div className="bg-rose-50 border-l-4 border-rose-600 text-rose-800 p-3 rounded text-sm flex gap-2 items-start">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                  <p className="font-medium">{errorMsg}</p>
                </div>
              )}

              {/* Data Table Khas ANBK */}
              <div className="bg-slate-50 border border-slate-200 rounded overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold w-1/3 text-slate-600">Kode / No. Peserta</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{student.examCardNumber}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">Nama Lengkap</td>
                      <td className="px-4 py-3 font-extrabold text-[#1e3c72]">{student.name}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">Username</td>
                      <td className="px-4 py-3">{student.username}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">Jenis Kelamin</td>
                      <td className="px-4 py-3">
                        {student.gender === "L" ? "LAKI-LAKI" : "PEREMPUAN"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">Rombel / Kelas</td>
                      <td className="px-4 py-3">{student.className}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">Mata Ujian Baru</td>
                      <td className="px-4 py-3 font-medium text-emerald-700">{session.name}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Token Input Revalidation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 space-y-3">
                <label className="block text-sm font-bold text-[#1e3c72]">
                  Masukkan Kembali Token Ujian Untuk Validasi Akses:
                </label>
                <div className="flex gap-2 max-w-sm">
                  <input
                    id="confirm-token-input"
                    type="text"
                    maxLength={6}
                    placeholder="Masukkan Token"
                    className="w-full bg-white border border-slate-300 rounded px-4 py-2 font-black text-xl text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1e3c72]"
                    value={enteredToken}
                    onChange={(e) => setEnteredToken(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  * Verifikasi token pengamanan agar terhubung langsung dengan sesi {session.code}.
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  id="btn-confirm-submit"
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-[#1e3c72] hover:text-black font-extrabold px-6 py-2.5 rounded shadow transition-all cursor-pointer flex items-center gap-2"
                >
                  PROSES DATA
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ================= STEP 2: KONFIRMASI TES ================= */
          <div id="panel-konfirmasi-tes" className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-2xl w-full overflow-hidden animate-fade-in">
            {/* Green Banner Title */}
            <div className="bg-[#1b5e20] p-4 text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-yellow-400" />
              <h2 className="font-bold text-lg">Konfirmasi Tes Peserta</h2>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <p className="text-sm text-slate-500 border-b border-dashed border-slate-300 pb-3">
                Data Anda telah terverifikasi. Tekan tombol <strong className="text-[#1b5e20]">MULAI</strong> untuk mengunduh naskah ujian dan membuka dashboard penyelesaian soal.
              </p>

              {/* Tes Table Khas ANBK */}
              <div className="bg-slate-50 border border-slate-200 rounded overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold w-1/3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[#1e3c72]" />
                          Nama Tes / Sesi
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{session.name} ({session.code})</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">Status Tes</td>
                      <td className="px-4 py-3">
                        <span className="bg-green-100 border border-green-300 text-green-800 text-xs px-2.5 py-0.5 rounded font-extrabold uppercase">
                          BARU (SIAP MULAI)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-[#1e3c72]" />
                          Hari, Tanggal Tes
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {new Date().toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#1e3c72]" />
                          Waktu Server
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 bg-slate-100 font-semibold text-slate-600">Alokasi Waktu Ujian</td>
                      <td className="px-4 py-3 font-extrabold text-[#1e3c72]">{session.durationMinutes} MENIT</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  id="btn-confirm-back"
                  onClick={() => setStep(1)}
                  className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-4 py-2.5 rounded shadow transition-all cursor-pointer"
                >
                  KEMBALI KE DATA
                </button>
                <button
                  id="btn-confirm-start"
                  onClick={onConfirmStart}
                  className="bg-yellow-500 hover:bg-yellow-600 text-[#1b5e20] hover:text-black font-extrabold px-8 py-3 rounded-md shadow-lg hover:shadow-yellow-200 transition-all cursor-pointer text-lg tracking-wider"
                >
                  MULAI UJIAN
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#172d54] text-slate-400 py-3 text-center text-xs border-t border-blue-900">
        <p className="font-semibold">
          © 2026 Pusat Asesmen dan Pembelajaran (PUSMENDIK) • KEMENDIKBUDRISTEK
        </p>
      </footer>
    </div>
  );
}
