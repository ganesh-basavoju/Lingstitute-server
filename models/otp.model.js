import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    expires_at: {
        type: Date,
        required: true,
        expires: 0 // Automatically delete document when expired
    }
});

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;