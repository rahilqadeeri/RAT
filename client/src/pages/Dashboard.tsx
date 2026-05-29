import { useAuth } from "../context/AuthContext";
import {
  Monitor, Users, Activity, Clock, Shield, TrendingUp,
  ArrowUpRight, Circle, CheckCircle2, AlertCircle
} from "lucide-react";

const STATS = [
  { label: "Active Sessions",   value: "0",  icon: Monitor,    color: "text-brand-400",   bg: "bg-brand-500/10"  },
  { label: "Total Users",       value: "1",  icon: Users,      color: "text-emerald-400", bg: "bg-emerald-500/10"},
  { label: "Sessions Today",    value: "0",  icon: Activity,   color: "text-amber-400",   bg: "bg-amber-500/10"  },
  { label: "Avg Duration",      value: "—",  icon: Clock,      color: "text-violet-400",  bg: "bg-violet-500/10" },
];

const RECENT: { id: string; client: string; tech: string; status: "active"|"ended"|"waiting"; time: string }[] = [];

const STATUS_MAP = {
  active:  { label: "Active",  icon: Circle,       cls: "text-emerald-400" },
  ended:   { label: "Ended",   icon: CheckCircle2, cls: "text-slate-500"   },
  waiting: { label: "Waiting", icon: AlertCircle,  cls: "text-amber-400"   },
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Namaste, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
        <span className={`badge text-xs ${
          user?.role === "technician"
            ? "bg-brand-500/15 text-brand-300"
            : "bg-emerald-500/15 text-emerald-300"
        }`}>
          <Shield size={12} />
          {user?.role === "technician" ? "Technician" : "Client"}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <TrendingUp size={14} className="text-slate-600" />
            </div>
            <div className="text-2xl font-semibold text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Sessions table */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-medium text-slate-200 flex items-center gap-2">
            <Activity size={16} className="text-brand-400" /> Recent Sessions
          </h2>
          <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            Sab dekho <ArrowUpRight size={12} />
          </button>
        </div>

        {RECENT.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
              <Monitor size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Koi session nahi abhi</p>
            <p className="text-slate-600 text-sm mt-1">
              {user?.role === "technician"
                ? "Jab client connect karega, yahan dikhega"
                : "Nayi session start karo help ke liye"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Session ID","Client","Technician","Status","Time"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT.map(s => {
                const { label, icon: SIcon, cls } = STATUS_MAP[s.status];
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{s.id}</td>
                    <td className="px-5 py-3 text-slate-200">{s.client}</td>
                    <td className="px-5 py-3 text-slate-400">{s.tech}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 ${cls}`}>
                        <SIcon size={12} /> {label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{s.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 border-dashed border-white/5 hover:border-brand-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 group-hover:bg-brand-500/20 flex items-center justify-center transition-colors">
              <Monitor size={20} className="text-brand-400" />
            </div>
            <div>
              <div className="font-medium text-slate-200 text-sm">New Session Start karo</div>
              <div className="text-xs text-slate-500 mt-0.5">Client ke screen pe remote access lo</div>
            </div>
            <ArrowUpRight size={16} className="text-slate-600 group-hover:text-brand-400 ml-auto transition-colors" />
          </div>
        </div>

        <div className="card p-5 border-dashed border-white/5 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
              <Users size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="font-medium text-slate-200 text-sm">Users Manage karo</div>
              <div className="text-xs text-slate-500 mt-0.5">Technicians aur clients dekho</div>
            </div>
            <ArrowUpRight size={16} className="text-slate-600 group-hover:text-emerald-400 ml-auto transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
