const service = require("../services/folderService");

// tạo thư mục
exports.create = async (req, res) => {
  const folder = await service.createFolder(req.user.id, req.body);

  return res.status(201).json(folder);
};

// lấy thư mục con
exports.children = async (req, res) => {
  const folders = await service.getChildren(req.params.id);

  return res.json(folders);
};
