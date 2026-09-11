function normalizeFileName(fileName) {
  if (typeof fileName !== "string" || !fileName) {
    return fileName;
  }

  let normalized = fileName;

  // Các dấu hiệu thường gặp khi UTF-8 bị đọc nhầm thành Latin-1.
  const mojibakePattern = /(?:Ã.|Â.|â.|ð.|Ð.|Ñ.|áº.|á».|Ä.|Å.)/;
  if (!mojibakePattern.test(normalized)) {
    return normalized;
  }

  for (let i = 0; i < 2; i += 1) {
    try {
      const repaired = Buffer.from(normalized, "latin1").toString("utf8");
      if (!repaired || repaired === normalized) {
        break;
      }

      normalized = repaired;
      if (!mojibakePattern.test(normalized)) {
        break;
      }
    } catch {
      break;
    }
  }
  return normalized;
}

module.exports = { normalizeFileName };
