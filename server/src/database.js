import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

	CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		applied_at TEXT NOT NULL
	);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    profile_role TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS research_events (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_time TEXT NOT NULL,
    app_version TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS research_events_participant_time
    ON research_events(participant_id, event_time);

  CREATE TABLE IF NOT EXISTS sms_verifications (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    purpose TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    verified_at TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sms_verifications_phone_created
    ON sms_verifications(phone, created_at DESC);

	CREATE TABLE IF NOT EXISTS research_consents (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		consent_version TEXT NOT NULL,
		status TEXT NOT NULL CHECK (status IN ('granted', 'withdrawn')),
		consented_at TEXT NOT NULL,
		withdrawn_at TEXT,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS research_consents_user_time
		ON research_consents(user_id, consented_at DESC);

	CREATE TABLE IF NOT EXISTS app_sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		started_at TEXT NOT NULL,
		ended_at TEXT,
		app_version TEXT,
		platform TEXT,
		device_pseudonym TEXT,
		metadata_json TEXT NOT NULL DEFAULT '{}',
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS app_sessions_user_started
		ON app_sessions(user_id, started_at DESC);

	CREATE TABLE IF NOT EXISTS conversations (
		id TEXT PRIMARY KEY,
		type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'support')),
		title TEXT,
		created_by TEXT NOT NULL,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL,
		FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
	);

	CREATE TABLE IF NOT EXISTS conversation_members (
		conversation_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		member_role TEXT NOT NULL DEFAULT 'member' CHECK (member_role IN ('owner', 'moderator', 'member')),
		joined_at TEXT NOT NULL,
		last_read_at TEXT,
		PRIMARY KEY (conversation_id, user_id),
		FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS conversation_members_user
		ON conversation_members(user_id, joined_at DESC);

	CREATE TABLE IF NOT EXISTS messages (
		id TEXT PRIMARY KEY,
		conversation_id TEXT NOT NULL,
		sender_id TEXT NOT NULL,
		message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
		body TEXT,
		metadata_json TEXT NOT NULL DEFAULT '{}',
		created_at TEXT NOT NULL,
		edited_at TEXT,
		deleted_at TEXT,
		FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT
	);

	CREATE INDEX IF NOT EXISTS messages_conversation_time
		ON messages(conversation_id, created_at DESC);

	CREATE TABLE IF NOT EXISTS message_reactions (
		message_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		emoji TEXT NOT NULL,
		created_at TEXT NOT NULL,
		PRIMARY KEY (message_id, user_id, emoji),
		FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS message_reactions_message
		ON message_reactions(message_id);

	CREATE TABLE IF NOT EXISTS admin_accounts (
		user_id TEXT PRIMARY KEY,
		system_role TEXT NOT NULL CHECK (system_role IN ('super_admin', 'admin', 'operator')),
		permissions_json TEXT NOT NULL DEFAULT '[]',
		is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
		created_by TEXT,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
	);

	CREATE INDEX IF NOT EXISTS admin_accounts_role_active
		ON admin_accounts(system_role, is_active);

	CREATE TABLE IF NOT EXISTS system_logs (
		id TEXT PRIMARY KEY,
		actor_user_id TEXT,
		actor_role TEXT,
		action TEXT NOT NULL,
		target_type TEXT,
		target_id TEXT,
		created_at TEXT NOT NULL,
		ip_address TEXT,
		metadata_json TEXT NOT NULL DEFAULT '{}',
		FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
	);

	CREATE INDEX IF NOT EXISTS system_logs_created
		ON system_logs(created_at DESC);

	CREATE INDEX IF NOT EXISTS system_logs_actor
		ON system_logs(actor_user_id, created_at DESC);

	CREATE TABLE IF NOT EXISTS content_items (
		id TEXT PRIMARY KEY, page_key TEXT NOT NULL, content_type TEXT NOT NULL CHECK (content_type IN ('video','text','feature')),
		title TEXT NOT NULL, value TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,
		created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
		FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
	);
	CREATE INDEX IF NOT EXISTS content_items_page ON content_items(page_key, is_active, sort_order);
`;

export function createDatabase(databasePath) {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const database = new Database(databasePath);
  database.pragma("busy_timeout = 5000");
  database.exec(SCHEMA);
	database.prepare(`
		INSERT OR IGNORE INTO schema_migrations (version, applied_at)
		VALUES (?, ?)
	`).run(1, new Date().toISOString());
	database.prepare(`
		INSERT OR IGNORE INTO schema_migrations (version, applied_at)
		VALUES (?, ?)
	`).run(2, new Date().toISOString());
	database.prepare(`
		INSERT OR IGNORE INTO schema_migrations (version, applied_at)
		VALUES (?, ?)
	`).run(3, new Date().toISOString());
	const userColumns = database.prepare("PRAGMA table_info(users)").all();
	if (!userColumns.some((column) => column.name === "deleted_at")) {
		database.exec("ALTER TABLE users ADD COLUMN deleted_at TEXT");
	}
	database.prepare(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)`).run(4, new Date().toISOString());
	const conversationColumns = database.prepare("PRAGMA table_info(conversations)").all();
	if (!conversationColumns.some((column) => column.name === "deleted_at")) database.exec("ALTER TABLE conversations ADD COLUMN deleted_at TEXT");
	database.prepare(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)`).run(5, new Date().toISOString());
	database.prepare(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)`).run(6, new Date().toISOString());
  database.exec(`
    UPDATE users SET phone = '+852' || phone
      WHERE length(phone) = 8 AND phone NOT LIKE '+%';
    UPDATE sms_verifications SET phone = '+852' || phone
      WHERE length(phone) = 8 AND phone NOT LIKE '+%';
  `);
  return database;
}
