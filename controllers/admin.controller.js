import { drive } from "../lib/pdfupload.js";
import { generateToken } from "../lib/utils.js";
import Admin from "../models/admin.model.js";
import batchesModel from "../models/batches.model.js";
import classesModel from "../models/classes.model.js";
import User from "../models/user.model.js";
// import bcrypt from "bcryptjs"; 

export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ msg: "Please provide the required credentials" });
        }

        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ msg: "Unauthorized access, admin not found" });
        }

        // Validate password securely
        // const isPasswordValid = await bcrypt.compare(password, admin.password);
        const isPasswordValid=(password==admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ msg: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken(admin._id);

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error occurred", error: error.message });
    }
};




export const scheduleClass = async (req, res) => {
    try {
        const { batchname, title, date, time, description } = req.body;

        // Validate required fields
        if (!batchname || !title || !date || !time) {
            return res.status(400).json({ msg: "Please provide all required fields" });
        }

        // Create new class
        const newClass = new classesModel({
            batchname,
            title,
            date,
            time,
            description: description || "" // Set an empty string if no description is provided
        });

        // Save to database
        const savedClass = await newClass.save();

        res.status(201).json({ msg: "Class scheduled successfully", class: savedClass });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error occurred", error: error.message });
    }
};



export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params; 

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({ msg: "Class ID is required" });
        }
        const deletedClass = await classesModel.findByIdAndDelete(id);

        // If class not found
        if (!deletedClass) {
            return res.status(404).json({ msg: "Class not found" });
        }

        res.status(200).json({ msg: "Class deleted successfully", class: deletedClass });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error occurred", error: error.message });
    }
};

export const uploadPdf=async(req,res)=>{
    try{
        const {batch_name,fileUrl,title}=req.body;

        if(!batch||!fileUrl||!title) res.status(400).json({msg:"missing required information to upload"});

        const  batch=await batchesModel.findOne({batch_name:batch_name});

        if(!batch) res.status(402).json({msg:"batch is not found"});

        batch.course_content.push({
            title:title,
            fileUrl:fileUrl
        });
        batch.save();
        res.status(200).json({msg:"uploaded succesffully",batch:batch});

    }catch(error){
        res.status(500).json({ msg: "Internal Server Error occurred", error: error.message });
    }
}


export const deleteFile = async (req, res) => {
    try {
        const { file_id, batch_id } = req.body;

        if (!file_id || !batch_id) {
            return res.status(400).json({ msg: "File ID and Batch ID are required" });
        }
        const batch=await batchesModel.findOne({_id:batch_id});
        const newdata=batch.course_content.filter((file)=>file.file_id!=file_id);
        batch.course_content=newdata;
        batch.save();
        await drive.files.delete({ fileId: file_id });
        res.status(200).json({ msg: "File deleted successfully", fileId: file_id });
    } catch (error) {
        if (error.code === 404) {
            return res.status(404).json({ msg: "File not found in Google Drive", error: error.message });
        }
        res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
};



export const fetchAllUsers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit; // Corrected pagination logic

        const users = await User.find()
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 })
            .select("-password");

        const totalUsers = await User.countDocuments();

        res.status(200).json({
            msg: "All users fetched successfully",
            data: users,
            pagination: {
                totalUsers,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                hasNextPage: skip + limit < totalUsers,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
};


export const joinStudent_into_batch=async(req,res)=>{
    try {
        const {batch_name,student_id}=req.body;

        if(!batch_name||!student_id) res.status(400).json("please provide required information");
        
        const batch=await batchesModel.findOne({batch_name:batch_name});
        batch.students.push(student_id);
        batch.save();
        res.status(200).json({msg:`Successfully added student to the batch ${batch_name}`});
    } catch (error) {
     res.status(500).json({ msg: "Internal Server Error", error: error.message });   
    }
}



export const Video_Uploader = async (req, res) => {
    try {
        const { title, VideoUrl, batch_name } = req.body;

        if (!title || !VideoUrl || !batch_name) {
            return res.status(400).json({ msg: "Please provide required credentials" });
        }

     
        const batch = await batchesModel.findOne({ batch_name });

        if (!batch) {
            return res.status(404).json({ msg: "Batch not found" });
        }

        batch.course_videos.push({ title, videoUrl: VideoUrl });
        await batch.save();

        res.status(200).json({ msg: "Video added successfully", batch });

    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
};
