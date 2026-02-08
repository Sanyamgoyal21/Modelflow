const express = require("express");
const multer = require("multer");
const axios = require("axios");
const Model = require("../models/Model");
const { getSignedDownloadUrl } = require("../config/s3");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const fileUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "csv", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

router.post("/:slug", fileUpload, async (req, res) => {
  try {
    if (!process.env.INFERENCE_SERVICE_URL) {
      return res.status(500).json({ error: "Inference service not configured" });
    }

    const model = await Model.findOne({ slug: req.params.slug });
    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    if (model.apiKey !== req.headers["x-api-key"]) {
      return res.status(403).json({ error: "Invalid API key" });
    }

    const modelPath = await getSignedDownloadUrl(model.s3ModelKey);

    const payload = {
      model_path: modelPath.replace(
        "/server/uploads",
        "/inference/uploads"
      ),
      model_key: model.slug,
      input_type: model.inputType,
      output_type: model.outputType,
    };

    switch (model.inputType) {
      case "image":
        payload.image_base64 =
          req.files?.image?.[0]?.buffer.toString("base64") ||
          req.body?.image_base64;
        if (!payload.image_base64)
          return res.status(400).json({ error: "Image input required" });
        break;

      case "text":
        if (!req.body?.text)
          return res.status(400).json({ error: "Text input required" });
        payload.text = req.body.text;
        break;

      case "multi_text":
        if (!Array.isArray(req.body?.texts))
          return res.status(400).json({ error: "Texts array required" });
        payload.texts = req.body.texts;
        break;

      case "csv":
        payload.csv_data =
          req.files?.csv?.[0]?.buffer.toString("utf-8") ||
          req.body?.csv_data;
        if (!payload.csv_data)
          return res.status(400).json({ error: "CSV input required" });
        break;

      case "json":
        if (!req.body?.data)
          return res.status(400).json({ error: "JSON data required" });
        payload.json_data = req.body.data;
        break;

      default:
        if (!req.body?.inputs)
          return res.status(400).json({ error: "Numeric inputs required" });
        payload.inputs = req.body.inputs;
    }

    const response = await axios.post(
      `${process.env.INFERENCE_SERVICE_URL}/predict`,
      payload,
      { timeout: 120000 }
    );

    await Model.updateOne({ _id: model._id }, { $inc: { usageCount: 1 } });

    res.json({ model: model.name, ...response.data });
  } catch (error) {
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