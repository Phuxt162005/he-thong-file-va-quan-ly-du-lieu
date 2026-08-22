const STORAGE_KEY = "file_upload_sessions";

function readSessions() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return {};
    }

    return JSON.parse(value);
  } catch {
    return {};
  }
}

function writeSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function createFileKey(file, folderId) {
  return [file.name, file.size, file.lastModified, folderId || "root"].join(
    "|",
  );
}

export function saveUploadSession(key, session) {
  const sessions = readSessions();
  sessions[key] = session;
  writeSessions(sessions);
}

export function getUploadSession(key) {
  const sessions = readSessions();
  return sessions[key] || null;
}

export function removeUploadSession(key) {
  const sessions = readSessions();
  delete sessions[key];
  writeSessions(sessions);
}

export function getAllUploadSessions() {
  return readSessions();
}
