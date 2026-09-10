const express = require("express");
const errorHandler = require("./middleware/errorHandler.js");
const logoutRoutes = require("./routes/logoutRoutes");
const passwordRoutes = require("./routes/passwordRoute");
const refreshRoutes = require("./routes/refreshRoutes");
const adminRoutes = require("./routes/adminRoute");

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

// CORS Frontend sử dụng Authorization header nên không cần credentials/cookie.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Chunk-Index, X-Chunk-Checksum",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.use("/api/auth", require("./routes/authRoute.js"));
app.use("/api/users", require("./routes/userRoute.js"));
app.use("/api/folders", require("./routes/folderRoute.js"));
app.use("/api/files", require("./routes/fileRoute.js"));
app.use("/api/shares", require("./routes/shareRoute.js"));
app.use("/api/permissions", require("./routes/permissionRoute.js"));
app.use("/api/activities", require("./routes/activityLogRoute.js"));
app.use("/api/audit-logs", require("./routes/auditLogRoute.js"));

app.use("/api/auth/logout", logoutRoutes);
app.use("/api/auth/refresh", refreshRoutes);
app.use("/api/auth/password", passwordRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

module.exports = app;
