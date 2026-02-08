const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    avatar: { type: String },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

module.exports = mongoose.model("User", userSchema);