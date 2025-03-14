import { model, Schema } from "mongoose";

const StudentsSchema=new Schema({
  student_id:{type:Schema.Types.ObjectId,ref:"User"}
})

const StudentsModel=model("Students",StudentsSchema);

export default StudentsModel;