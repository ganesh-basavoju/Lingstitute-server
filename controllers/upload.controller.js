import multer from "multer";
import fs from "fs/promises";
import { google } from "googleapis";

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "/tmp/"); // Temporary storage
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

export const upload = multer({ storage });

// Google Drive API Configuration
const auth = new google.auth.GoogleAuth({
  keyFile: "google-service-account.json",
  scopes: ["https://www.googleapis.com/auth/drive.file"]
});

const drive = google.drive({ version: "v3", auth });

// Upload PDF or Video File to Google Drive
export const uploadFileToDrive = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const filePath = req.file.path;
    const fileType = req.file.mimetype; // Get file MIME type

    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        mimeType: fileType,
      },
      media: {
        mimeType: fileType,
        body: (await import("fs")).createReadStream(filePath),
      },
    });

    // Remove file from temp storage after upload
    await fs.unlink(filePath);

    res.status(200).json({ message: "File uploaded successfully", fileId: response.data.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to upload file to Google Drive");
  }
};
