const mongoose = require("mongoose");

const connectDatabase = async () => {
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URL;

  if (!mongoUri) {
    throw new Error(
      "MongoDB connection string is not configured. Please set MONGODB_URI, MONGO_URI or DB_URL.",
    );
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDatabase;
