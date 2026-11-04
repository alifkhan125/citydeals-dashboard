"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

type ImportResult = { imported: number; failed: number; errors?: Array<{ row: number; message: string }> };

export default function CsvImportModal({
  isOpen,
  onClose,
  title,
  headers,
  importCsv,
  onImported,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headers: string[];
  importCsv: (csv: string) => Promise<ImportResult>;
  onImported?: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, setPending] = useState(false);

  function downloadTemplate() {
    const blob = new Blob([`${headers.join(",")}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadErrors() {
    if (!result?.errors?.length) return;
    const body = ["row,message", ...result.errors.map((error) => `${error.row},"${error.message.replaceAll('"', '""')}"`)].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "import-errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsv(text);
      setPreview(text.split(/\r?\n/).filter(Boolean).slice(0, 6).map((line) => line.split(",")));
      setResult(null);
    };
    reader.readAsText(file);
  }

  async function submit() {
    if (!csv.trim()) return;
    setPending(true);
    try {
      const next = await importCsv(csv);
      setResult(next);
      onImported?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-[760px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
            Choose CSV file
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
          <button type="button" onClick={downloadTemplate} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Download template</button>
        </div>
        {fileName && <p className="text-sm text-slate-600">Selected: {fileName}</p>}
        {preview.length > 0 && (
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-xs"><tbody>{preview.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex === 0 ? "bg-slate-100 font-semibold" : "border-t border-slate-100"}>{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2">{cell}</td>)}</tr>)}</tbody></table>
          </div>
        )}
        {result && <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Imported: {result.imported} · Failed: {result.failed}{result.errors?.length ? <button type="button" onClick={downloadErrors} className="ml-3 text-orange-600 underline">Download errors</button> : null}</div>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Close</button><button type="button" onClick={submit} disabled={!csv || pending} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Importing..." : "Import CSV"}</button></div>
      </div>
    </Modal>
  );
}
