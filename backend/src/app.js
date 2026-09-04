const express = require("express");
const errorHandler = require("./middleware/errorHandler.js");
const logoutRoutes = require("./routes/logoutRoutes");
const refreshRoutes = require("./routes/refreshRoutes");

const app = express();

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

app.use(errorHandler);

module.exports = app;
