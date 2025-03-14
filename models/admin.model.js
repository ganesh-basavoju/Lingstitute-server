import { Schema,model } from "mongoose";

const adminSchema=new Schema({
    email:{
        type:String,
        required:true,
        unique:true,
    },  
    fullName:{
        type:String,
        required:true,
    },
    password:{
        type:String,    
        required:true,
        minlength:6,
    }

},{timestamps:true});
const Admin=model("Admin",adminSchema);

export default Admin;