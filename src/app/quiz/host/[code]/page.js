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
      const channel = supabase
        .channel(`quiz_session_${code.toUpperCase()}`)
        .on(
          'postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'submissions', filter: `quiz_id=eq.${quizData.id}` },
          () => fetchLeaderboard(quizData.id)
        )
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setJoinCount(count);

          // Extract names from presence state and deduplicate
          const usersMap = {};
          Object.values(state).forEach(presences => {
            presences.forEach(p => {
              if (p.user_id && p.full_name) {
                usersMap[p.user_id] = p.full_name;
              }
            });
          });
          const users = Object.entries(usersMap).map(([id, full_name]) => ({ id, full_name }));
          setPresentUsers(users);
          
          // Re-trigger leaderboard to merge these users
          if (quizData?.id) fetchLeaderboard(quizData.id);
        })
        .subscribe();

      // HEARTBEAT SYNC: Every 10s broadcast state to ensure mobile nodes catch up
      const heartbeat = setInterval(() => {
        if (quizData) {
          channel.send({
            type: 'broadcast',
            event: 'state_update',
            payload: quizData
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

  async function fetchLeaderboard(quizId) {
    const { data, error } = await supabase
      .from("submissions")
      .select("user_id, total_score, profiles!user_id(full_name)")
      .eq("quiz_id", quizId);
      
    if (error) {
      console.error("LEADERBOARD SYNC ERROR:", error);
      return;
    }

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
    const allUsers = [...scoredUsers];
    presentUsers.forEach(pu => {
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

    setQuiz(prev => ({ ...prev, ...payload }));
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
      await updateQuizStatus('showing-question', 0);
      setTimeout(() => startTimer(30), 3000);
    });
  };

  const nextQuestion = async () => {
    const nextIdx = quiz.current_question_index + 1;
    if (nextIdx < quiz.questions.length) {
      executeCountdown(async () => {
        await updateQuizStatus('showing-question', nextIdx);
        setTimeout(() => startTimer(30), 3000);
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
    <div className="min-h-screen lg:h-screen bg-[#0F172A] text-white flex flex-col lg:flex-row font-sans lg:overflow-hidden">
       {/* Main Display (TV AREA) */}
       <div className="flex-1 flex flex-col p-6 md:p-16 relative overflow-y-auto lg:overflow-hidden">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 w-full">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/5">
                   <Zap className="text-primary-blue w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black uppercase tracking-tighter text-white/50 leading-none mb-1">Skill Forge Host</h2>
                   <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{quiz.title}</h1>
                </div>
             </div>
              <div className="bg-white/5 border border-white/10 px-8 py-3 rounded-2xl flex items-center gap-6">
                 <div className="flex items-center gap-3">
                    <Users className="text-primary-blue w-4 h-4" />
                    <span className="text-[12px] font-black text-white">{joinCount} JOINED</span>
                 </div>
                 <div className="w-1 h-3 bg-white/10" />
                 <div className="flex items-center gap-3">
                    <Monitor className="text-white/40 w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">TV DISPLAY ACTIVE</span>
                 </div>
                 <div className="w-1 h-3 bg-white/10" />
                 <span className="text-xs font-black tracking-[0.2em]">{code}</span>
              </div>
          </header>

          <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full space-y-16 py-10 relative">
             <AnimatePresence mode="wait">
                {status === 'lobby' && (
                  <motion.div
                    key="lobby"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12 text-center"
                  >
                     <div className="space-y-4">
                        <div className="p-8 w-fit mx-auto bg-primary-blue/10 rounded-[60px] border border-primary-blue/20 mb-8 animate-pulse">
                           <Users size={120} className="text-primary-blue" />
                        </div>
                        <h1 className="text-8xl font-black tracking-tighter uppercase leading-none">JOIN THE NODE</h1>
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.6em]">Scanning for synchronized candidate signals</p>
                     </div>

                     <div className="flex flex-wrap justify-center gap-3 px-20">
                        {presentUsers.map((user, i) => (
                          <motion.div
                            key={user.id + i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-primary-blue/10 border border-primary-blue/20 px-6 py-3 rounded-2xl flex items-center gap-3"
                          >
                             <div className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-pulse" />
                             <span className="text-[10px] font-black text-primary-blue uppercase tracking-widest">{user.full_name}</span>
                          </motion.div>
                        ))}
                        {presentUsers.length === 0 && (
                          <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] animate-pulse">Waiting for neural handshake...</div>
                        )}
                     </div>

                     <div className="bg-white text-[#0F172A] p-12 rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Protocol Access Key</span>
                        <span className="text-9xl font-black tracking-widest leading-none">{code}</span>
                     </div>

                     <button 
                       onClick={startQuiz}
                       className="bg-[#2563EB] hover:bg-blue-700 px-20 py-8 rounded-[32px] text-lg font-black uppercase tracking-[0.4em] transition-all flex items-center gap-6 mx-auto group"
                     >
                        <span>Start Synchronization</span>
                        <PlayCircle size={32} className="group-hover:translate-x-1 duration-300" />
                     </button>
                  </motion.div>
                )}

                {status === 'showing-question' && currentQuestion && (
                   <motion.div
                     key="question"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, x: -50 }}
                     className="space-y-12"
                   >
                      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-10 rounded-[48px] backdrop-blur-3xl overflow-hidden relative group">
                         <div className="relative z-10 space-y-4 max-w-[80%]">
                            <span className="text-primary-blue text-sm font-black uppercase tracking-[0.4em] mb-4 block">Question Analysis 0{quiz.current_question_index + 1}</span>
                            <h2 className="text-6xl font-black leading-tight tracking-tight uppercase">{currentQuestion.content || currentQuestion.question_text}</h2>
                         </div>
                         <div className="relative z-10">
                            <div className="w-40 h-40 rounded-full border-8 border-primary-blue/20 flex flex-col items-center justify-center relative bg-[#0F172A] shadow-inner">
                               <span className="text-[10px] font-black text-white/40 mb-1">SEC</span>
                               <span className="text-5xl font-black tabular-nums">{timer}</span>
                               <motion.div 
                                 initial={{ rotate: 0 }}
                                 animate={{ rotate: 360 }}
                                 transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                                 className="absolute inset-0 border-8 border-transparent border-t-primary-blue rounded-full" 
                               />
                            </div>
                         </div>
                      </div>

                      {showOptions ? (
                        <div className="grid grid-cols-2 gap-8">
                           {currentQuestion.options?.map((opt, idx) => {
                               const colors = ['bg-[#2563EB]', 'bg-[#EF4444]', 'bg-[#F59E0B]', 'bg-[#10B981]'];
                               const labels = ['A', 'B', 'C', 'D'];
                               return (
                                  <div key={idx} className="flex items-center gap-6 p-8 bg-white/5 border border-white/10 rounded-[40px] transition-all group overflow-hidden relative">
                                     <div className={`${colors[idx]} w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl shadow-xl relative z-10`}>
                                        {labels[idx]}
                                     </div>
                                     <span className="text-2xl font-bold tracking-tight opacity-70 relative z-10">{opt}</span>
                                     <div className={`absolute left-0 top-0 bottom-0 w-2 ${colors[idx]} opacity-40`} />
                                  </div>
                               )
                           })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-dashed border-white/10 rounded-[48px] animate-pulse">
                           <div className="flex items-center gap-4 text-primary-blue text-sm font-black uppercase tracking-[0.5em] mb-4">
                              <Zap className="animate-spin" />
                              <span>BROADCAST SYNC IN PROGRESS</span>
                           </div>
                           <p className="text-white/40 text-sm font-black uppercase tracking-[0.3em]">Auditing Node Intelligence. Options initializing in 3s...</p>
                        </div>
                      )}
                   </motion.div>
                )}

                {status === 'showing-results' && currentQuestion && (
                   <motion.div
                     key="results"
                     initial={{ opacity: 0, y: 40 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     className="space-y-16 text-center py-10"
                   >
                      <div className="space-y-4">
                         <div className="w-24 h-24 bg-emerald-500/10 rounded-[40px] border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                            <CircleCheck className="text-emerald-500 w-12 h-12" />
                         </div>
                         <h1 className="text-5xl font-black uppercase tracking-tighter opacity-40 leading-none">Correct Intelligence Point</h1>
                         <h2 className="text-8xl font-black leading-tight tracking-tight uppercase text-emerald-400">
                            {currentQuestion.options?.[['A','B','C','D'].indexOf(currentQuestion.correct_answer)] || currentQuestion.correct_answer}
                         </h2>
                      </div>

                      <button 
                        onClick={nextQuestion}
                        className="bg-white text-[#0F172A] px-20 py-8 rounded-[32px] text-lg font-black uppercase tracking-[0.4em] transition-all flex items-center gap-6 mx-auto hover:bg-primary-blue hover:text-white group"
                      >
                         <span>Initialize Next Sync</span>
                         <ArrowRight size={32} className="group-hover:translate-x-1 duration-300" />
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
                      <div className="space-y-6">
                         <Trophy size={160} className="text-amber-400 mx-auto drop-shadow-[0_0_50px_rgba(251,191,36,0.3)]" />
                         <h1 className="text-9xl font-black tracking-[0.1em] uppercase leading-none">ELITE NODE ESTABLISHED</h1>
                         <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.6em]">All protocol datasets have been successfully processed</p>
                      </div>

                      <div className="flex gap-4 justify-center">
                         <button 
                           onClick={() => setStatus('lobby')}
                           className="bg-white/10 hover:bg-white/20 border border-white/10 px-12 py-5 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all"
                         >
                           Reset Session
                         </button>
                         <button 
                           onClick={() => router.push('/quiz/admin')}
                           className="bg-primary-blue hover:bg-blue-600 px-12 py-5 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl"
                         >
                           Archive Result
                         </button>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </main>

          <footer className="absolute bottom-10 left-16 right-16 flex justify-between items-center">
             <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Skill Forge Neutral Network v4.2</div>
             <div className="flex items-center gap-8">
                <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-full flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black tracking-widest text-white/40">SIGNAL STRENGTH: 98%</span>
                </div>
             </div>
          </footer>
       </div>

        {/* Real-time Leaderboard (25% width) - RIGHT SIDEBAR */}
        <div className="w-full lg:w-[450px] bg-white text-[#0F172A] flex flex-col p-8 md:p-12 overflow-hidden relative shadow-[-50px_0_100px_rgba(0,0,0,0.2)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-blue/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 mb-12">
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl">
                   <Medal className="text-primary-blue w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Elite Registry</h3>
             </div>
             <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] leading-none mb-4">Global Ranking Matrix</p>
             <div className="w-full h-1 bg-gray-50 flex">
                <div className="w-1/3 h-full bg-primary-blue" />
             </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-4 scrollbar-hide py-4 relative z-10">
             <AnimatePresence>
                {leaderboard.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                     <Users size={48} className="mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase">Scanning Participation</p>
                  </div>
                ) : leaderboard.map((player, index) => (
                   <motion.div
                     key={player.id}
                     layout
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={`flex items-center justify-between p-6 rounded-[32px] border ${
                       index === 0 ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-2xl scale-[1.05]' : 
                       'bg-white border-[#E2E8F0]'
                     } transition-all`}
                   >
                      <div className="flex items-center gap-5">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                           index === 0 ? 'bg-amber-400 text-[#0F172A]' : 
                           index === 1 ? 'bg-slate-100 text-slate-500' : 
                           index === 2 ? 'bg-orange-50 text-orange-600' : 
                           'bg-gray-50 text-gray-400'
                         }`}>
                           {index + 1}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">
                              {player.full_name}
                            </span>
                            <span className={`text-[9px] font-black uppercase opacity-40 ${index === 0 ? 'text-blue-200' : ''}`}>Node Authorized</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className={`text-2xl font-black tabular-nums ${index === 0 ? 'text-amber-400' : 'text-[#0F172A]'}`}>
                           {player.total_score}
                         </span>
                         <p className="text-[9px] font-black uppercase opacity-30 mt-1">PTS</p>
                      </div>
                   </motion.div>
                ))}
             </AnimatePresence>
          </div>

           {/* Top Performer Card */}
           <div className="mt-auto bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-[32px] flex items-center gap-6 group">
              <div className="w-14 h-14 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                 <Award className="text-primary-blue w-8 h-8" />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-black text-primary-blue uppercase tracking-[0.3em] mb-1">Top Performer</p>
                 <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-tight">
                    {leaderboard[0]?.full_name || "Searching..."}
                 </h3>
              </div>
           </div>

           {/* Admin Controls */}
           <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={resetQuiz}
                className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
              >
                <Zap size={14} />
                <span>Recalibrate Protocol Node</span>
              </button>
           </div>
        </div>

          <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[20%] bg-primary-blue opacity-[0.02] blur-[100px] -rotate-12 pointer-events-none" />
       </div>
    );
 }
