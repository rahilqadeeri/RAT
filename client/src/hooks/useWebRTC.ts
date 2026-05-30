import { useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: ["turn:98.94.118.105:3478", "turn:98.94.118.105:3478?transport=tcp"],
      username: "rstuser",
      credential: "rstpass123",
    },
  ],
};

interface UseWebRTCProps {
  roomId: string;
  role: string;
  userName?: string;
}

interface RemoteClient {
  socketId: string;
  userName: string;
  stream: MediaStream | null;
}

export default function useWebRTC({ role: _role, userName }: UseWebRTCProps) {
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteClients, setRemoteClients] = useState<RemoteClient[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [technicianName, setTechnicianName] = useState<string>("");

  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const roomRef = useRef<string>("");

  const cleanup = useCallback(() => {
    pcsRef.current.forEach(pc => pc.close());
    pcsRef.current.clear();
    socketRef.current?.disconnect();
    socketRef.current = null;
    sessionStorage.removeItem("rst_room");
    sessionStorage.removeItem("rst_role");
  }, []);

  const createPC = useCallback((roomId: string, socket: Socket, targetSocketId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ontrack = (e) => {
      console.log("ontrack fired!", e.streams);
      setRemoteStream(e.streams[0]);
      setRemoteClients(prev => prev.map(c =>
        c.socketId === targetSocketId ? { ...c, stream: e.streams[0] } : c
      ));
      setConnectionState("connected");
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: e.candidate, targetSocketId });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState, "for", targetSocketId);
      if (pc.connectionState === "connected") setConnectionState("connected");
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        pcsRef.current.delete(targetSocketId);
        setRemoteClients(prev => prev.filter(c => c.socketId !== targetSocketId));
        if (pcsRef.current.size === 0) setConnectionState("disconnected");
      }
    };

    pcsRef.current.set(targetSocketId, pc);
    return pc;
  }, []);

  const startSession = useCallback(async (roomId: string) => {
    try {
      setConnectionState("connecting");
      roomRef.current = roomId;
      sessionStorage.setItem("rst_room", roomId);
      sessionStorage.setItem("rst_role", "technician");

      const socket = io(SOCKET_URL, { transports: ["polling", "websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => console.log("Socket connected:", socket.id));

      socket.on("user-joined", async ({ socketId, role: joinedRole, userName: clientName }: { socketId: string, role: string, userName: string }) => {
        if (joinedRole === "client") {
          console.log("Client joined:", socketId);
          setRemoteClients(prev => [...prev.filter(c => c.socketId !== socketId), { socketId, userName: clientName || "Client", stream: null }]);
          setConnectionState("connecting");

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

      socket.on("user-left", ({ socketId }: { socketId: string }) => {
        pcsRef.current.get(socketId)?.close();
        pcsRef.current.delete(socketId);
        setRemoteClients(prev => prev.filter(c => c.socketId !== socketId));
        if (pcsRef.current.size === 0) {
          setConnectionState("disconnected");
          setRemoteStream(null);
        }
      });

      socket.emit("join-room", { roomId, role: "technician", userName: userName || "Admin" });
    } catch (err) {
      console.error("startSession error:", err);
      setConnectionState("disconnected");
    }
  }, [createPC, userName]);

  const joinSession = useCallback(async (roomId: string) => {
    try {
      setConnectionState("connecting");
      roomRef.current = roomId;
      sessionStorage.setItem("rst_room", roomId);
      sessionStorage.setItem("rst_role", "client");

      const socket = io(SOCKET_URL, { transports: ["polling", "websocket"] });
      socketRef.current = socket;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, displaySurface: "monitor" },
        audio: false,
      });
      setLocalStream(stream);

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

      socket.on("user-left", () => {
        setConnectionState("disconnected");
      });

      stream.getVideoTracks()[0].onended = () => cleanup();

      socket.emit("join-room", { roomId, role: "client", userName: "User" });
    } catch (err) {
      console.error("joinSession error:", err);
      setConnectionState("disconnected");
    }
  }, [createPC, cleanup]);

  const endSession = useCallback(() => { cleanup(); }, [cleanup]);

  return { startSession, joinSession, endSession, connectionState, remoteStream, remoteClients, localStream, technicianName };
}
