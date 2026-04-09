"use client";

import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Zap, 
  Activity,
  LogOut
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState("user");

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
    if (sessionCookie) {
      setRole(sessionCookie.split('=')[1]);
    }
  }, []);

  const isAdmin = role === "admin" || role === "evaluator";

  const adminItems = [
    { href: "/quiz/admin", label: "Control", icon: LayoutDashboard },
    { href: "/quiz/admin/quizzes", label: "Protocols", icon: FileText },
    { href: "/quiz/admin/users", label: "Registry", icon: Users },
    { href: "/dashboard/reports", label: "Reports", icon: Activity },
  ];

  const candidateItems = [
    { href: "/dashboard", label: "Nexus", icon: LayoutDashboard },
    { href: "/quiz/access", label: "Protocol", icon: Zap },
    { href: "/dashboard/reports", label: "Reports", icon: Activity },
    { href: "/", label: "Logout", icon: LogOut, action: async () => {
      document.cookie = "mock_session=; path=/; max-age=0;";
      await supabase.auth.signOut();
      router.push("/");
    }},
  ];

  const navItems = isAdmin ? adminItems : candidateItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#F1F5F9] px-6 py-4 flex items-center justify-between z-[100] lg:hidden safe-area-bottom shadow-[0_-20px_50px_rgba(0,0,0,0.05)] rounded-t-[32px]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <button
            key={item.label}
            onClick={() => item.action ? item.action() : router.push(item.href)}
            className="flex flex-col items-center gap-1.5 px-3 relative"
          >
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "text-[#94A3B8]"
            }`}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              isActive ? "text-blue-600" : "text-[#94A3B8]"
            }`}>
              {item.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="mobile-nav-pill"
                className="absolute -top-4 w-1 h-1 bg-blue-600 rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
