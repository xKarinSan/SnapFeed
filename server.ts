import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "./src/lib/socket/events";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const roomParticipants = new Map<
  string,
  Map<string, { id: string; displayName: string }>
>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("room:join", ({ projectId, displayName }) => {
      socket.data.projectId = projectId;
      socket.data.displayName = displayName;
      socket.join(projectId);

      if (!roomParticipants.has(projectId)) {
        roomParticipants.set(projectId, new Map());
      }
      const participants = roomParticipants.get(projectId)!;
      participants.set(socket.id, { id: socket.id, displayName });

      socket.to(projectId).emit("participant:joined", { id: socket.id, displayName });
      socket.emit("participants:list", Array.from(participants.values()));
      console.log(`${displayName} joined room ${projectId}`);
    });

    socket.on("room:leave", (projectId) => {
      handleLeaveRoom(socket, projectId);
    });

    socket.on("feedback:create", (feedback) => {
      const projectId = socket.data.projectId;
      if (projectId) {
        socket.to(projectId).emit("feedback:created", feedback as any);
      }
    });

    socket.on("feedback:update", ({ id, updates }) => {
      const projectId = socket.data.projectId;
      if (projectId) {
        socket.to(projectId).emit("feedback:updated", { id, ...updates } as any);
      }
    });

    socket.on("feedback:delete", (feedbackId) => {
      const projectId = socket.data.projectId;
      if (projectId) {
        socket.to(projectId).emit("feedback:deleted", feedbackId);
      }
    });

    socket.on("disconnect", () => {
      const projectId = socket.data.projectId;
      if (projectId) {
        handleLeaveRoom(socket, projectId);
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  function handleLeaveRoom(socket: any, projectId: string) {
    socket.leave(projectId);
    const participants = roomParticipants.get(projectId);
    if (participants) {
      participants.delete(socket.id);
      if (participants.size === 0) {
        roomParticipants.delete(projectId);
      }
    }
    socket.to(projectId).emit("participant:left", socket.id);
    console.log(`${socket.data.displayName} left room ${projectId}`);
  }

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
