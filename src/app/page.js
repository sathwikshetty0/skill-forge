"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Lock,
  Loader2,
  Fingerprint,
  Mail,
  User,
  LogOut,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMode(isSignUp ? "signup" : "login");
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
  }, [isSignUp]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "login") {
      // Mock bypass logic
      if (email === "1" && password === "1") {
        document.cookie = "mock_session=user; path=/";
        router.push("/dashboard");
        return;
      }
      if (email === "2" && password === "2") {
        document.cookie = "mock_session=admin; path=/";
        setUserRole("evaluator");
        router.push("/quiz/admin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } else {
      if (password !== confirmPassword) {
        setError("Security keys do not match.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            role: userRole
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setError("Check your email for confirmation!");
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  /* ─── Blue Branding Panel ─── */
  const BrandingPanel = () => (
    <div className="relative z-10 h-full flex flex-col justify-between p-14">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter pt-1">Skill Forge</h1>
        </div>
        
        <div className="space-y-8 max-w-[320px]">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-none mb-6">
              {isSignUp ? "Join the Node" : "Welcome Back to the Node"}
            </h2>
            <p className="text-white/70 text-base font-medium leading-relaxed">
              {isSignUp 
                ? "Initialize your credentials and begin your NEXUS assessment journey."
                : "Synchronize your session and resume your NEXUS assessment progress."
              }
            </p>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-5 text-white/80">
              <Zap size={22} className="text-white/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Instant Validation</span>
            </div>
            <div className="flex items-center gap-5 text-white/80">
              <Lock size={22} className="text-white/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Military Grade Security</span>
            </div>
            {isSignUp && (
              <div className="flex items-center gap-5 text-white/80">
                <UserPlus size={22} className="text-white/40" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Registration</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 text-white/30">
            <div className="w-10 h-px bg-white/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node Protocol 4.2.0</span>
          </div>
          <div className="flex gap-10">
            <span className="text-[10px] font-black text-white/40 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">Privacy</span>
            <span className="text-[10px] font-black text-white/40 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">Help</span>
          </div>
        </div>
      </div>

      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-700/50 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/30 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
    </div>
  );

  /* ─── Login Form ─── */
  const LoginForm = () => (
    <div className="w-full max-w-[480px]">
      <div className="text-center mb-8">
        <p className="text-[13px] font-black text-[#2563EB] uppercase tracking-[0.25em] mb-3">Innovators and Visionaries Club</p>
        <h1 className="text-[32px] font-black text-[#0F172A] tracking-tight mb-3 leading-none">System Authentication</h1>
        <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">Enter Authorized Credentials</p>
      </div>

      {/* Role Switcher */}
      <div className="bg-[#f1f5f9] p-1 rounded-[24px] border border-[#e2e8f0] flex relative mb-8 h-12">
        <motion.div
          animate={{ left: userRole === "candidate" ? "4px" : "calc(50%)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[20px] shadow-lg shadow-blue-900/5"
        />
        <button 
          onClick={() => setUserRole("candidate")}
          className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest ${userRole === "candidate" ? "text-primary-blue" : "text-[#64748b]"}`}
        >
          I&apos;m a Candidate
        </button>
        <button 
          onClick={() => setUserRole("evaluator")}
          className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest ${userRole === "evaluator" ? "text-primary-blue" : "text-[#64748b]"}`}
        >
          I&apos;m an Evaluator
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Identity Identifier</label>
          <div className="relative group">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
            <input 
              required
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Node Email or ID"
              className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-4 pl-14 pr-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Security Key</label>
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Protocol Key"
              className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-4 pl-14 pr-20 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
            />
            <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-blue uppercase tracking-widest hover:underline">Reset</button>
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-primary-blue text-white py-5 rounded-[28px] font-black text-xs tracking-[0.3em] uppercase shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
            <>
              <span>Execute Login</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </button>

        {error && (
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center pt-2 leading-relaxed">{error}</p>
        )}
      </form>

      <div className="mt-8 text-center">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">
          Don&apos;t have an account? <span onClick={toggleMode} className="text-[#2563EB] font-black cursor-pointer hover:underline transition-all">Initialize One</span>
        </p>
      </div>
    </div>
  );

  /* ─── Sign Up Form ─── */
  const SignUpForm = () => (
    <div className="w-full max-w-[480px]">
      <div className="text-center mb-8">
        <p className="text-[13px] font-black text-[#2563EB] uppercase tracking-[0.25em] mb-3">Innovators and Visionaries Club</p>
        <h1 className="text-[32px] font-black text-[#0F172A] tracking-tight mb-3 leading-none">Initialize Account</h1>
        <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">Generate New Node Credentials</p>
      </div>

      {/* Role Switcher */}
      <div className="bg-[#f1f5f9] p-1 rounded-[24px] border border-[#e2e8f0] flex relative mb-8 h-12">
        <motion.div
          animate={{ left: userRole === "candidate" ? "4px" : "calc(50%)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[20px] shadow-lg shadow-blue-900/5"
        />
        <button 
          type="button"
          onClick={() => setUserRole("candidate")}
          className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest ${userRole === "candidate" ? "text-primary-blue" : "text-[#64748b]"}`}
        >
          I&apos;m a Candidate
        </button>
        <button 
          type="button"
          onClick={() => setUserRole("evaluator")}
          className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest ${userRole === "evaluator" ? "text-primary-blue" : "text-[#64748b]"}`}
        >
          I&apos;m an Evaluator
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Node Designation</label>
          <div className="relative group">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
            <input 
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-4 pl-14 pr-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Identity Identifier</label>
          <div className="relative group">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Node Email"
              className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-4 pl-14 pr-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Security Key</label>
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create Protocol Key"
              className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-4 pl-14 pr-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Confirm Security Key</label>
          <div className="relative group">
            <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
            <input 
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter Protocol Key"
              className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-4 pl-14 pr-6 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-primary-blue text-white py-5 rounded-[28px] font-black text-xs tracking-[0.3em] uppercase shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
            <>
              <span>Initialize Account</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </button>

        {error && (
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center pt-2 leading-relaxed">{error}</p>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">
          Already have credentials? <span onClick={toggleMode} className="text-[#2563EB] font-black cursor-pointer hover:underline transition-all">Execute Login</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#F0F4F8] flex items-center justify-center p-4 md:p-8 font-sans text-black overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-blue/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-accent-indigo/5 rounded-full blur-[100px] animate-pulse delay-700" />

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1100px] h-[85vh] bg-white rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-white/40 overflow-hidden relative z-10"
      >
        <div className="flex w-full h-full relative">
          {/* ─── Blue Branding Panel (slides left/right) ─── */}
          <motion.div 
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`hidden md:flex bg-primary-blue text-white overflow-hidden absolute top-0 bottom-0 ${isSignUp ? "right-0" : "left-0"}`}
            style={{ width: "40%" }}
          >
            <BrandingPanel />
          </motion.div>

          {/* White Panel - Form */}
          <div className="flex-1 p-12 md:p-20 bg-white flex flex-col justify-center overflow-y-auto">
            <div className="max-w-[420px] mx-auto w-full">
              <div className="text-center mb-12">
                 <p className="text-[18px] md:text-[20px] font-black text-[#2563EB] uppercase tracking-[0.45em] mb-4 whitespace-nowrap">INNOVATORS AND VISIONARIES CLUB</p>
                 <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tighter mb-4 leading-none whitespace-nowrap">System Authentication</h1>
                 <p className="text-xs font-black text-[#94A3B8] uppercase tracking-[0.4em]">Enter Authorized Credentials</p>
              </div>

              {/* Role Switcher */}
              <div className="bg-[#f1f5f9] p-1 rounded-[24px] border border-[#e2e8f0] flex relative mb-10 h-12">
                 <motion.div
                    animate={{ x: userRole === "candidate" ? 0 : "100%" }}
                    className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[20px] shadow-lg shadow-blue-900/5"
                 />
                 <button 
                  onClick={() => setUserRole("candidate")}
                  className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest ${userRole === "candidate" ? "text-primary-blue" : "text-[#64748b]"}`}
                 >
                   I'm a Candidate
                 </button>
                 <button 
                  onClick={() => setUserRole("evaluator")}
                  className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest ${userRole === "evaluator" ? "text-primary-blue" : "text-[#64748b]"}`}
                 >
                   I'm an Evaluator
                 </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Identity Identifier</label>
                    <div className="relative group">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
                       <input 
                         required
                         type="text"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="Node Email or ID"
                         className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-5 pl-16 pr-8 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-4">Security Key</label>
                    <div className="relative group">
                       <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-primary-blue transition-colors" />
                       <input 
                         required
                         type="password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         placeholder="Protocol Key"
                         className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[28px] py-5 pl-16 pr-20 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-[#cbd5e1]"
                       />
                       <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-blue uppercase tracking-widest hover:underline">Reset</button>
                    </div>
                 </div>

                 <button
                    disabled={loading}
                    className="w-full bg-primary-blue text-white py-6 rounded-[28px] font-black text-xs tracking-[0.4em] uppercase shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
                 >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                      <>
                        <span>Execute Login</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                      </>
                    )}
                 </button>

                 {error && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center pt-2 leading-relaxed">{error}</p>
                 )}

                 <div className="relative py-8 flex items-center">
                    <div className="flex-1 h-px bg-[#F1F5F9]" />
                    <span className="px-6 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">Secondary Authentication</span>
                    <div className="flex-1 h-px bg-[#F1F5F9]" />
                 </div>

                 <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white border-2 border-[#E2E8F0] py-5 rounded-[28px] flex items-center justify-center gap-4 hover:bg-[#F8FAFC] transition-all group active:scale-[0.98]"
                 >
                   <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="G" />
                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1E293B]">Continue with Google</span>
                 </button>
              </form>

              <div className="mt-12 text-center">
                 <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">Don't have an account? <span className="text-primary-blue font-black cursor-pointer hover:underline">Initialize One</span></p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
