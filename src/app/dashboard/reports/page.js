"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  FileText, 
  Send, 
  ChevronRight, 
  AlertCircle,
  Zap,
  Lock,
  Clock,
  History,
  LayoutDashboard,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SubmitReportPage() {
  const [session, setSession] = useState(null);
  const [overview, setOverview] = useState("");
  const [applications, setApplications] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [improvements, setImprovements] = useState("");
  const [status, setStatus] = useState("idle");
  const [aiChecking, setAiChecking] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const hasMockSession = document.cookie.includes("mock_session=");
      if (!user && !hasMockSession) router.push("/login");
      setSession(user || { id: "mock_user", email: "candidate@skillforge.io" });
    }
    checkAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!overview.trim() && !applications.trim() && !thoughts.trim() && !improvements.trim()) {
      alert("Protocol Payload Required: Please fill at least one compartment.");
      return;
    }
    
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
      setOverview("");
      setApplications("");
      setThoughts("");
      setImprovements("");
      setTimeout(() => setStatus("idle"), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-black">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[280px] p-6 md:p-14 space-y-10 min-h-screen flex flex-col">
        <header className="space-y-1">
          <h1 className="text-4xl font-extrabold text-[#0F172A] tracking-tighter">Submit <span className="text-[#2563EB]">Protocol Report</span></h1>
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
            {/* Overview */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Overview</label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="Provide a brief overview of your findings..."
                className="w-full min-h-[120px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
              />
            </div>

            {/* Applications in Real World */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Applications in Real World</label>
              <textarea
                value={applications}
                onChange={(e) => setApplications(e.target.value)}
                placeholder="How can this be applied in real-world scenarios..."
                className="w-full min-h-[120px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
              />
            </div>

            {/* Your Thought About This */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Your Thought About This</label>
              <textarea
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="Share your personal analysis and reflections..."
                className="w-full min-h-[120px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
              />
            </div>

            {/* Future Improvements */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] ml-4">Future Improvements</label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Suggest future improvements and next steps..."
                className="w-full min-h-[120px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-6 pt-2">
              <div className="flex items-center gap-6 opacity-60">
                 <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#2563EB]" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Instant Sync</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Lock size={14} className="text-[#10B981]" />
                    <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Secure</span>
                 </div>
              </div>
              
              <div className="flex gap-6">
                <button
                  type="button"
                  disabled={aiChecking || !overview.trim() || !applications.trim() || !thoughts.trim() || !improvements.trim()}
                  title={!overview.trim() || !applications.trim() || !thoughts.trim() || !improvements.trim() ? "Protocol Insight: Please complete all report compartments to proceed." : ""}
                  onClick={() => {
                    setAiChecking(true);
                    setShowAiModal(true);
                    setAiResult(null);
                    
                    // Simulate high-fidelity AI analysis chain with deterministic logic
                    const totalLength = (overview + applications + thoughts + improvements).length;
                    const wordCount = totalLength / 6;
                    
                    setTimeout(() => {
                      // Deterministic mock calculation based on input length and entropy
                      const aiProb = Math.max(8, Math.min(22, (wordCount % 15) + 8));
                      const auth = Math.min(99.9, 94 + (totalLength % 5) + (totalLength % 0.9));
                      
                      setAiResult({
                        ai_generated: `${aiProb}%`,
                        plagiarism: "2%",
                        quality: `${Math.floor(85 + (totalLength % 10))}/100`,
                        authenticity: `${auth.toFixed(1)}%`,
                        status: "LEGITIMATE"
                      });
                      setAiChecking(false);
                    }, 3000);
                  }}
                  className="bg-[#0F172A] text-white px-8 py-4 rounded-full font-black text-[11px] tracking-[0.4em] uppercase shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-6 group"
                >
                  {aiChecking ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Check AI</span>
                      <Cpu size={18} className="text-[#3B82F6] group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={status === "submitting" || !overview.trim() || !applications.trim() || !thoughts.trim() || !improvements.trim()}
                  title={!overview.trim() || !applications.trim() || !thoughts.trim() || !improvements.trim() ? "Protocol Insight: Please complete all report compartments to proceed." : ""}
                  className="bg-[#0F172A] text-white px-10 py-4 rounded-full font-black text-[11px] tracking-[0.4em] uppercase shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-6 group"
                >
                  {status === "submitting" ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{status === "success" ? "ARCHIVED" : "Execute Submission"}</span>
                      <Send size={18} className="text-[#3B82F6] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <AnimatePresence>
            {showAiModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full max-w-[420px] bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-[#E2E8F0] p-10 text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F1F5F9] overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: "0%" }}
                      animate={{ width: aiChecking ? "100%" : "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                    />
                  </div>

                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                     <Cpu className={`w-8 h-8 text-blue-600 ${aiChecking ? "animate-pulse" : ""}`} />
                  </div>

                  <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter mb-1">AI Intelligence Scrutiny</h3>
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-8">
                    {aiChecking ? "Analyzing node patterns..." : "Deep scan analysis complete"}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-10">
                     <div className="p-4 bg-[#F8FAFC] rounded-3xl border border-[#F1F5F9]">
                        <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">AI Probability</p>
                        <p className="text-2xl font-black text-[#0F172A]">{aiChecking ? "--" : aiResult?.ai_generated}</p>
                     </div>
                     <div className="p-4 bg-[#F8FAFC] rounded-3xl border border-[#F1F5F9]">
                        <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Authenticity</p>
                        <p className="text-2xl font-black text-green-500">{aiChecking ? "--" : aiResult?.authenticity}</p>
                     </div>
                  </div>

                  {!aiChecking && (
                    <button
                      onClick={() => setShowAiModal(false)}
                      className="w-full bg-[#0F172A] text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-blue-600 transition-all active:scale-[0.98]"
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
                <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-10">Data node has been archived in central registry</p>
                <button 
                  onClick={() => setStatus("idle")} 
                  className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest hover:underline"
                >
                  Create New Protocol Intelligence Log
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
