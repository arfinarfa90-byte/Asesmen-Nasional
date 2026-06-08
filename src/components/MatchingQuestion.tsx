import React from "react";
import { MatchingOption, MatchingPair } from "../types";

interface MatchingQuestionProps {
  rows: MatchingOption[];
  cols: MatchingOption[];
  selectedValue: MatchingPair[];
  onChange: (pairs: MatchingPair[]) => void;
  fontSizeClass: string; // Dynamic font sizing option passed down
}

export default function MatchingQuestion({
  rows,
  cols,
  selectedValue = [],
  onChange,
  fontSizeClass,
}: MatchingQuestionProps) {
  
  // Handle toggling of a radio bullet for a given statement row and specific column option
  const handleSelect = (rowId: string, colId: string) => {
    // Collect all matches except any old match for this specific row, then append the new match
    const updatedPairs = selectedValue.filter((pair) => pair.rowId !== rowId);
    updatedPairs.push({ rowId, colId });
    onChange(updatedPairs);
  };

  // Check if a specific row and column pair is already matched
  const isChecked = (rowId: string, colId: string): boolean => {
    return selectedValue.some((pair) => pair.rowId === rowId && pair.colId === colId);
  };

  return (
    <div id="matching-question-wrapper" className={`w-full bg-slate-50 p-4 md:p-6 rounded-lg border border-slate-300 ${fontSizeClass}`}>
      <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <span>🧩</span> Tentukan Pasangan yang Sesuai (Klik bulatan pada Grid)
      </div>

      <div className="overflow-x-auto rounded-lg shadow-sm border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          {/* Column Headers */}
          <thead className="bg-[#1e3c72] text-white">
            <tr>
              <th className="px-4 py-3 text-sm font-bold w-1/3 min-w-[180px]">Pernyataan (Kiri)</th>
              {cols.map((col) => (
                <th
                  key={col.id}
                  className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider min-w-[120px]"
                >
                  {col.text}
                </th>
              ))}
            </tr>
          </thead>

          {/* Statement Rows */}
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={`${
                  index % 2 === 1 ? "bg-slate-50" : "bg-white"
                } hover:bg-yellow-50 transition-colors`}
              >
                {/* Statement text */}
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                  <div className="flex gap-2">
                    <span className="text-[#1e3c72] font-bold font-mono">{index + 1}.</span>
                    <span>{row.text}</span>
                  </div>
                </td>

                {/* Match radios */}
                {cols.map((col) => {
                  const active = isChecked(row.id, col.id);
                  return (
                    <td
                      key={col.id}
                      onClick={() => handleSelect(row.id, col.id)}
                      className="px-4 py-4 text-center cursor-pointer select-none transition-all active:scale-95"
                    >
                      <div className="flex items-center justify-center">
                        <div
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            active
                              ? "border-[#1e3c72] bg-blue-50 ring-2 ring-blue-500/30"
                              : "border-slate-300 hover:border-slate-500 bg-white"
                          }`}
                        >
                          {active && (
                            <div className="h-3 w-3 rounded-full bg-[#1e3c72] animate-scale-up" />
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-between text-[11px] text-slate-500 italic px-1">
        <span>* Klik baris dan kolom yang berpotongan untuk menjodohkan</span>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-red-600 font-bold hover:underline"
        >
          Reset Pilihan Menjodohkan
        </button>
      </div>
    </div>
  );
}
