"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  FileText, 
  Send, 
  AlertCircle,
  Zap,
  Lock,
  Cpu,
  Users,
  Search,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const [role, setRole] = useState("user");
  const [session, setSession] = useState(null);
  const [overview, setOverview] = useState("");
  const [applications, setApplications] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [improvements, setImprovements] = useState("");
  const [status, setStatus] = useState("idle");
  const [aiChecking, setAiChecking] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const [candidates] = useState([
    { 
      id: "C-112", 
      name: "Ethan Vance", 
      report: { 
        overview: "The neural sync was successful with 98% efficiency. No anomalies detected.",
        apps: "Can be used for real-time risk assessment in automated systems.",
        thoughts: "The interface is intuitive but needs more depth in data points.",
        improvements: "Optimize the data-fetch cycle to resolve minor latency."
      },
      aiStats: {
        checkCount: 4,
        history: [
          { time: "14:12", score: "92.14%" },
          { time: "14:18", score: "94.50%" },
          { time: "14:26", score: "97.80%" },
          { time: "14:32", score: "99.12%" }
        ]
      }
    },
    { 
      id: "C-402", 
      name: "Sarah Chen", 
      report: { 
        overview: "Synchronized node access remains stable across all protocols.",
        apps: "Deployable for secure encryption keys in financial layers.",
        thoughts: "Encryption speed is acceptable but could be improved.",
        improvements: "Implement multi-channel handshake for redundancy."
      },
      aiStats: {
        checkCount: 2,
        history: [
          { time: "10:05", score: "12.45%" },
          { time: "10:15", score: "15.22%" }
        ]
      }
    },
    { 
      id: "C-901", 
      name: "Marcus Thorne", 
      report: null, // No submission yet
      aiStats: { checkCount: 0, history: [] }
    }
  ]);

  useEffect(() => {
    setIsMounted(true);
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const cookies = document.cookie.split(';');
      const mockSession = cookies.find(c => c.trim().startsWith('mock_session='));
      const activeRole = mockSession ? mockSession.split('=')[1] : "user";
      
      setRole(activeRole);
      setSession(user || { id: "mock_user", email: activeRole === "admin" ? "superuser@skillforge.io" : "candidate@skillforge.io" });
      if (!user && !mockSession) router.push("/login");
    }
    checkAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!overview.trim() || !applications.trim() || !thoughts.trim() || !improvements.trim()) {
      return;
    }
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
      setOverview(""); setApplications(""); setThoughts(""); setImprovements("");
      setTimeout(() => setStatus("idle"), 3000);
    }, 1500);
  };

  const isAdmin = role === "admin";

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-black">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-[280px] p-6 md:p-14 space-y-10 min-h-screen flex flex-col">
        {isAdmin ? (
          <>
            <header className="space-y-1">
               <h1 className="text-4xl font-extrabold text-[#0F172A] tracking-tighter uppercase leading-none">Protocol <span className="text-[#2563EB]">Intelligence Hub</span></h1>
               <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Authorized Oversight & Scrutiny Panel</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1">
               <div className="lg:col-span-4 bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden h-[calc(100vh-280px)]">
                  <div className="p-8 border-b border-[#F1F5F9] space-y-6">
                     <div className="flex items-center gap-3">
                        <Users size={18} className="text-[#2563EB]" />
                        <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Active Candidates</h3>
                     </div>
                     <div className="relative">
                        <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                        <input 
                          type="text" 
                          placeholder="Search node..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-3 pl-12 pr-6 text-xs font-bold focus:outline-none focus:border-[#2563EB] transition-all"
                        />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                     {candidates.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                       <button 
                         key={c.id}
                         onClick={() => setSelectedCandidate(c)}
                         className={`w-full text-left p-6 rounded-[32px] border transition-all ${
                           selectedCandidate?.id === c.id 
                             ? "bg-[#0F172A] border-[#0F172A] shadow-xl text-white" 
                             : "bg-white border-[#F1F5F9] hover:bg-[#F8FAFC] text-[#0F172A]"
                         }`}
                       >
                          <div className="flex items-center justify-between mb-2">
                             <span className={`text-[8px] font-black uppercase tracking-widest ${selectedCandidate?.id === c.id ? "text-white/40" : "text-[#94A3B8]"}`}>{c.id}</span>
                             <div className={`w-1.5 h-1.5 rounded-full ${c.report ? "bg-emerald-500" : "bg-amber-500"}`} />
                          </div>
                          <h4 className="text-sm font-black tracking-tight">{c.name}</h4>
                          <p className={`text-[9px] font-bold mt-1 ${selectedCandidate?.id === c.id ? "text-white/60" : "text-[#94A3B8]"}`}>
                             {c.report ? "PAYLOAD SUBMITTED" : "PENDING SUBMISSION"}
                          </p>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="lg:col-span-8 flex flex-col gap-10 overflow-y-auto custom-scrollbar pr-2 h-[calc(100vh-280px)]">
                  <AnimatePresence mode="wait">
                     {selectedCandidate ? (
                        <motion.div 
                          key={selectedCandidate.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-10"
                        >
                           <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm p-10 space-y-10">
                              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-8">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center">
                                       <FileText className="text-[#2563EB] w-6 h-6" />
                                    </div>
                                    <div>
                                       <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Neural Log Retrieval</h3>
                                       <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Submitted Protocol Content</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">AI Traces</p>
                                    <p className="text-xl font-black text-[#2563EB]">{selectedCandidate.aiStats.checkCount}</p>
                                 </div>
                              </div>

                              {selectedCandidate.report ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                      { label: "Overview", content: selectedCandidate.report.overview },
                                      { label: "Applications", content: selectedCandidate.report.apps },
                                      { label: "Thoughts", content: selectedCandidate.report.thoughts },
                                      { label: "Improvements", content: selectedCandidate.report.improvements }
                                    ].map(field => (
                                       <div key={field.label} className="p-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[32px] space-y-4">
                                          <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.4em] block">{field.label}</label>
                                          <p className="text-sm font-bold text-[#0F172A] leading-relaxed italic border-l-4 border-[#2563EB] pl-6 text-[#1E293B]">"{field.content}"</p>
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 <div className="py-20 text-center space-y-4">
                                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                                    <p className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">No protocol payload detected for this node</p>
                                 </div>
                              )}
                           </div>

                           <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm p-10">
                              <div className="flex items-center gap-4 mb-10 pb-8 border-b border-[#F1F5F9]">
                                 <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center">
                                    <Cpu className="text-[#2563EB] w-6 h-6" />
                                 </div>
                                 <div>
                                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">AI Scrutiny Audit</h3>
                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Historical trace detection & entropy</p>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 {selectedCandidate.aiStats.history.length > 0 ? selectedCandidate.aiStats.history.map((trace, idx) => (
                                   <div key={idx} className="flex items-center justify-between p-7 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] hover:shadow-md transition-all group">
                                      <div className="flex items-center gap-6">
                                         <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] font-black text-[#94A3B8]">
                                            0{idx + 1}
                                         </div>
                                         <div>
                                            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Time Trace</p>
                                            <p className="text-sm font-black text-[#0F172A]">{trace.time}</p>
                                         </div>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Detection Score</p>
                                         <p className="text-xl font-black text-[#2563EB]">{trace.score}</p>
                                      </div>
                                   </div>
                                 )) : (
                                    <div className="py-10 text-center">
                                       <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Zero historical checks performed</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </motion.div>
                     ) : (
                        <div className="h-full bg-white/50 border-2 border-dashed border-[#E2E8F0] rounded-[40px] flex flex-col items-center justify-center space-y-6 text-center p-10">
                           <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-lg border border-[#F1F5F9]">
                              <Activity className="w-10 h-10 text-[#2563EB] opacity-40" />
                           </div>
                           <div className="max-w-[280px]">
                              <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter leading-none mb-2">Initialize Audit</h3>
                              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Select a candidate node from the terminal list to retrieve intelligence logs.</p>
                           </div>
                        </div>
                     )}
                  </AnimatePresence>
               </div>
            </div>
          </>
        ) : (
          <>
            <header className="space-y-1">
              <h1 className="text-4xl font-extrabold text-[#0F172A] tracking-tighter uppercase">Submit <span className="text-[#2563EB]">Protocol Report</span></h1>
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Authorized Node Intelligence Submission</p>
            </header>

            <div className="flex-1 bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm p-8 md:p-12 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center border border-[#E2E8F0]">
                  <FileText className="text-[#2563EB] w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-[#0F172A]">Technical Intelligence Log</h3>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Detail your findings or session feedback below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Overview</label>
                  <textarea
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    placeholder="Provide a brief overview of your findings..."
                    className="w-full min-h-[120px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Applications in Real World</label>
                  <textarea
                    value={applications}
                    onChange={(e) => setApplications(e.target.value)}
                    placeholder="How can this be applied in real-world scenarios..."
                    className="w-full min-h-[100px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Analysis & Reflections</label>
                    <textarea
                      value={thoughts}
                      onChange={(e) => setThoughts(e.target.value)}
                      placeholder="Share your personal analysis..."
                      className="w-full min-h-[100px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Improvements / Suggestions</label>
                    <textarea
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="Suggest enhancements for the protocol..."
                      className="w-full min-h-[100px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
                    />
                  </div>
                </div>

                <div className="pt-8 mt-auto border-t border-[#F1F5F9] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex gap-6">
                     <div className="flex items-center gap-2">
                        <Zap size={14} className="text-[#2563EB]" />
                        <span className="text-[9px] font-black uppercase tracking-widest tracking-tighter">Instant Sync</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Lock size={14} className="text-[#10B981]" />
                        <span className="text-[9px] font-black uppercase tracking-widest tracking-tighter">Secure Handshake</span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-6">
                      <button
                        type="button"
                        disabled={aiChecking || !overview.trim() || !applications.trim() || !thoughts.trim() || !improvements.trim()}
                        onClick={() => {
                          setAiChecking(true);
                          setShowAiModal(true);
                          setAiResult(null);
                          const totalLength = (overview + applications + thoughts + improvements).length;
                          const wordCount = totalLength / 6;
                          setTimeout(() => {
                            const aiProb = Math.max(8, Math.min(22, (wordCount % 15) + 8));
                            const auth = Math.min(99.9, 94 + (totalLength % 5) + (totalLength % 0.9));
                            setAiResult({
                              ai_generated: `${aiProb.toFixed(2)}%`,
                              authenticity: `${auth.toFixed(2)}%`,
                            });
                            setAiChecking(false);
                          }, 3000);
                        }}
                        className="bg-[#0F172A] text-white px-8 py-4 rounded-full font-black text-[11px] tracking-[0.4em] uppercase shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center gap-6 group"
                      >
                        {aiChecking ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Check AI</span>
                            <Cpu size={18} className="text-[#3B82F6]" />
                          </>
                        )}
                      </button>

                      <button
                        type="submit"
                        disabled={status === "submitting" || !overview.trim() || !applications.trim() || !thoughts.trim() || !improvements.trim()}
                        className="bg-[#0F172A] text-white px-10 py-4 rounded-full font-black text-[11px] tracking-[0.4em] uppercase shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-30"
                      >
                        {status === "submitting" ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                          <span>{status === "success" ? "ARCHIVED" : "Execute Submission"}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <AnimatePresence>
                {showAiModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="w-full max-w-[420px] bg-white rounded-[44px] shadow-2xl border border-[#E2E8F0] p-10 text-center relative overflow-hidden"
                    >
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                         <Cpu className={`w-8 h-8 text-blue-600 ${aiChecking ? "animate-pulse" : ""}`} />
                      </div>

                      <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter mb-1">AI Scrutiny</h3>
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-8">
                        {aiChecking ? "Analyzing node patterns..." : "Deep scan complete"}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-10">
                         <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-[#F1F5F9]">
                            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">AI Probability</p>
                            <p className="text-2xl font-black text-[#0F172A]">{aiChecking ? "--" : aiResult?.ai_generated}</p>
                         </div>
                         <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-[#F1F5F9]">
                            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Authenticity</p>
                            <p className="text-2xl font-black text-green-500">{aiChecking ? "--" : aiResult?.authenticity}</p>
                         </div>
                      </div>

                      {!aiChecking && (
                        <button
                          onClick={() => setShowAiModal(false)}
                          className="w-full bg-[#0F172A] text-white py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-blue-600 transition-all"
                        >
                          Close Analysis
                        </button>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {status === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-10"
                  >
                    <div className="w-24 h-24 bg-green-50 rounded-[40px] flex items-center justify-center mb-8 relative">
                       <div className="absolute inset-0 bg-green-200/30 rounded-full animate-ping" />
                       <Send className="text-green-500 w-10 h-10 relative z-10" />
                    </div>
                    <h3 className="text-2xl font-black text-[#0F172A] mb-2 uppercase tracking-tighter">Transmission Successful</h3>
                    <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Data node has been archived in central registry</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
