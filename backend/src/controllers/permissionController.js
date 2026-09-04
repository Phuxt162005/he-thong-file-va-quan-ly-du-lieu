const service = require("../services/permissionService");
const asyncHandler = require("../middleware/asyncHandler");

// cấp quyền
exports.grant = asyncHandler(async (req, res) => {
  const permission = await service.grantPermission(
    req.user.id,
    req.body.userId,
    req.body.resourceId,
    req.body.resourceType,
    req.body.permissions,
  );

  return res.status(201).json(permission);
});

// xem danh sách permission
exports.getByResource = asyncHandler(async (req, res) => {
  const permissions = await service.getPermissions(
    req.user.id,
    req.params.resourceId,
    req.params.resourceType,
  );

  return res.json(permissions);
});

// cập nhật quyền
exports.update = asyncHandler(async (req, res) => {
  const permission = await service.updatePermission(
    req.user.id,
    req.params.id,
    req.body.permissions,
  );

  return res.json(permission);
});

// thu hồi quyền
exports.revoke = asyncHandler(async (req, res) => {
  await service.revokePermission(req.user.id, req.params.id);
  return res.json({ message: "Permission revoked successfully" });
});
