import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Setup JSON body parsing with a generous limit for PDF files
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Import questions from PDF endpoint
app.post("/api/questions/import-pdf", async (req, res) => {
  try {
    const { fileBase64, mimeType, numQuestions, subject } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: "File data base64 tidak boleh kosong." });
    }

    const requestedCount = Math.min(100, Math.max(1, Number(numQuestions) || 10));
    const targetMime = mimeType || "application/pdf";
    const targetSubject = subject || "Umum/Asesmen Kombinasi";

    if (!apiKey) {
      return res.status(500).json({
        error: "Kunci API (GEMINI_API_KEY) tidak dikonfigurasi di server. Silakan tambahkan di Settings > Secrets.",
      });
    }

    const docPart = {
      inlineData: {
        mimeType: targetMime,
        data: fileBase64,
      },
    };

    const textPart = {
      text: `Anda adalah asisten penguji Asesmen Nasional (ANBK) yang sangat teliti.
Tugas Anda adalah memindai berkas dokumen dokumen soal tersebut, dan mengetik ulang dengan teks yang SAMA PERSIS (word-for-word) sesuai dengan dokumen/soal asli di berkas tersebut tanpa ditambah-tambah atau dikurangi.

Semua soal ini dikhususkan untuk mata pelajaran: "${targetSubject}".

Ketentuan tambahan:
1. Ekstrak dan hasilkan tepat ${requestedCount} butir soal dari dokumen tersebut.
2. Jika dokumen memiliki lebih dari ${requestedCount} soal, pilih ${requestedCount} soal pertama yang ada demi kepatuhan jumlah.
3. Jika dokumen memiliki kurang dari ${requestedCount} soal, ketik semua soal yang ada dari dokumen terlebih dahulu secara verbatim/sama persis, lalu untuk memenuhi kuota ${requestedCount} soal, buatlah soal tambahan baru berkualitas tinggi yang relevan dengan topik dokumen tersebut DAN memiliki kaitan erat dengan mata pelajaran "${targetSubject}".
4. Setiap butir soal harus ditandai dengan field "subject" berisi "${targetSubject}" di JSON output Anda.
5. Format output HARUS berupa JSON array yang valid sesuai schema berikut.
6. Soal harus terbagi secara rasional ke dalam tipe-tipe soal standard ANBK: "SINGLE_CHOICE" (Pilihan ganda biasa), "COMPLEX_CHOICE" (Pilihan ganda kompleks - checkbox), "MATCHING" (Menjodohkan), "SHORT_ANSWER" (Isian singkat), atau "ESSAY" (Uraian).

Setiap objek soal dalam JSON array harus memiliki field:
- id: string unik contoh: "q_pdf_" + angka acak
- number: nomor soal berurutan (dari 1 sampai ${requestedCount})
- type: string bernilai salah satu dari: "SINGLE_CHOICE", "COMPLEX_CHOICE", "MATCHING", "SHORT_ANSWER", "ESSAY"
- text: teks pertanyaan dari soal (harus diketik persis sama dengan di dokumen)
- subject: string dengan nilai "${targetSubject}"
- points: angka bobot poin (default: 10 atau 20)
- choices: array dari objek { id: "A", text: "Teks opsi" } (wajib jika tipe SINGLE_CHOICE atau COMPLEX_CHOICE)
- matchingRows: array dari objek { id: "row1", text: "Teks baris/pernyataan kiri" } (wajib jika tipe MATCHING)
- matchingCols: array dari objek { id: "col1", text: "Teks kolom/kriteria kanan" } (wajib jika tipe MATCHING)
- correctAnswer: untuk "SINGLE_CHOICE" isikan ID opsi (misal "A"). Untuk "COMPLEX_CHOICE" isikan opsi ber-koma (misal "A,C"). Untuk "MATCHING" buat dalam string terformat pasang-berpasangan rowId-colId dipisah koma (misal "row1-col1,row2-col2"). Untuk "SHORT_ANSWER" dan "ESSAY" isikan perkiraan jawaban acuan dalam bentuk string teks biasa.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [docPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              number: { type: Type.INTEGER },
              type: {
                type: Type.STRING,
                description: "Must be one of: 'SINGLE_CHOICE', 'COMPLEX_CHOICE', 'MATCHING', 'SHORT_ANSWER', 'ESSAY'",
              },
              text: { type: Type.STRING, description: "Exact wording of the question text from the document." },
              subject: { type: Type.STRING },
              choices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ["id", "text"],
                },
              },
              matchingRows: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ["id", "text"],
                },
              },
              matchingCols: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ["id", "text"],
                },
              },
              correctAnswer: { type: Type.STRING },
              points: { type: Type.INTEGER },
            },
            required: ["id", "number", "type", "text", "points"],
          },
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "[]");
    return res.json({ success: true, questions: parsedJson });
  } catch (error: any) {
    console.error("Kesalahan ketika mengimpor berkas PDF via Gemini:", error);
    return res.status(500).json({ error: error.message || "Gagal mengolah dokumen menggunakan Gemini AI." });
  }
});

// Configure Vite or Static Fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving built static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CBT Server] Running full-stack mode on http://localhost:${PORT}`);
  });
}

startServer();
