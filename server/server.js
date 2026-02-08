require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectDB = require("./config/db");

// Initialize passport config
require("./config/passport");

const app = express();

/* -------------------- Core Middleware -------------------- */

// CORS (unchanged behavior, safer defaults)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Passport
app.use(passport.initialize());

/* -------------------- Routes -------------------- */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/models", require("./routes/models"));
app.use("/api/predict", require("./routes/predict"));

/* -------------------- Health Check -------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* -------------------- Global Error Handler -------------------- */
/* (Does NOT change existing responses, only catches crashes) */

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

/* -------------------- Server Startup -------------------- */

const PORT = process.env.PORT || 5050;

// Graceful shutdown (PM2 & EC2 safe)
const serverStart = () => {
  const server = app.listen(PORT, () => {
    console.log(`ModelFlow API running on port ${PORT}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => process.exit(0));
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received. Shutting down gracefully...");
    server.close(() => process.exit(0));
  });
};

// Connect DB first, then start server
connectDB()
  .then(() => {
    serverStart();
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.log("Starting server anyway (DB-dependent routes may fail)");
    serverStart();
  });