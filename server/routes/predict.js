const express = require("express");
const multer = require("multer");
const axios = require("axios");
const Model = require("../models/Model");
const { getSignedDownloadUrl } = require("../config/s3");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Accept image or csv file
const fileUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "csv", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// POST /api/predict/:slug - Run model inference
router.post("/:slug", fileUpload, async (req, res) => {
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
      input_type: model.inputType,
      output_type: model.outputType,
    };

    // Extract input based on model's inputType
    switch (model.inputType) {
      case "image": {
        const imageFile = req.files?.image?.[0] || req.files?.file?.[0];
        if (imageFile) {
          payload.image_base64 = imageFile.buffer.toString("base64");
        } else if (req.body?.image_base64) {
          payload.image_base64 = req.body.image_base64;
        } else {
          return res.status(400).json({
            error: "This model expects an image input.",
            usage: "Send 'image' file (multipart) or 'image_base64' (JSON).",
          });
        }
        break;
      }

      case "text": {
        if (!req.body?.text) {
          return res.status(400).json({
            error: "This model expects a text input.",
            usage: '{"text": "your input text here"}',
          });
        }
        payload.text = req.body.text;
        break;
      }

      case "multi_text": {
        if (!req.body?.texts || !Array.isArray(req.body.texts)) {
          return res.status(400).json({
            error: "This model expects multiple text inputs.",
            usage: '{"texts": ["text1", "text2"]}',
            expected_fields: model.inputSchema.map((f) => f.name),
          });
        }
        payload.texts = req.body.texts;
        break;
      }

      case "csv": {
        const csvFile = req.files?.csv?.[0] || req.files?.file?.[0];
        if (csvFile) {
          payload.csv_data = csvFile.buffer.toString("utf-8");
        } else if (req.body?.csv_data) {
          payload.csv_data = req.body.csv_data;
        } else {
          return res.status(400).json({
            error: "This model expects CSV/tabular data.",
            usage: "Send 'csv' file (multipart) or 'csv_data' string (JSON).",
          });
        }
        break;
      }

      case "json": {
        if (!req.body?.data) {
          return res.status(400).json({
            error: "This model expects JSON data input.",
            usage: '{"data": { ... }}',
          });
        }
        payload.json_data = req.body.data;
        break;
      }

      case "numeric":
      default: {
        if (!req.body?.inputs) {
          return res.status(400).json({
            error: "This model expects numeric inputs.",
            usage: '{"inputs": [1.0, 2.0, 3.0]}',
            expected_fields: model.inputSchema.map((f) => f.name),
          });
        }
        payload.inputs = req.body.inputs;
        break;
      }
    }

    // Forward to Python inference service
    const inferenceResponse = await axios.post(
      `${process.env.INFERENCE_SERVICE_URL}/predict`,
      payload,
      { timeout: 120000, maxContentLength: 50 * 1024 * 1024 }
    );

    // Increment usage count
    await Model.updateOne({ _id: model._id }, { $inc: { usageCount: 1 } });

    // Return full response from inference service
    res.json({
      model: model.name,
      ...inferenceResponse.data,
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
