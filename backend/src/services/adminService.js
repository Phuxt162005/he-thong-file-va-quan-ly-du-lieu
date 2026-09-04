const bcrypt = require("bcrypt");

const adminRepository = require("../repositories/adminRepository");
const auditLogService = require("./auditLogService");
const httpError = require("../utils/httpError");

const validateUserData = (data) => {
  if (typeof data.username !== "string" || !data.username.trim()) {
    throw httpError("Username is required", 400);
  }
  if (typeof data.email !== "string" || !data.email.trim()) {
    throw httpError("Email is required", 400);
  }

  const email = data.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError("Invalid email", 400);
  }
  if (data.role !== undefined && !["user", "admin"].includes(data.role)) {
    throw httpError("Invalid role", 400);
  }
};

exports.getUsers = async () => {
  return adminRepository.findUsers();
};

exports.getUser = async (userId) => {
  const user = await adminRepository.findUserById(userId);
  if (!user) {
    throw httpError("User not found", 404);
  }

  return user;
};

exports.createUser = async (data, adminId, ipAddress = null) => {
  if (!data || typeof data !== "object") {
    throw httpError("Invalid user data", 400);
  }
  validateUserData(data);
  if (typeof data.password !== "string" || data.password.length < 8) {
    throw httpError("Password must contain at least 8 characters", 400);
  }

  const username = data.username.trim();
  const email = data.email.trim().toLowerCase();
  const password = await bcrypt.hash(data.password, 10);

  try {
    const user = await adminRepository.createUser({
      username,
      email,
      password,
      role: data.role || "user",
      storageLimit:
        Number.isFinite(data.storageLimit) && data.storageLimit >= 0
          ? data.storageLimit
          : undefined,
    });

    await auditLogService.log({
      userId: adminId,
      action: "ADMIN_CREATE_USER",
      resourceType: "user",
      resourceId: user._id,
      result: "SUCCESS",
      ipAddress,
    });

    return user;
  } catch (error) {
    if (error?.code === 11000) {
      throw httpError("Username or email already exists", 409);
    }
    throw error;
  }
};

exports.updateUser = async (userId, data, adminId, ipAddress = null) => {
  if (!data || typeof data !== "object") {
    throw httpError("Invalid user data", 400);
  }
  const allowedData = {};

  if (data.username !== undefined) {
    if (typeof data.username !== "string" || !data.username.trim()) {
      throw httpError("Invalid username", 400);
    }
    allowedData.username = data.username.trim();
  }

  if (data.email !== undefined) {
    if (typeof data.email !== "string" || !data.email.trim()) {
      throw httpError("Invalid email", 400);
    }

    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw httpError("Invalid email", 400);
    }
    allowedData.email = email;
  }

  if (data.role !== undefined) {
    if (!["user", "admin"].includes(data.role)) {
      throw httpError("Invalid role", 400);
    }
    allowedData.role = data.role;
  }

  if (data.storageLimit !== undefined) {
    if (!Number.isFinite(data.storageLimit) || data.storageLimit < 0) {
      throw httpError("Invalid storage limit", 400);
    }
    allowedData.storageLimit = data.storageLimit;
  }

  if (Object.keys(allowedData).length === 0) {
    throw httpError("No user data to update", 400);
  }

  try {
    const user = await adminRepository.updateUser(userId, allowedData);
    if (!user) {
      throw httpError("User not found", 404);
    }

    await auditLogService.log({
      userId: adminId,
      action: "ADMIN_UPDATE_USER",
      resourceType: "user",
      resourceId: userId,
      result: "SUCCESS",
      ipAddress,
      details: allowedData,
    });
    return user;
  } catch (error) {
    if (error?.code === 11000) {
      throw httpError("Username or email already exists", 409);
    }
    throw error;
  }
};

exports.deleteUser = async (userId, adminId, ipAddress = null) => {
  if (userId.toString() === adminId.toString()) {
    throw httpError("Admin cannot delete the current account", 400);
  }

  const user = await adminRepository.deleteUser(userId);
  if (!user) {
    throw httpError("User not found", 404);
  }

  await auditLogService.log({
    userId: adminId,
    action: "ADMIN_DELETE_USER",
    resourceType: "user",
    resourceId: userId,
    result: "SUCCESS",
    ipAddress,
  });
  return { message: "User deleted successfully" };
};

exports.getStorageStats = async () => {
  return adminRepository.getStorageStats();
};

exports.getSystemStats = async () => {
  return adminRepository.getSystemStats();
};
