import { useApp } from '../context/AppContext';
import { X, Sparkles, ArrowRight } from 'lucide-react';

export const DemoTourModal: React.FC = () => {
  const { isDemoTourOpen, setDemoTourOpen, selectStudent } = useApp();

  if (!isDemoTourOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-6 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/10 text-slate-950 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              2-Minute Evaluator Tour
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 m-0">
              ShikshaGap Quick Walkthrough
            </h2>
            <p className="text-xs sm:text-sm text-slate-900 mt-1 m-0">
              How AI turns raw test failure into high-impact 15-minute zero-hour remedial action.
            </p>
          </div>
          <button
            onClick={() => setDemoTourOpen(false)}
            className="p-1.5 rounded-lg text-slate-900 hover:bg-slate-950/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div>
              <div className="font-bold text-slate-900">Notice Classroom Overview & Urgent Gaps</div>
              <p className="text-xs text-slate-600 mt-0.5 m-0">
                The top cards spotlight what students are missing right now across Class 5A (e.g. 56% struggle with Multiplication Fluency).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div>
              <div className="font-bold text-slate-900">Explore Ravi Kumar (Demo Case)</div>
              <p className="text-xs text-slate-600 mt-0.5 m-0">
                Ravi scored 38% in Division. Traditional systems re-teach division. ShikshaGap's diagnostic staircase traced the root cause to <b>Multiplication Fluency (Grade 4)</b>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div>
              <div className="font-bold text-slate-900">Review 5-Day Remedial Plan</div>
              <p className="text-xs text-slate-600 mt-0.5 m-0">
                Click "View Diagnostic" on Ravi to see the 5-day daily 15-minute action plan tailored for government school teachers with no extra preparation.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">Zero Child PII • DPDP 2023 Compliant</span>
          <button
            onClick={() => {
              setDemoTourOpen(false);
              selectStudent('stud_ravi');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Open Ravi's Diagnostic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
