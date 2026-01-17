
import React from 'react';

interface FileUploadProps {
  label: string;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  files: { file: File, preview: string }[];
  multiple?: boolean;
  required?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFilesSelected, onRemoveFile, files, multiple = true, required = false }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
        {label} {required && <span className="text-blue-500">*</span>}
      </label>
      <div className="space-y-4">
        <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group relative overflow-hidden bg-white/50">
          <div className="flex flex-col items-center justify-center py-6 text-center px-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
              <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">Drop {label.toLowerCase()} or click</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">PDF / JPG / PNG</p>
          </div>
          <input type="file" className="hidden" multiple={multiple} onChange={handleChange} accept="image/*,application/pdf" />
        </label>
        
        {files.length > 0 && (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-left-4">
                <img src={f.preview} alt="Preview" className="w-10 h-10 object-cover rounded-lg ring-1 ring-slate-100" />
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{f.file.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{(f.file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button 
                  onClick={() => onRemoveFile(idx)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
