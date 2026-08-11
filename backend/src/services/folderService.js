const repository = require("../repositories/folderRepository");

exports.createFolder = async (useImperativeHandle, data) => {
  // chuẩn hóa tên và gán owner
  data.name = data.name.trim();
  data.owner = useImperativeHandle;

  return await repository.create(data);
};

exports.getChildren = async (folderId) => {
  return await repository.findChildren(folderId);
};
