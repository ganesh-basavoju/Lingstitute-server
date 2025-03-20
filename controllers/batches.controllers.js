import batchesModel from "../models/batches.model.js";

export const Get_Batch = async (req, res) => {
    try {
        const { batch_name } = req.query;

        if (!batch_name || batch_name.trim() === "") {
            return res.status(400).json({ msg: "Batch name is required" });
        }

        const batch = await batchesModel.findOne({ batch_name }).select("batch_name course_content course_videos scheduledClasses").populate("scheduledClasses").sort({createdAt:-1});

        if (!batch) {
            return res.status(404).json({ msg: "No batch found" });
        }

        res.status(200).json({ msg: "Successfully fetched", data: batch });

    } catch (error) {
        console.error("Error fetching batch:", error);
        return res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
};
