import Admin from "../models/admin.model.js";


export const adminAuth=async(req,res)=>{
    try {
        const authorization=req.header.authorization;
        const token=authorization.split(" ")[1];
        if (!token) {
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
        return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }
        const admin=await Admin.findOne({_id:decoded.id});
        if(!admin){
            return res.status(404).json({msg:"Admin is not registered"});
        }
        req.admin=admin;
        next();
    } catch (error) {
        console.log("Error in protectRoute middleware: ", error.message);
        res.status(500).json({ message: "Internal server error" });
        
    }
}

