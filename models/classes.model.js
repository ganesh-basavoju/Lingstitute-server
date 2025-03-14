import { model, Schema } from "mongoose";


const classesSchema=new Schema({
    batchname:{type:String,required:true},
    title:{type:String,required:true},
    date:{type:Date,required:true},
    time:{type:String,required:true},
    description:{type:String}

})
const classesModel=model("classes",classesSchema);

export default classesModel;