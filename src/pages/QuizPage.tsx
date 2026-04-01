import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '../supabase';
import confetti from 'canvas-confetti';
import bgImage from '../assets/futuristic_bg.png';

interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'numerical' | 'multi';
  options?: string[];
  correct_answer: string;
  timer_limit: number;
}

const QuizPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState<string | string[]>('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const [violationMsg, setViolationMsg] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const navigate = useNavigate();
  const currentQ = questions[currentIdx];
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true);
      if (data) {
        setQuestions(data);
        setTimeLeft(data[0]?.timer_limit || 60);
      }
    };
    fetchQuestions();
  }, []);

  const handleViolation = (count: number, message: string) => {
    setViolations(count);
    setViolationMsg(message);
    setShowWarning(true);
    if (count >= 2) {
      handleSubmit();
      navigate('/leaderboard');
    }
  };

  useAntiCheating({ onViolation: handleViolation, violations });

  useEffect(() => {
    if (quizEnded) return;
    setTimeLeft(currentQ.timer_limit);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); handleNext(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx]);

  const handleSubmit = async () => {
    const points = Math.max(0, Math.floor(100 * (timeLeft / currentQ.timer_limit)));
    
    // Log response to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('responses').insert({
        user_id: user.id,
        question_id: currentQ.id,
        answer: Array.isArray(answer) ? answer.join(', ') : answer,
        points,
        time_taken: currentQ.timer_limit - timeLeft
      });
    }

    setTotalScore(prev => prev + points);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswer('');
    } else {
      setQuizEnded(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00f7ff', '#ffffff', '#00bac2'] });
      setTimeout(() => navigate('/leaderboard'), 3000);
    }
  };

  const handleNext = () => handleSubmit();

  const toggleMultiOption = (opt: string) => {
    setAnswer(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(opt) ? arr.filter(i => i !== opt) : [...arr, opt];
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative no-select bg-[#f8fafc]">
      <div className="fixed inset-0 opacity-[0.2] pointer-events-none"
           style={{ backgroundImage: `radial-gradient(#3b82f6 0.5px, transparent 0.5px)`, backgroundSize: '32px 32px' }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 flex flex-col items-center px-4 md:px-12 pt-12">
          <div className="w-full max-w-7xl">
            {/* Progress + Timer row - Enlarged */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-8">
              <div className="w-full md:w-auto">
                <p className="font-display text-xl tracking-[0.3em] text-[#64748b] uppercase font-black mb-6">
                  QUESTION {currentIdx + 1} / {questions.length}
                </p>
                <div className="flex gap-4">
                  {questions.map((_, i) => (
                    <div key={i} className={`h-2.5 grow md:w-24 rounded-full transition-all duration-700 ${i <= currentIdx ? 'bg-[#3b82f6] shadow-[0_4px_12px_rgba(59,130,246,0.3)]' : 'bg-[#e2e8f0]'}`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                <span className="text-sm tracking-[0.2em] text-[#94a3b8] uppercase font-black">REMAINING_TIME</span>
                <div className={`px-12 py-6 rounded-3xl border-2 shadow-sm ${timeLeft < 10 ? 'border-red-500 bg-red-50' : 'border-[#3b82f6]/30 bg-white'}`}>
                  <span className={`font-display text-6xl md:text-7xl font-black tracking-widest ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-[#0f172a]'}`}>
                    {String(timeLeft).padStart(2, '0')}<span className="text-2xl ml-2 text-[#94a3b8] font-black">S</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Question card - Enlarged */}
            <motion.div key={currentIdx} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              <div className="bg-white border border-[#e2e8f0] p-16 md:p-24 mb-12 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.05)]">
                <h2 className="font-display text-3xl md:text-5xl font-black text-[#0f172a] tracking-tight leading-tight mb-16 text-center md:text-left">
                  {currentQ.text}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {currentQ.type === 'mcq' && currentQ.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(opt)}
                      className={`w-full p-8 text-left rounded-3xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        answer === opt
                          ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-[#0f172a] shadow-[0_10px_30px_rgba(59,130,246,0.1)]'
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#3b82f6]/40 hover:text-[#0f172a] hover:bg-white'
                      }`}
                    >
                      <span className="text-xl md:text-2xl font-black tracking-tight uppercase">{opt}</span>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${answer === opt ? 'border-[#3b82f6] bg-[#3b82f6]' : 'border-[#e2e8f0]'}`}>
                        {answer === opt && <div className="w-4 h-4 bg-white rounded-full" />}
                      </div>
                    </button>
                  ))}

                  {currentQ.type === 'multi' && currentQ.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => toggleMultiOption(opt)}
                      className={`w-full p-8 text-left rounded-3xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        Array.isArray(answer) && answer.includes(opt)
                          ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-[#0f172a] shadow-[0_10px_30px_rgba(59,130,246,0.1)]'
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#3b82f6]/40 hover:text-[#0f172a] hover:bg-white'
                      }`}
                    >
                      <span className="text-xl md:text-2xl font-black tracking-tight uppercase">{opt}</span>
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center ${Array.isArray(answer) && answer.includes(opt) ? 'border-[#3b82f6] bg-[#3b82f6]' : 'border-[#e2e8f0]'}`}>
                        {Array.isArray(answer) && answer.includes(opt) && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {(currentQ.type === 'text' || currentQ.type === 'numerical') && (
                    <div className="mt-8">
                       <input
                        type={currentQ.type === 'numerical' ? 'number' : 'text'}
                        placeholder="Type your response here..."
                        value={Array.isArray(answer) ? '' : answer}
                        onChange={e => setAnswer(e.target.value)}
                        className="w-full bg-[#f8fafc] border-b-4 border-[#3b82f6]/20 p-10 rounded-3xl text-3xl md:text-5xl font-display font-black text-[#0f172a] tracking-tight outline-none focus:border-[#3b82f6] focus:bg-white transition-all placeholder:text-[#cbd5e1] text-center shadow-inner"
                      />
                    </div>
                  )}
              </div>

              {/* Huge Submit Button */}
              <div className="flex justify-center md:justify-end">
                <button
                  onClick={handleSubmit}
                  className="px-20 py-10 bg-[#0f172a] text-white font-display text-4xl tracking-[0.2em] font-black uppercase rounded-3xl hover:bg-[#1e293b] hover:shadow-[0_20px_50px_rgba(15,23,42,0.2)] hover:scale-105 active:scale-[0.97] transition-all flex items-center gap-6 cursor-pointer group"
                >
                  TRANSMIT <Send className="w-10 h-10 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 right-0 p-16 opacity-[0.03] pointer-events-none select-none">
        <h1 className="text-[300px] font-black uppercase leading-none text-[#0f172a]">IVC</h1>
      </div>
    </div>
  );
};

export default QuizPage;
