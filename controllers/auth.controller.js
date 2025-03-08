import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import nodemailer from "nodemailer";
import OTPModel from "../models/otp.model.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to format user response
const formatUserResponse = (user) => ({
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    recipes_created: user.recipes_created_cnt || 0,
    fav_recipes: user.fav_recipes || [],
    list_recipes: user.list_recipes || [],
    fav_recipes_cnt: user.fav_recipes_cnt || 0,
});

// Signup Controller
export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, email, password: hashedPassword });

        await newUser.save();
        generateToken(newUser._id, res);

        res.status(201).json(formatUserResponse(newUser));
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Login Controller
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        generateToken(user._id, res);
        res.status(200).json(formatUserResponse(user));
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Logout Controller
export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Forgot Password Controller
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Generate OTP (6-digit)
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes
        // Store OTP in MongoDB (Replace existing OTP if any)
        await OTPModel.findOneAndUpdate(
            { email },
            { otp, expiresAt },
            { upsert: true, new: true }
        );
        // Setup Email Transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_APPCODE, 
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP - RecipeShare",
            text: `Your OTP for password reset is: ${otp}\nThis OTP is valid for 5 minutes.`,
        };
        // Send Email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Google Login Controller
export const googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ $or: [{ google_id: googleId }, { email }] });

        if (!user) {
            user = new User({
                google_id: googleId,
                email,
                fullName: name,
                profilePic: picture,
                fav_recipes: [],
                list_recipes: [],
                recipes_created_cnt: 0,
                fav_recipes_cnt: 0,
            });
            await user.save();
        }

        const authToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
            expiresIn: "24h",
        });

        res.status(user ? 200 : 201).json({
            token: authToken,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Google Login Error:", error.message);
        res.status(401).json({ message: "Invalid Google token" });
    }
};

// Reset Password Controller
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Check if OTP exists
        const otpEntry = await OTPModel.findOne({ email, otp });
        if (!otpEntry) {
            return res.status(400).json({ error: "Invalid OTP" });
        }
        // Check if OTP is expired
        if (new Date(otpEntry.expiresAt) < new Date()) {
            return res.status(400).json({ error: "OTP expired" });
        }
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        // Update user password in MongoDB
        await User.findOneAndUpdate({ email }, { password: hashedPassword });
        // Delete OTP after successful reset
        await OTPModel.deleteOne({ email });

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// Update Profile Controller
export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        res.status(200).json(formatUserResponse(updatedUser));
    } catch (error) {
        console.error("Update Profile Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Check Auth Controller
export const checkAuth = (req, res) => {
    try {
        res.status(200).json(formatUserResponse(req.user));
    } catch (error) {
        console.error("Check Auth Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
