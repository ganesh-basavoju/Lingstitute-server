import mongoose, { Schema,model } from "mongoose";

const batchesSchema=new Schema({
    batch_name:{
        type:String,
        required:true,
        unique:true,
    },
    students:[{type:mongoose.Schema.Types.ObjectId,ref:"Students"}],
    course_content:[
        {
            title:{type:String,required:true},
            fileUrl:{type:String,required:true},
            file_id:{type:String,required:true},
        }
    ],
    course_videos:[
        {
            title:{type:String,required:true},
            videoUrl:{type:String,required:true}
        }
    ]
    
},{timestamps:true});
const batchesModel=model("batches",batchesSchema);

export default batchesModel;