import mongoose, { Schema,model } from "mongoose";

const batchesSchema=new Schema({
    batch_name:{
        type:String,
        required:true,
        unique:true,
    },
    students:[{studnet_id:mongoose.Schema.Types.ObjectId,ref:"Students"}],
    
},{timestamps:true})

        