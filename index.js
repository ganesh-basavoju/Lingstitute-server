import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import { app, server } from "./lib/socket.js";
import nodemailer from 'nodemailer';
import multer from 'multer';

dotenv.config();

const PORT = process.env.PORT;


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp/');
    },
    filename: (req, file, cb) => {
        cb(null,file.originalname);
    }

});

app.set("trust proxy", 1);

const upload_file = multer({ storage });



app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use("/api/auth", authRoutes);


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
    connectDB();
});

app.use(upload_file.array('img'));








// server.listen(PORT, () => {
//   console.log("server is running on PORT:" + PORT);
//   connectDB();
// });