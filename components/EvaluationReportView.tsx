
import React from 'react';
import { EvaluationReport } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface EvaluationReportViewProps {
  report: EvaluationReport;
  onReset: () => void;
}

const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({ report, onReset }) => {
  const chartData = [
    { name: 'Obtained', value: report.totalScore },
    { name: 'Remaining', value: Math.max(0, report.maxScore - report.totalScore) },
  ];

  const barData = report.grades.map(g => ({
    name: `Q${g.questionNumber}`,
    score: g.marksObtained,
    total: g.totalMarks
  }));

  const COLORS = ['#2563eb', '#f1f5f9'];

  // This function triggers the system print dialog which allows users to "Save as PDF"
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* Action Buttons (Hidden in Print) */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-12 no-print">
        <div>
          <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">Evaluation Complete</span>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mt-2">Performance Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button 
            type="button"
            onClick={handleDownloadPDF}
            className="bg-white border border-slate-200 text-slate-800 px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all font-bold flex items-center gap-2 shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Download PDF Report
          </button>
          <button 
            type="button"
            onClick={onReset}
            className="gradient-bg text-white px-8 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-blue-200 font-bold active:scale-95"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Official PDF Header (Visible ONLY in Print) */}
      <div className="hidden print:block mb-10 border-b-4 border-slate-900 pb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black text-slate-900 mb-2">EduGrade AI</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Official Academic Transcript & Performance Analysis</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Reference ID: {report.id?.substring(0,8).toUpperCase()}</p>
            <p className="text-lg font-bold text-slate-900">{new Date(report.timestamp || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-8 glass-panel p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row gap-12 items-center border border-slate-100 print:shadow-none print:border-slate-300 print:bg-white">
          <div className="relative w-48 h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  cornerRadius={10}
                  isAnimationActive={false}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900">{report.percentage}%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Aggregate</span>
            </div>
          </div>

          <div className="flex-grow w-full">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Student Name</span>
                <p className="text-xl font-bold text-slate-900 truncate">{report.studentInfo.name || 'Anonymous'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Roll / ID</span>
                <p className="text-xl font-bold text-slate-900">{report.studentInfo.rollNumber || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Subject</span>
                <p className="text-xl font-bold text-slate-900">{report.studentInfo.subject || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Net Score</span>
                <p className="text-xl font-bold text-slate-900">{report.totalScore} <span className="text-slate-300">/ {report.maxScore}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl flex flex-col justify-center print:bg-white print:text-slate-900 print:border-2 print:border-slate-900 print:shadow-none">
          <h3 className="text-2xl font-bold mb-4">Summary Feedback</h3>
          <p className="text-slate-400 text-lg leading-relaxed font-medium print:text-slate-700 italic">
            "{report.generalFeedback}"
          </p>
        </div>
      </div>

      {/* Visual Bar Chart Dashboard */}
      <div className="mb-12 no-print">
        <h3 className="text-2xl font-extrabold text-slate-800 mb-6">Question-wise Analysis</h3>
        <div className="glass-panel p-8 rounded-[32px] border border-slate-100 h-[320px] bg-white shadow-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
              />
              <Bar dataKey="score" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={44} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Step-by-Step Breakdown */}
      <div className="page-break-before">
        <div className="flex items-center justify-between mb-8 px-4">
          <h3 className="text-3xl font-extrabold text-slate-900">Detailed Grading Breakdown</h3>
          <div className="hidden print:block text-xs font-bold text-slate-400 uppercase tracking-widest">
            Page 2: Itemized Evaluation
          </div>
        </div>
        
        <div className="space-y-10">
          {report.grades.map((grade, idx) => (
            <div key={idx} className="glass-panel rounded-[32px] overflow-hidden border border-slate-100 shadow-xl p-8 hover:border-blue-200 transition-all print:shadow-none print:border-slate-300 print:rounded-[24px] print:bg-white print:page-break-inside-avoid">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="shrink-0">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-lg shadow-blue-100 print:bg-slate-900 print:shadow-none">
                    <span className="text-[10px] uppercase tracking-tighter opacity-80">No.</span>
                    <span className="text-2xl -mt-1">{grade.questionNumber}</span>
                  </div>
                </div>
                
                <div className="flex-grow space-y-8 w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 pb-5 print:border-slate-200">
                    <h4 className="text-xl font-bold text-slate-800">Scoring Analysis</h4>
                    <div className="flex items-center gap-4 mt-3 sm:mt-0">
                      <div className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-full text-sm font-black print:border print:border-slate-200 print:text-slate-900 print:bg-white">
                        Marks: {grade.marksObtained} / {grade.totalMarks}
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full ring-4 ring-white shadow-sm ${grade.marksObtained / grade.totalMarks >= 0.8 ? 'bg-green-500' : grade.marksObtained / grade.totalMarks >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Student Answer</span>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl text-slate-800 text-sm leading-relaxed border border-slate-100 print:bg-white print:border-slate-200 min-h-[140px] italic">
                        {grade.studentAnswer || "No content extracted."}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">Ideal Solution (Strict Syllabus)</span>
                      </div>
                      <div className="p-6 bg-blue-50/20 rounded-2xl text-slate-800 text-sm leading-relaxed border border-blue-100/20 print:bg-white print:border-slate-200 min-h-[140px] font-medium">
                        {grade.correctAnswer || "Refer to standard curriculum."}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/5 border border-slate-100 p-8 rounded-[24px] print:bg-white print:border-slate-300 relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white print:bg-slate-900">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.464 16.364a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414z"></path></svg>
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Examiner's Critique</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium pl-11">
                      {grade.feedback}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Official PDF Footer */}
      <div className="hidden print:block text-center mt-20 border-t-2 border-slate-100 pt-10 pb-10">
         <p className="text-2xl font-black text-slate-900">EduGrade AI Evaluator</p>
         <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic">
           Automated Integrity Verification Engine • Built on Gemini Pro Vision
         </p>
      </div>
    </div>
  );
};

export default EvaluationReportView;
