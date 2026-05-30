import { useState, useEffect, useRef, useCallback } from "react";
import { Monitor, PhoneOff, Copy, CheckCircle, Loader2, Maximize2, Minimize2, Users, Mouse, MousePointer } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function Sessions() {
  const { user } = useAuth();
  const { roomId, isInSession, connectionState, remoteStream, remoteClients, technicianName, startSession, joinSession, endSession, sendControl, agentConnected } = useSession();

  const [inputRoom, setInputRoom] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [controlEnabled, setControlEnabled] = useState(false);
  

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (remoteStream && fullscreenVideoRef.current) fullscreenVideoRef.current.srcObject = remoteStream;
  }, [remoteStream, isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) { setIsFullscreen(false); return; }
      if (!controlEnabled) return;
      e.preventDefault();
      sendControl("key-press", { roomId, key: e.key.toLowerCase(), modifier: e.ctrlKey ? "control" : e.altKey ? "alt" : e.shiftKey ? "shift" : null });
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, controlEnabled, roomId, sendControl]);

  useEffect(() => {
    if (remoteClients.length > 0 && !activeClient) setActiveClient(remoteClients[0].socketId);
  }, [remoteClients, activeClient]);

  // Agent connection status listen karo
  useEffect(() => {
    // SessionContext se agent events
  }, []);

  // Video pe mouse events — coordinates calculate karke bhejo
  const handleVideoMouseMove = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
    if (!controlEnabled) return;
    const video = e.currentTarget;
    const rect = video.getBoundingClientRect();
    const scaleX = (video.videoWidth || 1920) / rect.width;
    const scaleY = (video.videoHeight || 1080) / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    sendControl("mouse-move", { roomId, x, y });
  }, [controlEnabled, roomId, sendControl]);

  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
    if (!controlEnabled) return;
    const video = e.currentTarget;
    const rect = video.getBoundingClientRect();
    const scaleX = (video.videoWidth || 1920) / rect.width;
    const scaleY = (video.videoHeight || 1080) / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const button = e.button === 2 ? "right" : "left";
    sendControl("mouse-click", { roomId, x, y, button });
  }, [controlEnabled, roomId, sendControl]);

  const handleVideoDoubleClick = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
    if (!controlEnabled) return;
    const video = e.currentTarget;
    const rect = video.getBoundingClientRect();
    const scaleX = (video.videoWidth || 1920) / rect.width;
    const scaleY = (video.videoHeight || 1080) / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    sendControl("mouse-double-click", { roomId, x, y });
  }, [controlEnabled, roomId, sendControl]);

  const handleVideoScroll = useCallback((e: React.WheelEvent<HTMLVideoElement>) => {
    if (!controlEnabled) return;
    e.preventDefault();
    sendControl("mouse-scroll", { roomId, x: e.deltaX, y: e.deltaY, direction: e.deltaY > 0 ? "down" : "up" });
  }, [controlEnabled, roomId, sendControl]);

  const handleStart = async () => {
    const id = generateRoomId();
    await startSession(id, user?.name || user?.email || "Admin");
  };

  const handleJoin = async () => {
    if (!inputRoom.trim()) { toast.error("Session code daalo"); return; }
    await joinSession(inputRoom.trim().toUpperCase(), user?.name || "User");
  };

  const handleEnd = () => {
    endSession();
    setIsFullscreen(false);
    setActiveClient(null);
    setControlEnabled(false);
    setInputRoom("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("Code copy ho gaya!");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  if (!isInSession) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Remote Sessions</h1>
        <p className="text-slate-400 mb-8">Screen sharing aur remote control</p>
        {user?.role === "technician" ? (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Session Start Karo</h2>
            <button onClick={handleStart} className="btn-primary flex items-center gap-2">
              <Monitor size={18} /> Session Shuru Karo
            </button>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Session Join Karo</h2>
            <div className="flex gap-3">
              <input
                value={inputRoom}
                onChange={e => setInputRoom(e.target.value.toUpperCase())}
                placeholder="Session code daalo"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-400 transition-colors"
                maxLength={6}
              />
              <button onClick={handleJoin} className="btn-primary">Join</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <video
            ref={fullscreenVideoRef}
            autoPlay playsInline
            className={`w-full h-full object-contain ${controlEnabled ? "cursor-none" : "cursor-default"}`}
            onMouseMove={handleVideoMouseMove}
            onClick={handleVideoClick}
            onDoubleClick={handleVideoDoubleClick}
            onWheel={handleVideoScroll}
            onContextMenu={e => { e.preventDefault(); handleVideoClick(e as any); }}
          />
          <button onClick={toggleFullscreen} className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2 rounded-lg">
            <Minimize2 size={20} />
          </button>
          {controlEnabled && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              🖱️ Control Active — Esc to exit fullscreen
            </div>
          )}
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Session Code:</span>
            <span className="text-brand-400 font-bold text-lg">{roomId}</span>
            <button onClick={handleCopy} className="text-slate-400 hover:text-white">
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-sm ${connectionState === "connected" ? "text-green-400" : "text-yellow-400"}`}>
              {connectionState === "connected" ? "● Connected" : "○ Connecting..."}
            </div>
            <button onClick={handleEnd} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm">
              <PhoneOff size={16} /> End Session
            </button>
          </div>
        </div>

        {/* Technician View */}
        {user?.role === "technician" && (
          <div className="flex gap-4 flex-1">
            {remoteClients.length > 1 && (
              <div className="w-48 flex flex-col gap-2">
                <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Users size={12} /> Connected Clients</p>
                {remoteClients.map(client => (
                  <button
                    key={client.socketId}
                    onClick={() => { setActiveClient(client.socketId); if (client.stream && remoteVideoRef.current) remoteVideoRef.current.srcObject = client.stream; }}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeClient === client.socketId ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-2"></div>
                    {client.userName || "Client"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 card overflow-hidden">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></div>
                  <span className="text-sm text-slate-400">
                    {remoteClients.length === 0 ? "Client Screen" : `${remoteClients.find(c => c.socketId === activeClient)?.userName || "Client"} ki Screen`}
                  </span>
                  {remoteClients.length > 0 && (
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{remoteClients.length} connected</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Agent status */}
                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${agentConnected ? "bg-green-500/10 text-green-400" : "bg-white/5 text-slate-500"}`}>
                    <Mouse size={10} /> {agentConnected ? "Agent Ready" : "No Agent"}
                  </div>
                  {/* Control toggle */}
                  {agentConnected && (
                    <button
                      onClick={() => { setControlEnabled(p => !p); if (!controlEnabled) toast.success("Control enabled!"); else toast("Control disabled"); }}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${controlEnabled ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                    >
                      <MousePointer size={10} /> {controlEnabled ? "Control ON" : "Control OFF"}
                    </button>
                  )}
                  {remoteStream && (
                    <button onClick={toggleFullscreen} className="text-slate-400 hover:text-white p-1 rounded">
                      <Maximize2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative bg-surface-950 aspect-video flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay playsInline
                  className={`w-full h-full object-contain ${controlEnabled ? "cursor-none" : "cursor-default"}`}
                  onMouseMove={handleVideoMouseMove}
                  onClick={handleVideoClick}
                  onDoubleClick={handleVideoDoubleClick}
                  onWheel={handleVideoScroll}
                  onContextMenu={e => { e.preventDefault(); handleVideoClick(e as any); }}
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-brand-400 mb-3" />
                    <p className="text-slate-500 text-sm">Client ka wait kar rahe hain...</p>
                  </div>
                )}
                {controlEnabled && remoteStream && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
                    🖱️ Control Active
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Client View */}
        {user?.role === "client" && (
          <div className="flex-1 card p-6 flex flex-col items-center justify-center gap-4">
            <Monitor size={48} className="text-brand-400" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Screen Share Ho Rahi Hai</p>
              <p className="text-slate-400 text-sm mt-1">
                {connectionState === "connected"
                  ? `Aapki screen ${technicianName || "technician"} ke saath share ho rahi hai`
                  : "Technician se connect ho raha hai..."}
              </p>
            </div>
            <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full ${connectionState === "connected" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
              {connectionState === "connected" ? "● Connected" : "○ Connecting..."}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
