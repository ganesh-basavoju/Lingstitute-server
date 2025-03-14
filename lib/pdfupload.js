import { google } from "googleapis";



const KEY_FILE_PATH =process.env.KEY_FILE_PATH;
const SCOPES = process.env.SCOPES;


const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

export const drive = google.drive({ version: "v3", auth });


// Upload file function
export const uploadToDrive = async (req, res,next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        const fileMetadata = {
            name: req.file.originalname,
            parents: ["YOUR_FOLDER_ID"], // Replace with your Google Drive Folder ID
        };

        const media = {
            mimeType: req.file.mimetype,
            body: Buffer.from(req.file.buffer),
        };

        // Upload file to Google Drive
        const file = await drive.files.create({
            resource: fileMetadata,
            media: {
                mimeType: req.file.mimetype,
                body: req.file.buffer, // Buffer instead of stream
            },
            fields: "id",
        });

        const fileId = file.data.id;

        // Make file public
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        // Get public URL
        const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

        req.fileUrl=fileUrl;
        next();
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error", error: error.message });
    }
};