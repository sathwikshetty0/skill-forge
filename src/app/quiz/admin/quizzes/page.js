"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  FileText, 
  Plus,
  BookText,
  Clock,
  TrendingUp,
  MoreVertical,
  X,
  Zap,
  Lock,
  ChevronRight,
  Monitor,
  Play,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", access_code: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mock_session="))
        ?.split("=")[1];
      
      const isMockAdmin = mockSession === "admin";
      
      if (!user && !isMockAdmin) {
        router.push("/login");
        return;
      }

      if (user && !isMockAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (profile?.role !== "admin") {
          router.push("/");
          return;
        }
      }
      
      loadQuizzes();
    }

    checkAuth();
  }, []);

  async function loadQuizzes() {
    const { data } = await supabase
      .from("quizzes")
      .select("*, questions(count)");
    setQuizzes(data || []);
    setLoading(false);
  }

  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const code = newQuiz.access_code.toUpperCase();
    
    const { data, error } = await supabase
      .from("quizzes")
      .insert([
        { 
          title: newQuiz.title, 
          description: newQuiz.description, 
          access_code: code,
          status: 'lobby',
          current_question_index: 0
        }
      ])
      .select();

    if (error) {
      console.error(error);
      setError(error.message);
      setSubmitting(false);
      return;
    }

    setGeneratedCode(code);
    setNewQuiz({ title: "", description: "", access_code: "" });
    setSubmitting(false);
    loadQuizzes();
  };

  return (
    <div className="p-10 space-y-10 flex flex-col min-h-full">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Protocol <span className="text-primary-blue">Management</span>
          </h1>
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] mt-1">Authorized Creation Terminal</p>
        </motion.div>
        
        <button 
          onClick={() => { setIsModalOpen(true); setGeneratedCode(null); }}
          className="bg-primary-blue text-white px-8 py-5 rounded-[22px] font-black text-xs tracking-widest uppercase shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] flex items-center gap-4 hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Initialize Protocol</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {loading ? (
           <div className="col-span-full py-32 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Synchronizing Registry...</p>
           </div>
         ) : quizzes.map((q, i) => (
           <motion.div
             key={q.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.05 }}
             className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group flex flex-col justify-between"
           >
             <div>
               <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-[#F8FAFC] group-hover:bg-blue-50 rounded-2xl flex items-center justify-center text-[#94A3B8] group-hover:text-primary-blue transition-colors">
                     <Zap size={22} />
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black text-primary-blue bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                       {q.access_code}
                     </span>
                  </div>
               </div>

               <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-black text-[#0F172A] leading-tight group-hover:text-primary-blue transition-colors">
                    {q.title || "Untitled Protocol"}
                  </h3>
                  <p className="text-xs font-bold text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {q.description || "No neural description provided for this synchronized protocol."}
                  </p>
               </div>
             </div>

              <div className="flex items-center justify-between pt-6 border-t border-[#F1F5F9]">
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Status</span>
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{q.status || "WAITING"}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => router.push(`/quiz/admin/quizzes/${q.id}`)}
                      className="w-10 h-10 bg-[#F1F5F9] text-[#94A3B8] rounded-xl flex items-center justify-center hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-all"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={async () => {
                        // Reset to lobby before starting session
                        await supabase.from("quizzes").update({ status: 'lobby', current_question_index: 0 }).eq("id", q.id);
                        router.push(`/quiz/host/${q.access_code}`);
                      }}
                      className="w-10 h-10 bg-[#0F172A] text-white rounded-xl flex items-center justify-center hover:bg-primary-blue transition-colors shadow-lg"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-[540px] rounded-[48px] p-12 md:p-14 shadow-2xl relative z-10 space-y-10"
            >
              {!generatedCode ? (
                <>
                  <div className="text-center space-y-2">
                     <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase">Initialize Protocol</h2>
                     <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Configure Neutral Network Template</p>
                  </div>

                  <form onSubmit={handleCreateQuiz} className="space-y-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-6">Protocol Title</label>
                        <input 
                          required
                          value={newQuiz.title}
                          onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                          placeholder="EX: CORE_SYSTEM_V1"
                          className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[28px] py-5 px-8 text-sm font-bold focus:outline-none focus:border-primary-blue transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-6">Encryption Description</label>
                        <textarea 
                          value={newQuiz.description}
                          onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
                          placeholder="Protocol parameters..."
                          className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[28px] py-5 px-8 text-sm font-bold focus:outline-none focus:border-primary-blue transition-all h-32 resize-none"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-6">Protocol Access Key</label>
                        <input 
                          required
                          value={newQuiz.access_code}
                          onChange={(e) => setNewQuiz({...newQuiz, access_code: e.target.value})}
                          placeholder="EX: ALPHA-9"
                          className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[28px] py-5 px-8 text-sm font-bold focus:outline-none focus:border-primary-blue transition-all"
                        />
                     </div>

                     <button 
                       disabled={submitting}
                       className="w-full bg-primary-blue text-white py-6 rounded-[28px] font-black text-xs tracking-[0.4em] uppercase shadow-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4"
                     >
                        {submitting ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Finalize Protocol creation</span>
                            <Zap size={18} fill="currentColor" />
                          </>
                        )}
                     </button>

                     <AnimatePresence>
                       {error && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-center gap-4"
                          >
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                             <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
                          </motion.div>
                       )}
                     </AnimatePresence>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-10 py-6">
                  <div className="space-y-4">
                     <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-emerald-500 w-10 h-10" />
                     </div>
                     <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Access <span className="text-emerald-500">Secured</span></h2>
                     <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Share this axis code with candidates</p>
                  </div>

                  <div className="py-10 bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-[40px] relative overflow-hidden group">
                     <span className="text-6xl font-black text-[#0F172A] tracking-widest select-all relative z-10">{generatedCode}</span>
                     <div className="absolute inset-0 bg-primary-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex gap-4">
                     <button 
                       onClick={() => { setIsModalOpen(false); setGeneratedCode(null); }}
                       className="flex-1 bg-[#0F172A] text-white py-6 rounded-[28px] font-black text-[10px] tracking-[0.4em] uppercase transition-all"
                     >
                        Return to Registry
                     </button>
                     <button 
                       onClick={() => router.push(`/quiz/host/${generatedCode}`)}
                       className="flex-1 bg-primary-blue text-white py-6 rounded-[28px] font-black text-[10px] tracking-[0.4em] uppercase transition-all shadow-xl shadow-blue-200"
                     >
                        Initialize Host
                     </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
