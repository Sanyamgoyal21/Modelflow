const mongoose = require("mongoose");

const inputFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["number", "text", "array"], default: "number" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const modelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    apiKey: { type: String, required: true, unique: true },
    s3ModelKey: { type: String, required: true },
    s3ReadmeKey: { type: String },
    inputSchema: [inputFieldSchema],
    inputCount: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Model", modelSchema);
