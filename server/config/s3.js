const fs = require("fs");
const path = require("path");

// Local file storage (drop-in replacement for S3)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const uploadToS3 = async (fileBuffer, key, contentType) => {
  const filePath = path.join(UPLOAD_DIR, key);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, fileBuffer);
  return key;
};

const getFromS3 = async (key) => {
  const filePath = path.join(UPLOAD_DIR, key);
  const body = fs.readFileSync(filePath);
  return { Body: body };
};

const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  // Return a local file path that the inference service can access
  return path.join(UPLOAD_DIR, key);
};

const deleteFromS3 = async (key) => {
  const filePath = path.join(UPLOAD_DIR, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  // Try to remove empty parent directory
  const dir = path.dirname(filePath);
  try {
    const files = fs.readdirSync(dir);
    if (files.length === 0) fs.rmdirSync(dir);
  } catch {}
};

module.exports = { uploadToS3, getFromS3, getSignedDownloadUrl, deleteFromS3 };
