import { createContext, useContext, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: ["turn:98.94.118.105:3478", "turn:98.94.118.105:3478?transport=tcp"], username: "rstuser", credential: "rstpass123" },
  ],
};

interface RemoteClient { socketId: string; userName: string; stream: MediaStream | null; }

interface SessionContextType {
  roomId: string;
  isInSession: boolean;
  connectionState: "idle" | "connecting" | "connected" | "disconnected";
  remoteStream: MediaStream | null;
  remoteClients: RemoteClient[];
  localStream: MediaStream | null;
  technicianName: string;
  startSession: (roomId: string, userName: string) => Promise<void>;
  joinSession: (roomId: string, userName: string) => Promise<void>;
  endSession: () => void;
  sendControl: (event: string, data: object) => void;
  agentConnected: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState(() => sessionStorage.getItem("rst_room") || "");
  const [isInSession, setIsInSession] = useState(() => !!sessionStorage.getItem("rst_room"));
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteClients, setRemoteClients] = useState<RemoteClient[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [technicianName, setTechnicianName] = useState("");
  const [agentConnected, setAgentConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const cleanup = useCallback(() => {
    pcsRef.current.forEach(pc => pc.close());
    pcsRef.current.clear();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setRemoteStream(null);
    setRemoteClients([]);
    setLocalStream(null);
    setConnectionState("idle");
    sessionStorage.removeItem("rst_room");
    sessionStorage.removeItem("rst_role");
  }, []);

  const sendControl = useCallback((event: string, data: object) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const createPC = useCallback((roomId: string, socket: Socket, targetSocketId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setRemoteClients(prev => prev.map(c => c.socketId === targetSocketId ? { ...c, stream: e.streams[0] } : c));
      setConnectionState("connected");
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { roomId, candidate: e.candidate, targetSocketId });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnectionState("connected");
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        pcsRef.current.delete(targetSocketId);
        setRemoteClients(prev => prev.filter(c => c.socketId !== targetSocketId));
        if (pcsRef.current.size === 0) { setConnectionState("disconnected"); setRemoteStream(null); }
      }
    };
    pcsRef.current.set(targetSocketId, pc);
    return pc;
  }, []);

  const startSession = useCallback(async (roomId: string, userName: string) => {
    try {
      setConnectionState("connecting");
      setRoomId(roomId);
      setIsInSession(true);
      sessionStorage.setItem("rst_room", roomId);
      sessionStorage.setItem("rst_role", "technician");

      const socket = io(SOCKET_URL, { transports: ["polling", "websocket"] });
      socketRef.current = socket;

      socket.on("user-joined", async ({ socketId, role: joinedRole, userName: clientName }: { socketId: string, role: string, userName: string }) => {
        if (joinedRole === "client") {
          setRemoteClients(prev => [...prev.filter(c => c.socketId !== socketId), { socketId, userName: clientName || "Client", stream: null }]);
          const pc = createPC(roomId, socket, socketId);
          pc.addTransceiver("video", { direction: "recvonly" });
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { roomId, offer, targetSocketId: socketId });
        }
      });

      socket.on("answer", async ({ answer, from }: { answer: RTCSessionDescriptionInit, from: string }) => {
        const pc = pcsRef.current.get(from);
        if (pc) await pc.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", async ({ candidate, from }: { candidate: RTCIceCandidateInit, from: string }) => {
        const pc = pcsRef.current.get(from);
        if (pc) try { await pc.addIceCandidate(candidate); } catch(e) { console.error(e); }
      });

      socket.on("agent-connected", () => setAgentConnected(true));
      socket.on("agent-disconnected", () => setAgentConnected(false));

      socket.on("user-left", ({ socketId }: { socketId: string }) => {
        pcsRef.current.get(socketId)?.close();
        pcsRef.current.delete(socketId);
        setRemoteClients(prev => prev.filter(c => c.socketId !== socketId));
        if (pcsRef.current.size === 0) { setConnectionState("disconnected"); setRemoteStream(null); }
      });

      socket.emit("join-room", { roomId, role: "technician", userName });
    } catch (err) {
      console.error("startSession error:", err);
      setConnectionState("disconnected");
    }
  }, [createPC]);

  const joinSession = useCallback(async (roomId: string, userName: string) => {
    try {
      setConnectionState("connecting");
      setRoomId(roomId);
      setIsInSession(true);
      sessionStorage.setItem("rst_room", roomId);
      sessionStorage.setItem("rst_role", "client");

      const socket = io(SOCKET_URL, { transports: ["polling", "websocket"] });
      socketRef.current = socket;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, displaySurface: "monitor" }, audio: false,
      });
      setLocalStream(stream);
      stream.getVideoTracks()[0].onended = () => cleanup();

      socket.on("technician-info", ({ userName: techName }: { userName: string }) => {
        setTechnicianName(techName || "Admin");
        setConnectionState("connected");
      });

      socket.on("offer", async ({ offer, from }: { offer: RTCSessionDescriptionInit, from: string }) => {
        const pc = createPC(roomId, socket, from);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer, targetSocketId: from });
      });

      socket.on("ice-candidate", async ({ candidate, from }: { candidate: RTCIceCandidateInit, from: string }) => {
        const pc = pcsRef.current.get(from);
        if (pc) try { await pc.addIceCandidate(candidate); } catch(e) { console.error(e); }
      });

      socket.on("user-left", () => setConnectionState("disconnected"));
      socket.emit("join-room", { roomId, role: "client", userName });
    } catch (err) {
      console.error("joinSession error:", err);
      setConnectionState("disconnected");
    }
  }, [createPC, cleanup]);

  const endSession = useCallback(() => {
    cleanup();
    setRoomId("");
    setIsInSession(false);
  }, [cleanup]);

  return (
    <SessionContext.Provider value={{ roomId, isInSession, connectionState, remoteStream, remoteClients, localStream, technicianName, startSession, joinSession, endSession, sendControl, agentConnected }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
// Note: sendControl is exported via context below - see replacement needed
