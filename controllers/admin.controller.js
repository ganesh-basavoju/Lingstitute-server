import axios from "axios";
import { drive } from "../lib/pdfupload.js";
import { generateToken } from "../lib/utils.js";
import Admin from "../models/admin.model.js";
import batchesModel from "../models/batches.model.js";
import classesModel from "../models/classes.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"; 


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

        // Generate token
        const token = generateToken(admin._id);
        res.status(200).json( token);
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error occurred", error: error.message });
    }
};





export const scheduleClass = async (req, res) => {
  try {
    const { batchId, title, date, time, description, link} = req.body;

    // Validate required fields
    if (!batchId || !title || !date || !time || !link) {
      return res.status(400).json({ msg: "Please provide all required fields" });
    }

    // Find the batch
    const batch = await batchesModel.findById(batchId);
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }
    // Create and Save New Class with Meeting Link
    const newClass = new classesModel({
      batchname: batch.batch_name,
      title,
      date,
      time,
      description: description || "",
      link,
    });

    // Save to DB
    const savedClass = await newClass.save();
    batch.scheduledClasses.push(savedClass.id);
    await batch.save();

    res
      .status(201)
      .json({ msg: "Class scheduled successfully", class: savedClass });
  } catch (error) {
    console.error("❌ Error scheduling class:", error);
    res
      .status(500)
      .json({ msg: "Internal Server Error occurred", error: error.message });
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



export const uploadPdf = async (req, res) => {
    try {
        const { batchId, fileUrl, title, fileId, moduleName } = req.body;
        console.log("Entered into uploadPdf func", req.body);

        if (!batchId || !fileUrl || !title || !fileId || !moduleName) {
            return res.status(400).json({ msg: "Missing required information to upload" });
        }

        const batch = await batchesModel.findById(batchId);
        if (!batch) {
            return res.status(404).json({ msg: "Batch not found" });
        }

        // Check if module exists
        let existingModule = batch.course_content.find(item => item.moduleName === moduleName);

        if (existingModule) {
            // If module exists, push the new file to the module's data array
            existingModule.data.push({
                title: title,
                fileUrl: fileUrl,
                file_id: fileId
            });
        } else {
            // If module doesn't exist, create a new module and push it to course_content
            batch.course_content.push({
                moduleName: moduleName,
                data: [{
                    title: title,
                    fileUrl: fileUrl,
                    file_id: fileId
                }]
            });
        }

        // Save updated batch
        await batch.save();

        res.status(200).json({ msg: "Uploaded successfully", batch });

    } catch (error) {
        console.error("Error in uploadPdf:", error);
        res.status(500).json({ msg: "Internal Server Error occurred", error: error.message });
    }
};



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
      console.log(req.body,"cdjc");
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
         const user=await User.findById(student_id);
        user.isStudent=true;
        user.enrolled_batch=batch.batch_name;
        await user.save();
        console.log("user",user);

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
    const { name,description } = req.body;

    if (!name) {
      return res.status(400).json({ msg: "Batch name is required" });
    }

    const existingBatch = await batchesModel.findOne({ batch_name: name });
    
    if (existingBatch) {
      return res.status(400).json({ msg: "Batch already exists" });
    }

   
    const newBatch = await batchesModel.create({ batch_name: name ,batch_description:description});

    return res.status(201).json({ msg: "Batch created successfully", batch: {id:newBatch._id,batch_name:newBatch.batch_name,student_count:0,batch_description:newBatch.batch_description}});
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
    const { id, name, batchDescription } = req.body;

    // Validate input
    if (!id) return res.status(400).json({ msg: "Batch ID is required" });
    if (!name) return res.status(400).json({ msg: "New batch name is required" });

    // Check if the new name already exists in another batch
    const duplicateBatch = await batchesModel.findOne({ batch_name: name, _id: { $ne: id } });
    if (duplicateBatch) return res.status(400).json({ msg: "Batch name already exists" });

    // Update batch name and description in a single query
    const updatedBatch = await batchesModel.findByIdAndUpdate(
      id,
      { batch_name: name, batch_description: batchDescription || undefined },
      { new: true, select: "batch_name batch_description" } // Return only necessary fields
    );

    if (!updatedBatch) return res.status(404).json({ msg: "Batch not found" });

    return res.status(200).json({
      msg: "Batch updated successfully",
      data: { batch_name: updatedBatch.batch_name, batch_description: updatedBatch.batch_description },
    });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};



export const Get_All_Batches = async (req, res) => {
  try {
    // Fetch all batches with student count
    const batches = await batchesModel.find({}); // Fetch only batch_name & students

    // Transform data to include student count
    const formattedBatches = batches.map(batch => ({
      id:batch._id,
      batch_name: batch.batch_name,
      student_count: batch.students.length,
      batch_description:batch.batch_description // Get student count
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
    user.isStudent=false;
    user.enrolled_batch="";
    user.save();
    const updatedBatch = await batchesModel.findOneAndUpdate(
      {batch_name:batch},
      { $pull: { students: user._id }},
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
