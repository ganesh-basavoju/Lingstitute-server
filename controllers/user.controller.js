import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Set up nodemailer transporter


// Handle webinar registration and notify admin
const registerForSeat = async (req, res) => {
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

export default registerForSeat;
