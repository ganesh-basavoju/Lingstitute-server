import jwt from "jsonwebtoken";
import axios from "axios";

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    return token;
};




export const axiosInstance = axios.create({
  baseURL: "httP://localhost:5001", // Set your API base URL
  headers: {
    "Content-Type": "application/json",
  },
});


axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Example:
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


