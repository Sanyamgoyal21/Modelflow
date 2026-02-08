const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,          // better for production
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB connected`);
  } catch (error) {
    console.error("MongoDB connection failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;