import { Link, useLocation, useNavigate } from "react-router-dom";
import { Monitor, LayoutDashboard, Users, Activity, FileText, Settings, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NAV = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/sessions",   label: "Sessions",   icon: Activity         },
  { to: "/users",      label: "Users",      icon: Users            },
  { to: "/logs",       label: "Logs",       icon: FileText         },
  { to: "/settings",   label: "Settings",   icon: Settings         },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logout ho gaye");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-surface-900/90 backdrop-blur-xl border-r border-white/5 flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-md shadow-brand-600/30">
            <Monitor size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100 leading-tight">RemoteSupport</div>
            <div className="text-[10px] text-slate-600 uppercase tracking-wider">v1.0</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`sidebar-link ${location.pathname === to ? "active" : ""}`}>
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {location.pathname === to && <ChevronRight size={13} className="opacity-50" />}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-800/50 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-300 text-sm font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
