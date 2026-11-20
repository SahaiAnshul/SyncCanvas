import http from "http";
import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocket } from "./sockets/index.js";

dotenv.config();

async function startServer() {
  try {
    const server = http.createServer(app);

    initializeSocket(server);

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log("🚀 SyncCanvas Backend Started");
      console.log(`🌐 Server URL : http://localhost:${PORT}`);
      console.log(`📦 Environment : ${process.env.NODE_ENV || "development"}`);
    });

    // Connect database in background so server listens immediately
    connectDB().catch((err) => {
      console.error("Database connection error:", err?.message || err);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
