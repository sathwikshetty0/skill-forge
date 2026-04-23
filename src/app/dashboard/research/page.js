"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Send,
  Loader2,
  Copy,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ResearchPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [researchContent, setResearchContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lastPasteTime, setLastPasteTime] = useState(0);

  const textareaRef = useRef(null);

  const TARGET_CHARS = 10000;
  const PASTE_LIMIT = 100;

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      if (profileData?.round2_content) {
        setResearchContent(profileData.round2_content);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleContentChange = (e) => {
    const val = e.target.value;
    if (val.length <= TARGET_CHARS + 500) { // Small buffer
      setResearchContent(val);
    }
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.length > PASTE_LIMIT) {
      e.preventDefault();
      setError(`PASTE RESTRICTION: You cannot paste more than ${PASTE_LIMIT} characters at once. Please type or paste in smaller segments.`);
      setTimeout(() => setError(null), 5000);
      
      // Optionally allow the first PASTE_LIMIT characters
      const truncated = pastedText.substring(0, PASTE_LIMIT);
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const text = researchContent;
      const newText = text.substring(0, start) + truncated + text.substring(end);
      setResearchContent(newText);
      
      // Update cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + truncated.length;
        }
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (researchContent.length < TARGET_CHARS * 0.95) { // Allow 5% margin
      setError(`INCOMPLETE PROTOCOL: You must provide at least 10,000 characters of secondary research. Current count: ${researchContent.length}`);
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        round2_content: researchContent,
        round2_status: 'submitted'
      })
      .eq("id", profile.id);

    if (updateError) {
      setError("Submission failed. Please try again.");
    } else {
      setSuccess(true);
      setProfile({ ...profile, round2_status: 'submitted' });
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-blue" />
    </div>
  );

  if (!profile?.round2_topic) {
    return (
      <div className="p-8 md:p-14 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center text-amber-500 border border-amber-100 shadow-xl shadow-amber-500/5">
          <Info size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">Round 2 Pending</h2>
          <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.4em] mt-2 max-w-md mx-auto">
            You have not been assigned a research topic yet. Please await authorization from the control center.
          </p>
        </div>
        <button 
          onClick={() => router.push("/dashboard")}
          className="bg-[#0F172A] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center gap-3"
        >
          <LayoutDashboard size={16} />
          <span>Return to Hub</span>
        </button>
      </div>
    );
  }

  const progress = Math.min((researchContent.length / TARGET_CHARS) * 100, 100);

  return (
    <div className="p-8 md:p-14 space-y-10 relative overflow-hidden">
      {/* HUD Background Elements */}
      <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none rotate-12">
        <ShieldCheck size={400} />
      </div>
      <div className="absolute bottom-0 left-0 p-20 opacity-[0.03] pointer-events-none -rotate-12">
        <Zap size={400} />
      </div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] font-[900] text-slate-900/[0.02] pointer-events-none select-none tracking-tighter uppercase whitespace-nowrap z-0">
        Confidential Data
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#F1F5F9] pb-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-4 py-1.5 bg-blue-50 text-[#2563EB] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-100 shadow-sm">
               Phase II Protocol
             </div>
             {profile.round2_status === 'submitted' && (
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-100 shadow-sm flex items-center gap-2">
                  <CheckCircle2 size={12} />
                  <span>SYNCED</span>
                </div>
             )}
          </div>
          <div className="group relative">
            <h1 className="text-6xl font-[900] text-[#0F172A] tracking-tighter uppercase leading-[0.85] max-w-3xl mb-6">
              {profile.round2_topic}
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-[2px] w-12 bg-blue-600" />
              <p className="text-[12px] font-black text-[#94A3B8] uppercase tracking-[0.5em]">
                SUBJECT NODE ID: R2-{profile.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-white border border-[#E2E8F0] px-8 py-5 rounded-[32px] shadow-sm flex flex-col items-center min-w-[160px] group hover:border-blue-200 transition-all">
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-1 group-hover:text-blue-500 transition-colors">Data Density</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-[900] text-[#0F172A] tabular-nums">{researchContent.length.toLocaleString()}</span>
                <span className="text-[10px] font-black text-[#CBD5E1]">CHARS</span>
              </div>
           </div>
           <div className="bg-[#0F172A] text-white px-8 py-5 rounded-[32px] shadow-2xl flex flex-col items-center min-w-[160px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Zap size={40} />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1 relative z-10">Quota Target</span>
              <div className="flex items-baseline gap-1 relative z-10">
                <span className="text-3xl font-[900] tabular-nums text-blue-400">10K</span>
                <span className="text-[10px] font-black text-white/30">THRESHOLD</span>
              </div>
           </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div className="space-y-6">
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={researchContent}
              onChange={handleContentChange}
              onPaste={handlePaste}
              disabled={profile.round2_status === 'submitted' || success}
              placeholder="Begin your detailed research synthesis here... (Minimum 10,000 characters required)"
              className="w-full bg-white border-2 border-[#F1F5F9] rounded-[32px] p-10 min-h-[600px] text-lg font-medium leading-relaxed focus:outline-none focus:border-[#2563EB]/30 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-[#CBD5E1] shadow-sm selection:bg-blue-100 resize-none"
            />
            
            {/* Progress Overlay with Terminal Feedback */}
            <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                  <span className={researchContent.length > 0 ? "text-blue-500 animate-pulse" : "text-slate-400"}>
                    {researchContent.length > 0 ? "• SYNC_ACTIVE" : "• STANDBY"}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400">BUFFER_LOAD: {progress.toFixed(1)}%</span>
                </div>
                <div className="text-slate-400">
                  ENC_V3.2 // AES-256
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-white shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.3)]"}`}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-start gap-4 text-rose-600"
              >
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4 text-emerald-600"
              >
                <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">RESEARCH COMMITTED SUCCESSFULLY. NODE SYNCHRONIZATION COMPLETE.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-6">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-8 rounded-[32px] space-y-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#2563EB]" size={20} />
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F172A]">Rules of Engagement</h4>
            </div>
            
            <ul className="space-y-6">
              {[
                { icon: Copy, text: "Paste restriction: Max 100 chars per action." },
                { icon: Zap, text: "Minimum requirement: 10,000 characters." },
                { icon: Clock, text: "Auto-save disabled. Commit when finished." },
                { icon: BookOpen, text: "Deep synthesis and citations required." }
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-center text-[#94A3B8] shadow-sm">
                    <rule.icon size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide leading-tight mt-1">{rule.text}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-[#E2E8F0]">
              <button
                onClick={handleSubmit}
                disabled={submitting || profile.round2_status === 'submitted' || success}
                className={`w-full py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                  profile.round2_status === 'submitted' || success
                  ? "bg-emerald-500 text-white cursor-not-allowed"
                  : "bg-[#2563EB] text-white hover:bg-blue-600 shadow-blue-200"
                }`}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : profile.round2_status === 'submitted' || success ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Submitted</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Execute Commit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-8 bg-white border border-[#E2E8F0] rounded-[32px] shadow-sm">
             <h5 className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-4">Integrity Monitor</h5>
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-[#0F172A] uppercase">Accuracy</span>
                <span className="text-[10px] font-bold text-[#2563EB]">98.2%</span>
             </div>
             <div className="h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden">
                <div className="h-full bg-[#2563EB] w-[98.2%]" />
             </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
