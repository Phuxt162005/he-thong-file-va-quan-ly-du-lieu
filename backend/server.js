require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/config/database");
require("./src/jobs/uploadCleanupJob");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
