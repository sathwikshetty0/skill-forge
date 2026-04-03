"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  BarChart3, 
  BookText, 
  Users2, 
  FileBox, 
  LogOut, 
  Plus, 
  Activity, 
  FileText, 
  LayoutDashboard,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  Trophy,
  History,
  Zap,
  Lock,
  Medal,
  Dna,
  X,
  Clock,
  Target,
  BarChart,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState("user");
  const [submissions, setSubmissions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionLeaderboard, setSessionLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
    if (sessionCookie) {
      setRole(sessionCookie.split('=')[1]);
    }

    async function loadSubmissions() {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Fetch all attended sessions for the candidate
      const { data } = await supabase
        .from("submissions")
        .select("*, quizzes(title, total_questions)")
        .order("submitted_at", { ascending: false });
        
      setSubmissions(data || []);
      setLoading(false);
    }
    loadSubmissions();
  }, []);

  const fetchSessionDetails = async (session) => {
    setDetailsLoading(true);
    setSelectedSession(session);
    
    // Fetch leaderboard for this specific quiz
    const { data } = await supabase
        .from("submissions")
        .select("*, profiles!user_id(full_name)")
        .eq("quiz_id", session.quiz_id)
        .order("total_score", { ascending: false })
        .limit(10);
        
    setSessionLeaderboard(data || []);
    setDetailsLoading(false);
  };

  const isAdmin = role === "admin";

  const stats = [
    { title: "SESSIONS ATTENDED", value: submissions.length, icon: History, color: "text-blue-600" },
    { title: "AVERAGE ACCURACY", value: submissions.length ? `${(submissions.reduce((acc, s) => acc + (s.total_score || 0), 0) / submissions.length / 10 * 100).toFixed(0)}%` : "0%", icon: Target, color: "text-emerald-500" },
    { title: "TOTAL SYNC TIME", value: submissions.length ? `${(submissions.length * 30)}m` : "0m", icon: Clock, color: "text-indigo-600" },
    { title: "GLOBAL RANKING", value: "#14", icon: Trophy, color: "text-amber-500" },
  ];

  if (selectedSession) {
    return (
      <div className="flex h-screen bg-[#F0F2F5] text-[#0F172A] font-sans overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-10 md:p-14 space-y-12 ml-0 lg:ml-[280px]">
           <button 
             onClick={() => setSelectedSession(null)}
             className="flex items-center gap-3 px-6 py-3 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50 transition-all group"
           >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Control Center</span>
           </button>

           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                 <h2 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
                   Session <span className="text-[#2563EB]">Analysis</span>
                 </h2>
                 <p className="text-[12px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">
                   {selectedSession.quizzes?.title || "PROTOCOL_ID_UNDEFINED"}
                 </p>
              </div>
              <div className="flex gap-4">
                 <div className="bg-[#0F172A] text-white px-8 py-4 rounded-2xl flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Time Sync</span>
                    <span className="text-xl font-black">{selectedSession.time_taken || "24:12"}s</span>
                 </div>
                 <div className="bg-white border border-[#E2E8F0] px-8 py-4 rounded-2xl flex flex-col items-center shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8] mb-1">Total Score</span>
                    <span className="text-xl font-black text-[#2563EB]">{selectedSession.total_score}</span>
                 </div>
              </div>
           </div>

           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-6">
                 <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563EB]">
                    <BarChart size={24} />
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 leading-none">Intelligence Accuracy</h4>
                    <p className="text-4xl font-black text-[#0F172A]">
                      {((selectedSession.total_score / (selectedSession.quizzes?.total_questions || 10)) * 10).toFixed(0)}%
                    </p>
                    <div className="mt-4 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${(selectedSession.total_score / (selectedSession.quizzes?.total_questions || 10)) * 100}%` }} className="h-full bg-[#2563EB]" />
                    </div>
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-6">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                    <BookText size={24} />
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 leading-none">Data Points Resolved</h4>
                    <p className="text-4xl font-black text-[#0F172A]">
                      {selectedSession.total_score} <span className="text-xl text-[#94A3B8]">/ {selectedSession.quizzes?.total_questions || 10}</span>
                    </p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">{selectedSession.flagged ? "ANOMALY DETECTED" : "INTEGRITY VERIFIED"}</p>
                 </div>
              </div>

              <div className="bg-[#0F172A] p-10 rounded-[40px] shadow-2xl text-white space-y-6 overflow-hidden relative">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Trophy size={24} className="text-amber-400" />
                 </div>
                 <div className="relative z-10">
                    <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">Session Rank</h4>
                    <p className="text-4xl font-black">TOP 42%</p>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-4">ELITE CANDIDATE BRACKET</p>
                 </div>
                 <Shield size={120} className="absolute -bottom-8 -right-8 text-white/5" />
              </div>
           </div>

           {/* Protocol Leaderboard */}
           <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm p-10 md:p-14">
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                       <Medal size={24} className="text-amber-500" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0F172A]">Protocol Leaderboard</h3>
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Global Session Rankings</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 {detailsLoading ? (
                    <div className="flex flex-col gap-6">
                       {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-50 rounded-[32px] animate-pulse" />)}
                    </div>
                 ) : sessionLeaderboard.map((u, i) => (
                    <motion.div 
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center justify-between p-8 rounded-[36px] bg-white border border-[#E2E8F0] transition-all hover:shadow-2xl hover:shadow-blue-900/5 group ${i === 0 ? "border-[#F59E0B]/20 bg-amber-50/20" : ""}`}
                    >
                       <div className="flex items-center gap-8">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${
                            i === 0 ? "bg-amber-50 text-amber-500 border-amber-300" :
                            i === 1 ? "bg-slate-50 text-slate-500 border-slate-300" :
                            i === 2 ? "bg-orange-50 text-orange-600 border-orange-300" :
                            "bg-white text-gray-400 border-gray-100"
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                             <h5 className="font-extrabold text-[#0F172A] uppercase tracking-tight group-hover:text-[#2563EB] transition-colors">{u.profiles?.full_name || "Unknown Entity"}</h5>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Authorized Node</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-12">
                          <div className="text-right hidden sm:block">
                             <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Time</p>
                             <p className="text-xs font-black text-[#0F172A]">{u.time_taken || "24:12"}s</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Points</p>
                             <p className="text-2xl font-black text-[#0F172A]">{u.total_score}</p>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-[#0F172A] font-sans selection:bg-blue-100 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-10 md:p-14 ml-0 lg:ml-[280px]">
        <header className="flex justify-between items-start mb-12 w-full">
          <div className="space-y-1">
            <h2 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
              CONTROL <span className="text-[#2563EB]">CENTER</span>
            </h2>
            <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">
              Authorized Station Analysis Protocol
            </p>
          </div>

          {(role === "admin" || role === "evaluator") && (
            <button 
              onClick={() => router.push('/quiz')}
              className="bg-[#2563EB] text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-4 shadow-[0_15px_40px_rgba(37,99,235,0.3)] hover:bg-[#1E40AF] transition-all active:scale-[0.98] group"
            >
              <Zap size={20} className="group-hover:translate-x-1.5 transition-transform" />
              <span>Initialize Session</span>
            </button>
          )}
        </header>

        <section className="space-y-12">
          {/* Core Telemetry Grid - Primary Display */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[32px] p-8 border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/20 transition-all group overflow-hidden relative"
              >
                <div className="relative z-10 space-y-4">
                  <div className={`p-3 w-fit rounded-xl bg-[#F8FAFC] ${stat.color}`}>
                    <stat.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-[#0F172A] mb-1">{stat.value}</p>
                    <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest leading-none">{stat.title}</p>
                  </div>
                </div>
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-[0.03] -mr-8 -mt-8 ${stat.color.replace('text-', 'bg-')}`} />
              </motion.div>
            ))}
          </div>

          {/* Attended Sessions - Logs Display */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F1F5F9] rounded-2xl">
                   <History size={24} className="text-[#0F172A]" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-[#0F172A]">Synchronized Sessions</h3>
              </div>
              <span className="bg-blue-50 text-[#2563EB] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                {submissions.length} Total Logs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {loading ? (
                 [1,2,3,4].map(i => <div key={i} className="h-64 bg-white rounded-[40px] border animate-pulse" />)
               ) : submissions.length === 0 ? (
                 <div className="col-span-full py-20 bg-white rounded-[48px] border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center text-center">
                    <BookText size={48} className="text-[#94A3B8] mb-6" />
                    <p className="text-base font-black text-[#0F172A] uppercase tracking-widest mb-2">No Protocol Logs Found</p>
                    <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Initialize a session to synchronize data nodes.</p>
                 </div>
               ) : submissions.map((s, idx) => (
                 <motion.div
                   key={s.id}
                   whileHover={{ y: -10 }}
                   onClick={() => fetchSessionDetails(s)}
                   className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all cursor-pointer group flex flex-col justify-between h-72 border-b-8 border-b-[#F1F5F9] hover:border-b-[#2563EB]"
                 >
                    <div className="space-y-4">
                       <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-[#F8FAFC] group-hover:bg-[#F0F7FF] rounded-2xl flex items-center justify-center text-[#94A3B8] group-hover:text-[#2563EB] transition-colors shadow-inner">
                             <Dna size={22} />
                          </div>
                          <span className="text-[9px] font-black text-[#94A3B8] group-hover:text-[#2563EB] leading-none pt-1">#{s.id.slice(0, 8)}</span>
                       </div>
                       <h4 className="font-extrabold text-[#0F172A] text-lg leading-tight group-hover:text-[#2563EB] transition-colors">{s.quizzes?.title || "PROTOCOL_ANALYSIS"}</h4>
                    </div>

                    <div className="space-y-3 pt-6">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-[#94A3B8]">Intelligence Match</span>
                          <span className={`${s.total_score >= 8 ? "text-emerald-500" : "text-amber-500"}`}>{(s.total_score / 10 * 100).toFixed(0)}%</span>
                       </div>
                       <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                          <div className={`h-full ${s.total_score >= 8 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${(s.total_score / 10 * 100)}%` }} />
                       </div>
                       <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                             <Clock size={12} className="text-[#94A3B8]" />
                             <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest">{s.time_taken || 240}s SYNC</span>
                          </div>
                          <ArrowRight size={18} className="text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                 </motion.div>
               ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
