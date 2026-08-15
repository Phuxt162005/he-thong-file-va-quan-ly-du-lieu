const service = require("../services/permissionService");

// cấp quyền
exports.grant = async (req, res) => {
  const permission = await service.grantPermission(
    req.body.userId,
    req.body.resourceId,
    req.body.resourceType,
    req.body.permissions,
  );
  return res.status(201).json(permission);
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
  const permission = await service.updatePermission(
    req.params.id,
    req.body.permissions,
  );
  return res.json(permission);
};

// thu hồi quyền
exports.revoke = async (req, res) => {
  await service.revokePermission(req.params.id);

  return res.json({ message: "Permission revoked successfully" });
};
