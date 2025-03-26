import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"; 
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();



export const registerForSeat = async (req, res) => {
    const { fullName, email, phoneNumber } = req.body;

    if (!fullName || !email || !phoneNumber) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {

        const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_APPCODE,
                },
            });
        // Email to the admin with user details
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "New User Registration",
            html: `
            <h2>New User Registration</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phoneNumber}</p>
            <p>They have registered for the Seat in "English Communication Skills for Job Interviews".</p>
        `,
        };
        
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Registration successful. Admin notified!" });
    } catch (error) {
        console.error("Error sending admin notification email:", error);
        res.status(500).json({ message: "Failed to notify the admin. Please try again later." });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        console.log(req.user);
        res.status(200).json(req.user);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            res.status(500).json({ message: "Server error" });
        }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber, profilePic } = req.body;
    
        // Update user fields
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { fullName, phoneNumber, profilePic },
            { new: true, runValidators: true }
            );
        
            if (!updatedUser) return res.status(404).json({ message: "User not found" });
        
            res.status(200).json(updatedUser);
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Server error" });
        }
};