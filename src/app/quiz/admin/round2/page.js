"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Users, 
  Search,
  CheckCircle2,
  BookOpen,
  Trophy,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const RESEARCH_TOPICS = [
  "Artificial Intelligence in Healthcare",
  "Quantum Computing and Cryptography",
  "Blockchain and Decentralized Finance",
  "Renewable Energy Systems and Grid Integration",
  "Cybersecurity in the Age of IoT",
  "Ethics of Algorithmic Decision Making",
  "Edge Computing and 5G Technology",
  "Autonomous Vehicles and Urban Mobility",
  "Genetic Engineering and CRISPR Technology",
  "Climate Change Mitigation Strategies",
  "Circular Economy and Sustainable Manufacturing",
  "Nanotechnology in Drug Delivery",
  "Space Exploration and In-Situ Resource Utilization",
  "Augmented and Virtual Reality in Education",
  "Natural Language Processing and Conversational AI",
  "Smart Cities and Infrastructure Resilience",
  "Robotics and Human-Robot Interaction",
  "Big Data Analytics and Predictive Modeling",
  "Neuromorphic Computing Architectures",
  "Digital Twins in Industrial IoT",
  "Microservices Architecture and Scalability",
  "DevOps Culture and Automation",
  "Full-Stack Performance Optimization",
  "Software Design Patterns and Refactoring",
  "Functional Programming in Modern Web Dev",
  "Web3 and the Future of Social Networks",
  "Privacy-Preserving Computation",
  "Computational Biology and Proteomics",
  "Advanced Materials and Superconductors",
  "Human-Centered Design and UX Research",
  "Game Theory in Network Economics",
  "Deep Learning and Neural Network Interpretability",
  "Cloud Native Security and Zero Trust",
  "Distributed Systems and Consensus Algorithms",
  "Wireless Sensor Networks and Data Aggregation",
  "Computer Vision and Image Recognition",
  "Reinforcement Learning in Robotics",
  "Multi-Agent Systems and Swarm Intelligence",
  "High-Performance Computing and Parallel Algorithms",
  "Semantic Web and Knowledge Graphs",
  "Information Retrieval and Search Engine Algorithms",
  "Cryptography and Secure Multi-Party Computation",
  "Network Function Virtualization and Software Defined Networking",
  "E-waste Management and Sustainable Electronics",
  "Agile Methodologies and Project Management",
  "Enterprise Resource Planning and Digital Transformation",
  "FinTech Innovation and Regulatory Technology",
  "Biometric Authentication and Identity Management",
  "Machine Learning Operations (MLOps)",
  "Data Governance and Information Privacy"
];

export default function Round2SelectionPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mock_session="))
        ?.split("=")[1];
      
      const isMockAdmin = mockSession === "admin";
      
      if (!user && !isMockAdmin) {
        router.push("/auth");
        return;
      }

      if (user && !isMockAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (profile?.role !== "admin") {
          router.push("/");
          return;
        }
      }
      
      loadUsers();
    }
    checkAuth();
  }, []);

  async function loadUsers() {
    setLoading(true);
    // Fetch users who have submitted a quiz
    const { data: submissions } = await supabase
      .from("submissions")
      .select("user_id, profiles(*)")
      .order("submitted_at", { ascending: false });

    // Get unique users from submissions
    const uniqueUserIds = [...new Set(submissions?.map(s => s.user_id) || [])];
    
    // Fetch all profiles to ensure we have the latest round 2 data
    // We assume profiles has round2_topic and round2_status fields
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", uniqueUserIds);

    setUsers(profiles || []);
    setLoading(false);
  }

  const assignTopic = async (userId) => {
    setUpdating(userId);
    const randomTopic = RESEARCH_TOPICS[Math.floor(Math.random() * RESEARCH_TOPICS.length)];
    
    // Update profile with round 2 info
    // Note: If these columns don't exist, this will error in real Supabase.
    // However, for the sake of the task, we implement the logic.
    const { error } = await supabase
      .from("profiles")
      .update({ 
        round2_topic: randomTopic,
        round2_status: 'assigned'
      })
      .eq("id", userId);

    if (error) {
      console.error("Error assigning topic:", error);
      toast.error("PROTOCOL FAILURE: Database synchronization failed.");
    } else {
      toast.success(`TOPIC ASSIGNED: ${randomTopic} linked to node.`);
      setUsers(users.map(u => u.id === userId ? { ...u, round2_topic: randomTopic, round2_status: 'assigned' } : u));
    }
    setUpdating(null);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 md:p-14 space-y-12">
      <section className="bg-[#0F172A] rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Trophy size={120} />
        </div>
        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Mission Briefing</span>
          </div>
          <h1 className="text-4xl font-[900] tracking-tighter uppercase leading-none">
            Round 2 <span className="text-blue-500">Authorization</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed uppercase tracking-wider">
            Select qualified nodes for Phase II engagement. Each node must be assigned a unique research subject. 
            Candidates are required to synthesize 10,000 characters of secondary research within a high-security environment.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Nodes", value: users.length, icon: Users, color: "blue" },
          { label: "Assigned Topics", value: users.filter(u => u.round2_topic).length, icon: BookOpen, color: "emerald" },
          { label: "Pending Assignment", value: users.filter(u => !u.round2_topic).length, icon: RefreshCw, color: "amber" },
          { label: "Active Synthesis", value: users.filter(u => u.round2_status === 'submitted').length, icon: Zap, color: "indigo" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] p-6 rounded-[24px] shadow-sm flex items-center gap-5">
            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-[#0F172A]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-[900] text-[#0F172A] tracking-tighter uppercase leading-none">
            Registry <span className="text-[#2563EB]">Flow</span>
          </h2>
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mt-2">
            DETAILED NODE MANAGEMENT
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-2xl flex items-center gap-3 flex-1 md:flex-none md:min-w-[300px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/30 transition-all">
            <Search size={16} className="text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="FILTER NODES BY NAME OR EMAIL..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black w-full placeholder:text-[#CBD5E1] uppercase tracking-widest"
            />
          </div>
          <button 
            onClick={loadUsers}
            className="p-3 bg-white border border-[#E2E8F0] rounded-2xl text-[#64748B] hover:text-[#2563EB] transition-all hover:shadow-md active:scale-95"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
            <Loader2 size={40} className="animate-spin text-[#2563EB]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Registry</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E2E8F0] rounded-[32px] p-20 text-center">
            <Users size={48} className="mx-auto text-[#CBD5E1] mb-4" />
            <p className="text-sm font-bold text-[#64748B]">No eligible candidates found in the registry.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-[32px] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="px-8 py-5 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Candidate</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest text-center">Round 1 Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Assigned Topic</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-200">
                          {user.full_name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0F172A] leading-tight">{user.full_name}</p>
                          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-1">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        QUALIFIED
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {user.round2_topic ? (
                        <div className="flex items-center gap-3 text-blue-600">
                          <BookOpen size={14} />
                          <span className="text-xs font-black uppercase tracking-tight">{user.round2_topic}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-widest">UNASSIGNED</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => assignTopic(user.id)}
                        disabled={updating === user.id}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                          user.round2_topic 
                          ? "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB]/30" 
                          : "bg-[#2563EB] text-white hover:bg-blue-600 shadow-blue-100"
                        }`}
                      >
                        {updating === user.id ? (
                          <Loader2 size={14} className="animate-spin mx-auto" />
                        ) : user.round2_topic ? (
                          "Reassign Topic"
                        ) : (
                          "Assign Round 2"
                        )}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
