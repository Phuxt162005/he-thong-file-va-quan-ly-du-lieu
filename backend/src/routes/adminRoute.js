const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminController = require("../controllers/adminController");

router.use(authMiddleware, adminMiddleware);

router.get("/users", adminController.getUsers);

router.get("/users/:id", adminController.getUser);

router.post("/users", adminController.createUser);

router.put("/users/:id", adminController.updateUser);

router.delete("/users/:id", adminController.deleteUser);

router.get("/storage", adminController.getStorageStats);

router.get("/system", adminController.getSystemStats);

module.exports = router;
