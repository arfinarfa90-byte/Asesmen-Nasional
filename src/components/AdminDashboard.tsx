import React, { useState } from "react";
import {
  Settings,
  Database,
  Users,
  Tv,
  Award,
  Key,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  Info,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Bot,
  FileText,
  Loader2
} from "lucide-react";
import { Question, Participant, ExamSession, StudentProgress, QuestionType } from "../types";

interface AdminDashboardProps {
  session: ExamSession;
  onChangeSession: (updated: ExamSession) => void;
  questions: Question[];
  onUpdateQuestions: (updated: Question[]) => void;
  participants: Participant[];
  onUpdateParticipants: (updated: Participant[]) => void;
  activeProgress: StudentProgress[];
  onResetProgress: (participantId: string) => void;
  onGoToStudentMode: () => void;
}

type TabType = "session" | "questions" | "students" | "monitoring" | "grades" | "schema";

export default function AdminDashboard({
  session,
  onChangeSession,
  questions,
  onUpdateQuestions,
  participants,
  onUpdateParticipants,
  activeProgress,
  onResetProgress,
  onGoToStudentMode,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("monitoring");
  
  // States for new session configurations
  const [sessionSubject, setSessionSubject] = useState(session.name);
  const [sessionDuration, setSessionDuration] = useState(session.durationMinutes);
  const [sessionToken, setSessionToken] = useState(session.token);

  // States for manual Question creation
  const [newQType, setNewQType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [newQText, setNewQText] = useState("");
  const [newQPoints, setNewQPoints] = useState(20);

  // States for Gemini AI PDF Import and Question setting
  const [questionTab, setQuestionTab] = useState<"manual" | "pdf">("manual");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfNumQuestions, setPdfNumQuestions] = useState<number>(10);
  const [isImportingPdf, setIsImportingPdf] = useState<boolean>(false);
  const [pdfImportStatus, setPdfImportStatus] = useState<string>("");
  const [pdfImportError, setPdfImportError] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [clientGeminiKey, setClientGeminiKey] = useState<string>(() => {
    return localStorage.getItem("client_gemini_api_key") || "";
  });

  // States for subject selection in manual input and PDF import
  const [selectedSubject, setSelectedSubject] = useState<string>("Asesmen Literasi (Membaca)");
  const [pdfSubject, setPdfSubject] = useState<string>("Asesmen Literasi (Membaca)");
  const [customSubjectActive, setCustomSubjectActive] = useState<boolean>(false);
  const [customSubjectText, setCustomSubjectText] = useState<string>("");
  const [customPdfSubjectActive, setCustomPdfSubjectActive] = useState<boolean>(false);
  const [customPdfSubjectText, setCustomPdfSubjectText] = useState<string>("");
  const [questionFilterSubject, setQuestionFilterSubject] = useState<string>("Semua");

  // States for manual Student creation
  const [newSName, setNewSName] = useState("");
  const [newSUsername, setNewSUsername] = useState("");
  const [newSPassword, setNewSPassword] = useState("");
  const [newSGender, setNewSGender] = useState<"L" | "P">("L");
  const [newSCard, setNewSCard] = useState("");
  const [newSClass, setNewSClass] = useState("XII TKJ 1");

  const [anbkSchedule, setAnbkSchedule] = useState([
    {
      sesi: "Sesi I (Pagi)",
      waktu: "08.00 - 10.00 WIT",
      mapel: "Asesmen Literasi (Membaca)",
      kelas: ["XII TKJ 1", "XII TKJ 2"],
      proktor: "Laurensius Gobay, S.Pd.",
      status: "Selesai"
    },
    {
      sesi: "Sesi II (Siang)",
      waktu: "11.00 - 13.00 WIT",
      mapel: "Asesmen Numerasi (Matematika)",
      kelas: ["XII RPL 1", "XII RPL 2"],
      proktor: "Arfin Arfa, S.Kom.",
      status: "Aktif"
    },
    {
      sesi: "Sesi III (Sore)",
      waktu: "14.30 - 16.30 WIT",
      mapel: "Survei Karakter & Lingkungan Belajar",
      kelas: ["XII MM 1", "XII MM 2"],
      proktor: "Dina Mariana, M.T.",
      status: "Belum Mulai"
    }
  ]);

  const applyScheduleSession = (sch: typeof anbkSchedule[0]) => {
    setSessionSubject(sch.mapel);
    setSessionDuration(120);
    const updated = {
      ...session,
      name: sch.mapel,
      durationMinutes: 120,
    };
    onChangeSession(updated);
    setAnbkSchedule((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.sesi === sch.sesi ? "Aktif" : s.status === "Aktif" ? "Belum Mulai" : s.status,
      }))
    );
    triggerToast(`Berhasil menerapkan ${sch.sesi} (${sch.mapel}) sebagai sesi ujian aktif.`);
  };

  // Status message
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Generate a random 6-character token
  const handleGenerateToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSessionToken(token);
    const updated = { ...session, token };
    onChangeSession(updated);
    triggerToast(`Token baru berhasil digenerate: ${token}`);
  };

  const handleSaveSessionSettings = () => {
    const updated = {
      ...session,
      name: sessionSubject,
      durationMinutes: sessionDuration,
      token: sessionToken
    };
    onChangeSession(updated);
    triggerToast("Pengaturan sesi ujian ANBK berhasil diperbarui!");
  };

  // Manual Question append
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) return;

    const finalSubj = customSubjectActive ? customSubjectText.trim() : selectedSubject;

    const newQ: Question = {
      id: `q_custom_${Date.now()}`,
      number: questions.length + 1,
      type: newQType,
      text: newQText,
      subject: finalSubj || "Umum/Lainnya",
      points: Number(newQPoints),
    };

    if (newQType === QuestionType.SINGLE_CHOICE || newQType === QuestionType.COMPLEX_CHOICE) {
      newQ.choices = [
        { id: "A", text: "Opsi Pilihan A" },
        { id: "B", text: "Opsi Pilihan B" },
        { id: "C", text: "Opsi Pilihan C" },
        { id: "D", text: "Opsi Pilihan D" }
      ];
      newQ.correctAnswer = "A";
    } else if (newQType === QuestionType.MATCHING) {
      newQ.matchingRows = [
        { id: "row1", text: "Kebutuhan Primer" },
        { id: "row2", text: "Kebutuhan Sekunder" }
      ];
      newQ.matchingCols = [
        { id: "col1", text: "Pangan & Sandang" },
        { id: "col2", text: "Arloji & Laptop" }
      ];
      newQ.correctAnswer = [
        { rowId: "row1", colId: "col1" },
        { rowId: "row2", colId: "col2" }
      ];
    } else {
      newQ.correctAnswer = "Jawaban Acuan";
    }

    onUpdateQuestions([...questions, newQ]);
    setNewQText("");
    triggerToast("Soal baru berhasil ditambahkan ke Bank Soal!");
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id).map((q, idx) => ({ ...q, number: idx + 1 }));
    onUpdateQuestions(updated);
    triggerToast("Soal berhasil dihapus.");
  };

  // AI PDF Import handlers
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setPdfImportError("");
    }
  };

  const handlePdfDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPdfFile(e.dataTransfer.files[0]);
      setPdfImportError("");
    }
  };

  const handleImportPDFWithGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      setPdfImportError("Harap pilih atau tarik berkas PDF / Dokumen soal terlebih dahulu.");
      return;
    }

    setIsImportingPdf(true);
    setPdfImportError("");
    setPdfImportStatus("Membaca berkas dokumen...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rawResult = reader.result as string;
          const base64String = rawResult.split(",")[1];
          setPdfImportStatus("Menghubungkan ke server CBT & memproses berkas...");

          const targetSubj = customPdfSubjectActive ? customPdfSubjectText.trim() : pdfSubject;
          let parsedQuestionsRaw: any[] = [];
          let executedDirectly = false;

          try {
            // Check if we are running in static server environment (e.g., GitHub Pages)
            const isStaticOrGithubPages = 
              window.location.hostname.includes("github.io") || 
              window.location.hostname.includes("github.com") ||
              window.location.hostname.includes("vercel.app") || 
              window.location.hostname.includes("netlify.app") ||
              window.location.hostname.includes("pages.dev");

            if (isStaticOrGithubPages) {
              // Direct skip server-side on static site, forcing client-side fallback
              throw new Error("SERVER_HTML_FALLBACK_STATIC_DETECTED");
            }

            // First attempt: Server-Side API proxy
            const res = await fetch("/api/questions/import-pdf", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileBase64: base64String,
                mimeType: pdfFile.type || "application/pdf",
                numQuestions: pdfNumQuestions,
                subject: targetSubj || "Umum/Lainnya",
              }),
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
              throw new Error("SERVER_HTML_FALLBACK");
            }

            const textData = await res.text();
            if (textData.trim().startsWith("<") || textData.trim().startsWith("<!DOCTYPE")) {
              throw new Error("SERVER_HTML_FALLBACK");
            }

            let data;
            try {
              data = JSON.parse(textData);
            } catch (e) {
              throw new Error("Respon dari server backend tidak valid (Bukan JSON).");
            }

            if (res.ok && data.success) {
              parsedQuestionsRaw = data.questions;
            } else {
              throw new Error(data.error || "Gagal mengimpor dari AI server.");
            }
          } catch (serverErr: any) {
            console.warn("Express server-side error, attempting direct client-side fallback...", serverErr);
            
            // Second attempt: Client-side direct call to Google Gemini API (great for serverless static hosting like GitHub Pages)
            const activeKey = clientGeminiKey.trim();
            if (!activeKey) {
              throw new Error(
                "Aplikasi berjalan di lingkungan serverless/statis (seperti GitHub Pages) sehingga server backend proxy tidak aktif. " +
                "Silakan masukkan Kunci API Gemini Anda pada kolom di luar/bawah untuk mengimpor berkas PDF secara langsung."
              );
            }

            setPdfImportStatus("Server luring dideteksi. Menjalankan pengetikan AI secara langsung dari peramban (Client-side)...");
            executedDirectly = true;
            const requestedCount = Math.min(100, Math.max(1, Number(pdfNumQuestions) || 10));

            const promptText = `Anda adalah asisten penguji Asesmen Nasional (ANBK) yang sangat teliti.
Tugas Anda adalah memindai berkas dokumen dokumen soal tersebut, dan mengetik ulang dengan teks yang SAMA PERSIS (word-for-word) sesuai dengan dokumen/soal asli di berkas tersebut tanpa ditambah-tambah atau dikurangi.

Semua soal ini dikhususkan untuk mata pelajaran: "${targetSubj}".

Ketentuan tambahan:
1. Ekstrak dan hasilkan tepat ${requestedCount} butir soal dari dokumen tersebut.
2. Jika dokumen memiliki lebih dari ${requestedCount} soal, pilih ${requestedCount} soal pertama yang ada demi kepatuhan jumlah.
3. Jika dokumen memiliki kurang dari ${requestedCount} soal, ketik semua soal yang ada dari dokumen terlebih dahulu secara verbatim/sama persis, lalu untuk memenuhi kuota ${requestedCount} soal, buatlah soal tambahan baru berkualitas tinggi yang relevan dengan topik dokumen tersebut DAN memiliki kaitan erat dengan mata pelajaran "${targetSubj}".
4. Setiap butir soal harus ditandai dengan field "subject" berisi "${targetSubj}" di JSON output Anda.
5. Format output HARUS berupa JSON array yang valid sesuai schema berikut.
6. Soal harus terbagi secara rasional ke dalam tipe-tipe soal standard ANBK: "SINGLE_CHOICE" (Pilihan ganda biasa), "COMPLEX_CHOICE" (Pilihan ganda kompleks - checkbox), "MATCHING" (Menjodohkan), "SHORT_ANSWER" (Isian singkat), atau "ESSAY" (Uraian).

Setiap objek soal dalam JSON array harus memiliki field:
- id: string unik contoh: "q_pdf_" + angka acak
- number: nomor soal berurutan (dari 1 sampai ${requestedCount})
- type: string bernilai salah satu dari: "SINGLE_CHOICE", "COMPLEX_CHOICE", "MATCHING", "SHORT_ANSWER", "ESSAY"
- text: teks pertanyaan dari soal (harus diketik persis sama dengan di dokumen)
- subject: string dengan nilai "${targetSubj}"
- points: angka bobot poin (default: 10 atau 20)
- choices: array dari objek { id: "A", text: "Teks opsi" } (wajib jika tipe SINGLE_CHOICE atau COMPLEX_CHOICE)
- matchingRows: array dari objek { id: "row1", text: "Teks baris/pernyataan kiri" } (wajib jika tipe MATCHING)
- matchingCols: array dari objek { id: "col1", text: "Teks kolom/kriteria kanan" } (wajib jika tipe MATCHING)
- correctAnswer: untuk "SINGLE_CHOICE" isikan ID opsi (misal "A"). Untuk "COMPLEX_CHOICE" isikan opsi ber-koma (misal "A,C"). Untuk "MATCHING" buat dalam string terformat pasang-berpasangan rowId-colId dipisah koma (misal "row1-col1,row2-col2"). Untuk "SHORT_ANSWER" dan "ESSAY" isikan perkiraan jawaban acuan dalam bentuk string teks biasa.`;

            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inlineData: {
                          mimeType: pdfFile.type || "application/pdf",
                          data: base64String,
                        }
                      },
                      {
                        text: promptText,
                      }
                    ]
                  }
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        id: { type: "STRING" },
                        number: { type: "INTEGER" },
                        type: {
                          type: "STRING",
                          description: "Must be one of: 'SINGLE_CHOICE', 'COMPLEX_CHOICE', 'MATCHING', 'SHORT_ANSWER', 'ESSAY'"
                        },
                        text: { type: "STRING" },
                        subject: { type: "STRING" },
                        choices: {
                          type: "ARRAY",
                          items: {
                            type: "OBJECT",
                            properties: {
                              id: { type: "STRING" },
                              text: { type: "STRING" }
                            },
                            required: ["id", "text"]
                          }
                        },
                        matchingRows: {
                          type: "ARRAY",
                          items: {
                            type: "OBJECT",
                            properties: {
                              id: { type: "STRING" },
                              text: { type: "STRING" }
                            },
                            required: ["id", "text"]
                          }
                        },
                        matchingCols: {
                          type: "ARRAY",
                          items: {
                            type: "OBJECT",
                            properties: {
                              id: { type: "STRING" },
                              text: { type: "STRING" }
                            },
                            required: ["id", "text"]
                          }
                        },
                        correctAnswer: { type: "STRING" },
                        points: { type: "INTEGER" }
                      },
                      required: ["id", "number", "type", "text", "points"]
                    }
                  }
                }
              })
            });

            const geminiTextRes = await geminiRes.text().catch(() => "");
            if (geminiTextRes.trim().startsWith("<") || geminiTextRes.trim().startsWith("<!DOCTYPE") || geminiRes.headers.get("content-type")?.includes("text/html")) {
              throw new Error("Mendapatkan berkas HTML bukan JSON dari API Google Gemini. Kemungkinan alamat API diblokir oleh sistem keamanan jaringan sekolah atau provider internet Anda (internet positif/blockpage).");
            }

            if (!geminiRes.ok) {
              let errJson: any = {};
              try {
                errJson = JSON.parse(geminiTextRes);
              } catch (_) {}
              throw new Error(errJson?.error?.message || `Gagal menghubungi API Gemini langsung berkode (${geminiRes.status}). Harap periksa apakah API Key Anda valid.`);
            }

            let gData;
            try {
              gData = JSON.parse(geminiTextRes);
            } catch (err) {
              throw new Error("Hasil dari API Gemini bukan merupakan berkas JSON yang valid.");
            }
            const textResponse = gData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            parsedQuestionsRaw = JSON.parse(textResponse);
          }

          const parsedQuestions: Question[] = parsedQuestionsRaw.map((q: any, index: number) => {
            let answerObj = q.correctAnswer;
            if (q.type === QuestionType.MATCHING && typeof q.correctAnswer === "string") {
              try {
                answerObj = q.correctAnswer.split(",").map((pairStr: string) => {
                  const [row, col] = pairStr.split("-");
                  return { rowId: row?.trim(), colId: col?.trim() };
                });
              } catch (e) {
                answerObj = q.correctAnswer;
              }
            } else if (q.type === QuestionType.COMPLEX_CHOICE && typeof q.correctAnswer === "string") {
              answerObj = q.correctAnswer.split(",").map((c: string) => c.trim());
            }

            return {
              id: q.id || `q_pdf_${Date.now()}_${index}`,
              number: questions.length + index + 1,
              type: q.type as QuestionType,
              text: q.text,
              subject: q.subject || targetSubj || "Umum/Lainnya",
              points: Number(q.points) || 10,
              choices: q.choices,
              matchingRows: q.matchingRows,
              matchingCols: q.matchingCols,
              correctAnswer: answerObj,
            };
          });

          onUpdateQuestions([...questions, ...parsedQuestions]);
          setPdfFile(null);
          setPdfImportStatus("");
          triggerToast(
            `Berhasil mengimpor ${parsedQuestions.length} butir soal secara presisi via Gemini AI ${
              executedDirectly ? "(Koneksi Langsung)" : "(Melalui Server Proxy)"
            }!`
          );
        } catch (err: any) {
          console.error("Gemini upload error:", err);
          setPdfImportError(err.message || "Gagal mengolah dokumen menggunakan Gemini AI.");
          setPdfImportStatus("");
        } finally {
          setIsImportingPdf(false);
        }
      };

      reader.onerror = () => {
        setPdfImportError("Gagal membaca berkas lokal.");
        setIsImportingPdf(false);
        setPdfImportStatus("");
      };

      reader.readAsDataURL(pdfFile);
    } catch (err: any) {
      setPdfImportError("Gagal memproses file unggahan.");
      setIsImportingPdf(false);
      setPdfImportStatus("");
    }
  };

  // Manual student add
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSName.trim() || !newSUsername.trim() || !newSPassword.trim()) return;

    // Check if duplicate username
    if (participants.some((p) => p.username === newSUsername)) {
      triggerToast("Gagal! Username/NISN telah digunakan.");
      return;
    }

    const newS: Participant = {
      id: `p_custom_${Date.now()}`,
      username: newSUsername,
      passwordHash: newSPassword,
      name: newSName,
      gender: newSGender,
      examCardNumber: newSCard || `U-0101-${Math.floor(1000 + Math.random() * 9000)}-AN`,
      className: newSClass
    };

    onUpdateParticipants([...participants, newS]);
    setNewSName("");
    setNewSUsername("");
    setNewSPassword("");
    setNewSCard("");
    triggerToast(`Siswa "${newS.name}" berhasil didaftarkan!`);
  };

  // Remove participant
  const handleDeleteStudent = (id: string) => {
    onUpdateParticipants(participants.filter((p) => p.id !== id));
    triggerToast("Siswa berhasil dihapus dari daftar.");
  };

  // Simulated Excel spreadsheet parsing generator
  const simulateExcelUpload = (type: "soal" | "siswa") => {
    if (type === "siswa") {
      const simulatedSiswa: Participant[] = [
        ...participants,
        {
          id: `p_excel_1_${Date.now()}`,
          username: "20269901",
          passwordHash: "siswa99",
          name: "Farhan Ardiansyah (Excel)",
          gender: "L",
          className: "XII RPL 2",
          examCardNumber: "U-01010099-1"
        },
        {
          id: `p_excel_2_${Date.now()}`,
          username: "20269902",
          passwordHash: "siswa99",
          name: "Khairunnisa Fitri (Excel)",
          gender: "P",
          className: "XII RPL 2",
          examCardNumber: "U-01010099-2"
        }
      ];
      onUpdateParticipants(simulatedSiswa);
      triggerToast("Simulasi Import Excel: Berhasil mengimpor 2 data siswa dari Siswa_Template.xlsx!");
    } else {
      // Simulate adding custom questions
      const simulatedSoal: Question[] = [
        ...questions,
        {
          id: `q_excel_1_${Date.now()}`,
          number: questions.length + 1,
          type: QuestionType.SINGLE_CHOICE,
          text: "Manakah prototipe jaringan nirkabel jarak menengah yang memiliki radius 10 hingga 100 meter? (Simulasi Excel)",
          choices: [
            { id: "A", text: "PAN (Personal Area Network)" },
            { id: "B", text: "WLAN (Wireless Local Area Network)" },
            { id: "C", text: "WWAN (Wireless Wide Area Network)" },
            { id: "D", text: "WPAN (Wireless Personal Area Network)" }
          ],
          correctAnswer: "B",
          points: 20
        },
        {
          id: `q_excel_2_${Date.now()}`,
          number: questions.length + 2,
          type: QuestionType.SHORT_ANSWER,
          text: "Sebutkan protokol standar terenkripsi yang digunakan untuk mengirim berkas dokumen HTML secara aman lintas web browser! (Simulasi Excel)",
          correctAnswer: "HTTPS",
          points: 20
        }
      ];
      onUpdateQuestions(simulatedSoal);
      triggerToast("Simulasi Import Excel: Berhasil mendaftarkan 2 Soal Baru dari BankSoal_ANBK.xlsx!");
    }
  };

  // Download export CSV spreadsheet values for results
  const downloadResultsCSV = () => {
    // Generate CSV contents
    const headers = ["No", "Nama", "No Kartu Ujian", "Kelas", "Benar", "Salah", "Nilai Angka", "Status"];
    const rows = activeProgress.map((prog, idx) => {
      const correct = Math.round(((prog.score || 0) * prog.totalQuestions) / 100);
      const wrong = prog.totalQuestions - correct;
      return [
        idx + 1,
        prog.name,
        prog.examCardNumber,
        prog.className || "XII TKJ 1",
        correct,
        wrong,
        prog.score ?? 0,
        prog.status
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `REKAP_NILAI_CBT_${session.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Unduhan data rekapitulasi nilai berekstensi CSV berhasil dikirim!");
  };

  return (
    <div id="proktor-dashboard" className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Admin Branding Banner */}
      <header className="bg-[#0f172a] text-white py-4 px-6 flex flex-col sm:flex-row justify-between items-center border-b-4 border-yellow-500 shadow-md">
        
        {/* Branding Title */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-yellow-500 to-amber-600 text-slate-900 rounded-lg p-2.5 h-11 w-11 flex items-center justify-center font-black shadow-lg">
            AN
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide uppercase flex items-center gap-2">
              <span>ADMIN & PROKTOR CBT</span>
              <span className="bg-yellow-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded tracking-normal">
                KEMENDIKBUD
              </span>
            </h1>
            <p className="text-xs text-slate-300">
              Sistem Manajemen Sesi Ujian Semester & Monitoring Peserta Terpadu
            </p>
          </div>
        </div>

        {/* Global Action switcher */}
        <div className="mt-3 sm:mt-0 flex items-center gap-3">
          <button
            id="admin-btn-preview"
            onClick={onGoToStudentMode}
            className="bg-yellow-500 hover:bg-yellow-600 text-[#0f172a] hover:text-black font-extrabold text-xs py-2 px-4 rounded border border-yellow-600 shadow-md flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
          >
            <span>Masuk Mode CBT Siswa</span>
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main proktor panels frame */}
      <div className="flex-grow flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        
        {/* Left Drawer Side Navigation Tabs */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 rounded-lg shadow-lg border border-slate-800 p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-slate-400 text-[10px] uppercase font-black tracking-widest px-2-accent">
              Menu Kontrol Ujian
            </h3>

            <nav className="flex flex-col gap-1">
              {[
                { id: "monitoring", label: "Monitoring Peserta", icon: Tv },
                { id: "session", label: "Pengaturan & Token", icon: Settings },
                { id: "questions", label: "Manajemen Bank Soal", icon: Database },
                { id: "students", label: "Daftar Peserta (Siswa)", icon: Users },
                { id: "grades", label: "Rekap Hasil / Nilai", icon: Award },
                { id: "schema", label: "Skema Database (Design)", icon: Layers }
              ].map((item) => {
                const ActiveIcon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-semibold text-xs tracking-wide cursor-pointer transition-all ${
                      active
                        ? "bg-yellow-500 text-slate-900 border-l-4 border-yellow-700"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <ActiveIcon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 space-y-3">
            <div className="bg-slate-950 p-2 text-center rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-bold">TOKEN AKTIF:</span>
              <strong className="text-xl font-mono text-yellow-500 font-black tracking-widest">{session.token}</strong>
            </div>
            
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold">
              Versi Server: r_prok-2.6
            </p>
          </div>
        </aside>

        {/* Right Main Panel container */}
        <main className="flex-grow bg-white rounded-lg border border-slate-300 shadow-lg p-6 overflow-hidden flex flex-col">
          
          {/* Toast Notification for admin confirmations */}
          {toastMessage && (
            <div className="bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 p-3 rounded text-sm mb-4 font-bold flex items-center gap-2 shadow animate-fade-in z-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Core Content loaded based on navigation tabs */}
          
          {/* ======================= TAB 1: MONITORING STUDENTS ======================= */}
          {activeTab === "monitoring" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Status & Monitoring Peserta</h2>
                  <p className="text-xs text-slate-500">Melihat daftar siswa yang sedang aktif mengerjakan soal secara real-time</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                    Live monitoring terhubung
                  </span>
                </div>
              </div>

              {/* Grid table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-[#0f172a] text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider">No</th>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider text-left">Nama Peserta</th>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider text-left">No. Kartu Ujian</th>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider text-center">Kelas</th>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider text-center">Soal Terjawab</th>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider text-center">Waktu Aktivitas</th>
                      <th className="px-4 py-3 font-semibold text-xs tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {activeProgress.map((student, idx) => {
                      let statusBadge = "bg-slate-150 text-slate-700";
                      if (student.status === "Mengerjakan") statusBadge = "bg-blue-100 text-blue-800 border border-blue-300";
                      if (student.status === "Selesai") statusBadge = "bg-green-100 text-green-800 border border-green-300";
                      if (student.status === "Pending/Ragu") statusBadge = "bg-yellow-100 text-yellow-800 border border-yellow-300";

                      return (
                        <tr key={student.participantId} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-4 font-bold text-[#1e3c72]">{student.name}</td>
                          <td className="px-4 py-4 font-mono text-xs">{student.examCardNumber}</td>
                          <td className="px-4 py-4 text-center text-xs text-slate-500">{student.className || "XII TKJ 1"}</td>
                          <td className="px-4 py-4 text-center font-mono">
                            <span className="font-bold bg-blue-50 py-1 px-3 border border-blue-200 text-blue-900 rounded-full text-xs">
                              {student.answeredCount} / {student.totalQuestions}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded ${statusBadge}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-xs font-mono text-slate-500 font-semibold">
                            {new Date(student.lastActive).toLocaleTimeString("id-ID", { timeZone: "Asia/Jayapura", hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIT
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              id={`btn-reset-${student.participantId}`}
                              onClick={() => {
                                onResetProgress(student.participantId);
                                triggerToast(`Sesi login untuk siswa "${student.name}" berhasil direset! Siswa dapat masuk kembali.`);
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 font-extrabold text-xs py-1 px-2.5 rounded cursor-pointer transition-all flex items-center gap-1.5 mx-auto active:scale-95"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Reset Login</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-xs rounded">
                <div className="flex gap-2 font-bold text-yellow-900 mb-1">
                  <Info className="h-4.5 w-4.5" />
                  <span>Petunjuk Tindakan Reset Login:</span>
                </div>
                <p className="text-yellow-800 leading-relaxed font-semibold">
                  Gunakan tombol "Reset Login" jika komputer/browser siswa mengalami hang, disconnect jaringan internet, atau siswa keluar secara paksa dari window ujian. Melakukan reset login memungkinkan peserta tersebut masuk kembali dari peramban/komputer mana pun menggunakan token yang sama tanpa kehilangan progres jawaban (karena didukung autosave).
                </p>
              </div>
            </div>
          )}

          {/* ======================= TAB 2: EXAM SESSION & SECURE TOKEN ======================= */}
          {activeTab === "session" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Pengaturan Sesi & Generate Token</h2>
                <p className="text-xs text-slate-500">Buat sesi ujian, atur batasan alokasi waktu, dan kunci token akses ujian semester.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel edit settings */}
                <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b pb-2 mb-4">
                    <Settings className="h-4.5 w-4.5 text-[#1e3c72]" />
                    Form Konfigurasi Ujian
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CBT Nama Ujian / Mata Pelajaran:</label>
                      <input
                        id="session-subject-input"
                        type="text"
                        className="w-full bg-white border rounded px-3 py-2 font-semibold text-sm text-slate-800"
                        value={sessionSubject}
                        onChange={(e) => setSessionSubject(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alokasi Waktu Ujian (Menit):</label>
                      <input
                        id="session-duration-input"
                        type="number"
                        className="w-full bg-white border rounded px-3 py-2 font-mono font-bold text-sm text-[#1e3c72]"
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sesi Pelaksanaan:</label>
                      <select id="session-select-active" className="w-full bg-white border rounded px-3 py-2 text-xs font-bold text-slate-700">
                        <option value="ganjil">ULANGAN SEMESTER GANJIL - UTAMA</option>
                        <option value="genap">ULANGAN SEMESTER GENAP - UTAMA</option>
                        <option value="susulan">UJIAN SUSULAN SEMESTER</option>
                      </select>
                    </div>
                  </div>

                  <button
                    id="btn-save-session"
                    onClick={handleSaveSessionSettings}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 px-4 rounded shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Simpan Konfigurasi
                  </button>
                </div>

                {/* Panel generate Token */}
                <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-lg flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-[#1e3c72] text-sm flex items-center gap-2 border-b border-amber-200 pb-2">
                      <Key className="h-4.5 w-4.5" />
                      Token Pengaman Sesi Aktif
                    </h3>

                    <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                      Token ini digunakan oleh siswa saat masuk ke peranti login ANBK. Mengganti token ditujukan untuk menutup kesempatan bagi siswa terlambat yang ingin masuk di luar jam tanpa ijin.
                    </p>

                    <div className="text-center py-4 bg-white border-2 border-dashed border-amber-300 rounded">
                      <p className="text-[10px] uppercase font-black text-slate-400">TOKEN SAAT INI:</p>
                      <strong className="text-4xl font-mono text-amber-600 font-black tracking-widest">{sessionToken}</strong>
                    </div>
                  </div>

                  <button
                    id="btn-trigger-token"
                    onClick={handleGenerateToken}
                    className="w-full bg-[#1e3c72] hover:bg-[#152a51] text-white font-black text-sm py-3 px-4 rounded shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4.5 w-4.5" />
                    GENERATE TOKEN BARU (6 DIGIT)
                  </button>
                </div>

              </div>

              {/* Penjadwalan Harian ANBK (6 Kelas, 3 Mapel per hari - WIT) */}
              <div className="mt-8 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#0f172a] text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-2 uppercase tracking-wider text-yellow-400">
                      <Clock className="h-5 w-5" />
                      Penjadwalan Harian ANBK (6 Kelas & 3 Mata Pelajaran - Sesi WIT)
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Sesi ujian sinkron dengan Waktu Indonesia Timur (WIT). Pilih sesi harian untuk diaktifkan ke peserta ujian.
                    </p>
                  </div>
                  <span className="bg-amber-600 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded tracking-wide uppercase">
                    UTC +09:00 (WIT)
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {anbkSchedule.map((sch) => {
                      const isActive = sch.status === "Aktif" || session.name === sch.mapel;
                      return (
                        <div
                          key={sch.sesi}
                          className={`border rounded-lg p-4 flex flex-col justify-between transition-all duration-300 ${
                            isActive
                              ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-md"
                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="font-black text-xs text-[#1e3c72] uppercase tracking-wide">
                                {sch.sesi}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                  sch.status === "Selesai"
                                    ? "bg-slate-250 border-slate-300 text-slate-600"
                                    : sch.status === "Aktif" || isActive
                                    ? "bg-emerald-100 border-emerald-300 text-emerald-800 animate-pulse font-extrabold"
                                    : "bg-blue-105 border-blue-200 text-blue-700"
                                }`}
                              >
                                {isActive ? "AKTIF" : sch.status}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-slate-400">Mata Pelajaran</h4>
                              <p className="font-extrabold text-[#1e3c72] text-sm leading-tight">
                                {sch.mapel}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-slate-400">Waktu Pelaksanaan (WIT)</h4>
                              <p className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {sch.waktu}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-slate-400">Daftar Kelas (2 Kelas / Sesi)</h4>
                              <div className="flex gap-1.5 mt-1 flex-wrap">
                                {sch.kelas.map((cls) => (
                                  <span key={cls} className="bg-slate-200/85 border border-slate-300 text-slate-800 text-[10px] px-2 py-0.5 rounded font-black">
                                    {cls}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 text-[11px] border-t border-dashed border-slate-200">
                              <span className="text-slate-400 font-semibold block">Pengawas:</span>
                              <span className="font-bold text-slate-700">{sch.proktor}</span>
                            </div>
                          </div>

                          <button
                            id={`btn-apply-schedule-${sch.sesi.replace(/\s+/g, '')}`}
                            type="button"
                            onClick={() => applyScheduleSession(sch)}
                            disabled={isActive}
                            className={`w-full mt-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isActive
                                ? "bg-emerald-600 text-white cursor-default"
                                : "bg-yellow-500 hover:bg-yellow-600 text-slate-900 shadow hover:shadow-md"
                            }`}
                          >
                            {isActive ? "✓ Sesi Sedang Aktif" : "Aktifkan Sesi Ini"}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded text-xs">
                    <h4 className="font-extrabold text-[#172d54] mb-1 flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-blue-600" />
                      Informasi Penjadwalan Multi-Kelas Harian (ANBK Nasional)
                    </h4>
                    <p className="text-slate-700 font-semibold leading-relaxed leading-5">
                      Sesuai pedoman pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK) di Wilayah Waktu Indonesia Timur (WIT):
                      <br/>
                      1. Setiap harinya dijadwalkan <strong className="text-[#1e3c72]">3 Mata Pelajaran</strong> utama yang terbagi ke dalam <strong className="text-[#1e3c72]">3 Sesi harian</strong>.
                      <br/>
                      2. Sekolah mengelompokkan <strong className="text-[#1e3c72]">6 Kelas</strong> (rombongan belajar) ke masing-masing sesi harian secara berpasangan (2 kelas per sesi) untuk menyesuaikan kapasitas laboratorium komputer sekolah.
                      <br/>
                      3. Administrator/Proktor dapat memicu status aktif masing-masing sesi harian di atas, yang otomatis merubah mata pelajaran yang dapat dipilih serta memfilter perolehan token log siswa.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================= TAB 3: MANAGE QUESTIONS BANK ======================= */}
          {activeTab === "questions" && (
            <div className="space-y-6 flex-grow overflow-y-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Manajemen Bank Soal</h2>
                  <p className="text-xs text-slate-500">Kelola dan lihat daftar soal ujian semester yang terdaftar di bank soal saat ini.</p>
                </div>
                
                {/* Excel tools simulation */}
                <div className="flex gap-2">
                  <button
                    id="btn-import-soal-excel"
                    onClick={() => simulateExcelUpload("soal")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Import Excel Ujian</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                               {/* Dual-tab Form Container */}
                <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-lg h-fit">
                  {/* Tab Selector */}
                  <div className="flex border-b border-slate-200 pb-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestionTab("manual")}
                      className={`flex-1 py-1.5 px-2 text-center text-xs font-black rounded uppercase tracking-wider transition-all cursor-pointer ${
                        questionTab === "manual"
                          ? "bg-[#1e3c72] text-white shadow-sm"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      Ketik Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTab("pdf")}
                      className={`flex-1 py-1.5 px-2 text-center text-xs font-black rounded uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        questionTab === "pdf"
                          ? "bg-purple-700 text-white shadow-sm"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Impor PDF (AI)
                    </button>
                  </div>

                  {questionTab === "manual" ? (
                    <form onSubmit={handleAddQuestion} className="space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1">
                        <Plus className="h-4 w-4 text-[#1e3c72]" />
                        Buat Soal Manual Baru
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran:</label>
                          <select
                            id="select-add-subject"
                            className="w-full bg-white border rounded px-2.5 py-1.5 font-bold text-slate-700 animate-fade-in"
                            value={selectedSubject}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedSubject(val);
                              if (val === "CUSTOM") {
                                setCustomSubjectActive(true);
                              } else {
                                setCustomSubjectActive(false);
                              }
                            }}
                          >
                            <option value="Asesmen Literasi (Membaca)">Asesmen Literasi (Membaca)</option>
                            <option value="Asesmen Numerasi (Matematika)">Asesmen Numerasi (Matematika)</option>
                            <option value="Survei Karakter & Lingkungan Belajar">Survei Karakter & Lingkungan Belajar</option>
                            <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                            <option value="Bahasa Inggris">Bahasa Inggris</option>
                            <option value="CUSTOM">-- Ketik Mata Pelajaran Kustom --</option>
                          </select>
                          
                          {customSubjectActive && (
                            <input
                              type="text"
                              required
                              className="mt-1.5 w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-800 font-bold border-blue-300 focus:outline-[#1e3c72]"
                              placeholder="Ketik mata pelajaran..."
                              value={customSubjectText}
                              onChange={(e) => setCustomSubjectText(e.target.value)}
                            />
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tipe Soal ANBK:</label>
                          <select
                            id="select-add-qtype"
                            className="w-full bg-white border rounded px-2.5 py-1.5 font-bold text-slate-700"
                            value={newQType}
                            onChange={(e) => setNewQType(e.target.value as QuestionType)}
                          >
                            <option value={QuestionType.SINGLE_CHOICE}>Pilihan Ganda (Satu Jawaban)</option>
                            <option value={QuestionType.COMPLEX_CHOICE}>Pilihan Ganda Kompleks (Checkbox)</option>
                            <option value={QuestionType.MATCHING}>Menjodohkan (Grid Pasangan)</option>
                            <option value={QuestionType.SHORT_ANSWER}>Isian Singkat</option>
                            <option value={QuestionType.ESSAY}>Uraian / Essay</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Teks Pertanyaan Soal:</label>
                          <textarea
                            id="input-add-qtext"
                            rows={3}
                            className="w-full bg-white border rounded p-2 text-slate-800"
                            placeholder="Ketik deskripsi atau soal..."
                            value={newQText}
                            onChange={(e) => setNewQText(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Bobot Points:</label>
                          <input
                            id="input-add-qpoints"
                            type="number"
                            className="w-full bg-white border rounded px-2.5 py-1.5 font-mono font-bold"
                            value={newQPoints}
                            onChange={(e) => setNewQPoints(Number(e.target.value))}
                          />
                        </div>

                        {/* Hint text */}
                        <p className="text-[10px] text-slate-400">
                          * Opsi standar pilihan ganda dan grid menjodohkan acuan akan didaftarkan secara otomatis sebagai templat awal yang siap disunting.
                        </p>
                      </div>

                      <button
                        id="btn-submit-add-question"
                        type="submit"
                        className="w-full bg-[#1e3c72] hover:bg-blue-800 text-white font-extrabold text-xs py-2 rounded shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        <span>Tambah Ke Bank Soal</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleImportPDFWithGemini} className="space-y-4">
                      <div className="flex items-center gap-1.5 text-purple-800">
                        <Bot className="h-5 w-5 text-purple-700" />
                        <h3 className="font-extrabold text-purple-850 text-xs uppercase tracking-wide">
                          Pengetikan Presisi ver. Gemini AI
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Unggah berkas soal format PDF atau berkas teks. Gemini AI akan menganalisis dokumen dan mengetik ulang persis dengan dokumen asli.
                      </p>

                      <div className="space-y-4 text-xs">
                        {/* Configuration section for Serverless/GitHub deployments */}
                        <div className="bg-purple-50/50 p-3 rounded-md border border-purple-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-purple-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                              ⚙️ Pengaturan Lingkungan Statis (GitHub / Client-only)
                            </span>
                            <span className="text-[9px] bg-purple-200 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                              Penting untuk GitHub
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            Jika dijalankan secara statis (seperti di GitHub Pages), backend proxy server luring tidak tersedia. Masukkan Kunci API Gemini pribadi Anda agar pemindaian dokumen tetap berjalan langsung dari peramban Anda. API Key disimpan aman di penyimpanan lokal peramban (<code className="font-mono bg-slate-100 p-0.5 text-rose-650 rounded text-[9px]">localStorage</code>).
                          </p>
                          <div className="pt-1">
                            <input
                              type="password"
                              className="w-full bg-white border border-slate-350 rounded px-2.5 py-1.5 text-[11px] text-slate-800 font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                              placeholder="Masukkan Kunci API Gemini Anda (AIzaSy...)"
                              value={clientGeminiKey}
                              onChange={(e) => {
                                const val = e.target.value;
                                setClientGeminiKey(val);
                                localStorage.setItem("client_gemini_api_key", val);
                              }}
                            />
                          </div>
                        </div>

                        {/* Mata Pelajaran Selector */}
                        <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1.5">
                          <label className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                            Mata Pelajaran Soal:
                          </label>
                          <select
                            id="select-pdf-subject"
                            className="w-full bg-slate-50 border rounded px-2.5 py-1.5 font-bold text-slate-700 text-xs focus:ring-1 focus:ring-purple-500"
                            value={pdfSubject}
                            disabled={isImportingPdf}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPdfSubject(val);
                              if (val === "CUSTOM") {
                                setCustomPdfSubjectActive(true);
                              } else {
                                setCustomPdfSubjectActive(false);
                              }
                            }}
                          >
                            <option value="Asesmen Literasi (Membaca)">Asesmen Literasi (Membaca)</option>
                            <option value="Asesmen Numerasi (Matematika)">Asesmen Numerasi (Matematika)</option>
                            <option value="Survei Karakter & Lingkungan Belajar">Survei Karakter & Lingkungan Belajar</option>
                            <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                            <option value="Bahasa Inggris">Bahasa Inggris</option>
                            <option value="CUSTOM">-- Ketik Mata Pelajaran Kustom --</option>
                          </select>
                          
                          {customPdfSubjectActive && (
                            <input
                              type="text"
                              required
                              disabled={isImportingPdf}
                              className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-purple-750"
                              placeholder="Ketik mata pelajaran kustom..."
                              value={customPdfSubjectText}
                              onChange={(e) => setCustomPdfSubjectText(e.target.value)}
                            />
                          )}
                        </div>

                        {/* Drag & Drop File Container */}
                        <div
                          onDragEnter={handlePdfDrag}
                          onDragOver={handlePdfDrag}
                          onDragLeave={handlePdfDrag}
                          onDrop={handlePdfDrop}
                          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                            dragActive
                              ? "border-purple-500 bg-purple-50"
                              : pdfFile
                              ? "border-emerald-500 bg-emerald-50/10"
                              : "border-slate-300 hover:border-purple-400 bg-white"
                          }`}
                        >
                          <input
                            id="pdf-file-upload"
                            type="file"
                            accept=".pdf,text/plain"
                            className="hidden"
                            onChange={handlePdfFileChange}
                            disabled={isImportingPdf}
                          />
                          <label htmlFor="pdf-file-upload" className="cursor-pointer block space-y-2">
                            <FileText className={`h-8 w-8 mx-auto ${pdfFile ? "text-emerald-500 animate-bounce" : "text-slate-400"}`} />
                            <span className="block text-slate-700 font-bold text-xs select-none">
                              {pdfFile ? pdfFile.name : "Klik atau seret berkas PDF di sini"}
                            </span>
                            {pdfFile ? (
                              <span className="block text-[10px] text-emerald-600 font-black">
                                {(pdfFile.size / 1024).toFixed(1)} KB - Siap diketik otomatis
                              </span>
                            ) : (
                              <span className="block text-[10px] text-slate-400">
                                Berkas PDF atau berkas teks ujian
                              </span>
                            )}
                          </label>
                        </div>

                        {/* Setting Jumlah Butir Soal 1 - 100 */}
                        <div className="bg-white p-3 rounded-md border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                              Jumlah Soal Ditargetkan:
                            </label>
                            <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {pdfNumQuestions} Butir Soal
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={1}
                              max={100}
                              value={pdfNumQuestions}
                              disabled={isImportingPdf}
                              onChange={(e) => setPdfNumQuestions(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-705"
                            />
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={pdfNumQuestions}
                              disabled={isImportingPdf}
                              onChange={(e) => setPdfNumQuestions(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                              className="w-14 bg-slate-50 border rounded text-center py-1 text-xs font-mono font-black border-slate-350 text-slate-800"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                            Batas penyesuaian: 1 s.d. 100 soal. Apabila dokumen memiliki butir soal kurang dari target, AI akan melengkapi dengan soal relevan tambahan otomatis.
                          </p>
                        </div>

                        {pdfImportError && (
                          <div className="bg-rose-50 border-l-2 border-rose-500 p-2.5 rounded text-[11px] text-rose-800 font-semibold leading-relaxed">
                            {pdfImportError}
                          </div>
                        )}

                        {isImportingPdf && (
                          <div className="bg-purple-50 border-l-2 border-purple-500 p-3 rounded space-y-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 text-purple-700 animate-spin" />
                              <span className="font-bold text-purple-900 text-xs">Pengetikan AI Berlangsung...</span>
                            </div>
                            <p className="text-[10px] text-purple-700 leading-normal font-medium italic">
                              {pdfImportStatus}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        id="btn-submit-import-pdf"
                        type="submit"
                        disabled={isImportingPdf || !pdfFile}
                        className={`w-full text-white font-extrabold text-xs py-2 rounded shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                          isImportingPdf || !pdfFile
                            ? "bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed"
                            : "bg-purple-700 hover:bg-purple-800 shadow"
                        }`}
                      >
                        <Sparkles className="h-4.5 w-4.5" />
                        <span>Ketik Otomatis Soal PDF</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* List bank items */}
                <div className="lg:col-span-2 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  <h3 className="font-extrabold text-slate-800 text-sm flex justify-between items-center bg-slate-50 p-2 rounded border">
                    <span>Daftar Soal Terdaftar ({questions.length} Soal)</span>
                    <span className="text-[10px] bg-blue-100 text-[#1e3c72] px-2 py-0.5 rounded font-bold">Autosaved</span>
                  </h3>

                  {/* Saring Mata Pelajaran Selector */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600">Saring menurut Mata Pelajaran:</span>
                    <select
                      value={questionFilterSubject}
                      onChange={(e) => setQuestionFilterSubject(e.target.value)}
                      className="bg-white border rounded px-2 py-1 text-xs font-bold text-slate-700 focus:outline-[#1e3c72]"
                    >
                      <option value="Semua">Semua Mata Pelajaran ({questions.length})</option>
                      {Array.from(new Set(questions.map((q) => q.subject || "Umum/Lainnya"))).map((subj) => (
                        <option key={subj} value={subj}>
                          {subj} ({questions.filter((q) => (q.subject || "Umum/Lainnya") === subj).length} Soal)
                        </option>
                      ))}
                    </select>
                  </div>

                  {questions
                    .filter((q) => questionFilterSubject === "Semua" || (q.subject || "Umum/Lainnya") === questionFilterSubject)
                    .map((q) => (
                      <div
                        key={q.id}
                        className="p-4 border rounded-lg hover:border-slate-400 transition-all shadow-sm bg-white flex justify-between items-start gap-4"
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-[#1e3c72] text-white font-bold h-5 w-5 rounded-full flex items-center justify-center text-[10px]">
                              {q.number}
                            </span>
                            <span className="bg-slate-100 border text-slate-600 font-bold px-2 py-0.5 rounded text-[10px]">
                              {q.type}
                            </span>
                            <span className="bg-blue-50 border border-blue-200 text-[#1e3c72] font-black px-2 py-0.5 rounded text-[10px] truncate max-w-[200px]" title={q.subject || "Umum/Lainnya"}>
                              📚 {q.subject || "Umum/Lainnya"}
                            </span>
                            <span className="font-black text-rose-700">
                              {q.points} Poin
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed font-semibold text-sm">
                            {q.text}
                          </p>
                        </div>

                        <button
                          id={`btn-del-q-${q.id}`}
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-slate-350 hover:text-red-600 p-1 border rounded bg-slate-50 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>

              </div>
            </div>
          )}

          {/* ======================= TAB 4: MANAGE STUDENTS DATA ======================= */}
          {activeTab === "students" && (
            <div className="space-y-6 flex-grow overflow-y-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Manajemen Data Siswa</h2>
                  <p className="text-xs text-slate-500">Tambahkan daftar siswa semester secara manual mendetail atau melalui pengunggahan format Excel.</p>
                </div>
                
                {/* Excel tools emulation */}
                <button
                  id="btn-import-siswa-excel"
                  onClick={() => simulateExcelUpload("siswa")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Import Excel Siswa</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* student create form */}
                <form onSubmit={handleAddStudent} className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-lg h-fit">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">
                    Registrasi Siswa Manual
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa:</label>
                      <input
                        id="input-student-name"
                        type="text"
                        placeholder="Contoh: Dania Putri"
                        className="w-full bg-white border rounded px-2.5 py-1.5 font-semibold text-slate-800"
                        value={newSName}
                        onChange={(e) => setNewSName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Username / NISN:</label>
                        <input
                          id="input-student-user"
                          type="text"
                          placeholder="20260105"
                          className="w-full bg-white border rounded px-2.5 py-1.5 font-mono"
                          value={newSUsername}
                          onChange={(e) => setNewSUsername(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Password:</label>
                        <input
                          id="input-student-pass"
                          type="text"
                          placeholder="siswa123"
                          className="w-full bg-white border rounded px-2.5 py-1.5"
                          value={newSPassword}
                          onChange={(e) => setNewSPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kelamin:</label>
                        <select
                          id="select-student-gender"
                          className="w-full bg-white border rounded px-2.5 py-1.5"
                          value={newSGender}
                          onChange={(e) => setNewSGender(e.target.value as "L" | "P")}
                        >
                          <option value="L">Laki-Laki (L)</option>
                          <option value="P">Perempuan (P)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kelas Rombel:</label>
                        <select
                          id="select-student-class"
                          className="w-full bg-white border rounded px-2.5 py-1.5"
                          value={newSClass}
                          onChange={(e) => setNewSClass(e.target.value)}
                        >
                          <option value="XII TKJ 1">XII TKJ 1</option>
                          <option value="XII TKJ 2">XII TKJ 2</option>
                          <option value="XII RPL 1">XII RPL 1</option>
                          <option value="XII RPL 2">XII RPL 2</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nomor Kartu Ujian (Optional):</label>
                      <input
                        id="input-student-card"
                        type="text"
                        placeholder="Contoh: U-01010045-9"
                        className="w-full bg-white border rounded px-2.5 py-1.5 font-mono"
                        value={newSCard}
                        onChange={(e) => setNewSCard(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    id="btn-submit-add-student"
                    type="submit"
                    className="w-full bg-[#1e3c72] hover:bg-blue-800 text-white font-extrabold text-xs py-2 rounded shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Daftarkan Siswa</span>
                  </button>
                </form>

                {/* List students */}
                <div className="lg:col-span-2 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  <h3 className="font-extrabold text-slate-800 text-sm bg-slate-50 p-2 rounded border">
                    Siswa Terdaftar ({participants.length} Siswa)
                  </h3>

                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {participants.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-3 py-3 font-bold text-[#1e3c72]">{p.name}</td>
                            <td className="px-3 py-3 font-mono text-slate-500">{p.username} / Password: {p.passwordHash}</td>
                            <td className="px-3 py-3 font-semibold text-slate-600">{p.className}</td>
                            <td className="px-3 py-3 font-mono text-slate-400">{p.gender}</td>
                            <td className="px-3 py-3 text-center">
                              <button
                                id={`btn-del-student-${p.id}`}
                                onClick={() => handleDeleteStudent(p.id)}
                                className="text-slate-350 hover:text-red-600 p-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================= TAB 5: GRADES AND RECAPITULATION ======================= */}
          {activeTab === "grades" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Unduh dan Rekapitulasi Nilai</h2>
                  <p className="text-xs text-slate-500">Melihat perolehan nilai, persentase jawaban benar, serta mengunduh rekapitulasi data.</p>
                </div>

                <button
                  id="btn-download-grades-csv"
                  onClick={downloadResultsCSV}
                  className="bg-yellow-500 hover:bg-yellow-600 text-[#0f172a] hover:text-black font-extrabold text-xs py-2 px-4 rounded border border-yellow-600 shadow-md flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider active:scale-95"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>Unduh File Excel (CSV)</span>
                </button>
              </div>

              {/* Table grades */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-[#0f172a] text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-xs text-center w-12">No</th>
                      <th className="px-4 py-3 font-semibold text-xs text-left">Nama Lengkap</th>
                      <th className="px-4 py-3 font-semibold text-xs text-left">Kode Kartu</th>
                      <th className="px-4 py-3 font-semibold text-xs text-center">Kelas</th>
                      <th className="px-4 py-3 font-semibold text-xs text-center">Benar</th>
                      <th className="px-4 py-3 font-semibold text-xs text-center">Salah</th>
                      <th className="px-4 py-3 font-semibold text-xs text-center">Skor Angka (Skala 100)</th>
                      <th className="px-4 py-3 font-semibold text-xs text-center">Kelulusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-700 font-semibold text-xs">
                    {activeProgress.map((p, idx) => {
                      const finalScore = p.score ?? 0;
                      const correct = Math.round((finalScore * p.totalQuestions) / 100);
                      const wrong = p.totalQuestions - correct;
                      const pass = finalScore >= 75;

                      return (
                        <tr key={p.participantId} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-4 font-bold text-[#1e3c72]">{p.name}</td>
                          <td className="px-4 py-4 font-mono text-slate-500">{p.examCardNumber}</td>
                          <td className="px-4 py-4 text-center font-semibold text-slate-600">{p.className || "XII TKJ 1"}</td>
                          <td className="px-4 py-4 text-center font-mono text-emerald-700">{correct}</td>
                          <td className="px-4 py-4 text-center font-mono text-rose-700">{wrong}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-mono font-black text-sm bg-slate-100 py-1 px-3 rounded border text-slate-900">
                              {finalScore}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {p.status === "Selesai" ? (
                              <span
                                className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                  pass
                                    ? "bg-emerald-100 border border-emerald-300 text-emerald-800"
                                    : "bg-amber-100 border border-amber-300 text-amber-800"
                                }`}
                              >
                                {pass ? "LULUS KKM" : "REMIDIAL"}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Sedang Mengikuti Ujian</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB 6: BASE DATABASE SCHEMAS ======================= */}
          {activeTab === "schema" && (
            <div className="space-y-6 flex-grow overflow-y-auto">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Desain & Skema Database Dasar</h2>
                <p className="text-xs text-slate-500">Mempelajari struktur arsitektur tabel relasional (MySQL / PostgreSQL) yang siap dipasang.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Relational Database schemas SQL code blocks */}
                <div className="space-y-3">
                  <span className="bg-[#1e3c72] text-white font-extrabold text-[10px] px-2.5 py-1 rounded uppercase">
                    Skema SQL Relasional (Drizzle / PostgreSQL)
                  </span>
                  
                  <div className="bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed shadow-inner max-h-80">
<pre>{`-- 1. Tabel Sesi Ujian (exam_sessions)
CREATE TABLE exam_sessions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(6) UNIQUE NOT NULL,
    duration_minutes INT DEFAULT 90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Soal (exam_questions)
CREATE TABLE exam_questions (
    id VARCHAR(50) PRIMARY KEY,
    number INT NOT NULL,
    type VARCHAR(30) NOT NULL, -- Pilihan Ganda, Essay, dll
    text TEXT NOT NULL,
    image_url TEXT,
    correct_answer TEXT, -- format JSON jika kompleks / menjodohkan
    points INT DEFAULT 20
);

-- 3. Tabel Siswa (participants)
CREATE TABLE participants (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('L', 'P')),
    class_name VARCHAR(100)
);

-- 4. Tabel Jawaban Siswa (student_responses)
CREATE TABLE student_responses (
    id SERIAL PRIMARY KEY,
    participant_id VARCHAR(50) REFERENCES participants(id),
    question_id VARCHAR(50) REFERENCES exam_questions(id),
    answer JSONB, -- menyimpan text, array opsi, atau koordinat menjodohkan
    is_doubtful BOOLEAN DEFAULT FALSE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}</pre>
                  </div>
                </div>

                {/* Firestore document database style schemas */}
                <div className="space-y-3">
                  <span className="bg-[#1b5e20] text-white font-extrabold text-[10px] px-2.5 py-1 rounded uppercase">
                    Skema Dokumen (NoSQL / Firestore Blueprint)
                  </span>

                  <div className="bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-orange-400 overflow-x-auto border border-slate-800 leading-relaxed shadow-inner max-h-80">
<pre>{`// 1. Koleksi "sessions"
{
  "docId": "session_ganjil_2026",
  "name": "ULANGAN SEMESTER GANJIL",
  "token": "ANBK26",
  "durationMinutes": 90,
  "active": true
}

// 2. Koleksi "questions"
{
  "docId": "q1",
  "number": 1,
  "type": "SINGLE_CHOICE",
  "text": "Perangkat keras utama CPU...",
  "choices": [
    { "id": "A", "text": "RAM" },
    { "id": "B", "text": "CPU" }
  ],
  "correctAnswer": "B",
  "points": 20
}

// 3. Koleksi "progress_monitoring"
{
  "docId": "p1",
  "name": "Ahmad Habibi",
  "answeredCount": 3,
  "totalQuestions": 5,
  "status": "Mengerjakan",
  "lastActive": "2026-06-08T12:05:00Z"
}`}</pre>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer Khas Admin */}
      <footer className="bg-[#0f172a] text-slate-500 py-3 text-center text-xs border-t border-slate-800">
        <p className="font-semibold">
          © 2026 Panel Proktor CBT-ANBK • Direktorat Jenderal Pendidikan Menengah Atas & Kejuruan RI
        </p>
      </footer>

    </div>
  );
}
