import { Question, QuestionType, Participant, ExamSession, StudentProgress } from "../types";

/**
 * Initial standard ANBK questions
 */
export const defaultQuestions: Question[] = [
  {
    id: "q1",
    number: 1,
    type: QuestionType.SINGLE_CHOICE,
    text: "Perangkat keras komputer yang berfungsi sebagai unit pemroses utama untuk mengeksekusi instruksi data adalah...",
    choices: [
      { id: "A", text: "RAM (Random Access Memory)" },
      { id: "B", text: "CPU (Central Processing Unit)" },
      { id: "C", text: "SSD (Solid State Drive)" },
      { id: "D", text: "GPU (Graphics Processing Unit)" }
    ],
    correctAnswer: "B",
    points: 20
  },
  {
    id: "q2",
    number: 2,
    type: QuestionType.COMPLEX_CHOICE,
    text: "Manakah di antara pilihan berikut yang termasuk dalam sistem operasi berbasis Open Source? (Pilih semua jawaban yang benar)",
    choices: [
      { id: "A", text: "Ubuntu Linux" },
      { id: "B", text: "Microsoft Windows 11" },
      { id: "C", text: "Android OS" },
      { id: "D", text: "macOS Ventura" },
      { id: "E", text: "Fedora Workstation" }
    ],
    correctAnswer: ["A", "C", "E"],
    points: 20
  },
  {
    id: "q3",
    number: 3,
    type: QuestionType.MATCHING,
    text: "Jodohkanlah perangkat periferal komputer berikut dengan kategori fungsional yang tepat!",
    matchingRows: [
      { id: "row1", text: "Keyboard Mekanikal" },
      { id: "row2", text: "Freesync Monitor" },
      { id: "row3", text: "NVMe M.2 SSD" },
      { id: "row4", text: "Flatbed Scanner" }
    ],
    matchingCols: [
      { id: "col1", text: "Perangkat Input" },
      { id: "col2", text: "Perangkat Output" },
      { id: "col3", text: "Perangkat Penyimpanan" }
    ],
    correctAnswer: [
      { rowId: "row1", colId: "col1" },
      { rowId: "row2", colId: "col2" },
      { rowId: "row3", colId: "col3" },
      { rowId: "row4", colId: "col1" }
    ],
    points: 30
  },
  {
    id: "q4",
    number: 4,
    type: QuestionType.SHORT_ANSWER,
    text: "Sebutkan nama sistem operasi berlisensi gratis dan open-source yang berlambang hewan maskot seekor pinguin bernama Tux!",
    correctAnswer: "Linux",
    points: 15
  },
  {
    id: "q5",
    number: 5,
    type: QuestionType.ESSAY,
    text: "Menurut pendapat Anda, mengapa keamanan siber (cybersecurity) sangat penting di era digitalisasi pendidikan dan infrastruktur Computer-Based Test (CBT) saat ini? Jelaskan strategi mitigasi sederhana untuk mencegah kebocoran soal ujian!",
    correctAnswer: "",
    points: 15
  }
];

/**
 * Default students database conforming to standard Indonesian student registry
 */
export const defaultParticipants: Participant[] = [
  {
    id: "p1",
    username: "20260101",
    passwordHash: "siswa123",
    name: "Ahmad Habibi",
    gender: "L",
    examCardNumber: "U-01010041-5",
    className: "XII TKJ 1"
  },
  {
    id: "p2",
    username: "20260102",
    passwordHash: "siswa123",
    name: "Siti Rahmawati",
    gender: "P",
    examCardNumber: "U-01010042-6",
    className: "XII TKJ 1"
  },
  {
    id: "p3",
    username: "20260103",
    passwordHash: "siswa123",
    name: "Budi Pratama",
    gender: "L",
    examCardNumber: "U-01010043-7",
    className: "XII TKJ 2"
  },
  {
    id: "p4",
    username: "20260104",
    passwordHash: "siswa123",
    name: "Dewi Lestari",
    gender: "P",
    examCardNumber: "U-01010044-8",
    className: "XII RPL 1"
  },
  {
    id: "p5",
    username: "20260105",
    passwordHash: "siswa123",
    name: "Farhan Ardiansyah",
    gender: "L",
    examCardNumber: "U-01010045-9",
    className: "XII RPL 2"
  },
  {
    id: "p6",
    username: "20260106",
    passwordHash: "siswa123",
    name: "Khairunnisa Fitri",
    gender: "P",
    examCardNumber: "U-01010046-0",
    className: "XII RPL 2"
  },
  {
    id: "p7",
    username: "20260107",
    passwordHash: "siswa123",
    name: "Gede Agung",
    gender: "L",
    examCardNumber: "U-01010047-1",
    className: "XII MM 1"
  },
  {
    id: "p8",
    username: "20260108",
    passwordHash: "siswa123",
    name: "Kadek Wulandari",
    gender: "P",
    examCardNumber: "U-01010048-2",
    className: "XII MM 1"
  },
  {
    id: "p9",
    username: "20260109",
    passwordHash: "siswa123",
    name: "Nyoman Surya",
    gender: "L",
    examCardNumber: "U-01010049-3",
    className: "XII MM 2"
  },
  {
    id: "p10",
    username: "20260110",
    passwordHash: "siswa123",
    name: "Ketut Lestari",
    gender: "P",
    examCardNumber: "U-01010050-4",
    className: "XII MM 2"
  }
];

/**
 * Initial Exam state details
 */
export const defaultSession: ExamSession = {
  id: "s1",
  name: "Asesmen Nasional - Literasi Membaca",
  code: "ANBK_LITERASI",
  token: "ANBK26",
  durationMinutes: 90,
  active: true,
  createdAt: "2026-06-08T08:00:00Z"
};

/**
 * Initial state of Student Activity monitor inside Admin Panel
 */
export const defaultProgress: StudentProgress[] = [
  {
    participantId: "p1",
    name: "Ahmad Habibi",
    username: "20260101",
    examCardNumber: "U-01010041-5",
    currentQuestionNumber: 3,
    totalQuestions: 5,
    answeredCount: 2,
    status: "Mengerjakan",
    lastActive: "2026-06-08T12:05:00Z"
  },
  {
    participantId: "p2",
    name: "Siti Rahmawati",
    username: "20260102",
    examCardNumber: "U-01010042-6",
    currentQuestionNumber: 0,
    totalQuestions: 5,
    answeredCount: 0,
    status: "Belum Mulai",
    lastActive: "2026-06-08T12:00:00Z"
  },
  {
    participantId: "p3",
    name: "Budi Pratama",
    username: "20260103",
    examCardNumber: "U-01010043-7",
    currentQuestionNumber: 5,
    totalQuestions: 5,
    answeredCount: 4,
    status: "Pending/Ragu",
    lastActive: "2026-06-08T12:06:50Z"
  }
];
