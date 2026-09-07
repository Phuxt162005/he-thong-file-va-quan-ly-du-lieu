import fileService from "./fileService";

const STORAGE_KEY = "chunk_upload_sessions";
const MAX_RETRIES = 3;

function getSessions() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function createFileKey(file, folderId) {
  return [
    file.name,
    file.size,
    file.lastModified,
    file.type,
    folderId || "root",
  ].join("|");
}

function saveSession(key, session) {
  const sessions = getSessions();
  sessions[key] = { ...session, updatedAt: Date.now() };
  saveSessions(sessions);
}

function getSession(key) {
  return getSessions()[key] || null;
}

function removeSession(key) {
  const sessions = getSessions();
  delete sessions[key];
  saveSessions(sessions);
}

function normalizeUploadedChunks(status) {
  const value =
    status?.uploadedChunks ??
    status?.completedChunks ??
    status?.chunks ??
    status?.uploaded ??
    [];

  if (Array.isArray(value)) {
    return new Set(
      value.map((item) =>
        typeof item === "object"
          ? Number(item.index ?? item.chunkIndex)
          : Number(item),
      ),
    );
  }
  return new Set();
}

async function retry(fn, retries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }

      const delay = 500 * Math.pow(2, attempt);
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }
  throw lastError;
}

async function getOrCreateSession(file, folderId, key) {
  const saved = getSession(key);
  if (saved?.uploadId) {
    try {
      const status = await fileService.getChunkUploadStatus(saved.uploadId);
      return {
        ...saved,
        ...status,
        uploadId: saved.uploadId,
      };
    } catch {
      removeSession(key);
    }
  }

  const session = await fileService.initiateChunkUpload(file, folderId);
  const normalized = {
    uploadId: session.uploadId,
    chunkSize: Number(session.chunkSize),
    totalChunks: Number(session.totalChunks),
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    folderId: folderId || null,
  };
  saveSession(key, normalized);
  return normalized;
}

async function upload(file, folderId, options = {}) {
  if (!file || file.size === 0) {
    throw new Error("Không thể upload file rỗng.");
  }

  const key = createFileKey(file, folderId);
  const session = await getOrCreateSession(file, folderId, key);
  const { uploadId, chunkSize, totalChunks } = session;
  if (!uploadId || !chunkSize || !totalChunks || totalChunks <= 0) {
    throw new Error("Upload session không hợp lệ.");
  }

  let uploadedChunks = new Set();
  try {
    const status = await fileService.getChunkUploadStatus(uploadId);
    uploadedChunks = normalizeUploadedChunks(status);
  } catch {
    // Session có thể vừa được tạo và chưa có chunk nào.
  }

  const completedBefore = uploadedChunks.size;

  if (options.onProgress) {
    options.onProgress(Math.round((completedBefore / totalChunks) * 100));
  }

  for (let index = 0; index < totalChunks; index += 1) {
    if (uploadedChunks.has(index)) {
      continue;
    }

    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    await retry(() => fileService.uploadChunk(uploadId, index, chunk));
    uploadedChunks.add(index);
    const progress = Math.round((uploadedChunks.size / totalChunks) * 100);

    if (options.onProgress) {
      options.onProgress(progress);
    }

    saveSession(key, {
      ...session,
      uploadedChunks: Array.from(uploadedChunks),
    });
  }

  await retry(() => fileService.completeChunkUpload(uploadId));
  removeSession(key);

  if (options.onProgress) {
    options.onProgress(100);
  }

  return { uploadId, totalChunks };
}

function getIncompleteUploads() {
  return Object.entries(getSessions()).map(([key, session]) => ({
    key,
    ...session,
  }));
}

function clearIncompleteUpload(key) {
  removeSession(key);
}

const chunkUploadService = {
  upload,
  getIncompleteUploads,
  clearIncompleteUpload,
};

export default chunkUploadService;
