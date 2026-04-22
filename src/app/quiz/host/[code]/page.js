"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Clock, 
  Users, 
  ChevronRight,
  Monitor,
  ArrowRight,
  CircleCheck,
  Zap,
  PlayCircle,
  BarChart2,
  Medal,
  Award
} from "lucide-react";

export default function AdminHostPage() {
  const { code } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [joinCount, setJoinCount] = useState(0);
  const [presentUsers, setPresentUsers] = useState([]);
  const quizRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState('lobby');
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status === 'showing-question') {
      setShowOptions(false);
      const timer = setTimeout(() => setShowOptions(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowOptions(false);
    }
  }, [status, currentQuestion?.id]);

  useEffect(() => {
    async function loadHostData() {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*, questions(*)")
        .eq("access_code", code.toUpperCase())
        .single();
      
      if (!quizData) {
        router.push("/quiz/admin/quizzes");
        return;
      }
      
      setQuiz(quizData);
      quizRef.current = quizData;
      
      // If quiz is already finished when admin enters, reset it to lobby for a fresh start
      if (quizData.status === 'finished') {
        await supabase.from("quizzes").update({ status: 'lobby', current_question_index: 0 }).eq("id", quizData.id);
        setStatus('lobby');
      } else {
        setStatus(quizData.status || 'lobby');
      }
      
      setLoading(false);

      // Initial Data Load
      fetchLeaderboard(quizData.id);

      // Subscribe to communications and presence
      const canal_id = `quiz_session_${code.toUpperCase()}_${Date.now()}`;
      const channel = supabase
        .channel(canal_id)
        .on(
          'postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'submissions', filter: `quiz_id=eq.${quizData.id}` },
          () => fetchLeaderboard(quizData.id)
        )
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setJoinCount(count);

          const usersMap = {};
          Object.entries(state).forEach(([key, presences]) => {
            presences.forEach(p => {
              const userId = p.user_id || p.userId || p.id || key;
              const fullName = p.full_name || p.fullName || p.name || p.userName || `Node-${userId.toString().substring(0, 5)}`;
              if (userId) usersMap[userId] = fullName;
            });
          });
          
          const users = Object.entries(usersMap).map(([id, full_name]) => ({ id, full_name }));
          setPresentUsers(users);
          if (quizData?.id) fetchLeaderboard(quizData.id, users);
        });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("NEURAL LINK ESTABLISHED:", canal_id);
        }
      });

      // HEARTBEAT SYNC: Every 10s broadcast state to ensure mobile nodes catch up
      const heartbeat = setInterval(() => {
        if (quizRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'state_update',
            payload: quizRef.current
          });
        }
      }, 10000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(heartbeat);
        clearInterval(timerRef.current);
      };
    }
    loadHostData();
  }, [code]);

  async function fetchLeaderboard(quizId, currentPresentUsers = null) {
    const { data, error } = await supabase
      .from("submissions")
      .select("user_id, total_score, profiles!user_id(full_name)")
      .eq("quiz_id", quizId);
      
    if (error) {
      console.warn("LEADERBOARD SYNC WARNING (Likely missing submissions table):", error.message);
      setLeaderboard(currentPresentUsers || []);
      return;
    }

    console.log("SUBMISSIONS DATA:", data?.length || 0, "records");


    // Aggregate scores by user ID
    const totals = (data || []).reduce((acc, curr) => {
      const uid = curr.user_id;
      if (!acc[uid]) {
        acc[uid] = { 
          id: uid, 
          full_name: curr.profiles?.full_name || "Challenger", 
          total_score: 0 
        };
      }
      acc[uid].total_score += curr.total_score || 0;
      return acc;
    }, {});

    // Sort and limit to top 15 (larger window)
    const scoredUsers = Object.values(totals);
    
    // Merge with present users who have no scores yet
    // Use the passed in users if available, otherwise fallback to state
    const usersToMerge = currentPresentUsers || presentUsers;
    const allUsers = [...scoredUsers];
    
    usersToMerge.forEach(pu => {
      if (!allUsers.some(u => u.id === pu.id)) {
        allUsers.push({ id: pu.id, full_name: pu.full_name, total_score: 0 });
      }
    });

    const sorted = allUsers
      .filter(u => u.full_name) // Ensure valid data
      .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
      .slice(0, 15);
      
    setLeaderboard(sorted);
  }

  useEffect(() => {
    if (quiz && quiz.questions && quiz.current_question_index !== undefined) {
      const q = quiz.questions.find(qt => qt.order_index === quiz.current_question_index);
      setCurrentQuestion(q);
    }
  }, [quiz]);

  const updateQuizStatus = async (newStatus, index = null) => {
    const payload = { status: newStatus };
    if (index !== null) payload.current_question_index = index;
    
    await supabase.from("quizzes").update(payload).eq("id", quiz.id);
    
    // BROADCAST PULSE: Instant sync for all nodes
    const channel = supabase.channel(`quiz_session_${code.toUpperCase()}`);
    await channel.send({
      type: 'broadcast',
      event: 'state_update',
      payload: { ...quiz, ...payload }
    });

    setQuiz(prev => {
       const updated = { ...prev, ...payload };
       quizRef.current = updated;
       return updated;
    });
    setStatus(newStatus);
    
    // Refresh leaderboard to catch present users
    if (quiz?.id) fetchLeaderboard(quiz.id);
  };

  const executeCountdown = async (callback) => {
    setStatus('countdown');
    await supabase.from("quizzes").update({ status: 'countdown' }).eq("id", quiz.id);
    
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        callback();
      }
    }, 1000);
  };

  const resetQuiz = async () => {
    await updateQuizStatus('lobby', 0);
  };

  const startQuiz = async () => {
    // Clear any existing scores/submissions if starting over
    await supabase.from("submissions").delete().eq("quiz_id", quiz.id);
    setLeaderboard([]);
    
    executeCountdown(async () => {
      const firstQuestion = quiz.questions[0];
      const timeLimit = firstQuestion?.time_limit || 30;
      await updateQuizStatus('showing-question', 0);
      setTimeout(() => startTimer(timeLimit), 3000);
    });
  };

  const nextQuestion = async () => {
    const nextIdx = quiz.current_question_index + 1;
    if (nextIdx < quiz.questions.length) {
      executeCountdown(async () => {
        const nextQuestion = quiz.questions[nextIdx];
        const timeLimit = nextQuestion?.time_limit || 30;
        await updateQuizStatus('showing-question', nextIdx);
        setTimeout(() => startTimer(timeLimit), 3000);
      });
    } else {
      await updateQuizStatus('finished');
    }
  };

  const showResults = async () => {
    await updateQuizStatus('showing-results');
  };

  const handleTimerEnd = async () => {
    await showResults();
    if (quiz?.id) fetchLeaderboard(quiz.id);
  };

  const startTimer = (seconds) => {
    clearInterval(timerRef.current);
    setTimer(seconds);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen lg:h-screen bg-[#020617] text-white flex flex-col lg:flex-row font-sans lg:overflow-hidden selection:bg-primary-blue/30">
       {/* Background Ambient Glows */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-blue/10 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-primary-blue/5 rounded-full blur-[100px]" />
       </div>

       {/* Main Display (TV AREA) */}
       <div className="flex-1 flex flex-col p-6 md:p-12 relative overflow-y-auto lg:overflow-hidden z-10">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 w-full">
             <div className="flex items-center gap-5">
                <div className="p-4 bg-white/5 rounded-[22px] border border-white/10 backdrop-blur-xl shadow-2xl">
                   <Zap className="text-primary-blue w-7 h-7 fill-primary-blue/20" />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary-blue animate-pulse" />
                      <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/40 leading-none">Command Terminal</h2>
                   </div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter leading-none grad-text">{quiz.title}</h1>
                </div>
             </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-[28px] flex items-center gap-2 shadow-2xl">
                 <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-[22px] border border-white/5">
                    <Users className="text-primary-blue w-4 h-4" />
                    <span className="text-[17px] font-black text-white">{joinCount} <span className="text-white/40 text-xs tracking-widest ml-1">NODES</span></span>
                 </div>
                 <div className="hidden sm:flex items-center gap-3 px-6 py-3">
                    <Monitor className="text-white/20 w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">TV SYNC ACTIVE</span>
                 </div>
                 <div className="w-px h-6 bg-white/10 hidden sm:block" />
                 <div className="px-6 py-3">
                    <span className="text-sm font-black tracking-[0.3em] text-primary-blue">{code}</span>
                 </div>
              </div>
          </header>

          <main className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full relative">
             <AnimatePresence mode="wait">
                {status === 'lobby' && (
                  <motion.div
                    key="lobby"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12"
                  >
                     <div className="text-center space-y-6">
                        <div className="relative w-fit mx-auto">
                           <div className="absolute inset-0 bg-primary-blue/20 blur-3xl rounded-full" />
                           <div className="relative p-10 bg-white/5 rounded-[50px] border border-primary-blue/20 backdrop-blur-3xl mb-4">
                              <Users size={80} className="text-primary-blue" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase leading-none">JOIN THE <span className="text-primary-blue">NODE</span></h1>
                           <p className="text-sm font-black text-white/30 uppercase tracking-[0.6em]">Scanning for synchronized candidate signals</p>
                        </div>
                     </div>

                     <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto min-h-[120px] content-start">
                        <AnimatePresence>
                           {presentUsers.map((user, i) => (
                             <motion.div
                               key={user.id}
                               initial={{ scale: 0, opacity: 0, y: 10 }}
                               animate={{ scale: 1, opacity: 1, y: 0 }}
                               exit={{ scale: 0, opacity: 0 }}
                               className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-[22px] flex items-center gap-4 transition-all group backdrop-blur-sm shadow-xl"
                             >
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:animate-ping" />
                                <span className="text-sm font-black text-white/80 uppercase tracking-widest">{user.full_name}</span>
                             </motion.div>
                           ))}
                        </AnimatePresence>
                        {presentUsers.length === 0 && (
                          <div className="flex flex-col items-center gap-4 opacity-20 py-10">
                             <div className="w-12 h-1 px-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                  animate={{ x: [-40, 40] }} 
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                  className="w-8 h-full bg-white" 
                                />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-[0.5em]">Waiting for neural handshake...</p>
                          </div>
                        )}
                     </div>

                     <div className="bg-white text-[#020617] p-8 md:p-12 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] flex flex-col gap-2 max-w-md mx-auto w-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-blue/5 rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
                        <span className="text-xs font-black uppercase tracking-[0.5em] opacity-40 text-center">Protocol Access Key</span>
                        <span className="text-8xl font-black tracking-[0.2em] leading-none text-center">{code}</span>
                     </div>

                     <button 
                       onClick={startQuiz}
                       className="bg-primary-blue hover:bg-blue-600 px-16 py-8 rounded-[32px] text-lg font-black uppercase tracking-[0.4em] transition-all flex items-center gap-6 mx-auto group shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-95"
                     >
                        <span>Initialize Sync</span>
                        <PlayCircle size={32} fill="currentColor" className="text-white/20 group-hover:text-white transition-colors" />
                     </button>
                  </motion.div>
                )}

                {status === 'showing-question' && currentQuestion && (
                   <motion.div
                     key="question"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, x: -50 }}
                     className="space-y-10"
                   >
                      <div className="bg-white/5 border border-white/10 p-12 rounded-[56px] backdrop-blur-3xl overflow-hidden relative group shadow-2xl">
                         <div className="absolute top-0 right-0 p-8">
                            <div className="w-32 h-32 rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative bg-black/20">
                               <span className="text-[10px] font-black text-white/30 mb-1 tracking-widest">TIME</span>
                               <span className="text-5xl font-black tabular-nums">{timer}</span>
                               <svg className="absolute inset-0 w-full h-full -rotate-90">
                                  <circle 
                                    cx="64" cy="64" r="60" 
                                    className="stroke-primary-blue/20 fill-none" 
                                    strokeWidth="4" 
                                  />
                                  <motion.circle 
                                    cx="64" cy="64" r="60" 
                                    className="stroke-primary-blue fill-none" 
                                    strokeWidth="4" 
                                    strokeDasharray="377"
                                    initial={{ strokeDashoffset: 0 }}
                                    animate={{ strokeDashoffset: 377 - (377 * (timer / (currentQuestion.time_limit || 30))) }}
                                  />
                               </svg>
                            </div>
                         </div>
                         <div className="relative z-10 space-y-6 max-w-[75%]">
                            <div className="flex items-center gap-3">
                               <span className="bg-primary-blue/20 text-primary-blue px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Module 0{quiz.current_question_index + 1}</span>
                               <div className="h-px w-10 bg-white/10" />
                            </div>
                            <h2 className="text-5xl font-black leading-[1.1] tracking-tight uppercase">{currentQuestion.content || currentQuestion.question_text}</h2>
                         </div>
                      </div>

                      {showOptions ? (
                        <div className="grid grid-cols-2 gap-6">
                           {currentQuestion.options?.map((opt, idx) => {
                               const colors = ['border-blue-500/30', 'border-red-500/30', 'border-amber-500/30', 'border-emerald-500/30'];
                               const bgColors = ['bg-blue-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
                               const labels = ['A', 'B', 'C', 'D'];
                               return (
                                  <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.1 } }}
                                    className={`flex items-center gap-8 p-8 bg-white/5 border ${colors[idx]} rounded-[40px] shadow-xl group relative overflow-hidden`}
                                  >
                                     <div className={`${bgColors[idx]} w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl shadow-2xl relative z-10`}>
                                        {labels[idx]}
                                     </div>
                                     <span className="text-2xl font-bold tracking-tight text-white/70 relative z-10">{opt}</span>
                                     <div className={`absolute inset-0 ${bgColors[idx]} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />
                                  </motion.div>
                               )
                           })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-dashed border-white/10 rounded-[56px] animate-pulse space-y-4">
                           <div className="flex items-center gap-4 text-primary-blue text-[11px] font-black uppercase tracking-[0.5em]">
                              <Zap className="animate-bounce" />
                              <span>BROADCAST SYNC IN PROGRESS</span>
                           </div>
                           <p className="text-white/20 text-xs font-black uppercase tracking-[0.3em]">Auditing Node Intelligence. Data streams opening in 3s...</p>
                        </div>
                      )}
                   </motion.div>
                )}

                {status === 'showing-results' && currentQuestion && (
                   <motion.div
                     key="results"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-12 text-center py-20"
                   >
                      <div className="space-y-6">
                         <div className="w-28 h-28 bg-emerald-500/10 rounded-[44px] border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-3xl shadow-emerald-500/10">
                            <CircleCheck className="text-emerald-500 w-14 h-14" />
                         </div>
                         <h1 className="text-xs font-black uppercase tracking-[0.6em] text-white/30">Verified Dataset Signature</h1>
                         <h2 className="text-7xl font-black leading-tight tracking-tight uppercase text-emerald-400 max-w-4xl mx-auto">
                            {currentQuestion.options?.[['A','B','C','D'].indexOf(currentQuestion.correct_answer)] || currentQuestion.correct_answer}
                         </h2>
                      </div>

                      <button 
                        onClick={nextQuestion}
                        className="bg-white text-[#020617] px-20 py-8 rounded-[36px] text-lg font-black uppercase tracking-[0.4em] transition-all flex items-center gap-6 mx-auto hover:bg-primary-blue hover:text-white group shadow-2xl"
                      >
                         <span>Next Protocol</span>
                         <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                   </motion.div>
                )}

                {status === 'finished' && (
                   <motion.div
                     key="finished"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-16 text-center"
                   >
                      <div className="space-y-8">
                         <div className="relative w-fit mx-auto">
                            <Trophy size={180} className="text-amber-400 drop-shadow-[0_0_50px_rgba(251,191,36,0.5)]" />
                            <motion.div 
                               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                               transition={{ duration: 3, repeat: Infinity }}
                               className="absolute inset-0 bg-amber-400/20 blur-[100px] rounded-full" 
                            />
                         </div>
                         <div className="space-y-4">
                            <h1 className="text-8xl font-black tracking-[0.1em] uppercase leading-none">ELITE NODE ESTABLISHED</h1>
                            <p className="text-sm font-black text-white/30 uppercase tracking-[0.6em]">Protocol sequence terminated successfully</p>
                         </div>
                      </div>

                      <div className="flex gap-6 justify-center">
                         <button 
                           onClick={() => setStatus('lobby')}
                           className="bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-6 rounded-[28px] font-black text-[13px] uppercase tracking-[0.3em] transition-all backdrop-blur-md"
                         >
                           Reset Node
                         </button>
                         <button 
                           onClick={() => router.push('/quiz/admin/quizzes')}
                           className="bg-primary-blue hover:bg-blue-600 px-16 py-6 rounded-[28px] font-black text-[13px] uppercase tracking-[0.3em] transition-all shadow-2xl"
                         >
                           Finalize Matrix
                         </button>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </main>

          <footer className="mt-auto pt-10 flex justify-between items-center opacity-40">
             <div className="text-[10px] font-black uppercase tracking-[0.6em]">Skill Forge • Neural Mesh v4.28</div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                   <span className="text-[10px] font-black tracking-[0.4em]">STRENGTH: 98%</span>
                </div>
             </div>
          </footer>
       </div>

        {/* Global Registry Sidebar */}
        <div className="w-full lg:w-[480px] bg-[#020617] lg:bg-white text-white lg:text-[#0F172A] flex flex-col p-8 md:p-12 overflow-hidden relative border-l border-white/5 lg:border-gray-100">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 mb-12">
             <div className="flex items-center gap-5 mb-5">
                <div className="p-3 bg-primary-blue/10 lg:bg-blue-50 rounded-[20px]">
                   <Medal className="text-primary-blue w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Elite Registry</h3>
             </div>
             <div className="flex justify-between items-end mb-4">
                <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.4em] leading-none">Global Ranking Matrix</p>
                <span className="text-[10px] font-black uppercase text-primary-blue">{leaderboard.length} LOGS</span>
             </div>
             <div className="w-full h-1 bg-white/5 lg:bg-gray-100 flex overflow-hidden rounded-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '40%' }}
                  className="h-full bg-primary-blue" 
                />
             </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar-hide relative z-10 py-2">
             <AnimatePresence mode="popLayout">
                {leaderboard.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20">
                     <Users size={64} strokeWidth={1} />
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center">Awaiting Node Connections</p>
                  </div>
                ) : leaderboard.map((player, index) => (
                   <motion.div
                     key={player.id}
                     layout
                     initial={{ opacity: 0, x: 30 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={`flex items-center justify-between p-6 rounded-[32px] border ${
                       index === 0 ? 'bg-[#0F172A] lg:bg-[#0F172A] text-white border-[#0F172A] shadow-2xl scale-[1.03] ring-4 ring-primary-blue/10' : 
                       'bg-white/5 lg:bg-white border-white/5 lg:border-[#F1F5F9]'
                     } transition-all relative overflow-hidden`}
                   >
                      {index === 0 && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-blue/10 rounded-full translate-x-10 -translate-y-10 blur-2xl" />
                      )}
                      
                      <div className="flex items-center gap-5 relative z-10">
                         <div className={`w-11 h-11 rounded-[18px] flex items-center justify-center font-black text-sm ${
                           index === 0 ? 'bg-amber-400 text-[#0F172A]' : 
                           index === 1 ? 'bg-slate-500/10 text-slate-500' : 
                           index === 2 ? 'bg-orange-500/10 text-orange-600' : 
                           'bg-gray-500/5 text-gray-400'
                         }`}>
                           {index + 1}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight truncate max-w-[160px]">
                              {player.full_name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                               <div className={`w-1 h-1 rounded-full ${index === 0 ? 'bg-emerald-400' : 'bg-primary-blue'}`} />
                               <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${index === 0 ? 'text-blue-200' : ''}`}>Verified</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-right relative z-10">
                         <span className={`text-2xl font-black tabular-nums ${index === 0 ? 'text-amber-400' : 'text-primary-blue lg:text-[#0F172A]'}`}>
                           {player.total_score || player.points || 0}
                         </span>
                         <p className="text-[9px] font-black uppercase opacity-30 mt-1">PTS</p>
                      </div>
                   </motion.div>
                ))}
             </AnimatePresence>
          </div>

           {/* Stats Overview */}
           <div className="mt-8 space-y-4">
              <div className="bg-[#F8FAFC]/5 lg:bg-[#F8FAFC] border border-white/5 lg:border-[#E2E8F0] p-6 rounded-[36px] flex items-center gap-6 group transition-all hover:border-primary-blue/30">
                 <div className="w-16 h-16 bg-primary-blue/10 lg:bg-white border border-white/10 lg:border-[#E2E8F0] rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Award className="text-primary-blue w-8 h-8" />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-primary-blue uppercase tracking-[0.3em] mb-1.5">Top Strategist</p>
                    <h3 className="text-sm font-black uppercase tracking-tight">
                       {leaderboard[0]?.full_name || "Scanning..."}
                    </h3>
                 </div>
              </div>

               <button 
                 onClick={resetQuiz}
                 className="w-full py-5 bg-white/5 lg:bg-slate-50 border border-white/5 lg:border-slate-100 rounded-[28px] text-[10px] font-black uppercase tracking-[0.4em] text-white/30 lg:text-slate-400 hover:text-primary-blue lg:hover:text-primary-blue hover:bg-white/10 lg:hover:bg-blue-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
               >
                 <Zap size={14} className="fill-current" />
                 <span>Recalibrate Neural Node</span>
               </button>
           </div>
        </div>
    </div>
  );
