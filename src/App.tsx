/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import {
  defaultQuestions,
  defaultParticipants,
  defaultSession,
  defaultProgress,
} from "./data/mockData";
import { Question, Participant, ExamSession, StudentProgress, StudentResponse } from "./types";
import StudentLogin from "./components/StudentLogin";
import StudentConfirmation from "./components/StudentConfirmation";
import StudentCBTGrid from "./components/StudentCBTGrid";
import AdminDashboard from "./components/AdminDashboard";
import { Award, CheckCircle, ArrowRight, UserCheck, ShieldAlert, LogOut } from "lucide-react";

export default function App() {
  // Global States
  const [view, setView] = useState<"admin" | "login" | "confirm" | "cbt" | "result">("login");
  const [session, setSession] = useState<ExamSession>(defaultSession);
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [participants, setParticipants] = useState<Participant[]>(defaultParticipants);
  const [monitoringProgress, setMonitoringProgress] = useState<StudentProgress[]>(defaultProgress);

  // Active student state
  const [currentStudent, setCurrentStudent] = useState<Participant | null>(null);
  const [studentResponses, setStudentResponses] = useState<Record<string, StudentResponse>>({});
  const [studentScore, setStudentScore] = useState<number | null>(null);

  // Initialize or update tracking progress of mock students
  useEffect(() => {
    // If we have active responses, sync them dynamically to the monitoring monitor
    if (currentStudent) {
      setMonitoringProgress((prev) =>
        prev.map((item) => {
          if (item.participantId === currentStudent.id) {
            const list = Object.values(studentResponses) as StudentResponse[];
            return {
              ...item,
              answeredCount: list.filter((r) => {
                // Find matching question
                const targetQ = questions.find((q) => q.id === r.questionId);
                if (!targetQ) return false;
                // Validate answer content
                if (Array.isArray(r.answer)) return r.answer.length > 0;
                return typeof r.answer === "string" && r.answer.trim() !== "";
              }).length,
              status: list.some((r) => r.isDoubtful) ? "Pending/Ragu" : "Mengerjakan",
              lastActive: new Date().toISOString(),
            };
          }
          return item;
        })
      );
    }
  }, [studentResponses, currentStudent, questions]);

  // Handle successful login
  const handleLoginSuccess = (student: Participant, token: string) => {
    setCurrentStudent(student);
    setView("confirm");

    // Initialize or load existing responses for the student
    setStudentResponses({});
    
    // Add student to live monitors if not already present
    setMonitoringProgress((prev) => {
      if (prev.some((item) => item.participantId === student.id)) {
        return prev.map((item) =>
          item.participantId === student.id
            ? { ...item, status: "Mengerjakan", lastActive: new Date().toISOString() }
            : item
        );
      }
      return [
        ...prev,
        {
          participantId: student.id,
          name: student.name,
          username: student.username,
          examCardNumber: student.examCardNumber,
          currentQuestionNumber: 1,
          totalQuestions: questions.length,
          answeredCount: 0,
          status: "Mengerjakan",
          lastActive: new Date().toISOString(),
        },
      ];
    });
  };

  // Confirm and start exam
  const handleConfirmStart = () => {
    setView("cbt");
  };

  // Student finished exam
  const handleFinishExam = (score: number) => {
    setStudentScore(score);
    setView("result");

    // Sync state to monitor
    if (currentStudent) {
      setMonitoringProgress((prev) =>
        prev.map((item) =>
          item.participantId === currentStudent.id
            ? {
                ...item,
                status: "Selesai",
                score: score,
                lastActive: new Date().toISOString(),
              }
            : item
        )
      );
    }
  };

  // Student logs out
  const handleLogout = () => {
    // If currently testing and logging out, flag as Belum Mulai on progress table
    if (currentStudent && view !== "result") {
      setMonitoringProgress((prev) =>
        prev.map((item) =>
          item.participantId === currentStudent!.id
            ? { ...item, status: "Belum Mulai", lastActive: new Date().toISOString() }
            : item
        )
      );
    }
    setCurrentStudent(null);
    setStudentResponses({});
    setStudentScore(null);
    setView("login");
  };

  // Proctor resets active session for specific student
  const handleResetProgress = (participantId: string) => {
    // Clear responses
    setStudentResponses({});
    // Remove or reset status in monitors
    setMonitoringProgress((prev) =>
      prev.map((item) =>
        item.participantId === participantId
          ? {
              ...item,
              answeredCount: 0,
              status: "Belum Mulai",
              score: undefined,
              lastActive: new Date().toISOString(),
            }
          : item
      )
    );

    // If the currently active student was reset, log them out
    if (currentStudent && currentStudent.id === participantId) {
      setCurrentStudent(null);
      setView("login");
    }
  };

  // Quick switch of states to help evaluation
  const toggleSystemMode = () => {
    if (view === "admin") {
      setView("login");
    } else {
      setView("admin");
    }
  };

  return (
    <div id="cbt-app-root" className="min-h-screen bg-slate-150 text-slate-900 font-sans selection:bg-yellow-250">
      
      {/* Top Demo Toggler Overlay for testing evaluation */}
      <div id="demo-overlay-control" className="bg-[#1e1e2f] border-b border-slate-700 py-1.5 px-4 text-center flex flex-col sm:flex-row justify-between items-center gap-1.5 z-50">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold font-mono">
          <span className="bg-[#fbbf24] text-slate-900 rounded-full h-3 w-3 inline-block" />
          <span>Demo Sandbox Controller</span>
          <span className="text-slate-500">•</span>
          <span>Current Active View: <strong className="text-[#a5b4fc] uppercase">{view}</strong></span>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-switch-admin"
            onClick={toggleSystemMode}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 font-black text-yellow-400 py-1 px-3 border border-slate-600 rounded cursor-pointer uppercase transition-all tracking-wider"
          >
            {view === "admin" ? "Masuk ke Sisi Siswa" : "Buka Dashboard Proktor (Admin)"}
          </button>
        </div>
      </div>

      {/* Primary Routing Container */}
      <div id="routing-stage-wrapper">
        
        {/* VIEW 1: ADMIN PANEL */}
        {view === "admin" && (
          <AdminDashboard
            session={session}
            onChangeSession={setSession}
            questions={questions}
            onUpdateQuestions={setQuestions}
            participants={participants}
            onUpdateParticipants={setParticipants}
            activeProgress={monitoringProgress}
            onResetProgress={handleResetProgress}
            onGoToStudentMode={() => setView("login")}
          />
        )}

        {/* VIEW 2: STUDENT LOGIN */}
        {view === "login" && (
          <StudentLogin
            participants={participants}
            session={session}
            onLoginSuccess={handleLoginSuccess}
            onToggleAdmin={() => setView("admin")}
          />
        )}

        {/* VIEW 3: STUDENT DATA & TEST TERM CONFIRMATION */}
        {view === "confirm" && currentStudent && (
          <StudentConfirmation
            student={currentStudent}
            session={session}
            onConfirmStart={handleConfirmStart}
            onLogout={handleLogout}
          />
        )}

        {/* VIEW 4: ACTIVE CBT SYSTEM EXAM */}
        {view === "cbt" && currentStudent && (
          <StudentCBTGrid
            questions={questions}
            student={currentStudent}
            examName={session.name}
            durationMinutes={session.durationMinutes}
            initialResponses={studentResponses}
            onSaveAnswers={setStudentResponses}
            onFinishExam={handleFinishExam}
          />
        )}

        {/* VIEW 5: TRANSCRIPT / SCORE RESULT SCREEN */}
        {view === "result" && currentStudent && (
          <div id="cbt-result-page" className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
            <header className="bg-[#1e3c72] text-white py-4 px-6 md:px-12 flex justify-between items-center border-b-4 border-yellow-500 shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500 text-[#1e3c72] rounded-full p-2 h-10 w-10 flex items-center justify-center font-bold text-lg">
                  AN
                </div>
                <div>
                  <h1 className="font-bold text-sm md:text-base uppercase tracking-wider text-white">
                    UJIAN SELESAI
                  </h1>
                  <p className="text-xs text-yellow-300 font-semibold uppercase">Laporan Penyelesaian Lembar CBT</p>
                </div>
              </div>
              <button
                id="btn-result-logout"
                onClick={handleLogout}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>LOGOUT INTEGRASI</span>
              </button>
            </header>

            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
              <div id="result-sheet-card" className="bg-white rounded-lg shadow-2xl border border-slate-350 max-w-xl w-full p-6 md:p-8 space-y-6 text-center">
                
                <div className="inline-flex h-16 w-16 items-center justify-center bg-emerald-100 border-2 border-emerald-300 rounded-full text-emerald-800 shadow-inner">
                  <CheckCircle className="h-9 w-9" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">Alhamdulillah, Ujian Selesai!</h2>
                  <p className="text-xs text-slate-500">
                    Lembar CBT Anda telah tersimpan dan dilaporkan secara permanen ke pangkalan data sekolah.
                  </p>
                </div>

                {/* Score badge card details */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">
                    Skor Akhir Perolehan Anda:
                  </p>
                  
                  <div className="inline-block py-3 px-8 bg-gradient-to-tr from-[#1e3c72] to-[#2a5298] text-white rounded-lg shadow-md mb-4 border border-blue-900">
                    <strong className="text-4xl font-mono tracking-wider font-extrabold">{studentScore}</strong>
                    <span className="text-xs block text-yellow-300 font-bold border-t border-blue-400 mt-1">
                      SKALA 100
                    </span>
                  </div>

                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-600">
                    <tbody>
                      <tr>
                        <td className="py-2 font-semibold">Nama Peserta:</td>
                        <td className="py-2 text-right font-extrabold text-slate-900">{currentStudent.name}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2 font-semibold">Nomor Kartu:</td>
                        <td className="py-2 text-right font-mono font-bold">{currentStudent.examCardNumber}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2 font-semibold">Kelas / Rombel:</td>
                        <td className="py-2 text-right">{currentStudent.className}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2 font-semibold">Mata Ujian:</td>
                        <td className="py-2 text-right text-emerald-800 font-bold">{session.name}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Action switcher */}
                <div className="flex justify-center gap-3 border-t pt-5">
                  <button
                    id="btn-result-close"
                    onClick={handleLogout}
                    className="bg-[#1e3c72] hover:bg-blue-800 text-white font-extrabold text-xs py-2.5 px-6 rounded shadow transition-all cursor-pointer uppercase flex items-center gap-1.5"
                  >
                    <span>Logout & Tutup</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-[9px] text-slate-400">
                  * Untuk alasan keamanan sistem, dilarang melanggar ketertiban atau membuka akun milik siswa lainnya setelah menyelesaikan lembar ujian Anda.
                </p>

              </div>
            </main>

            <footer className="bg-[#172d54] text-slate-400 py-3 text-center text-xs border-t border-blue-900">
              <p className="font-semibold">
                © 2026 Pusat Asesmen dan Pembelajaran (PUSMENDIK) • KEMENDIKBUDRISTEK
              </p>
            </footer>
          </div>
        )}

      </div>

    </div>
  );
}
