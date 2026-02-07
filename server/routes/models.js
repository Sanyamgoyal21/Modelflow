const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { authenticate } = require("../middleware/auth");
const Model = require("../models/Model");
const { uploadToS3, deleteFromS3, getSignedDownloadUrl } = require("../config/s3");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "model" && !file.originalname.endsWith(".h5")) {
      return cb(new Error("Only .h5 model files are allowed"));
    }
    cb(null, true);
  },
});

function generateSlug(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    crypto.randomBytes(4).toString("hex")
  );
}

function generateApiKey() {
  return "mlh_" + crypto.randomBytes(24).toString("hex");
}

function parseReadmeForInputs(readmeContent) {
  const inputs = [];
  const lines = readmeContent.split("\n");
  let inInputSection = false;

  for (const line of lines) {
    if (/^#+\s*(inputs?|parameters?|features?)/i.test(line)) {
      inInputSection = true;
      continue;
    }
    if (inInputSection && /^#+\s/.test(line)) {
      inInputSection = false;
      continue;
    }
    if (inInputSection) {
      // Match patterns like: - feature_name (number): description
      // or: - feature_name: description
      // or: | feature_name | number | description |
      const bulletMatch = line.match(
        /^[\s]*[-*]\s*(\w+)\s*(?:\((\w+)\))?\s*[:\-]?\s*(.*)/
      );
      const tableMatch = line.match(
        /^\|?\s*(\w+)\s*\|\s*(\w+)\s*\|\s*(.*?)\s*\|?$/
      );

      if (bulletMatch && bulletMatch[1] !== "---") {
        inputs.push({
          name: bulletMatch[1],
          type: bulletMatch[2] || "number",
          description: bulletMatch[3]?.trim() || "",
        });
      } else if (tableMatch && tableMatch[1] !== "---" && tableMatch[1].toLowerCase() !== "name") {
        inputs.push({
          name: tableMatch[1],
          type: tableMatch[2] || "number",
          description: tableMatch[3]?.trim() || "",
        });
      }
    }
  }

  return inputs;
}

// Upload a new model
router.post(
  "/",
  authenticate,
  upload.fields([
    { name: "model", maxCount: 1 },
    { name: "readme", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, description, inputType, outputType } = req.body;

      if (!name || !req.files?.model) {
        return res.status(400).json({ error: "Model name and .h5 file are required" });
      }

      const slug = generateSlug(name);
      const apiKey = generateApiKey();

      // Upload model file to S3
      const modelKey = `models/${slug}/${req.files.model[0].originalname}`;
      await uploadToS3(req.files.model[0].buffer, modelKey, "application/octet-stream");

      // Upload README if provided and parse inputs
      let readmeKey = null;
      let inputSchema = [];
      if (req.files.readme) {
        readmeKey = `models/${slug}/README.md`;
        await uploadToS3(req.files.readme[0].buffer, readmeKey, "text/markdown");
        const readmeContent = req.files.readme[0].buffer.toString("utf-8");
        inputSchema = parseReadmeForInputs(readmeContent);
      }

      // Parse inputSchema from body if provided directly
      if (req.body.inputSchema) {
        try {
          inputSchema = JSON.parse(req.body.inputSchema);
        } catch {}
      }

      const model = await Model.create({
        userId: req.user._id,
        name,
        description: description || "",
        slug,
        apiKey,
        s3ModelKey: modelKey,
        s3ReadmeKey: readmeKey,
        inputType: inputType || "numeric",
        outputType: outputType || "classification",
        inputSchema,
        inputCount: inputSchema.length,
      });

      res.status(201).json({
        _id: model._id,
        name: model.name,
        slug: model.slug,
        apiKey: model.apiKey,
        apiUrl: `/api/predict/${model.slug}`,
        inputType: model.inputType,
        outputType: model.outputType,
        inputSchema: model.inputSchema,
        message: "Model uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload model" });
    }
  }
);

// Get all public models
router.get("/", async (req, res) => {
  try {
    const models = await Model.find({ isPublic: true })
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 })
      .select("-apiKey -s3ModelKey -s3ReadmeKey");

    res.json(models);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// Get current user's models
router.get("/mine", authenticate, async (req, res) => {
  try {
    const models = await Model.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// Get single model by slug
router.get("/:slug", async (req, res) => {
  try {
    const model = await Model.findOne({ slug: req.params.slug })
      .populate("userId", "name email avatar")
      .select("-s3ModelKey");

    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    // Only show apiKey to the owner
    const result = model.toObject();
    if (!req.cookies?.token) {
      delete result.apiKey;
    } else {
      const jwt = require("jsonwebtoken");
      try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        if (decoded.userId !== model.userId._id.toString()) {
          delete result.apiKey;
        }
      } catch {
        delete result.apiKey;
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch model" });
  }
});

// Get README content
router.get("/:slug/readme", async (req, res) => {
  try {
    const model = await Model.findOne({ slug: req.params.slug });
    if (!model || !model.s3ReadmeKey) {
      return res.status(404).json({ error: "README not found" });
    }

    const readmeUrl = await getSignedDownloadUrl(model.s3ReadmeKey);
    res.json({ url: readmeUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch README" });
  }
});

// Delete model
router.delete("/:slug", authenticate, async (req, res) => {
  try {
    const model = await Model.findOne({
      slug: req.params.slug,
      userId: req.user._id,
    });

    if (!model) {
      return res.status(404).json({ error: "Model not found or unauthorized" });
    }

    await deleteFromS3(model.s3ModelKey);
    if (model.s3ReadmeKey) {
      await deleteFromS3(model.s3ReadmeKey);
    }
    await Model.deleteOne({ _id: model._id });

    res.json({ message: "Model deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete model" });
  }
});

module.exports = router;
