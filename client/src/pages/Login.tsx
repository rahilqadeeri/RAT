import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Saare fields bharo"); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Monitor size={20} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-100 tracking-tight">RemoteSupport</span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Apne account mein login karo</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className="input-field pl-11"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  className="input-field pl-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Login <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Account nahi hai?{" "}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Register karo
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-slate-600 mt-4">
          Demo: admin@rst.com / password123
        </p>
      </div>
    </div>
  );
}
