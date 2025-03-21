import axios from "axios";
import { drive } from "../lib/pdfupload.js";
import { generateToken } from "../lib/utils.js";
import Admin from "../models/admin.model.js";
import batchesModel from "../models/batches.model.js";
import classesModel from "../models/classes.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"; 
import moment from "moment-timezone";

export const adminSignup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await Admin.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Admin({ fullName, email, password: hashedPassword });

        await newUser.save();
        

        res.status(201).json(newUser);
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


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
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        //isPasswordValid=(password==admin.password);
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


const ZOOM_API_KEY = "k6s4ukVAR0OnzuIe5ZAxIw";
const ZOOM_API_SECRET = "W3hbG0fGI7fY7MQX0XQ9eurwkBYV7aAW";

const createZoomMeeting = async (title, date, time) => {
    try {
        // Convert local time to UTC
        const startTimeUTC = moment.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata").utc().format();

        const zoomResponse = await axios.post(
            "https://api.zoom.us/v2/users/me/meetings",
            {
                topic: title,
                type: 2, // Scheduled meeting
                start_time: startTimeUTC, // Pass UTC time
                duration: 60, // 1 hour
                timezone: "UTC", // Always set to UTC
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${ZOOM_API_KEY}.${ZOOM_API_SECRET}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return zoomResponse.data.join_url;
    } catch (error) {
        console.error("Error creating Zoom meeting:", error.response?.data || error.message);
        throw new Error("Failed to create Zoom meeting");
    }
};


export const scheduleClass = async (req, res) => {
    try {
        const { batchId, title, date, time, description } = req.body;

        // Validate required fields
        if (!batchId || !title || !date || !time) {
            return res.status(400).json({ msg: "Please provide all required fields" });
        }

        const batch = await batchesModel.findById(batchId);
        if (!batch) {
            return res.status(404).json({ msg: "Batch not found" });
        }

        // Create Zoom meeting
        const meetingLink = await createZoomMeeting(title, date, time);

        // Create new class
        const newClass = new classesModel({
            batchname: batch.batch_name,
            title,
            date,
            time,
            description: description || "",
            link: meetingLink, // Store Zoom meeting link
        });

        // Save to database
        const savedClass = await newClass.save();
        batch.scheduledClasses.push(savedClass.id);
        await batch.save();

        res.status(201).json({ msg: "Class scheduled successfully", class: savedClass });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error occurred", error: error.message });
    }
};



export const deleteClass = async (req, res) => {
    try {
        const { id } = req.query; 

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({ msg: "Class ID is required" });
        }

        // Find and delete the class
        const deletedClass = await classesModel.findByIdAndDelete(id);

        // If class not found
        if (!deletedClass) {
            return res.status(404).json({ msg: "Class not found" });
        }

        // Find the corresponding batch
        const batch = await batchesModel.findOne({ batch_name: deletedClass.batchname });

        // If batch is found, update scheduledClasses array
        if (batch) {
            batch.scheduledClasses = batch.scheduledClasses.filter(item => item.toString() !== id);
            await batch.save(); // Ensure changes are saved
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

        const users = await User.find({isStudent:false})
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


export const joinStudent_into_batch = async (req, res) => {
    try {
        const { batchId, student_id } = req.body;

        if (!batchId || !student_id) {
            return res.status(400).json({ msg: "Please provide required information" });
        }

        const batch = await batchesModel.findById(batchId);
        if (!batch) {
            return res.status(404).json({ msg: "Batch not found" });
        }

        if (batch.students.includes(student_id)) {
            return res.status(409).json({ msg: "Student already exists in this batch" });
        }

        batch.students.push(student_id);
        await batch.save();

        res.status(200).json({ msg: `Successfully added student to batch ${batchId}` });

    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
};

export const Video_Uploader = async (req, res) => {
    try {
        const { title, VideoUrl, batchId } = req.body;

        if (!title || !VideoUrl || !batchId) {
            return res.status(400).json({ msg: "Please provide required credentials" });
        }

     
        const batch = await batchesModel.findById(batchId);

        if (!batch) {
            return res.status(404).json({ msg: "Batch not found" });
        }

        batch.course_videos.push({ title, videoUrl: VideoUrl });
        await batch.save();

        res.status(200).json({ msg: "Video added successfully", batch });

    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
}

export const Create_Batch = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ msg: "Batch name is required" });
    }

    const existingBatch = await batchesModel.findOne({ batch_name: name });
    
    if (existingBatch) {
      return res.status(400).json({ msg: "Batch already exists" });
    }

   
    const newBatch = await batchesModel.create({ batch_name: name });

    return res.status(201).json({ msg: "Batch created successfully", batch: {id:newBatch._id,batch_name:newBatch.batch_name,student_count:0}});
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};

export const Delete_Batch = async (req, res) => {
  try {
    const  id  = req.query.id; // Assuming batch ID is sent in the URL params

    // Validate input
    if (!id) {
      return res.status(400).json({ msg: "Batch ID is required" });
    }

    // Find and delete batch
    const deletedBatch = await batchesModel.findByIdAndDelete(id);

    if (!deletedBatch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    return res.status(200).json({ msg: "Batch deleted successfully", batch: deletedBatch });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};



export const Update_Batch = async (req, res) => {
  try {
    const { id } = req.body; // Get batch ID from URL params
    const { name } = req.body; // Get new batch name from request body

    // Validate input
    if (!id) {
      return res.status(400).json({ msg: "Batch ID is required" });
    }
    if (!name) {
      return res.status(400).json({ msg: "New batch name is required" });
    }

    // Check if batch exists
    const existingBatch = await batchesModel.findById(id);
    if (!existingBatch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    // Check if the new name is already taken
    const duplicateBatch = await batchesModel.findOne({ batch_name: name });
    if (duplicateBatch) {
      return res.status(400).json({ msg: "Batch name already exists" });
    }

    const updatedBatch = await batchesModel.findByIdAndUpdate(
      id,
      { batch_name: name },
      { new: true } 
    );

    return res.status(200).json({ msg: "Batch name updated successfully", batch:updatedBatch.batch_name});
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};


export const Get_All_Batches = async (req, res) => {
  try {
    // Fetch all batches with student count
    const batches = await batchesModel.find({}, "batch_name students").lean(); // Fetch only batch_name & students

    // Transform data to include student count
    const formattedBatches = batches.map(batch => ({
      id:batch._id,
      batch_name: batch.batch_name,
      student_count: batch.students.length, // Get student count
    }));

    return res.status(200).json({ msg: "Batches fetched successfully", batches: formattedBatches });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};




export const Get_All_Schedules=async(req,res)=>{
  try {
    const classes=await classesModel.find({}).sort({created_at:-1});
    if(!res){
      res=[];
    }
    res.status(200).json({msg:"Succesfully fetched",data:classes});

  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
}




export const Get_User_By_Mail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email,isStudent:false });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};



export const Delete_User=async(req,res)=>{
  try {
    const {id}=req.query;
    if(!id){
      return res.status(400).json({ msg: "Email is required" });
    }
    const user=await User.findByIdAndDelete(id);
    if(!user){
       return res.status(404).json({ msg: "User not found" });
    }
    return res.status(200).json({msg:"Deleted successfully"});
    
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
}



export const Get_Students_By_Batch = async (req, res) => {
  try {
    const { batch_name } = req.body;
    let { page = 1, limit = 10 } = req.query; // Get page and limit from query params

    page = parseInt(page);
    limit = parseInt(limit);

    if (!batch_name) {
      return res.status(400).json({ msg: "Batch name not provided" });
    }

    const batch = await batchesModel.findOne({ batch_name }).populate({
      path: "students",
      select: "fullName email phoneNumber _id",
    });

    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    const totalStudents = batch.students.length;
    const totalPages = Math.ceil(totalStudents / limit);
    const paginatedStudents = batch.students.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      msg: "Batch successfully fetched",
      data: paginatedStudents,
      pagination: {
        totalStudents,
        totalPages,
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};



export const Remove_From_Batch = async (req, res) => {
  try {
    const { batch, email } = req.query;
    console.log(req.query);

    if (!batch || !email) {
      return res.status(400).json({ msg: "Please provide necessary information" });
    }

    // Find the user by email
    const user = await User.findOne({ email }).select("_id");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.isStudent=true;
    user.save();
    const updatedBatch = await batchesModel.findOneAndUpdate(
      {batch_name:batch},
      { $pull: { students: user._id } },
      { new: true }
    );

    if (!updatedBatch) {
      return res.status(404).json({ msg: "Batch not found or user not in batch" });
    }

    return res.status(200).json({ msg: "User removed from batch successfully", data: updatedBatch });

  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};
