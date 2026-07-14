// Admin user management (product closed-loop: account administration).
import { randomBytes } from "node:crypto";
import { getDb } from "../db/database.mjs";
import { hashPassword } from "../db/password.mjs";

function toUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

export function listAdminUsers() {
  return getDb()
    .prepare("SELECT id, username, display_name, role, status, created_at FROM admin_users ORDER BY created_at ASC")
    .all()
    .map(toUser);
}

export function createAdminUser(input = {}) {
  const username = String(input.username || "").trim();
  const password = String(input.password || "");
  if (!username || !password) {
    const error = new Error("username and password are required.");
    error.statusCode = 400;
    error.code = "USER_REQUIRED";
    throw error;
  }
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM admin_users WHERE username = ?").get(username);
  if (exists) {
    const error = new Error("Username already exists.");
    error.statusCode = 409;
    error.code = "USER_EXISTS";
    throw error;
  }
  const record = {
    id: `user_${Date.now()}_${randomBytes(3).toString("hex")}`,
    username,
    password_hash: hashPassword(password),
    display_name: String(input.displayName || username).trim(),
    role: ["admin", "operator"].includes(input.role) ? input.role : "operator",
    status: "active",
    created_at: new Date().toISOString()
  };
  db.prepare(
    `INSERT INTO admin_users (id, username, password_hash, display_name, role, status, created_at)
     VALUES (@id, @username, @password_hash, @display_name, @role, @status, @created_at)`
  ).run(record);
  return toUser(record);
}

export function updateAdminUser(id, input = {}) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id);
  if (!row) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }
  const displayName = input.displayName !== undefined ? String(input.displayName).trim() : row.display_name;
  const role = ["admin", "operator"].includes(input.role) ? input.role : row.role;
  const status = ["active", "disabled"].includes(input.status) ? input.status : row.status;
  db.prepare("UPDATE admin_users SET display_name = ?, role = ?, status = ? WHERE id = ?").run(
    displayName,
    role,
    status,
    id
  );
  if (input.password) {
    db.prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(hashPassword(String(input.password)), id);
  }
  return toUser(db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id));
}

export function deleteAdminUser(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id);
  if (!row) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }
  if (row.username === "admin") {
    const error = new Error("The built-in admin account cannot be deleted.");
    error.statusCode = 400;
    error.code = "USER_PROTECTED";
    throw error;
  }
  db.prepare("DELETE FROM admin_users WHERE id = ?").run(id);
  return { id };
}
