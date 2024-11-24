import { Server } from "http";
import app from "./app";
import config from "./config";

const PORT = config.PORT || 5000;

let server: Server;

function startServer() {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (error) => {
    console.error("Server error:", error);
    stopServer();
  });
}

function stopServer() {
  if (server) {
    server.close((err) => {
      if (err) {
        console.error("Error while closing server:", err);
      } else {
        console.log("Server stopped. Restarting...");
        startServer();
      }
    });
  }
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  stopServer();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  stopServer();
});

// Start the server for the first time
startServer();
