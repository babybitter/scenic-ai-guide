export function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

export function ok(res, data = null, meta = {}) {
  sendJson(res, 200, {
    success: true,
    data,
    meta
  });
}

export function created(res, data = null, meta = {}) {
  sendJson(res, 201, {
    success: true,
    data,
    meta
  });
}

export function fail(res, statusCode, code, message, details = null) {
  sendJson(res, statusCode, {
    success: false,
    error: {
      code,
      message,
      details
    }
  });
}
