import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import newsRoutes from "./routes/news.route.js";
import zoomRoutes from "./routes/zoom.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;




app.use(express.json());
app.use(cookieParser());
const corsOptions = {
    origin: "http://localhost:8080", // ✅ Frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allow any origin
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

app.set("trust proxy", 1);


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", newsRoutes);
app.use('/api/zoom', zoomRoutes);



app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
    connectDB();
});







// server.listen(PORT, () => {
//   console.log("server is running on PORT:" + PORT);
//   connectDB();
// });