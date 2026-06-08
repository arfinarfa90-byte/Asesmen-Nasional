import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Circle,
  HelpCircle,
  AlertTriangle,
  Lock,
  User,
  LayoutGrid,
  Check,
  RotateCcw,
  Volume2
} from "lucide-react";
import { Question, QuestionType, StudentResponse, Participant, MatchingPair } from "../types";
import MatchingQuestion from "./MatchingQuestion";

interface StudentCBTGridProps {
  questions: Question[];
  student: Participant;
  examName: string;
  durationMinutes: number;
  initialResponses: Record<string, StudentResponse>;
  onSaveAnswers: (responses: Record<string, StudentResponse>) => void;
  onFinishExam: (finalScore: number) => void;
}

export default function StudentCBTGrid({
  questions,
  student,
  examName,
  durationMinutes,
  initialResponses,
  onSaveAnswers,
  onFinishExam,
}: StudentCBTGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, StudentResponse>>(initialResponses);
  const [fontSize, setFontSize] = useState<"A-" | "A" | "A+">("A");
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [finishedStage, setFinishedStage] = useState<1 | 2 | 3>(1);
  const [stage1Checked, setStage1Checked] = useState(false);
  const [stage2Checked, setStage2Checked] = useState(false);
  const [stage2Timer, setStage2Timer] = useState(5);
  const [stage3Input, setStage3Input] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Anti-cheat warning counters
  const [cheatWarnings, setCheatWarnings] = useState<string[]>([]);
  const [showCheatModal, setShowCheatModal] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Helper formatting for seconds to hours:minutes:seconds
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Keep countdown timer ticking Down
  useEffect(() => {
    if (secondsLeft <= 0) {
      // Auto-submit when time is completely exhausted
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Handle stage 2 counter ticking when ending
  useEffect(() => {
    if (showFinishedModal && finishedStage === 2 && stage2Timer > 0) {
      const countdown = setInterval(() => {
        setStage2Timer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [showFinishedModal, finishedStage, stage2Timer]);

  // Anti-Cheat: Event listener to prevent copy, paste, and right clicks
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addCheatWarning("Aksi klik kanan diblokir untuk memelihara integritas ujian!");
    };
    const preventCopyText = (e: ClipboardEvent) => {
      e.preventDefault();
      addCheatWarning("Aksi menyalin (Copy) soal dilarang keras selama ujian!");
    };
    const preventPasteText = (e: ClipboardEvent) => {
      e.preventDefault();
      addCheatWarning("Aksi tempel (Paste) teks dilarang keras selama ujian!");
    };

    // Attach listeners
    const mainEl = document.getElementById("cbt-interactive-zone");
    if (mainEl) {
      mainEl.addEventListener("contextmenu", preventContextMenu);
      mainEl.addEventListener("copy", preventCopyText);
      mainEl.addEventListener("paste", preventPasteText);
    }

    return () => {
      if (mainEl) {
        mainEl.removeEventListener("contextmenu", preventContextMenu);
        mainEl.removeEventListener("copy", preventCopyText);
        mainEl.removeEventListener("paste", preventPasteText);
      }
    };
  }, [currentIndex]);

  // Anti-Cheat: Tab change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addCheatWarning(
          "Terdeteksi berganti tab browser! Kejadian ini disimpan sebagai salah satu rekam indikasi kecurangan."
        );
        setShowCheatModal(true);
      }
    };

    const handleWindowBlur = () => {
      addCheatWarning(
        "Terdeteksi kehilangan fokus jendela ujian (meninggalkan browser). Fokus kembali pada ujian Anda!"
      );
      setShowCheatModal(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Helper helper to add cheat logs safely
  const addCheatWarning = (msg: string) => {
    setCheatWarnings((prev) => {
      const timeStr = new Date().toLocaleTimeString("id-ID");
      return [`[${timeStr}] ${msg}`, ...prev.slice(0, 5)];
    });
  };

  // Get current response state
  const currentResponse = responses[currentQuestion?.id] || {
    questionId: currentQuestion?.id,
    answer: currentQuestion?.type === QuestionType.COMPLEX_CHOICE || currentQuestion?.type === QuestionType.MATCHING ? [] : "",
    isDoubtful: false,
    savedAt: new Date().toISOString(),
  };

  // Handle single choice updates (Pilihan Ganda)
  const handleSingleAnswerUpdate = (choiceId: string) => {
    const updated = {
      ...currentResponse,
      answer: choiceId,
      savedAt: new Date().toISOString(),
    };
    const nextResponses = { ...responses, [currentQuestion.id]: updated };
    setResponses(nextResponses);
    onSaveAnswers(nextResponses); // Trigger Autosave
  };

  // Handle complex selection updates (Pilihan Ganda Kompleks)
  const handleComplexAnswerUpdate = (choiceId: string) => {
    let currentChoices = (currentResponse.answer as string[]) || [];
    if (currentChoices.includes(choiceId)) {
      currentChoices = currentChoices.filter((id) => id !== choiceId);
    } else {
      currentChoices = [...currentChoices, choiceId];
    }

    const updated = {
      ...currentResponse,
      answer: currentChoices,
      savedAt: new Date().toISOString(),
    };
    const nextResponses = { ...responses, [currentQuestion.id]: updated };
    setResponses(nextResponses);
    onSaveAnswers(nextResponses); // Trigger Autosave
  };

  // Handle matching response matrix updates (Menjodohkan)
  const handleMatchingAnswerUpdate = (pairs: MatchingPair[]) => {
    const updated = {
      ...currentResponse,
      answer: pairs,
      savedAt: new Date().toISOString(),
    };
    const nextResponses = { ...responses, [currentQuestion.id]: updated };
    setResponses(nextResponses);
    onSaveAnswers(nextResponses); // Trigger Autosave
  };

  // Handle text area inputs (Short text or long essay)
  const handleTextAnswerUpdate = (textVal: string) => {
    const updated = {
      ...currentResponse,
      answer: textVal,
      savedAt: new Date().toISOString(),
    };
    const nextResponses = { ...responses, [currentQuestion.id]: updated };
    setResponses(nextResponses);
    onSaveAnswers(nextResponses); // Trigger Autosave
  };

  // Toggle Ragu-Ragu state (Doubtful status triggers Yellow marker in grid)
  const handleToggleDoubtful = () => {
    const updated = {
      ...currentResponse,
      isDoubtful: !currentResponse.isDoubtful,
      savedAt: new Date().toISOString(),
    };
    const nextResponses = { ...responses, [currentQuestion.id]: updated };
    setResponses(nextResponses);
    onSaveAnswers(nextResponses);
  };

  // Check if a question is fully answered
  const isQuestionAnswered = useCallback((q: Question): boolean => {
    const resp = responses[q.id];
    if (!resp) return false;

    if (q.type === QuestionType.SINGLE_CHOICE) {
      return typeof resp.answer === "string" && resp.answer !== "";
    }
    if (q.type === QuestionType.COMPLEX_CHOICE) {
      return Array.isArray(resp.answer) && resp.answer.length > 0;
    }
    if (q.type === QuestionType.MATCHING) {
      return Array.isArray(resp.answer) && resp.answer.length > 0;
    }
    if (q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.ESSAY) {
      return typeof resp.answer === "string" && resp.answer.trim() !== "";
    }
    return false;
  }, [responses]);

  // Navigate back/forward
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Get dynamic font style based on current setting
  const getFontSizeClass = () => {
    if (fontSize === "A-") return "text-sm";
    if (fontSize === "A+") return "text-lg";
    return "text-base";
  };

  const getHeadingFontSizeClass = () => {
    if (fontSize === "A-") return "text-lg";
    if (fontSize === "A+") return "text-2xl";
    return "text-xl";
  };

  // Scoring engine (runs after student finishes)
  const calculateFinalScore = () => {
    let totalPoints = 0;
    let studentPoints = 0;

    questions.forEach((q) => {
      totalPoints += q.points;
      const resp = responses[q.id];
      if (!resp) return;

      if (q.type === QuestionType.SINGLE_CHOICE) {
        if (resp.answer === q.correctAnswer) {
          studentPoints += q.points;
        }
      } else if (q.type === QuestionType.COMPLEX_CHOICE) {
        const correctAnswers = q.correctAnswer as string[];
        const studentAnswers = resp.answer as string[];
        // Sort both and compare
        const matches =
          correctAnswers.length === studentAnswers.length &&
          correctAnswers.every((val) => studentAnswers.includes(val));
        if (matches) {
          studentPoints += q.points;
        }
      } else if (q.type === QuestionType.MATCHING) {
        // Pairs match comparison
        const correctPairs = q.correctAnswer as MatchingPair[];
        const studentPairs = resp.answer as MatchingPair[];
        if (correctPairs.length === studentPairs.length) {
          let matches = true;
          correctPairs.forEach((cp) => {
            const found = studentPairs.find(
              (sp) => sp.rowId === cp.rowId && sp.colId === cp.colId
            );
            if (!found) matches = false;
          });
          if (matches) studentPoints += q.points;
        }
      } else if (q.type === QuestionType.SHORT_ANSWER) {
        if (
          typeof resp.answer === "string" &&
          resp.answer.trim().toLowerCase() === (q.correctAnswer as string).trim().toLowerCase()
        ) {
          studentPoints += q.points;
        }
      } else if (q.type === QuestionType.ESSAY) {
        // Essay gets points based on completion of input text
        if (typeof resp.answer === "string" && resp.answer.trim().length > 20) {
          studentPoints += q.points; // Simulated automatic system checking
        } else if (typeof resp.answer === "string" && resp.answer.trim().length > 0) {
          studentPoints += Math.floor(q.points * 0.5);
        }
      }
    });

    const scaledScore = Math.round((studentPoints / totalPoints) * 100);
    return scaledScore;
  };

  // Finished 3 stage workflow submission
  const startSubmitWorkflow = () => {
    setFinishedStage(1);
    setStage1Checked(false);
    setStage2Checked(false);
    setStage2Timer(5);
    setStage3Input("");
    setShowFinishedModal(true);
  };

  const handleStage1Complete = () => {
    if (stage1Checked) {
      setFinishedStage(2);
      setStage2Timer(5);
    }
  };

  const handleStage2Complete = () => {
    if (stage2Checked && stage2Timer <= 0) {
      setFinishedStage(3);
    }
  };

  const handleFinalSubmit = () => {
    if (stage3Input.trim().toUpperCase() === "SELESAI") {
      setShowFinishedModal(false);
      const score = calculateFinalScore();
      onFinishExam(score);
    }
  };

  const handleAutoSubmit = () => {
    // Automatically called when countdown reaches Zero
    setShowFinishedModal(false);
    const score = calculateFinalScore();
    onFinishExam(score);
  };

  return (
    <div id="cbt-panel-interactive" className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans select-none">
      
      {/* Top Main Navigation Header */}
      <header id="cbt-header-board" className="bg-[#1e3c72] text-white py-3 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg border-b-4 border-yellow-500">
        
        {/* Left Side: Brand Logo & Information */}
        <div className="flex items-center gap-3">
          <div className="bg-white text-[#1e3c72] font-black rounded h-10 w-10 flex items-center justify-center border-2 border-yellow-400 text-lg">
            CBT
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide uppercase">{examName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="bg-blue-800 text-white font-bold px-2 py-0.5 rounded text-[10px]">SISWA</span>
              <span>•</span>
              <span className="font-semibold text-yellow-300">{student.name} ({student.className})</span>
            </div>
          </div>
        </div>

        {/* Center Side: Countdown TIMER (Highly visible, flashing if limit < 5 mins) */}
        <div id="timer-banner" className="flex items-center gap-3 bg-blue-950/80 px-5 py-2 rounded-full border border-blue-800/80">
          <Clock className={`h-5 w-5 ${secondsLeft < 300 ? "text-red-500 animate-pulse" : "text-yellow-400"}`} />
          <span className="text-xs font-bold text-slate-300 uppercase">Sisa Waktu:</span>
          <span
            id="countdown-clock"
            className={`font-mono text-xl font-bold tracking-widest ${
              secondsLeft < 300 ? "text-red-500 animate-pulse font-extrabold" : "text-white"
            }`}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>

        {/* Right Side: Font Adjustment & Actions */}
        <div className="flex items-center gap-4">
          
          {/* FontSize Adjustment Widget */}
          <div className="flex items-center gap-1.5 bg-blue-900/60 p-1 rounded-md border border-blue-700">
            <span className="text-[10px] text-slate-300 px-1 uppercase font-bold">Font:</span>
            {(["A-", "A", "A+"] as const).map((size) => (
              <button
                key={size}
                id={`font-btn-${size}`}
                onClick={() => setFontSize(size)}
                className={`text-xs font-black h-7 w-8 rounded flex items-center justify-center transition-all cursor-pointer ${
                  fontSize === size
                    ? "bg-yellow-500 text-[#1e3c72]"
                    : "text-white hover:bg-blue-800/80"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <button
            id="btn-sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden bg-blue-900 hover:bg-blue-800 text-white p-2 rounded border border-blue-700 cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Study Zone Pane */}
      <div id="cbt-interactive-zone" className="flex-grow flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        
        {/* Sisi Kiri & Tengah: AREA SOAL DASAR */}
        <main
          id="question-work-area"
          className="flex-grow bg-white rounded-lg border border-slate-300 shadow-md flex flex-col justify-between overflow-y-auto"
          style={{ minHeight: "450px" }}
        >
          {/* Question Meta Header bar */}
          <div className="bg-slate-100 border-b border-slate-300 p-4 flex justify-between items-center text-sm font-semibold text-slate-700">
            <div id="soal-status-title" className="flex items-center gap-2">
              <span className="bg-[#1e3c72] text-white px-2.5 py-1 rounded text-xs font-black">
                SOAL NOMOR {currentIndex + 1}
              </span>
              <span className="text-slate-400">/ {questions.length}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 py-1 px-3 rounded-full">
                Bobot: {currentQuestion?.points} Poin
              </span>
            </div>
          </div>

          {/* Core Question & Selections Inner Space */}
          <div className="p-6 md:p-8 flex-grow space-y-6">
            
            {/* Embedded Audio player if present */}
            {currentQuestion?.audioUrl && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded flex items-center gap-3">
                <Volume2 className="h-6 w-6 text-blue-700 shrink-0" />
                <div className="flex-grow">
                  <p className="text-xs font-bold text-blue-900">Audio Pendukung Soal (Listening Focus):</p>
                  <audio controls className="w-full mt-2 h-8">
                    <source src={currentQuestion.audioUrl} type="audio/mp3" />
                    Browser Anda tidak mendukung pemutar audio.
                  </audio>
                </div>
              </div>
            )}

            {/* Simulated Images if present */}
            {currentQuestion?.imageUrl && (
              <div className="w-full max-w-md mx-auto border border-slate-200 rounded p-1 bg-slate-50">
                <img
                  referrerPolicy="no-referrer"
                  src={currentQuestion.imageUrl}
                  alt="Ilustrasi Soal"
                  className="rounded max-h-52 mx-auto object-contain"
                />
              </div>
            )}

            {/* Question Text with font sizing support */}
            <div
              id="question-body-text"
              className={`text-slate-800 leading-relaxed font-semibold ${getHeadingFontSizeClass()}`}
            >
              {currentQuestion?.text}
            </div>

            {/* Response Section grouped by Question Type */}
            <div id="choices-action-section" className="pt-4 border-t border-dashed border-slate-200">
              
              {/* ---------------- TYPE 1: SINGLE CHOICE (PILIHAN GANDA) ---------------- */}
              {currentQuestion?.type === QuestionType.SINGLE_CHOICE && (
                <div className="space-y-3">
                  {currentQuestion.choices?.map((choice) => {
                    const selected = currentResponse.answer === choice.id;
                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleSingleAnswerUpdate(choice.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-4 ${
                          selected
                            ? "border-[#1e3c72] bg-blue-50/50 shadow-inner"
                            : "border-slate-200 hover:border-slate-400 bg-white"
                        }`}
                      >
                        {/* Alphabet index styled button */}
                        <span
                          className={`h-8 w-8 rounded-full border-2 font-bold font-mono flex items-center justify-center text-sm transition-colors ${
                            selected
                              ? "bg-[#1e3c72] text-white border-[#1e3c72]"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {choice.id}
                        </span>
                        <span className={`text-slate-800 font-semibold ${getFontSizeClass()}`}>
                          {choice.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ---------------- TYPE 2: COMPLEX CHOICE (MULTIPLE CHECKBOXES) ---------------- */}
              {currentQuestion?.type === QuestionType.COMPLEX_CHOICE && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">
                    🔒 Pilih satu atau lebih jawaban yang benar:
                  </div>
                  {currentQuestion.choices?.map((choice) => {
                    const isSelectedArray = Array.isArray(currentResponse.answer)
                      ? (currentResponse.answer as string[])
                      : [];
                    const selected = isSelectedArray.includes(choice.id);

                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleComplexAnswerUpdate(choice.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-4 ${
                          selected
                            ? "border-emerald-600 bg-emerald-50/20 shadow-inner"
                            : "border-slate-200 hover:border-slate-400 bg-white"
                        }`}
                      >
                        {/* Checkbox square */}
                        <div
                          className={`h-6 w-6 rounded border-2 flex items-center justify-center text-white transition-all ${
                            selected
                              ? "bg-emerald-600 border-emerald-600"
                              : "bg-slate-100 border-slate-300"
                          }`}
                        >
                          {selected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">{choice.id}</span>
                          )}
                        </div>
                        <span className={`text-slate-800 font-semibold ${getFontSizeClass()}`}>
                          {choice.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ---------------- TYPE 3: MATCHING (MENJODOHKAN) ---------------- */}
              {currentQuestion?.type === QuestionType.MATCHING && (
                <MatchingQuestion
                  rows={currentQuestion.matchingRows || []}
                  cols={currentQuestion.matchingCols || []}
                  selectedValue={(currentResponse.answer as MatchingPair[]) || []}
                  onChange={handleMatchingAnswerUpdate}
                  fontSizeClass={getFontSizeClass()}
                />
              )}

              {/* ---------------- TYPE 4: SHORT ANSWER (ISIAN SINGKAT) ---------------- */}
              {currentQuestion?.type === QuestionType.SHORT_ANSWER && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Ketik Isian Jawaban Singkat Anda di bawah ini:
                  </label>
                  <input
                    id="short-answer-input"
                    type="text"
                    placeholder="Ketik jawaban singkat..."
                    className="w-full max-w-lg bg-slate-50 border-2 border-slate-300 rounded px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3c72]"
                    value={(currentResponse.answer as string) || ""}
                    onChange={(e) => handleTextAnswerUpdate(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    * Jawaban tidak sensitif huruf besar/kecil (Case-Insensitive).
                  </p>
                </div>
              )}

              {/* ---------------- TYPE 5: LONG ESSAY (URAIAN/ESSAY) ---------------- */}
              {currentQuestion?.type === QuestionType.ESSAY && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Tulis Uraian Penjelasan Anda secara detail:
                  </label>
                  <textarea
                    id="essay-textarea"
                    rows={6}
                    placeholder="Tulis uraian argumentasi atau jawaban lengkap di sini untuk diperiksa proktor..."
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded p-4 font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3c72] leading-relaxed"
                    value={(currentResponse.answer as string) || ""}
                    onChange={(e) => handleTextAnswerUpdate(e.target.value)}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>* Karakter minimum disarankan: 20 karakter</span>
                    <span>Tersimpan otomatis</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* bottom Footer: Action Navigator Buttons */}
          <footer className="bg-slate-100 border-t border-slate-300 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            
            {/* Soal Sebelumnya */}
            <button
              id="btn-nav-prev"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded font-extrabold text-sm border shadow-sm transition-all cursor-pointer ${
                currentIndex === 0
                  ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                  : "bg-slate-300 hover:bg-slate-400 text-slate-800 border-slate-400"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              SOAL SEBELUMNYA
            </button>

            {/* Ragu-Ragu Checkbox Button (Yellow highlight center of footer) */}
            <button
              id="btn-nav-doubt"
              type="button"
              onClick={handleToggleDoubtful}
              className={`w-full sm:w-auto px-6 py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2 border shadow-sm transition-all cursor-pointer ${
                currentResponse.isDoubtful
                  ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-[#1e3c72] animate-bounce"
                  : "bg-yellow-50 hover:bg-yellow-100 border-yellow-400 text-amber-700"
              }`}
            >
              <input
                id="checkbox-ragu"
                type="checkbox"
                checked={currentResponse.isDoubtful}
                onChange={() => {}} // Controlled via button click
                className="h-4 w-4 bg-yellow-50 border-yellow-400 rounded text-amber-600 focus:ring-yellow-400"
              />
              <span className="font-extrabold">RAGU-RAGU</span>
            </button>

            {/* Soal Berikutnya / Selesai */}
            {currentIndex === questions.length - 1 ? (
              <button
                id="btn-nav-finish"
                onClick={startSubmitWorkflow}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-extrabold px-8 py-2.5 rounded border border-green-700 text-sm shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>SELESAI (KUMPULKAN)</span>
                <Lock className="h-4 w-4" />
              </button>
            ) : (
              <button
                id="btn-nav-next"
                onClick={handleNext}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded border border-blue-700 text-sm shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>SOAL BERIKUTNYA</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

          </footer>
        </main>

        {/* Sisi Kanan: PANEL navigasi DAFTAR SOAL GRID (Always open on Desktop, drawer on Mobile) */}
        <aside
          id="questions-sidebar"
          className={`${
            isSidebarOpen ? "block" : "hidden"
          } md:block w-full md:w-80 bg-white rounded-lg border border-slate-300 shadow-md p-4 shrink-0 transition-all duration-300`}
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[#1e3c72]" />
              NAVIGASI SOAL UJIAN
            </h3>
            <span className="bg-[#1e3c72] text-white text-[11px] font-bold px-2 py-0.5 rounded">
              Lengkap: {(Object.values(responses) as StudentResponse[]).filter((r) => isQuestionAnswered(questions.find(q => q.id === r.questionId)!)).length} / {questions.length}
            </span>
          </div>

          {/* Grid selector buttons */}
          <div id="soal-checker-grid" className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const active = idx === currentIndex;
              const answered = isQuestionAnswered(q);
              const doubtful = responses[q.id]?.isDoubtful;

              // Styling values depending on state
              let btnClass = "border-slate-300 text-slate-800 hover:border-slate-800 bg-white";
              let labelMarker = "";

              if (doubtful) {
                btnClass = "bg-yellow-500 border-yellow-600 text-slate-900 font-extrabold shadow-sm animate-pulse";
                labelMarker = "?";
              } else if (answered) {
                btnClass = "bg-blue-800 border-blue-900 text-white font-bold shadow-sm";
                // Include answered symbol or first character
                const ansObj = responses[q.id].answer;
                labelMarker = typeof ansObj === "string" ? ansObj : "✓";
              }

              if (active) {
                btnClass += " ring-4 ring-yellow-400 ring-offset-1 scale-105 duration-75";
              }

              return (
                <button
                  key={q.id}
                  id={`grid-soal-${idx + 1}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-12 w-full rounded flex flex-col items-center justify-center border font-mono text-sm transition-all duration-200 cursor-pointer ${btnClass}`}
                >
                  <span className="font-bold">{idx + 1}</span>
                  {labelMarker && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-black uppercase text-yellow-300">
                      {labelMarker.slice(0, 3)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid key legends */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs font-semibold">
            <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Petunjuk Indikator:</h4>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 bg-white border border-slate-300 rounded block" />
              <span className="text-slate-600">Terbuka / Belum Dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 bg-blue-800 border border-blue-900 rounded block" />
              <span className="text-slate-600">Tersimpan / Sudah Dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 bg-yellow-500 border border-yellow-600 rounded block" />
              <span className="text-slate-600 font-bold">Ragu-Ragu (Tanda Kuning)</span>
            </div>
          </div>

          {/* Secure System Logs / Anti cheat live warnings inside student screen */}
          <div className="mt-8 pt-4 border-t border-slate-200 bg-rose-50 border border-rose-100 p-2 rounded text-xs">
            <div className="flex items-center gap-1.5 text-rose-800 font-bold mb-1 uppercase text-[10px]">
              <AlertTriangle className="h-3 w-3 text-rose-700" />
              Aktivitas Pengawasan
            </div>
            {cheatWarnings.length === 0 ? (
              <p className="text-slate-500 text-[10px] italic">Keamanan browser terpelihara aman.</p>
            ) : (
              <ul className="space-y-1 text-[9px] text-rose-700 font-mono list-disc list-inside max-h-24 overflow-y-auto">
                {cheatWarnings.slice(0, 3).map((warn, i) => (
                  <li key={i} className="line-clamp-2">{warn}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>

      </div>

      {/* Footer PUSMENDIK */}
      <footer className="bg-[#172d54] text-slate-400 py-2.5 text-center text-xs border-t border-blue-900">
        <p className="font-semibold">
          © 2026 Pusat Asesmen dan Pembelajaran (PUSMENDIK) • KEMENDIKBUDRISTEK
        </p>
      </footer>

      {/* ========================================================================= */}
      {/* 3-STAGE CONFIRMATION SUBMIT DIALOG / POPUP */}
      {/* ========================================================================= */}
      {showFinishedModal && (
        <div id="submit-confirm-modal" className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-md w-full overflow-hidden transition-all duration-300 scale-100">
            
            {/* Modal Header */}
            <div className="bg-[#2a5298] p-4 text-white flex items-center gap-3">
              <Lock className="h-6 w-6 text-yellow-400" />
              <div>
                <h3 className="font-bold text-lg">Konfirmasi Selesai Ujian</h3>
                <p className="text-xs text-blue-200">Tahap {finishedStage} dari 3 Validasi Kunci</p>
              </div>
            </div>

            {/* Stage Content */}
            <div className="p-6 space-y-6">

              {/* STAGE 1: Checkbox terms */}
              {finishedStage === 1 && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 text-blue-900 rounded text-sm font-semibold flex gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-700 shrink-0" />
                    Apakah Anda yakin ingin mengakhiri tes mata ujian ini dan mengirim semua jawaban Anda ke server pusat?
                  </div>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-all">
                    <input
                      id="stage1-checkbox"
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-[#1e3c72] focus:ring-[#1e3c72] rounded"
                      checked={stage1Checked}
                      onChange={(e) => setStage1Checked(e.target.checked)}
                    />
                    <div className="text-xs text-slate-700 select-none">
                      <strong className="text-slate-900 block font-bold">Saya mengonfirmasi data di atas benar</strong>
                      Saya memvalidasi bahwa saya telah meneliti kembali seluruh nomor soal sebelum mengakhiri.
                    </div>
                  </label>

                  <div className="flex justify-between gap-3 pt-3">
                    <button
                      id="btn-stage1-cancel"
                      onClick={() => setShowFinishedModal(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-800 rounded font-semibold text-sm cursor-pointer"
                    >
                      KEMBALI KE SOAL
                    </button>
                    <button
                      id="btn-stage1-next"
                      disabled={!stage1Checked}
                      onClick={handleStage1Complete}
                      className={`px-5 py-2 font-bold text-sm rounded shadow transition-all cursor-pointer ${
                        stage1Checked
                          ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      LANJUTKAN TAHAP 2
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 2: Safety Countdown */}
              {finishedStage === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-sm font-semibold flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
                    Peringatan Kritis! Sekali dikirim, lembar pengerjaan Anda akan terkunci secara permanen dan tidak dapat dibuka kembali.
                  </div>

                  <p className="text-xs text-slate-500">
                    Sistem memaksa perlindungan waktu tunda untuk mencegah tidak sengaja mengklik dua kali:
                  </p>

                  <div className="flex justify-center py-2">
                    {stage2Timer > 0 ? (
                      <div className="bg-slate-100 font-mono font-bold text-[#1e3c72] py-2 px-6 rounded-full text-sm flex items-center gap-2">
                        <span>Menunggu Kunci Terbuka Dalam:</span>
                        <strong className="font-black text-lg text-amber-600">{stage2Timer} detik</strong>
                      </div>
                    ) : (
                      <div className="bg-emerald-100 border border-emerald-300 font-mono font-bold text-emerald-800 py-1.5 px-6 rounded-full text-xs">
                        ✔️ Proteksi Kunci Dilepas
                      </div>
                    )}
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded">
                    <input
                      id="stage2-checkbox"
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-[#1e3c72]"
                      checked={stage2Checked}
                      onChange={(e) => setStage2Checked(e.target.checked)}
                      disabled={stage2Timer > 0}
                    />
                    <div className="text-xs text-slate-755 select-none">
                      <strong className="text-slate-900 block font-extrabold">Ya, Saya BENAR-BENAR yakin!</strong>
                      Simpan jawaban ke pangkalan data ANBK sekolah.
                    </div>
                  </label>

                  <div className="flex justify-between gap-3 pt-3">
                    <button
                      id="btn-stage2-cancel"
                      onClick={() => setFinishedStage(1)}
                      className="px-4 py-2 bg-slate-200 text-slate-800 rounded font-semibold text-sm cursor-pointer"
                    >
                      BATALKAN
                    </button>
                    <button
                      id="btn-stage2-next"
                      disabled={!stage2Checked || stage2Timer > 0}
                      onClick={handleStage2Complete}
                      className={`px-5 py-2 font-bold text-sm rounded shadow transition-all cursor-pointer ${
                        stage2Checked && stage2Timer <= 0
                          ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      LANJUTKAN TAHAP 3
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 3: Word write code verification */}
              {finishedStage === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded text-xs font-semibold">
                    Ketik verifikasi kata di bawah ini untuk melepaskan enkripsi paket dan mengonfirmasi pelaporan nilai Anda.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                      Ketik Kata <strong className="text-rose-600">"SELESAI"</strong> (Tanpa tanda kutip, Huruf Kapital):
                    </label>
                    <input
                      id="stage3-verify-input"
                      type="text"
                      placeholder="Ketik SELESAI"
                      className="w-full bg-slate-100 border border-slate-300 rounded px-4 py-2 font-mono font-black tracking-widest text-[#1e3c72] text-center uppercase"
                      value={stage3Input}
                      onChange={(e) => setStage3Input(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between gap-3 pt-3">
                    <button
                      id="btn-stage3-cancel"
                      onClick={() => setFinishedStage(2)}
                      className="px-4 py-2 bg-slate-200 text-slate-800 rounded font-semibold text-sm cursor-pointer"
                    >
                      BATALKAN
                    </button>
                    <button
                      id="btn-stage3-next"
                      disabled={stage3Input.trim().toUpperCase() !== "SELESAI"}
                      onClick={handleFinalSubmit}
                      className={`px-5 py-2 font-bold text-sm rounded shadow transition-all cursor-pointer ${
                        stage3Input.trim().toUpperCase() === "SELESAI"
                          ? "bg-green-600 hover:bg-green-700 text-white border border-green-700"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      KUMPULKAN & SELESAI
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANTI-CHEAT FULL POPUP WINDOW DETECTED MODAL */}
      {/* ========================================================================= */}
      {showCheatModal && (
        <div id="cheat-alert-modal" className="fixed inset-0 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-red-600 max-w-md w-full overflow-hidden">
            <div className="bg-red-600 p-4 text-white flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-300 animate-bounce" />
              <h3 className="font-black text-lg">Peringatan Keamanan CBT!</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-800 font-bold text-sm">
                Sistem mendeteksi bahwa Anda mencoba memindahkan tab aktif browser atau meninggalkan jendela utama ujian ANBK!
              </p>
              
              <div className="bg-red-50 p-3 rounded text-red-950 text-xs font-mono border border-red-200">
                Peringatan: Upaya ini dicatat secara realtime di panel Proktor. Jika terulangnya tindakan di luar ujian, sistem berhak mengunci lembar ujian Anda!
              </div>

              <div className="flex justify-center">
                <button
                  id="btn-cheat-dismiss"
                  onClick={() => setShowCheatModal(false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded shadow transition-all cursor-pointer text-sm"
                >
                  SAYA MENGERTI, KEMBALI KESEKOLAH
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
