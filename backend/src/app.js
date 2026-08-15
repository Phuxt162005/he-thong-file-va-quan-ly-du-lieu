const express = require("express");
const app = express();
app.use(express.json());

app.use("/api/auth", require("./routes/authRoute.js"));
app.use("/api/users", require("./routes/userRoute.js"));
app.use("/api/folders", require("./routes/folderRoute.js"));
app.use("/api/files", require("./routes/fileRoute.js"));
app.use("/api/shares", require("./routes/shareRoute.js"));
app.use("/api/permissions", require("./routes/permissionRoute.js"));

module.exports = app;
