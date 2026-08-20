import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase } from "../src/database.js";

test("creates the complete application database schema", () => {
	const database = createDatabase(":memory:");
	const tables = database.prepare(`
		SELECT name FROM sqlite_master
		WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
		ORDER BY name
	`).all().map((row) => row.name);

	assert.deepEqual(tables, [
		"admin_accounts",
		"app_sessions",
		"content_items",
		"conversation_members",
		"conversations",
		"message_reactions",
		"messages",
		"research_consents",
		"research_events",
		"schema_migrations",
		"sms_verifications",
		"system_logs",
		"users",
	]);
	assert.equal(database.pragma("foreign_keys", { simple: true }), 1);
	assert.equal(database.prepare("SELECT MAX(version) AS version FROM schema_migrations").get().version, 6);
	database.close();
});
