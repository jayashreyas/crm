
import React, { useState, useRef } from 'react';
import { X, FileUp, CheckCircle, AlertCircle, Loader2, Table } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
  title: string;
  expectedHeaders: string[];
  fieldAliases?: Record<string, string[]>;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImport, title, expectedHeaders, fieldAliases }) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Robust CSV parser handles quotes and nested commas
  const parseCSV = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        }
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedRows = parseCSV(content);

        if (parsedRows.length < 2) {
          throw new Error("File appears to be empty or missing data rows.");
        }

        const headersInFile = parsedRows[0].map((h, index) => {
          const trimmed = h.trim().toLowerCase();
          // Handle empty or duplicate headers to ensure all data is accessible
          if (!trimmed) return `column_${index}`;
          return trimmed;
        });

        // Ensure uniqueness to prevent key overwrites
        const uniqueHeaders = headersInFile.reduce((acc: string[], curr, index) => {
          let uniqueName = curr;
          let suffix = 1;
          while (acc.includes(uniqueName)) {
            uniqueName = `${curr}_${suffix}`;
            suffix++;
          }
          acc.push(uniqueName);
          return acc;
        }, []);

        // Header Mapping Engine: Standardize keys based on expectations
        const headerMap: Record<string, number> = {};
        expectedHeaders.forEach(expected => {
          const lowerExpected = expected.toLowerCase();
          const aliases = (fieldAliases?.[expected] || []).map(a => a.toLowerCase());
          const candidates = [lowerExpected, ...aliases];

          const colIndex = uniqueHeaders.findIndex(h =>
            candidates.some(c => h.includes(c))
          );

          if (colIndex !== -1) {
            headerMap[lowerExpected] = colIndex;
          }
        });

        // Validation: Ensure we found at least one matching column if expected
        if (expectedHeaders.length > 0 && Object.keys(headerMap).length === 0) {
          throw new Error(`Could not find required columns. Expected something like: ${expectedHeaders.join(', ')}`);
        }

        const formattedData = parsedRows.slice(1).map((row) => {
          const obj: any = {};
          // Map expected fields
          expectedHeaders.forEach(expected => {
            const index = headerMap[expected.toLowerCase()];
            if (index !== undefined) {
              obj[expected.toLowerCase()] = row[index] || '';
            }
          });
          // Also keep original fields for metadata using our sanitized unique headers
          uniqueHeaders.forEach((h, i) => {
            if (!obj[h]) obj[h] = row[i] || '';
          });
          return obj;
        });

        const validData = formattedData.filter(d => Object.values(d).some(v => v !== ''));
        if (validData.length === 0) throw new Error("No valid data rows found after processing.");

        setData(validData);
        setStep('preview');
      } catch (err: any) {
        setError(err.message || "Failed to parse file.");
      } finally {
        setIsProcessing(false);
        // Clear input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    onImport(data);
    onClose();
    // State will be reset because component unmounts in App.tsx when isOpen is false
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <FileUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Import {title}</h3>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">
                {step === 'upload' ? 'Awaiting Protocol Upload' : 'Data Integrity Review'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {step === 'upload' ? (
            <div className="space-y-8">
              <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-4 border-dashed rounded-[3rem] p-20 transition-all cursor-pointer group relative text-center ${isProcessing ? 'border-indigo-100 bg-slate-50' : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
                    <p className="text-lg font-black text-slate-800">Processing Stream...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white w-20 h-20 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <FileUp className="w-10 h-10 text-indigo-600" />
                    </div>
                    <p className="text-xl font-black text-slate-800 tracking-tight">Select CSV Data Source</p>
                    <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto text-sm">Upload your {title.toLowerCase()} export. We support multi-column data and flexible headers.</p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".csv,.txt"
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Table className="w-3.5 h-3.5" /> Required Column Map
                </h4>
                <div className="flex flex-wrap gap-2">
                  {expectedHeaders.map(h => (
                    <span key={h} className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-6 rounded-[2rem] text-sm font-bold flex items-center gap-4 border border-rose-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 text-emerald-700 p-6 rounded-[2rem] text-sm font-bold flex items-center gap-4 border border-emerald-100">
                <CheckCircle className="w-6 h-6 shrink-0" />
                Stream Parsed: Found {data.length} valid entries.
              </div>

              {/* NEW: Mapping Report */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {expectedHeaders.map(header => {
                  // Improved Check: validation now scans ALL rows to see if we found this data anywhere
                  // This prevents "MISSING" error just because the first row is empty
                  const key = header.toLowerCase();
                  let status: 'found' | 'empty' | 'missing' = 'missing';

                  // 1. Check if the key exists in our data object (meaning header mapping worked)
                  if (data.length > 0 && key in data[0]) {
                    // 2. Check if ANY row has a value for this key
                    const hasData = data.some(row => row[key] && row[key].trim().length > 0);
                    status = hasData ? 'found' : 'empty';
                  }

                  return (
                    <div key={header} className={`p-4 rounded-2xl border flex items-center justify-between ${status === 'found' ? 'bg-indigo-50 border-indigo-100' : (status === 'empty' ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-100')}`}>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{header}</span>
                      {status === 'found' && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">FOUND</span>
                      )}
                      {status === 'empty' && (
                        <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">EMPTY COLUMN</span>
                      )}
                      {status === 'missing' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold">MISSING</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="overflow-hidden border-2 border-slate-50 rounded-[2rem] shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {Object.keys(data[0]).slice(0, 4).map(h => (
                        <th key={h} className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[9px] border-b">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.slice(0, 4).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        {Object.keys(data[0]).slice(0, 4).map(h => (
                          <td key={h} className="px-8 py-5 text-slate-600 font-bold text-xs truncate max-w-[150px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase text-center tracking-[0.2em] mt-4">Verified {data.length} entries for commit</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 text-slate-500 hover:text-slate-800 font-black uppercase tracking-widest text-xs transition-all"
          >
            Abort Import
          </button>
          {step === 'preview' && (
            <button
              type="button"
              onClick={confirmImport}
              className="px-12 py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl transition-all"
            >
              Commit Data Stream
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
