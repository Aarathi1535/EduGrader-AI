
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

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-12 no-print">
        <div>
          <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">Evaluation Successful</span>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mt-2">Performance Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button 
            type="button"
            onClick={handlePrint}
            className="bg-white border border-slate-200 text-slate-800 px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all font-bold flex items-center gap-2 shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download PDF Report
          </button>
          <button 
            type="button"
            onClick={onReset}
            className="gradient-bg text-white px-8 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-blue-200 font-bold active:scale-95"
          >
            New Evaluation
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-10 border-b-4 border-slate-900 pb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black text-slate-900 mb-2">EduGrade AI</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Formal Academic Evaluation Report</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{new Date(report.timestamp || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-8 glass-panel p-10 rounded-[40px] shadow-2xl flex flex-col md:flex-row gap-12 items-center border border-slate-100 print:shadow-none print:border-slate-200 print:bg-white">
          <div className="relative w-48 h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" startAngle={90} endAngle={-270} cornerRadius={10} isAnimationActive={false}>
                  {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900">{report.percentage}%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Aggregate</span>
            </div>
          </div>
          <div className="flex-grow w-full">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Student</span><p className="text-xl font-bold text-slate-900 truncate">{report.studentInfo.name}</p></div>
              <div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Roll / ID</span><p className="text-xl font-bold text-slate-900">{report.studentInfo.rollNumber || '-'}</p></div>
              <div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Subject</span><p className="text-xl font-bold text-slate-900">{report.studentInfo.subject}</p></div>
              <div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Score</span><p className="text-xl font-bold text-slate-900">{report.totalScore} / {report.maxScore}</p></div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl flex flex-col justify-center print:bg-white print:text-slate-900 print:border-2 print:border-slate-900 print:shadow-none">
          <h3 className="text-2xl font-bold mb-4">Summary Feedback</h3>
          <p className="text-slate-400 text-lg leading-relaxed font-medium print:text-slate-700 italic">"{report.generalFeedback}"</p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="page-break-before">
        <h3 className="text-3xl font-extrabold text-slate-900 mb-8 px-4">Detailed Itemized Evaluation</h3>
        <div className="space-y-10">
          {report.grades.map((grade, idx) => (
            <div key={idx} className="glass-panel rounded-[32px] border border-slate-100 shadow-xl p-8 print:shadow-none print:border-slate-300 print:bg-white print:page-break-inside-avoid">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="shrink-0">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex flex-col items-center justify-center font-black text-white print:bg-slate-900">
                    <span className="text-[10px] uppercase tracking-tighter opacity-80">No.</span>
                    <span className="text-2xl -mt-1">{grade.questionNumber}</span>
                  </div>
                </div>
                <div className="flex-grow space-y-6 w-full">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h4 className="text-xl font-bold text-slate-800">Scoring Analysis</h4>
                    <span className="px-5 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-black print:bg-white print:border">{grade.marksObtained} / {grade.totalMarks} Marks</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Response</span>
                      <div className="p-5 bg-slate-50 rounded-2xl text-sm italic border print:bg-white">{grade.studentAnswer}</div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ideal Syllabus Answer</span>
                      <div className="p-5 bg-blue-50/20 rounded-2xl text-sm border print:bg-white">{grade.correctAnswer}</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border print:bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                      <span className="text-xs font-black uppercase tracking-widest">Examiner Remarks</span>
                    </div>
                    <p className="text-slate-700 text-sm">{grade.feedback}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden print:block text-center mt-20 border-t pt-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated by EduGrade AI Evaluator</div>
    </div>
  );
};

export default EvaluationReportView;
