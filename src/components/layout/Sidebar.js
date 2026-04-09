"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, 
  FileText, 
  LayoutDashboard,
  Zap,
  ShieldCheck,
  Menu,
  X,
  Users,
  Settings,
  Activity,
  Trophy,
  History
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useSidebar } from "@/context/SidebarContext";
import Link from "next/link";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isExpanded, setIsExpanded } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState("user");
  const [userName, setUserName] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        if (profile) setUserName(profile.full_name);
      }
      
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
      if (sessionCookie) {
        setRole(sessionCookie.split('=')[1]);
      }
      setIsMounted(true);
    }
    init();
  }, []);

  if (!isMounted) return null;

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    document.cookie = "mock_session=; path=/; max-age=0;";
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isAdmin = role === "admin" || role === "evaluator";

  const adminItems = [
    { href: "/quiz/admin", label: "Control Center", icon: LayoutDashboard },
    { href: "/quiz/admin/quizzes", label: "Protocols", icon: FileText },
    { href: "/quiz/admin/users", label: "Node Registry", icon: Users },
    { href: "/dashboard/reports", label: "Reports", icon: Activity },
    { href: "/quiz/admin/security", label: "Security Audit", icon: ShieldCheck },
  ];

  const candidateItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/quiz/access", label: "Protocol", icon: Zap },
    { href: "/dashboard/reports", label: "Reports", icon: Activity },
  ];

  const navItems = isAdmin ? adminItems : candidateItems;

  return (
    <motion.aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      initial={false}
      animate={{ 
        width: isExpanded ? 240 : 72
      }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="fixed left-0 top-0 bottom-0 bg-white border-r border-[#F1F5F9] hidden lg:flex flex-col z-[65] overflow-hidden"
    >
        {/* Logo Section */}
        <div className="h-24 flex items-center px-4 relative z-10">
           <div className="flex items-center gap-3.5 min-w-[200px]">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-100 flex-shrink-0"
              >
                <ShieldCheck className="w-6 h-6 text-white" />
              </motion.div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="font-[900] text-2xl text-[#0F172A] tracking-tight block leading-none">Skill Forge</span>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        <div className="px-4 mb-6 relative z-10 h-10">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div 
                key="expanded-chip"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#F8FAFC] rounded-full px-5 py-3 flex items-center gap-2.5 border border-[#F1F5F9] transition-all w-fit whitespace-nowrap"
              >
                  <div className="w-1 h-1 rounded-full bg-[#94A3B8]" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#94A3B8] leading-none">
                    {isAdmin ? "Evaluator Node" : "Candidate Station"}
                  </span>
              </motion.div>
            ) : (
              <motion.div 
                key="collapsed-chip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center w-10"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1 relative z-10 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname ? (pathname === item.href || (item.label !== "Dashboard" && item.label !== "Control Center" && pathname.startsWith(item.href))) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center transition-all rounded-full mx-1.5 group relative overflow-hidden h-[46px] ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                    : "text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
                style={{ width: isExpanded ? '228px' : '60px' }}
              >
                <div className={`flex items-center gap-5 px-0 w-full ${isExpanded ? "pl-5" : "justify-center"}`}>
                  <item.icon size={18} className={`${isActive ? "text-white" : "text-[#94A3B8] group-hover:text-blue-600"} transition-all duration-300 flex-shrink-0`} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] font-extrabold uppercase tracking-[0.2em] whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {isActive && isExpanded && (
                    <motion.div 
                      layoutId="active-indicator" 
                      className="ml-auto mr-5 w-1.2 h-1.2 bg-white rounded-full flex-shrink-0" 
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-[#F1F5F9] relative z-10 overflow-hidden mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-2 py-3 rounded-full transition-all group min-w-[240px]"
          >
             <div className="w-10 h-10 bg-[#334155] rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-lg relative group-hover:scale-110 transition-transform uppercase">
                <span>{userName?.[0] || role?.[0] || "N"}</span>
                <div className="absolute -right-0.5 -bottom-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                   <LogOut size={10} className="text-rose-500" />
                </div>
             </div>
             
             <AnimatePresence>
               {isExpanded && (
                 <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-4 text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] whitespace-nowrap"
                 >
                   Terminate Sync
                 </motion.span>
               )}
             </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    );
  }
