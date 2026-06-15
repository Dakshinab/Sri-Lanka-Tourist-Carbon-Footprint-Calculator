require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const tripsRouter = require("./routes/trips");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Logging setup ──
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const accessLog = fs.createWriteStream(path.join(logsDir, "access.log"), { flags: "a" });

// ── Middleware ──
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("combined", { stream: accessLog }));
app.use(morgan("dev"));

// ── Routes ──
app.use("/api/trips", tripsRouter);

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Carbon Footprint API running", timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});