import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, User, Zap } from 'lucide-react';
import { supabase } from '../supabase';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank?: number;
}

const LeaderboardPage: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaders = async () => {
    const { data } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(10);
    if (data) setLeaders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaders();

    // Subscribe to new responses to refresh leaderboard
    const ch = supabase
      .channel('realtime:responses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' }, () => {
        fetchLeaders();
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const sorted = [...leaders].sort((a, b) => b.score - a.score).map((l, i) => ({ ...l, rank: i + 1 }));

  return (
    <div className="min-h-screen flex flex-col relative bg-[#f8fafc]">
      <div className="absolute inset-0 opacity-[0.2] pointer-events-none"
           style={{ 
             backgroundImage: `radial-gradient(#3b82f6 0.5px, transparent 0.5px)`, 
             backgroundSize: '32px 32px' 
           }} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <div className="flex justify-center mt-6">
          <div className="bg-white border border-[#e2e8f0] rounded-full px-5 py-2 flex items-center gap-5 shadow-sm">
            <a href="/" className="text-[10px] tracking-[0.3em] text-[#64748b] font-bold uppercase hover:text-[#3b82f6] transition-colors">Home</a>
            <a href="#" className="text-[10px] tracking-[0.3em] text-[#64748b] font-bold uppercase hover:text-[#3b82f6] transition-colors">About</a>
            <a href="#" className="text-[10px] tracking-[0.3em] text-[#3b82f6] font-bold uppercase border-t-2 border-[#3b82f6] pt-1 -mt-1">Achievements</a>
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center px-8 pt-16">
          <div className="w-full max-w-4xl">
            <div className="flex flex-col items-center mb-14">
              <Trophy className="w-12 h-12 text-[#3b82f6] mb-4" />
              <h1 className="font-display text-4xl md:text-5xl font-black tracking-[0.1em] text-[#0f172a] uppercase mb-2">LEADERBOARD</h1>
              <p className="text-[10px] tracking-[0.4em] text-[#94a3b8] uppercase font-bold">REAL-TIME RANKING • SYSTEM SYNC: LIVE</p>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-[#e2e8f0] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <div className="flex px-10 py-6 border-b border-[#f1f5f9] bg-[#f8fafc]">
                <div className="w-20 font-display text-[9px] tracking-[0.3em] text-[#94a3b8] uppercase font-bold"># RANK</div>
                <div className="flex-1 font-display text-[9px] tracking-[0.3em] text-[#94a3b8] uppercase font-bold flex items-center gap-2">
                  <User className="w-3 h-3" /> PARTICIPANT
                </div>
                <div className="w-32 text-right font-display text-[9px] tracking-[0.3em] text-[#94a3b8] uppercase font-bold flex items-center justify-end gap-2">
                  <Zap className="w-3 h-3" /> SCORE
                </div>
              </div>

              <motion.div layout className="divide-y divide-[#f1f5f9]">
                <AnimatePresence>
                  {loading && leaders.length === 0 ? (
                    <div className="p-20 text-center text-[#94a3b8] font-display text-xs tracking-widest uppercase animate-pulse">Syncing session data...</div>
                  ) : sorted.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4, delay: idx * 0.08, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                      className={`flex px-10 py-7 items-center transition-colors group hover:bg-[#f8fafc] ${idx === 0 ? 'bg-[#3b82f6]/[0.02]' : ''}`}
                    >
                      <div className={`w-20 font-display text-xl font-black ${idx === 0 ? 'text-[#3b82f6]' : 'text-[#cbd5e1]'}`}>
                        {String(entry.rank).padStart(2, '0')}
                      </div>
                      <div className="flex-1 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-xs font-bold transition-all ${idx === 0 ? 'border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]' : 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] group-hover:border-[#3b82f6]/20 group-hover:text-[#3b82f6]'}`}>
                          {entry.name?.[0] || '?'}
                        </div>
                        <span className={`font-display text-sm font-bold tracking-[0.1em] ${idx === 0 ? 'text-[#0f172a]' : 'text-[#64748b] group-hover:text-[#0f172a]'}`}>{entry.name || 'Anonymous User'}</span>
                        {idx === 0 && <span className="text-[8px] px-2 py-0.5 bg-[#3b82f6] text-white font-bold rounded-lg tracking-wider uppercase">TOP</span>}
                      </div>
                      <div className="w-32 text-right">
                        <span className={`font-display text-2xl font-black ${idx === 0 ? 'text-[#0f172a]' : 'text-[#94a3b8] group-hover:text-[#0f172a]'}`}>
                          {entry.score.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LeaderboardPage;
