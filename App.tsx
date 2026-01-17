
import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import EvaluationReportView from './components/EvaluationReportView';
import { UploadedFile, EvaluationReport } from './types';
import { evaluateAnswerSheet } from './services/geminiService';

const MAX_FILE_SIZE_MB = 4;

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'upload' | 'report'>('dashboard');
  const [history, setHistory] = useState<EvaluationReport[]>([]);
  const [qpFiles, setQpFiles] = useState<UploadedFile[]>([]);
  const [keyFiles, setKeyFiles] = useState<UploadedFile[]>([]);
  const [studentFiles, setStudentFiles] = useState<UploadedFile[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('edugrade_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (newReport: EvaluationReport) => {
    const updated = [newReport, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('edugrade_history', JSON.stringify(updated));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileSelection = (type: 'qp' | 'key' | 'student') => async (files: File[]) => {
    setError(null);
    const validFiles = files.filter(f => {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${f.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const uploaded = await Promise.all(validFiles.map(async (file) => ({
      file,
      preview: await fileToBase64(file)
    })));

    if (type === 'qp') setQpFiles(prev => [...prev, ...uploaded]);
    if (type === 'key') setKeyFiles(prev => [...prev, ...uploaded]);
    if (type === 'student') setStudentFiles(prev => [...prev, ...uploaded]);
  };

  const handleRemoveFile = (type: 'qp' | 'key' | 'student', index: number) => {
    if (type === 'qp') setQpFiles(prev => prev.filter((_, i) => i !== index));
    if (type === 'key') setKeyFiles(prev => prev.filter((_, i) => i !== index));
    if (type === 'student') setStudentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runEvaluation = async () => {
    if (qpFiles.length === 0 || studentFiles.length === 0) {
      setError("Please provide a question paper and at least one answer sheet.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await evaluateAnswerSheet(
        qpFiles.map(f => f.preview),
        keyFiles.map(f => f.preview),
        studentFiles.map(f => f.preview)
      );
      
      const reportWithId = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };

      setReport(reportWithId);
      saveToHistory(reportWithId);
      setView('report');
    } catch (err: any) {
      setError(err.message || "Evaluation failed. Please check your image quality.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setQpFiles([]);
    setKeyFiles([]);
    setStudentFiles([]);
    setReport(null);
    setError(null);
    setView('upload');
  };

  const viewHistoryItem = (item: EvaluationReport) => {
    setReport(item);
    setView('report');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('edugrade_history', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <nav className="border-b border-slate-100 px-8 py-5 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50 no-print">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">E</div>
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight">EduGrade <span className="text-blue-600">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('dashboard')}
            className={`text-sm font-bold transition-colors ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={reset}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${view === 'upload' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            + New Evaluation
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {view === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h1>
                <p className="text-slate-500 font-medium">Manage your evaluations and track student progress.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center min-w-[120px]">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-2xl font-black text-slate-800">{history.length}</p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center min-w-[120px]">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Score</p>
                  <p className="text-2xl font-black text-blue-600">
                    {history.length ? Math.round(history.reduce((acc, curr) => acc + curr.percentage, 0) / history.length) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Evaluations</h2>
            
            {history.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No evaluations yet</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">Upload your first set of answer sheets to see them appear here.</p>
                <button 
                  onClick={reset}
                  className="gradient-bg text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                >
                  Start First Evaluation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => viewHistoryItem(item)}
                    className="group bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-lg">
                        {item.percentage}%
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1 truncate">{item.studentInfo.name}</h4>
                    <p className="text-slate-400 text-sm font-medium mb-4">{item.studentInfo.subject || 'General'}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      <span className="text-blue-600">View Report →</span>
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-100/50 transition-colors"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'report' && report && (
          <EvaluationReportView report={report} onReset={reset} />
        )}

        {view === 'upload' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="mb-10 flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Configure Evaluation</h2>
                <p className="text-slate-500 font-medium">Upload the source materials and student work.</p>
              </div>
              <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-800 font-bold text-sm">Cancel</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload 
                    label="Question Paper" 
                    required 
                    files={qpFiles} 
                    onFilesSelected={handleFileSelection('qp')} 
                    onRemoveFile={(idx) => handleRemoveFile('qp', idx)}
                  />
                  <FileUpload 
                    label="Answer Key (Optional)" 
                    files={keyFiles} 
                    onFilesSelected={handleFileSelection('key')} 
                    onRemoveFile={(idx) => handleRemoveFile('key', idx)}
                  />
                </div>
                <FileUpload 
                  label="Student Answer Sheets" 
                  required 
                  files={studentFiles} 
                  onFilesSelected={handleFileSelection('student')} 
                  onRemoveFile={(idx) => handleRemoveFile('student', idx)}
                />
                {error && (
                  <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-4 animate-shake">
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    {error}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-8 rounded-[32px] border border-slate-200 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Evaluation Summary</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-400">Question Paper</span>
                      <span className={qpFiles.length > 0 ? "text-green-600" : "text-slate-300"}>{qpFiles.length > 0 ? `${qpFiles.length} Pages` : "Pending"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-400">Student Sheets</span>
                      <span className={studentFiles.length > 0 ? "text-green-600" : "text-slate-300"}>{studentFiles.length > 0 ? `${studentFiles.length} Pages` : "Pending"}</span>
                    </div>
                  </div>

                  <button
                    onClick={runEvaluation}
                    disabled={isLoading || qpFiles.length === 0 || studentFiles.length === 0}
                    className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${isLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'gradient-bg text-white hover:shadow-2xl hover:shadow-blue-200 active:scale-95'}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Evaluating...
                      </>
                    ) : "Generate Report"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
