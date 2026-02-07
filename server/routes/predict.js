const express = require("express");
const multer = require("multer");
const axios = require("axios");
const Model = require("../models/Model");
const { getSignedDownloadUrl } = require("../config/s3");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/predict/:slug - Run model inference
// Accepts either JSON body with {"inputs": [...]} or multipart form with an image file
router.post("/:slug", upload.single("image"), async (req, res) => {
  try {
    const { slug } = req.params;
    const apiKey = req.headers["x-api-key"];

    // Find the model
    const model = await Model.findOne({ slug });
    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    // Validate API key
    if (model.apiKey !== apiKey) {
      return res.status(403).json({ error: "Invalid API key" });
    }

    // Get local file path for the model
    const modelPath = await getSignedDownloadUrl(model.s3ModelKey, 300);

    // Build payload for inference service
    const payload = {
      model_path: modelPath,
      model_key: model.s3ModelKey,
    };

    // Support image upload (multipart) or base64 image in JSON or raw numeric inputs
    if (req.file) {
      // Image sent as multipart file upload
      payload.image_base64 = req.file.buffer.toString("base64");
    } else if (req.body?.image_base64) {
      // Image sent as base64 string in JSON
      payload.image_base64 = req.body.image_base64;
    } else if (req.body?.inputs) {
      // Raw numeric inputs
      payload.inputs = req.body.inputs;
    } else {
      return res.status(400).json({
        error: "Missing input. Send 'image' file, 'image_base64' string, or 'inputs' array.",
        examples: {
          image_upload: "POST with multipart form-data, field name 'image'",
          image_base64: '{"image_base64": "<base64-encoded-image>"}',
          numeric: '{"inputs": [1.0, 2.0, 3.0]}',
        },
      });
    }

    // Forward to Python inference service
    const inferenceResponse = await axios.post(
      `${process.env.INFERENCE_SERVICE_URL}/predict`,
      payload,
      { timeout: 60000 }
    );

    // Increment usage count
    await Model.updateOne({ _id: model._id }, { $inc: { usageCount: 1 } });

    res.json({
      model: model.name,
      prediction: inferenceResponse.data.prediction,
    });
  } catch (error) {
    console.error("Prediction error:", error.message);
    if (error.response?.data) {
      return res.status(502).json({
        error: "Inference service error",
        details: error.response.data,
      });
    }
    res.status(500).json({ error: "Prediction failed" });
  }
});

module.exports = router;
