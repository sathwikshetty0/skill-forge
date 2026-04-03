"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  BookText, 
  Zap, 
  AlertCircle,
  Settings,
  Target,
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function QuizConfigurePage({ params }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ content: "", correct_answer: "" });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    // Fetch Quiz Details
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single();
    setQuiz(quizData);

    // Fetch Questions
    const { data: questionData } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", id)
      .order("order_index", { ascending: true });
    setQuestions(questionData || []);
    setLoading(false);
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.content.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("questions")
      .insert([
        { 
          quiz_id: id, 
          content: newQuestion.content, 
          correct_answer: newQuestion.correct_answer,
          order_index: questions.length 
        }
      ]);

    if (!error) {
      setNewQuestion({ content: "", correct_answer: "" });
      loadData();
    }
    setSubmitting(false);
  };

  const handleDeleteQuestion = async (qId) => {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", qId);
    
    if (!error) loadData();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-black">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-[240px] p-6 md:p-14 space-y-10 min-h-screen flex flex-col">
         {/* Breadcrumbs */}
         <button 
           onClick={() => router.push("/quiz/admin/quizzes")}
           className="flex items-center gap-2 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] hover:text-[#2563EB] transition-colors w-fit"
         >
            <ChevronLeft size={14} />
            <span>Back to Protocols</span>
         </button>

         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <header className="space-y-1">
               <h1 className="text-4xl font-extrabold text-[#0F172A] tracking-tighter uppercase leading-none">
                  Configure <span className="text-[#2563EB]">Intelligence</span>
               </h1>
               <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">
                  {quiz?.title} • Session Protocol Analysis
               </p>
            </header>

            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-[#E2E8F0] shadow-sm">
               <Hash size={14} className="text-[#2563EB]" />
               <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest leading-none">
                  {questions.length} Nodes Registered
               </span>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Question Entry Form */}
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm p-10 space-y-10 sticky top-10">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 rounded-2xl">
                        <Plus className="text-[#2563EB]" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Inject Node</h3>
                        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Register a new intelligence challenge</p>
                     </div>
                  </div>

                  <form onSubmit={handleCreateQuestion} className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Challenge Content</label>
                        <textarea 
                          required
                          value={newQuestion.content}
                          onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                          placeholder="Enter the technical challenge or question..."
                          className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[32px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all min-h-[160px] resize-none"
                        />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Response Key</label>
                        <div className="relative">
                           <Target size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                           <input 
                             required
                             value={newQuestion.correct_answer}
                             onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                             placeholder="Correct authentication value..."
                             className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[32px] py-5 pl-14 pr-8 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all"
                           />
                        </div>
                     </div>

                     <button 
                       disabled={submitting}
                       className="w-full bg-[#0F172A] text-white py-6 rounded-[32px] font-black text-[11px] tracking-[0.4em] uppercase shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
                     >
                        {submitting ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Authorize Challenge</span>
                            <Zap size={18} fill="currentColor" className="text-blue-400 group-hover:rotate-12 transition-transform" />
                          </>
                        )}
                     </button>
                  </form>
               </div>
            </div>

            {/* Questions List */}
            <div className="lg:col-span-7 space-y-6">
               <div className="flex items-center gap-4 mb-4">
                  <BookText size={18} className="text-[#2563EB]" />
                  <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Protocol Stack</h3>
               </div>

               <AnimatePresence mode="popLayout">
                  {questions.length > 0 ? (
                    questions.map((q, idx) => (
                      <motion.div 
                        key={q.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-[32px] border border-[#E2E8F0] p-8 flex items-start justify-between gap-6 hover:shadow-xl transition-all group"
                      >
                         <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center border border-[#E2E8F0] flex-shrink-0">
                               <span className="text-xs font-black text-[#2563EB]">{idx + 1}</span>
                            </div>
                            <div className="space-y-4">
                               <p className="text-sm font-bold text-[#0F172A] leading-relaxed italic border-l-4 border-blue-500 pl-4">
                                  "{q.content}"
                                </p>
                               <div className="flex items-center gap-4">
                                  <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                                     <Target size={10} className="text-emerald-500" />
                                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{q.correct_answer}</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleDeleteQuestion(q.id)}
                           className="p-3 text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 size={18} />
                         </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-20 bg-white/50 border-2 border-dashed border-[#E2E8F0] rounded-[40px] flex flex-col items-center justify-center space-y-6 text-center">
                       <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-sm">
                          <AlertCircle className="w-10 h-10 text-[#CBD5E1]" />
                       </div>
                       <div className="max-w-[280px]">
                          <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-tighter mb-2">Network Void</h4>
                          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest leading-relaxed"> No technical challenges have been registered for this protocol protocol node.</p>
                       </div>
                    </div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </main>
    </div>
  );
}
