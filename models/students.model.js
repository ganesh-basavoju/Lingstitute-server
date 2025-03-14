import { model, Schema } from "mongoose";

const StudentsSchema=new Schema({
  id:{type:Schema.Types.ObjectId,ref:"User"}
})

const StudentsModel=model("Students",StudentsSchema);

module.exports=StudentsModel;