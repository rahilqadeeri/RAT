import { Activity, Construction } from "lucide-react";

export function Sessions() {
  return <ComingSoon title="Sessions" icon={Activity} desc="WebRTC screen sharing — Phase 3 mein aayega" />;
}

function ComingSoon({ title, icon: Icon, desc }: { title: string; icon: any; desc: string }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
          <Icon size={28} className="text-slate-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
        <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5 justify-center">
          <Construction size={13} /> {desc}
        </p>
      </div>
    </div>
  );
}

export function UsersPage() {
  return <ComingSoon title="Users" icon={Activity} desc="User management — Phase 2 ke baad mein aayega" />;
}

export function Logs() {
  return <ComingSoon title="Logs" icon={Activity} desc="Session recordings — Phase 5 mein aayega" />;
}

export function SettingsPage() {
  return <ComingSoon title="Settings" icon={Activity} desc="App settings — Coming soon" />;
}
