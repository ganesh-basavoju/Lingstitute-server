import { google } from "googleapis";
import dotenv from "dotenv";
import { Readable } from "stream"; // Import Readable stream

dotenv.config();

// Define Google Drive authentication
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: SCOPES,
});

export const drive = google.drive({ version: "v3", auth });

const FOLDER_ID = "1b7a0nvBsAQDWXUSpZ0VKM89QL_nabzE5"; // Your folder ID

// Upload file function
export const uploadToDrive = async (req, res, next) => {
    console.log("entered into upload", req.file);

    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        const fileMetadata = {
            name: req.file.originalname,
            parents: [FOLDER_ID], // Assign the correct folder ID
        };

        const media = {
            mimeType: req.file.mimetype,
            body: Readable.from(req.file.buffer), // Convert buffer to stream
        };

        // Upload file to Google Drive
        const file = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: "id",
        });

        if (!file.data.id) {
            return res.status(500).json({ msg: "Failed to upload file to Google Drive" });
        }

        const fileId = file.data.id;

        // Make the file public
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        // Get public URL
        const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
        console.log("File URL:", fileUrl);

        // Append file URL to req.body for the next middleware
        req.body.fileUrl = fileUrl;
        req.body.fileId=fileId;

        next(); // Proceed to the next middleware
    } catch (error) {
        console.error("Google Drive Upload Error:", error.message);
        res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
};
