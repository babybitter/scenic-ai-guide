export function logInfo(message, meta = {}) {
  writeLog("info", message, meta);
}

export function logError(message, meta = {}) {
  writeLog("error", message, meta);
}

function writeLog(level, message, meta) {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...meta
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}
