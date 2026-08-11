const permissionService = require("../services/permissionService");
const auditLogService = require("../services/auditLogService");

module.exports = (requiredPermission) => {
  return async (req, res, next) => {
    const permissions = await permissionService.resolvePermission(
      req.user.id,
      req.params.id,
      req.params.resourceType,
    );
    // kiểm tra quyền yêu cầu
    if (!permissions.includes(requiredPermission)) {
      // ghi nhận sự kiện bị từ chối
      await auditLogService.log({
        userId: req.user.id,
        action: "ACCESS_DENIED",
        resourceType: req.params.resourceType,
        resourceId: req.params.id,
        result: "DENIED",
        ipAddress: req.ip,
        details: { requiredPermission },
      });
      return res.status(403).json({ message: "Permission denied" });
    }
    next();
  };
};
