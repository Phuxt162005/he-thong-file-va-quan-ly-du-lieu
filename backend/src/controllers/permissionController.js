const service = require("../services/permissionService");

// cấp quyền
exports.grant = async (req, res) => {
  try {
    const permission = await service.grantPermission(
      req.user.id,
      req.body.userId,
      req.body.resourceId,
      req.body.resourceType,
      req.body.permissions,
    );

    return res.status(201).json(permission);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// xem danh sách permission
exports.getByResource = async (req, res) => {
  try {
    const permissions = await service.getPermissions(
      req.params.resourceId,
      req.params.resourceType,
    );

    return res.json(permissions);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// cập nhật quyền
exports.update = async (req, res) => {
  try {
    const permission = await service.updatePermission(
      req.user.id,
      req.params.id,
      req.body.permissions,
    );

    return res.json(permission);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// thu hồi quyền
exports.revoke = async (req, res) => {
  try {
    await service.revokePermission(req.user.id, req.params.id);
    return res.json({ message: "Permission revoked successfully" });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};
