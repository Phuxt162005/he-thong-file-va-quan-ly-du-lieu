const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 3,
      maxLength: 50,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxLength: 255,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    avatar: { type: String, default: null },
    storageUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    storageLimit: { type: Number, default: 5368709120, min: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
