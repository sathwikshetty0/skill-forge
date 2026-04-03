"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Lock,
  Loader2,
  Fingerprint,
  Users,
  LayoutDashboard,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ProtocolAccessPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: quiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("access_code", accessCode.toUpperCase())
      .single();

    if (fetchError || !quiz) {
      setError("Invalid Protocol Access Key");
      setLoading(false);
    } else {
      router.push(`/quiz/play/${quiz.access_code}`);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex font-sans text-[#0f172a] overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 ml-0 lg:ml-[280px] min-h-screen flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(37,99,235,0.02)_0%,_transparent_50%)] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] bg-white rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] border border-[#f1f5f9] p-12 md:p-14 text-center space-y-10"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lock className="text-primary-blue w-8 h-8" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-[#0f172a]">Protocol <span className="text-primary-blue">Lockdown</span></h1>
            <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.4em]">Initialize secure session access</p>
          </div>

          <form onSubmit={handleAccess} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-[#94a3b8] uppercase tracking-widest text-left ml-6">Secure Access Key</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#cbd5e1] group-focus-within:text-primary-blue transition-colors">
                   <Fingerprint size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="EX: NEXUS-XXXX"
                  className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-6 pl-16 pr-8 text-sm font-bold text-[#0f172a] tracking-widest focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f172a] text-white py-4 rounded-[28px] font-black text-xs tracking-[0.4em] uppercase shadow-2xl hover:bg-primary-blue transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Decrypt Access</span>
                  <Zap size={18} className="text-primary-blue group-hover:text-white transition-colors" />
                </>
              )}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-center gap-3"
                >
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

        </motion.div>
      </main>
    </div>
  );
}
