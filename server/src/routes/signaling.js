const rooms = new Map();
const agents = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ roomId, role, userName }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.role = role;
      socket.userName = userName || "Admin";

      if (!rooms.has(roomId)) rooms.set(roomId, { technician: null, clients: [] });
      const room = rooms.get(roomId);

      if (role === "technician") {
        room.technician = { socketId: socket.id, userName };
        room.clients.forEach(client => {
          io.to(socket.id).emit("user-joined", { socketId: client.socketId, role: "client", userName: client.userName });
        });
        // Agent already connected hai?
        if (agents.has(roomId)) {
          socket.emit("agent-connected", { roomId });
        }
      }

      if (role === "client") {
        room.clients.push({ socketId: socket.id, userName });
        if (room.technician) {
          socket.emit("technician-info", { userName: room.technician.userName });
          io.to(room.technician.socketId).emit("user-joined", { socketId: socket.id, role: "client", userName });
        }
      }
    });

    // Agent join
    socket.on("agent-join", ({ roomId }) => {
      agents.set(roomId, socket.id);
      socket.roomId = roomId;
      socket.isAgent = true;
      console.log(`Agent joined room: ${roomId}`);
      const room = rooms.get(roomId);
      if (room?.technician) {
        io.to(room.technician.socketId).emit("agent-connected", { roomId });
      }
    });

    // Control events relay
    const controlEvents = ["mouse-move", "mouse-click", "mouse-double-click", "mouse-scroll", "key-press", "key-type"];
    controlEvents.forEach(event => {
      socket.on(event, (data) => {
        const agentSocketId = agents.get(data.roomId);
        if (agentSocketId) {
          io.to(agentSocketId).emit(event, data);
        }
      });
    });

    socket.on("offer", ({ roomId, offer, targetSocketId }) => {
      if (targetSocketId) io.to(targetSocketId).emit("offer", { offer, from: socket.id });
      else socket.to(roomId).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ roomId, answer, targetSocketId }) => {
      if (targetSocketId) io.to(targetSocketId).emit("answer", { answer, from: socket.id });
      else socket.to(roomId).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ roomId, candidate, targetSocketId }) => {
      if (targetSocketId) io.to(targetSocketId).emit("ice-candidate", { candidate, from: socket.id });
      else socket.to(roomId).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Agent disconnect
      if (socket.isAgent && socket.roomId) {
        agents.delete(socket.roomId);
        const room = rooms.get(socket.roomId);
        if (room?.technician) {
          io.to(room.technician.socketId).emit("agent-disconnected");
        }
        return;
      }

      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          if (socket.role === "technician") {
            room.technician = null;
            socket.to(socket.roomId).emit("user-left", { socketId: socket.id, role: "technician" });
          }
          if (socket.role === "client") {
            room.clients = room.clients.filter(c => c.socketId !== socket.id);
            if (room.technician) {
              io.to(room.technician.socketId).emit("user-left", { socketId: socket.id, role: "client" });
            }
          }
        }
      }
    });
  });
};
