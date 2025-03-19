import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import nodemailer from "nodemailer";
import Otp from "../models/otp.model.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Helper function to format user response
const formatUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  profilePic: user.profilePic || "",
});

// ✅ Helper to generate token and return in response
const generateTokenAndReturn = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// ✅ Signup Controller
export const signup = async (req, res) => {
  const { fullName, email, password, phoneNumber } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
    });

    await newUser.save();

    const token = generateTokenAndReturn(newUser);

    res.status(201).json({
      token,
      user: formatUserResponse(newUser),
    });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateTokenAndReturn(user);

    res.status(200).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Logout Controller
export const logout = (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Forgot Password Controller
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

    // ✅ Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // ✅ Store OTP in MongoDB
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // ✅ Setup Email Transporter
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
      subject: "Password Reset OTP - Lingstitute",
      text: `Your OTP for password reset is: ${otp}\nThis OTP is valid for 5 minutes.`,
    };

    // ✅ Send Email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Google Login Controller
export const googleLogin = async (req, res) => {
    const { token } = req.body;
  
    try {
      // ✅ Verify ID token using Google's client library
      const ticket = await googleClient.verifyIdToken({
        idToken: token, // ID token instead of access token
        audience: process.env.GOOGLE_CLIENT_ID,
      });
  
      if (!ticket) {
        return res.status(401).json({ message: "Invalid Google token" });
      }
  
      // ✅ Extract payload
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ message: "Invalid token payload" });
      }
  
      const { sub: googleId, email, name, picture } = payload;
  
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      // ✅ Check if user already exists
      let user = await User.findOne({ $or: [{ google_id: googleId }, { email }] });
  
      if (!user) {
        user = new User({
          google_id: googleId,
          email,
          fullName: name,
          profilePic: picture,
        });
        await user.save();
      }
  
      // ✅ Generate JWT token
      const authToken = generateTokenAndReturn(user);
  
      return res.status(user ? 200 : 201).json({
        token: authToken,
        user: formatUserResponse(user),
      });
    } catch (error) {
      console.error("Google Login Error:", error.message);
      return res.status(401).json({ message: "Invalid Google token" });
    }
  };
  
  

// ✅ Reset Password Controller
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Check if OTP exists
    const otpEntry = await Otp.findOne({ email, otp });
    if (!otpEntry) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // ✅ Check if OTP is expired
    if (new Date(otpEntry.expiresAt) < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // ✅ Update user password
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    // ✅ Delete OTP after reset
    await Otp.deleteOne({ email });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Update Profile Controller
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // ✅ Upload profile picture to Cloudinary
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

// ✅ Check Auth Controller (Token Validation)
export const checkAuth = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error("Check Auth Error:", error.message);
    res.status(401).json({ message: "Invalid token or session expired" });
  }
};
