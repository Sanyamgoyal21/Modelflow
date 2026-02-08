const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = "/home/ubuntu/modelflow/Modelflow/uploads";

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

  await fs.promises.writeFile(filePath, fileBuffer);
  return key;
};

const getFromS3 = async (key) => {
  const filePath = path.join(UPLOAD_DIR, key);
  const body = await fs.promises.readFile(filePath);
  return { Body: body };
};

const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  // Local file path used by inference service
  return path.join(UPLOAD_DIR, key);
};

const deleteFromS3 = async (key) => {
  const filePath = path.join(UPLOAD_DIR, key);

  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }

  const dir = path.dirname(filePath);
  try {
    const files = await fs.promises.readdir(dir);
    if (files.length === 0) {
      await fs.promises.rmdir(dir);
    }
  } catch {
    // ignore
  }
};

module.exports = {
  uploadToS3,
  getFromS3,
  getSignedDownloadUrl,
  deleteFromS3,
};