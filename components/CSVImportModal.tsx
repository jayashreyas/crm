
import React, { useState, useRef } from 'react';
import { X, FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
  title: string;
  expectedHeaders: string[];
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImport, title, expectedHeaders }) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Robust CSV parser that handles quotes and nested commas
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

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError("Please upload a valid CSV or Text file.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedRows = parseCSV(content);
        
        if (parsedRows.length < 2) {
          throw new Error("File is empty or missing data rows.");
        }

        const headers = parsedRows[0].map(h => h.trim().toLowerCase());
        
        // Use flexible matching for headers
        const missing = expectedHeaders.filter(expected => 
          !headers.some(h => h.includes(expected.toLowerCase()))
        );

        if (missing.length > 0 && expectedHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }

        const formattedData = parsedRows.slice(1).map((row) => {
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return obj;
        });

        setData(formattedData.filter(d => Object.values(d).some(v => v !== '')));
        setStep('preview');
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to parse file.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    onImport(data);
    onClose();
    setStep('upload');
    setData([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-black text-xl flex items-center gap-2 text-slate-800 tracking-tight">
              <FileUp className="w-6 h-6 text-indigo-600" />
              Import {title}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Step: {step === 'upload' ? 'Upload File' : 'Data Validation'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          {step === 'upload' ? (
            <div className="text-center space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group relative"
              >
                {isProcessing ? (
                  <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
                ) : (
                  <div className="bg-white w-20 h-20 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <FileUp className="w-10 h-10 text-indigo-600" />
                  </div>
                )}
                <p className="text-xl font-black text-slate-800 tracking-tight">Drop your CSV here</p>
                <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">Upload the listing export. We support multi-column property data and quoted fields.</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".csv,.txt"
                />
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-emerald-100">
                <CheckCircle className="w-5 h-5" />
                Found {data.length} valid property records. Reviewing schema map...
              </div>
              <div className="overflow-x-auto border-2 border-slate-50 rounded-2xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {Object.keys(data[0]).slice(0, 6).map(h => (
                        <th key={h} className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px] border-b">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        {Object.keys(data[0]).slice(0, 6).map(h => (
                          <td key={h} className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase text-center tracking-widest">Showing top 5 of {data.length} rows</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50/50 flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-8 py-3 text-slate-500 hover:text-slate-800 font-black uppercase tracking-widest text-xs"
          >
            Abort
          </button>
          {step === 'preview' && (
            <button 
              onClick={confirmImport}
              className="px-10 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all"
            >
              Commit {data.length} Records
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
