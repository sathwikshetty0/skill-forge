"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  BarChart3, 
  BookText, 
  Users2 as UsersIcon, 
  FileBox, 
  LogOut, 
  Plus, 
  Activity, 
  FileText, 
  LayoutDashboard,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  Trophy,
  History,
  Zap,
  Lock,
  Medal,
  Dna,
  X,
  Clock,
  Target,
  BarChart,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Menu,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState("user");

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
    if (sessionCookie) {
      setRole(sessionCookie.split('=')[1]);
    }
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    document.cookie = "mock_session=; path=/; max-age=0;";
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isAdmin = role === "admin";

  const adminItems = [
    { href: "/quiz/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/quiz/admin/quizzes", label: "Protocols", icon: FileText },
    { href: "/quiz/admin/users", label: "Users", icon: Users },
    { href: "/quiz/admin/security", label: "Security", icon: ShieldCheck },
    { href: "/dashboard/reports", label: "Reports", icon: FileText },
  ];

  const candidateItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/quiz/access", label: "Protocols", icon: FileText },
    { href: "/dashboard/reports", label: "Reports", icon: FileText },
  ];

  const navItems = isAdmin ? adminItems : candidateItems;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-[60] lg:hidden p-4 bg-white rounded-2xl shadow-2xl shadow-blue-200 text-[#0F172A] border border-[#f1f5f9] active:scale-90 transition-transform"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-[#0F172A]/20 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-[#E8EDF2] flex flex-col z-[58] transition-transform duration-500 ease-in-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Logo */}
        <div className="px-10 h-24 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#2563EB] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl text-[#0F172A] tracking-tighter">Skill Forge</span>
        </div>

        {/* User Role Indicator */}
        <div className="px-8 mb-6">
           <div className={`p-4 rounded-[24px] border ${isAdmin ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100"} flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full ${isAdmin ? "bg-primary-blue animate-pulse" : "bg-slate-400"}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? "text-primary-blue" : "text-slate-500"}`}>
                {isAdmin ? "Superuser Access" : "Candidate Station"}
              </span>
           </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-6 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-6 py-4 transition-all text-sm font-black uppercase tracking-widest ${
                  isActive 
                    ? "bg-[#2563EB] text-white rounded-[22px] shadow-2xl shadow-blue-200" 
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-[22px]"
                }`}
              >
                <div className="flex items-center gap-5">
                  <item.icon size={20} className={isActive ? "text-white" : "text-[#94A3B8]"} />
                  <span className="flex-1">{item.label}</span>
                </div>
                {isActive && (
                   <motion.div layoutId="active" className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile/Logout */}
        <div className="p-8 border-t border-[#f1f5f9]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-5 text-xs font-black text-[#E11D48] hover:bg-rose-50 rounded-[22px] transition-all uppercase tracking-[0.2em] group"
          >
             <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
             <span>Terminate Sync</span>
          </button>
        </div>
      </aside>
    </>
  );
}
