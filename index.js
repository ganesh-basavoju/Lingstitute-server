import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import externalRoutes from "./routes/external.route.js";
import userRoutes from "./routes/user.route.js";
import zoomRoutes from "./routes/zoom.route.js";
import { app, server, io } from "./lib/socket.js";
import batchesRoutes from "./routes/batches.route.js";

dotenv.config();

const PORT = 5001;
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: "http://localhost:8080", // Frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

app.set("trust proxy", 1);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/batch",batchesRoutes);
app.use('/api/zoom', zoomRoutes);
app.use("/api/user", userRoutes);

const waitingUsers = [];
const connectedPairs = new Map();

io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);
    
    socket.on("join-video-chat", (peerId) => {
        if (waitingUsers.length > 0) {
            const otherUser = waitingUsers.pop();
            connectedPairs.set(socket.id, otherUser.socketId);
            connectedPairs.set(otherUser.socketId, socket.id);
            
            io.to(socket.id).emit("match-found", { peerId: otherUser.peerId });
            io.to(otherUser.socketId).emit("match-found", { peerId });
        } else {
            waitingUsers.push({ socketId: socket.id, peerId });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        const partnerId = connectedPairs.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit("partner-disconnected");
            connectedPairs.delete(partnerId);
        }
        connectedPairs.delete(socket.id);
        
        // Remove from waiting list if present
        const index = waitingUsers.findIndex(user => user.socketId === socket.id);
        if (index !== -1) {
            waitingUsers.splice(index, 1);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectDB();
});