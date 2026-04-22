"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Lock,
  Loader2,
  Users,
  Mail,
  Activity,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setError(null);
  }, [isSignUp]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock bypass logic
    if (!isSignUp) {
      if (email === "1" && password === "1") {
        document.cookie = "mock_session=user; path=/";
        router.push("/dashboard");
        return;
      }
      if (email === "2" && password === "2") {
        document.cookie = "mock_session=admin; path=/";
        router.push("/quiz/admin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else { router.push("/dashboard"); }
    } else {
      if (password !== confirmPassword) {
        setError("Security keys do not match.");
        setLoading(false);
        return;
      }

      // Domain restriction removed per user request

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: userRole },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) { 
        // Handle Supabase "Signups not allowed" or other errors
        if (error.message.includes("Signups not allowed")) {
          setError("PROTOCOL ARCHIVE ERROR: System administrator has currently locked new node registrations. Contact authorized personnel.");
        } else {
          setError(error.message.toUpperCase()); 
        }
        setLoading(false); 
      }
      else if (authData.user) { 
        // Sync to public profiles table for administrative oversight
        await supabase.from('profiles').insert([{
          id: authData.user.id,
          full_name: fullName,
          email: email,
          role: userRole,
          created_at: new Date().toISOString()
        }]);

        setError("SYNCHRONIZATION COMPLETE: Node established. You can now Sync Credentials to enter."); 
        setLoading(false); 
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const toggleMode = () => setIsSignUp(!isSignUp);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-8 md:p-12 lg:p-20 font-sans selection:bg-blue-100 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[960px] bg-white rounded-[12px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden relative z-10 flex min-h-[540px]"
      >
        {/* Sliding Branding Panel */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={isSignUp ? "signup-branding" : "login-branding"}
            initial={{ opacity: 0, x: isSignUp ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignUp ? 40 : -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`hidden lg:flex bg-[#2563EB] text-white absolute top-0 bottom-0 z-20 w-[400px] flex-col justify-between p-16 ${isSignUp ? "right-0" : "left-0"}`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-20 group">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-blue-600 transition-all duration-500">
                  <ShieldCheck size={28} />
                </div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Skill Forge</h1>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="text-3xl font-black leading-[0.9] tracking-tighter uppercase">
                    {isSignUp ? "Connect Node" : "System Sync"}
                  </h2>
                  <p className="text-blue-100/60 text-sm font-medium leading-relaxed max-w-[200px]">
                    {isSignUp 
                      ? "Establish your node presence in the NEXUS protocol layers."
                      : "Synchronize your authorization keys."}
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: Zap, text: "Instant Validation" },
                    { icon: Lock, text: "Military Grade Encryption" },
                    { icon: Activity, text: "Biometric Identity Nodes" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-white/70">
                      <item.icon size={14} className="text-blue-300" />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-px bg-white/20" />
                <span className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Protocol 4.2.0-S</span>
              </div>
              <div className="flex gap-8 text-sm font-black uppercase tracking-widest text-white/30">
                <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                <span className="hover:text-white cursor-pointer transition-colors">Support</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 0 L100 100 M100 0 L0 100" stroke="white" strokeWidth="0.1" />
                  </svg>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Content Area */}
        <div 
          className={`flex-1 flex flex-col justify-center transition-all duration-700 ease-in-out px-6 md:px-12 py-10 relative overflow-hidden ${isSignUp ? "lg:mr-[400px]" : "lg:ml-[400px]"}`}
        >
          {/* Mobile Aesthetic Elements */}
          <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-600/5 blur-[100px] pointer-events-none" />
          <div className="lg:hidden absolute bottom-[-5%] left-[-10%] w-[50%] h-[30%] bg-indigo-600/5 blur-[100px] pointer-events-none" />
          
          <div className="max-w-[750px] mx-auto w-full space-y-10 md:space-y-12 flex flex-col items-center relative z-10">
            <div className="w-full space-y-6 text-center flex flex-col items-center">
              <div className="lg:hidden flex items-center justify-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-blue-200">
                  <ShieldCheck size={28} />
                </div>
                <div className="text-left">
                  <span className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none block">Skill Forge</span>
                  <span className="text-sm font-black uppercase tracking-[0.3em] text-blue-600/60 leading-none mt-1 block">Nexus Node</span>
                </div>
              </div>
              <div className="space-y-3">
                <p className="hidden lg:block text-base font-black text-blue-600 uppercase tracking-[0.5em] mb-4">Innovators and Visionaries Club</p>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  {isSignUp ? "Initialize" : "Welcome"}
                </h1>
                <p className="text-base font-black text-slate-400 uppercase tracking-[0.4em] leading-loose">Synchronize your identification parameters</p>
              </div>
            </div>

            {/* Role/Action UI */}
            <div className="space-y-8">
              <div className="bg-slate-100 p-1 rounded-full flex h-16 relative border border-slate-200">
                <button 
                  type="button"
                  onClick={() => setUserRole("candidate")}
                  className={`flex-1 relative z-10 text-xs font-black uppercase tracking-wider transition-colors duration-300 ${userRole === "candidate" ? "text-blue-600" : "text-slate-400"}`}
                >
                  I'm a Candidate
                  {userRole === "candidate" && (
                    <motion.div 
                      layoutId="role-pill-main"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200 -z-10"
                    />
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setUserRole("evaluator")}
                  className={`flex-1 relative z-10 text-xs font-black uppercase tracking-wider transition-colors duration-300 ${userRole === "evaluator" ? "text-blue-600" : "text-slate-400"}`}
                >
                  I'm an Evaluator
                  {userRole === "evaluator" && (
                    <motion.div 
                      layoutId="role-pill-main"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200 -z-10"
                    />
                  )}
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Authorized Name</label>
                    <input 
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter Node Identity Name"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Node Credentials</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      required
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="authorized@skillforge.io"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Security Protocol Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Confirm Key</label>
                    <input 
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                )}

                <button
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs tracking-[0.4em] uppercase shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <span>{isSignUp ? "Initialize Sync" : "Establish Link"}</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-sm font-black text-rose-500 uppercase tracking-widest text-center pt-2 leading-relaxed italic">{error}</p>
                )}

              </form>

              <div className="text-center pt-4 flex flex-col items-center">
                <div className="flex items-center gap-3 text-sm font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                  <span>{isSignUp ? "Already Enrolled?" : "New Node Signature?"}</span>
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-extrabold underline decoration-2 underline-offset-4"
                  >
                    {isSignUp ? "Sync Credentials" : "Enroll Node"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
