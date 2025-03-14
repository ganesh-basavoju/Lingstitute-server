import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
        type: String,
        required: true,
        unique: true,
        },
        fullName: {
        type: String,
        required: true,
        },
        password: {
        type: String,
        required: true,
        minlength: 6,
        },
        profilePic: {
        type: String,
        default: "https://img.icons8.com/?size=100&id=IerOpHeUt2OH&format=png&color=000000",
        },
        phoneNumber:{
        type:Number,
        validate:{
            validator:(v)=>{
                return /^\d{10}$/.test(v.toString());
            },
            message:props=>`${props.value} is not a valid one`
        }
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;