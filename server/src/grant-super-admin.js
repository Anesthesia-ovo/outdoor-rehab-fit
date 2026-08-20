import crypto from "node:crypto";
import { readConfig } from "./config.js";
import { createDatabase } from "./database.js";

const identifier = String(process.argv[2] || "").trim().toLowerCase();
if (!identifier) {
	console.error("Usage: node src/grant-super-admin.js <registered-email-or-e164-phone>");
	process.exit(1);
}

const config = readConfig();
const database = createDatabase(config.databasePath);
const hkPhone = /^\d{8}$/.test(identifier) ? `+852${identifier}` : identifier;
const user = database.prepare(`
	SELECT * FROM users WHERE lower(COALESCE(email, '')) = ? OR phone = ?
`).get(identifier, hkPhone);

if (!user) {
	console.error("No registered user matches that identifier.");
	database.close();
	process.exit(2);
}

const before = database.prepare("SELECT * FROM admin_accounts WHERE user_id = ?").get(user.id) || null;
const now = new Date().toISOString();
database.prepare(`
	INSERT INTO admin_accounts
		(user_id, system_role, permissions_json, is_active, created_by, created_at, updated_at)
	VALUES (?, 'super_admin', '[]', 1, NULL, ?, ?)
	ON CONFLICT(user_id) DO UPDATE SET
		system_role = 'super_admin', permissions_json = '[]', is_active = 1, updated_at = excluded.updated_at
`).run(user.id, now, now);
database.prepare(`
	INSERT INTO system_logs
		(id, actor_user_id, actor_role, action, target_type, target_id, created_at, metadata_json)
	VALUES (?, NULL, 'system', 'super_admin.bootstrap', 'admin_account', ?, ?, ?)
`).run(crypto.randomUUID(), user.id, now, JSON.stringify({ before, assignedTo: user.id }));

console.log(`Super administrator access granted to ${user.name}.`);
database.close();
