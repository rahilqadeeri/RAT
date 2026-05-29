import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor, Mail, Lock, User, ArrowRight, Loader2, Shield, Headphones } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Saare fields bharo"); return; }
    if (form.password.length < 6) { toast.error("Password minimum 6 characters ka hona chahiye"); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success("Account ban gaya!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Monitor size={20} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-100 tracking-tight">RemoteSupport</span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-slate-100 mb-1">Account banao</h1>
          <p className="text-slate-500 text-sm mb-8">Naya account register karo</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input-field pl-11" placeholder="Tumhara naam" value={form.name}
                  onChange={e => update("name", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" className="input-field pl-11" placeholder="email@example.com"
                  value={form.email} onChange={e => update("email", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" className="input-field pl-11" placeholder="Min 6 characters"
                  value={form.password} onChange={e => update("password", e.target.value)} />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Role chunno</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "technician", label: "Technician", desc: "Support dega", icon: Headphones },
                  { value: "client",     label: "Client",     desc: "Support lega",  icon: Shield     },
                ].map(({ value, label, desc, icon: Icon }) => (
                  <button key={value} type="button"
                    onClick={() => update("role", value)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      form.role === value
                        ? "border-brand-500 bg-brand-500/10 text-brand-300"
                        : "border-white/5 bg-surface-800 text-slate-400 hover:border-white/10"
                    }`}>
                    <Icon size={18} className="mb-2" />
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Account banao <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Pehle se account hai?{" "}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Login karo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
