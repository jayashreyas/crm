
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error("CSV is empty or missing data rows.");
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const missing = expectedHeaders.filter(eh => !headers.includes(eh.toLowerCase()));

        if (missing.length > 0) {
          throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }

        const rows = lines.slice(1).map((line, idx) => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = values[i]?.trim();
          });
          return obj;
        });

        setData(rows);
        setStep('preview');
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV file.");
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileUp className="w-5 h-5 text-indigo-600" />
            Import {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {step === 'upload' ? (
            <div className="text-center space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-12 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
              >
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                ) : (
                  <FileUp className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 mx-auto mb-4" />
                )}
                <p className="text-slate-600 font-medium">Click to upload or drag and drop</p>
                <p className="text-slate-400 text-sm">CSV files only. Must include: {expectedHeaders.join(', ')}</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".csv"
                />
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Validated {data.length} rows. Previewing the first 5 records.
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {expectedHeaders.map(h => (
                        <th key={h} className="px-4 py-2 text-left font-medium text-slate-500 border-b capitalize">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        {expectedHeaders.map(h => (
                          <td key={h} className="px-4 py-2 text-slate-600 whitespace-nowrap">{row[h.toLowerCase()]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
          {step === 'preview' && (
            <button 
              onClick={confirmImport}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all"
            >
              Import Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
