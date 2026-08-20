import crypto from "node:crypto";
import express from "express";
import { hashPassword, signSmsVerification, signToken, verifyPassword, verifySmsVerification, verifyToken } from "./security.js";

const PROFILE_ROLES = new Set(["participant", "staff", "caregiver"]);
const SMS_PURPOSES = new Set(["registration", "password_reset"]);
const ADMIN_ROLES = new Set(["super_admin", "admin", "operator"]);
const OPERATOR_PERMISSIONS = new Set([
	"dashboard.read",
	"users.read",
	"users.edit",
	"research.read",
	"messages.read",
	"data.export",
]);
const ADMIN_PERMISSIONS = new Set([...OPERATOR_PERMISSIONS, "operators.manage"]);
const SUPER_ADMIN_PERMISSIONS = new Set([...ADMIN_PERMISSIONS, "system_logs.read"]);
const MAIN_CHAT_ID = "outdoor-fit-main-group";
const CHAT_REACTIONS = new Set(["👍", "❤️", "💪", "👏", "😄", "🎉"]);

function normalizePhone(value, countryCode = "+852") {
  const raw = String(value || "").trim();
  if (raw.startsWith("+")) return `+${raw.replace(/\D/g, "")}`;
  const dialCode = `+${String(countryCode || "+852").replace(/\D/g, "")}`;
  const dialDigits = dialCode.slice(1);
  let national = raw.replace(/\D/g, "");
  if (national.startsWith(dialDigits) && national.length > dialDigits.length + 6) {
    national = national.slice(dialDigits.length);
  }
  if (dialCode !== "+852") national = national.replace(/^0+/, "");
  return `${dialCode}${national}`;
}

function isValidE164(phone) {
  return /^\+[1-9][0-9]{7,14}$/.test(phone);
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email || null;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email || "",
    profileRole: user.profile_role,
    createdAt: user.created_at,
  };
}

function findUserByIdentifier(database, identifier, countryCode = "+852") {
  const raw = String(identifier || "").trim();
  if (raw.includes("@")) {
	return database.prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL").get(normalizeEmail(raw));
  }
	return database.prepare("SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL").get(normalizePhone(raw, countryCode));
}

function smsCodeHash(id, code, secret) {
  return crypto.createHmac("sha256", secret).update(`${id}:${code}`).digest();
}

function authenticatedUser(request, database, jwtSecret) {
  const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const payload = verifyToken(token, jwtSecret);
  if (!payload) return null;
	return database.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").get(payload.sub) || null;
}

function boundedLimit(value, fallback = 100, maximum = 500) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function parsePermissions(account) {
	if (account.system_role === "super_admin") return [...SUPER_ADMIN_PERMISSIONS];
	if (account.system_role === "admin") return [...ADMIN_PERMISSIONS];
	try {
		const requested = JSON.parse(account.permissions_json || "[]");
		return [...new Set(requested.filter((permission) => OPERATOR_PERMISSIONS.has(permission)))];
	} catch {
		return [];
	}
}

function publicAdminAccount(row) {
	return {
		userId: row.user_id,
		name: row.name,
		phone: row.phone,
		email: row.email || "",
		systemRole: row.system_role,
		permissions: parsePermissions(row),
		isActive: Boolean(row.is_active),
		createdAt: row.admin_created_at,
		updatedAt: row.admin_updated_at,
	};
}

function writeSystemLog(database, request, action, targetType, targetId, metadata = {}) {
	database.prepare(`
		INSERT INTO system_logs
			(id, actor_user_id, actor_role, action, target_type, target_id, created_at, ip_address, metadata_json)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		crypto.randomUUID(),
		request.admin?.user.id || null,
		request.admin?.account.system_role || null,
		action,
		targetType || null,
		targetId || null,
		new Date().toISOString(),
		String(request.ip || "").slice(0, 80) || null,
		JSON.stringify(metadata),
	);
}

function ensureMainConversation(database, user) {
	let conversation = database.prepare("SELECT * FROM conversations WHERE id = ?").get(MAIN_CHAT_ID);
	if (!conversation) {
		const now = new Date().toISOString();
		database.prepare(`
			INSERT INTO conversations (id, type, title, created_by, created_at, updated_at)
			VALUES (?, 'group', 'OUTDOOR-FIT 研究群组', ?, ?, ?)
		`).run(MAIN_CHAT_ID, user.id, now, now);
		conversation = database.prepare("SELECT * FROM conversations WHERE id = ?").get(MAIN_CHAT_ID);
	}
	database.prepare(`
		INSERT OR IGNORE INTO conversation_members
			(conversation_id, user_id, member_role, joined_at)
		VALUES (?, ?, ?, ?)
	`).run(MAIN_CHAT_ID, user.id, conversation.created_by === user.id ? "owner" : "member", new Date().toISOString());
	return conversation;
}

function chatMessages(database, currentUserId, conversationId = MAIN_CHAT_ID, limit = 100) {
	const rows = database.prepare(`
		SELECT * FROM (
			SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.body,
				m.metadata_json, m.created_at, m.edited_at, m.deleted_at, u.name AS sender_name
			FROM messages m JOIN users u ON u.id = m.sender_id
			WHERE m.conversation_id = ?
			ORDER BY m.created_at DESC LIMIT ?
		) ORDER BY created_at
	`).all(conversationId, limit);
	const reactionStatement = database.prepare(`
		SELECT emoji, COUNT(*) AS count FROM message_reactions
		WHERE message_id = ? GROUP BY emoji ORDER BY emoji
	`);
	return rows.map((row) => {
		let metadata = {};
		try { metadata = JSON.parse(row.metadata_json || "{}"); } catch { metadata = {}; }
		const reactions = Object.fromEntries(reactionStatement.all(row.id).map((item) => [item.emoji, item.count]));
		return {
			id: row.id,
			conversationId: row.conversation_id,
			senderId: row.sender_id,
			senderName: row.sender_name,
			isMine: row.sender_id === currentUserId,
			type: row.message_type,
			text: row.deleted_at ? "" : row.body || "",
			imageUri: row.deleted_at ? "" : metadata.imageData || "",
			timestamp: row.created_at,
			editedAt: row.edited_at,
			deletedAt: row.deleted_at,
			reactions,
		};
	});
}

async function twilioVerifyRequest(twilio, path, values) {
  const authorization = Buffer.from(`${twilio.apiKeySid}:${twilio.apiKeySecret}`).toString("base64");
  const result = await fetch(`https://verify.twilio.com/v2/Services/${twilio.verifyServiceSid}/${path}`, {
    method: "POST",
    headers: {
      authorization: `Basic ${authorization}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) {
    const error = new Error(`Twilio Verify request failed (${result.status})`);
    error.status = result.status;
    error.twilioCode = payload.code;
    throw error;
  }
  return payload;
}

export function createApp({ database, jwtSecret, smsMode = "mock", twilio = {} }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "3mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "outdoor-fit-api" });
  });

  app.post("/api/auth/sms/request", async (request, response) => {
    const countryCode = String(request.body?.countryCode || "+852");
    const phone = normalizePhone(request.body?.phone, countryCode);
    const purpose = String(request.body?.purpose || "registration");
    if (!isValidE164(phone)) {
      return response.status(400).json({ error: "invalidPhone" });
    }
    if (!SMS_PURPOSES.has(purpose)) {
      return response.status(400).json({ error: "invalidSmsPurpose" });
    }
    if (purpose === "password_reset" && !database.prepare("SELECT id FROM users WHERE phone = ?").get(phone)) {
      return response.status(404).json({ error: "accountNotFound" });
    }
    const now = Date.now();
    const recent = database.prepare(`
      SELECT created_at FROM sms_verifications
      WHERE phone = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1
    `).get(phone, purpose);
    if (recent && now - Date.parse(recent.created_at) < 60_000) {
      return response.status(429).json({ error: "smsRateLimited" });
    }

    const id = crypto.randomUUID();
    const code = smsMode === "mock" ? String(crypto.randomInt(0, 1_000_000)).padStart(6, "0") : null;
    const createdAt = new Date(now).toISOString();

    if (smsMode === "twilio") {
      try {
        await twilioVerifyRequest(twilio, "Verifications", { To: phone, Channel: "sms" });
      } catch (error) {
        console.error("Twilio verification send failed", { status: error.status, code: error.twilioCode });
        return response.status(502).json({ error: "smsDeliveryFailed" });
      }
    }

    database.prepare(`
      INSERT INTO sms_verifications (id, phone, purpose, code_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      phone,
      purpose,
      smsMode === "mock" ? smsCodeHash(id, code, jwtSecret) : "twilio-managed",
      new Date(now + 10 * 60_000).toISOString(),
      createdAt,
    );

    const body = { ok: true, expiresInSeconds: smsMode === "mock" ? 300 : 600 };
    if (smsMode === "mock") body.testCode = code;
    return response.status(201).json(body);
  });

  app.post("/api/auth/sms/verify", async (request, response) => {
    const countryCode = String(request.body?.countryCode || "+852");
    const phone = normalizePhone(request.body?.phone, countryCode);
    const code = String(request.body?.code || "");
    const purpose = String(request.body?.purpose || "registration");
    if (!SMS_PURPOSES.has(purpose)) {
      return response.status(400).json({ error: "invalidSmsPurpose" });
    }
    const record = database.prepare(`
      SELECT * FROM sms_verifications
      WHERE phone = ? AND purpose = ? AND verified_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, purpose);

    if (!record || record.attempt_count >= 5 || Date.parse(record.expires_at) <= Date.now()) {
      return response.status(400).json({ error: "invalidOrExpiredCode" });
    }
    database.prepare("UPDATE sms_verifications SET attempt_count = attempt_count + 1 WHERE id = ?").run(record.id);
    if (smsMode === "twilio") {
      try {
        const result = await twilioVerifyRequest(twilio, "VerificationCheck", { To: phone, Code: code });
        if (result.status !== "approved") {
          return response.status(400).json({ error: "invalidOrExpiredCode" });
        }
      } catch (error) {
        if (error.status === 404 || error.status === 400) {
          return response.status(400).json({ error: "invalidOrExpiredCode" });
        }
        console.error("Twilio verification check failed", { status: error.status, code: error.twilioCode });
        return response.status(502).json({ error: "smsVerificationFailed" });
      }
    } else {
      const actual = smsCodeHash(record.id, code, jwtSecret);
      const expected = Buffer.from(record.code_hash);
      if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
        return response.status(400).json({ error: "invalidOrExpiredCode" });
      }
    }

    database.prepare("UPDATE sms_verifications SET verified_at = ? WHERE id = ?").run(new Date().toISOString(), record.id);
    return response.json({ verificationToken: signSmsVerification(phone, jwtSecret, purpose) });
  });

  app.post("/api/auth/password/reset", async (request, response) => {
    const countryCode = String(request.body?.countryCode || "+852");
    const user = findUserByIdentifier(database, request.body?.identifier, countryCode);
    const newPassword = String(request.body?.newPassword || "");
    const verificationToken = String(request.body?.verificationToken || "");
    if (!user) return response.status(404).json({ error: "accountNotFound" });
    if (newPassword.length < 8) return response.status(400).json({ error: "passwordTooShort" });
    if (!verifySmsVerification(verificationToken, normalizePhone(user.phone, countryCode), jwtSecret, "password_reset")) {
      return response.status(403).json({ error: "phoneNotVerified" });
    }

    const passwordRecord = await hashPassword(newPassword);
    database.prepare(`
      UPDATE users SET password_salt = ?, password_hash = ?, updated_at = ? WHERE id = ?
    `).run(passwordRecord.salt, passwordRecord.hash, new Date().toISOString(), user.id);
    return response.json({ ok: true });
  });

  app.post("/api/auth/register", async (request, response) => {
    const name = String(request.body?.name || "").trim();
    const countryCode = String(request.body?.countryCode || "+852");
    const phone = normalizePhone(request.body?.phone, countryCode);
    const email = normalizeEmail(request.body?.email);
    const profileRole = String(request.body?.profileRole || "");
    const password = String(request.body?.password || "");
    const verificationToken = String(request.body?.verificationToken || "");

	if (!name || !isValidE164(phone) || !new Set(["participant", "caregiver"]).has(profileRole) || password.length < 8) {
      return response.status(400).json({ error: "invalidRegistration" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: "invalidEmail" });
    }
    if (!verifySmsVerification(verificationToken, phone, jwtSecret)) {
      return response.status(403).json({ error: "phoneNotVerified" });
    }

    const duplicate = database.prepare("SELECT phone, email FROM users WHERE phone = ? OR (? IS NOT NULL AND email = ?)").get(phone, email, email);
    if (duplicate) {
      return response.status(409).json({ error: duplicate.phone === phone ? "phoneExists" : "emailExists" });
    }

    const passwordRecord = await hashPassword(password);
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      name,
      phone,
      email,
      profile_role: profileRole,
      password_salt: passwordRecord.salt,
      password_hash: passwordRecord.hash,
      created_at: now,
      updated_at: now,
    };

    database.prepare(`
      INSERT INTO users (id, name, phone, email, profile_role, password_salt, password_hash, created_at, updated_at)
      VALUES (@id, @name, @phone, @email, @profile_role, @password_salt, @password_hash, @created_at, @updated_at)
    `).run(user);

    return response.status(201).json({ user: publicUser(user), token: signToken(user, jwtSecret) });
  });

  app.post("/api/auth/login", async (request, response) => {
    const user = findUserByIdentifier(database, request.body?.identifier, request.body?.countryCode);
    const password = String(request.body?.password || "");
    if (!user || !password || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
      return response.status(401).json({ error: "invalidCredentials" });
    }
    return response.json({ user: publicUser(user), token: signToken(user, jwtSecret) });
  });

  app.get("/api/users/me", (request, response) => {
    const user = authenticatedUser(request, database, jwtSecret);
    if (!user) return response.status(401).json({ error: "unauthorized" });
    return response.json({ user: publicUser(user) });
  });

	app.post("/api/research/events", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const eventName = String(request.body?.eventName || "").trim();
		if (!/^[a-zA-Z0-9_.:-]{1,80}$/.test(eventName)) {
			return response.status(400).json({ error: "invalidEventName" });
		}
		const metadata = request.body?.metadata && typeof request.body.metadata === "object"
			? request.body.metadata
			: {};
		const metadataJson = JSON.stringify(metadata);
		if (Buffer.byteLength(metadataJson, "utf8") > 16_384) {
			return response.status(413).json({ error: "eventMetadataTooLarge" });
		}
		const event = {
			id: crypto.randomUUID(),
			participantId: user.id,
			eventName,
			eventTime: new Date().toISOString(),
			appVersion: String(request.body?.appVersion || "").slice(0, 40) || null,
			metadataJson,
		};
		database.prepare(`
			INSERT INTO research_events (id, participant_id, event_name, event_time, app_version, metadata_json)
			VALUES (@id, @participantId, @eventName, @eventTime, @appVersion, @metadataJson)
		`).run(event);
		return response.status(201).json({ ok: true, eventId: event.id });
	});

	app.get("/api/content", (request, response) => {
		const pageKey = String(request.query.pageKey || "").trim();
		const items = database.prepare(`SELECT id, page_key AS pageKey, content_type AS contentType, title, value, sort_order AS sortOrder FROM content_items WHERE is_active = 1 AND (? = '' OR page_key = ?) ORDER BY page_key, sort_order, created_at`).all(pageKey, pageKey);
		return response.json({ items });
	});

	app.get("/api/chat/messages", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		ensureMainConversation(database, user);
		return response.json({
			conversation: { id: MAIN_CHAT_ID, title: "OUTDOOR-FIT 研究群组" },
			messages: chatMessages(database, user.id, MAIN_CHAT_ID, boundedLimit(request.query.limit, 100, 200)),
		});
	});

	app.post("/api/chat/messages", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		ensureMainConversation(database, user);
		const messageType = String(request.body?.type || "text");
		const text = String(request.body?.text || "").trim();
		const imageData = String(request.body?.imageData || "");
		if (!new Set(["text", "image"]).has(messageType)) {
			return response.status(400).json({ error: "invalidMessageType" });
		}
		if (messageType === "text" && (!text || text.length > 2_000)) {
			return response.status(400).json({ error: "invalidMessage" });
		}
		if (messageType === "image" && (!/^data:image\/(jpeg|png|webp);base64,/.test(imageData) || imageData.length > 2_500_000)) {
			return response.status(400).json({ error: "invalidImage" });
		}
		const recentCount = database.prepare(`
			SELECT COUNT(*) AS count FROM messages
			WHERE sender_id = ? AND created_at >= datetime('now', '-1 minute')
		`).get(user.id).count;
		if (recentCount >= 20) return response.status(429).json({ error: "chatRateLimited" });
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		database.prepare(`
			INSERT INTO messages
				(id, conversation_id, sender_id, message_type, body, metadata_json, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`).run(
			id,
			MAIN_CHAT_ID,
			user.id,
			messageType,
			messageType === "text" ? text : null,
			JSON.stringify(messageType === "image" ? { imageData } : {}),
			now,
		);
		database.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(now, MAIN_CHAT_ID);
		const message = chatMessages(database, user.id, MAIN_CHAT_ID, 200).find((item) => item.id === id);
		return response.status(201).json({ message });
	});

	app.post("/api/chat/messages/:id/reactions", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		ensureMainConversation(database, user);
		const emoji = String(request.body?.emoji || "");
		if (!CHAT_REACTIONS.has(emoji)) return response.status(400).json({ error: "invalidReaction" });
		const message = database.prepare(`
			SELECT id FROM messages WHERE id = ? AND conversation_id = ? AND deleted_at IS NULL
		`).get(request.params.id, MAIN_CHAT_ID);
		if (!message) return response.status(404).json({ error: "messageNotFound" });
		const existing = database.prepare(`
			SELECT 1 FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?
		`).get(message.id, user.id, emoji);
		if (existing) {
			database.prepare("DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?").run(message.id, user.id, emoji);
		} else {
			database.prepare(`
				INSERT INTO message_reactions (message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)
			`).run(message.id, user.id, emoji, new Date().toISOString());
		}
		const reactions = Object.fromEntries(database.prepare(`
			SELECT emoji, COUNT(*) AS count FROM message_reactions WHERE message_id = ? GROUP BY emoji
		`).all(message.id).map((item) => [item.emoji, item.count]));
		return response.json({ reactions });
	});

	app.get("/api/chat/participants", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		if (user.profile_role !== "staff") return response.status(403).json({ error: "staffRequired" });
		const phone = normalizePhone(request.query.phone, request.query.countryCode || "+852");
		if (!isValidE164(phone)) return response.status(400).json({ error: "invalidPhone" });
		const participant = database.prepare(`
			SELECT * FROM users WHERE phone = ? AND profile_role = 'participant'
		`).get(phone);
		return response.json({ participant: participant ? publicUser(participant) : null });
	});

	app.get("/api/chat/conversations", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const conversations = database.prepare(`
			SELECT c.id, c.type, c.title, c.updated_at AS updatedAt,
				(SELECT COUNT(*) FROM conversation_members members WHERE members.conversation_id = c.id) AS memberCount,
				(SELECT u.id FROM conversation_members cm2 JOIN users u ON u.id = cm2.user_id
				 WHERE cm2.conversation_id = c.id AND cm2.user_id != ? LIMIT 1) AS otherUserId,
				(SELECT u.name FROM conversation_members cm2 JOIN users u ON u.id = cm2.user_id
				 WHERE cm2.conversation_id = c.id AND cm2.user_id != ? LIMIT 1) AS otherUserName,
				(SELECT u.phone FROM conversation_members cm2 JOIN users u ON u.id = cm2.user_id
				 WHERE cm2.conversation_id = c.id AND cm2.user_id != ? LIMIT 1) AS otherUserPhone,
				(SELECT COUNT(*) FROM messages m
				 WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.deleted_at IS NULL
				 AND m.created_at > COALESCE(mine.last_read_at, '1970-01-01T00:00:00.000Z')) AS unreadCount,
				(SELECT CASE WHEN m.message_type = 'image' THEN '[图片]' ELSE COALESCE(m.body, '') END
				 FROM messages m WHERE m.conversation_id = c.id AND m.deleted_at IS NULL
				 ORDER BY m.created_at DESC LIMIT 1) AS lastMessage
			FROM conversation_members mine JOIN conversations c ON c.id = mine.conversation_id
			WHERE mine.user_id = ? AND c.deleted_at IS NULL
			ORDER BY c.updated_at DESC
		`).all(user.id, user.id, user.id, user.id, user.id);
		return response.json({ conversations });
	});

	app.post("/api/chat/conversations", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		if (user.profile_role !== "staff") return response.status(403).json({ error: "staffRequired" });
		const participant = database.prepare(`
			SELECT * FROM users WHERE id = ? AND profile_role = 'participant'
		`).get(String(request.body?.participantId || ""));
		if (!participant) return response.status(404).json({ error: "participantNotFound" });
		let conversation = database.prepare(`
			SELECT c.* FROM conversations c
			JOIN conversation_members a ON a.conversation_id = c.id AND a.user_id = ?
			JOIN conversation_members b ON b.conversation_id = c.id AND b.user_id = ?
			WHERE c.type = 'direct' LIMIT 1
		`).get(user.id, participant.id);
		if (!conversation) {
			const now = new Date().toISOString();
			conversation = {
				id: crypto.randomUUID(),
				type: "direct",
				title: `${user.name} / ${participant.name}`,
				created_by: user.id,
				created_at: now,
				updated_at: now,
			};
			database.prepare(`
				INSERT INTO conversations (id, type, title, created_by, created_at, updated_at)
				VALUES (@id, @type, @title, @created_by, @created_at, @updated_at)
			`).run(conversation);
			const addMember = database.prepare(`
				INSERT INTO conversation_members (conversation_id, user_id, member_role, joined_at, last_read_at)
				VALUES (?, ?, ?, ?, ?)
			`);
			addMember.run(conversation.id, user.id, "owner", now, now);
			addMember.run(conversation.id, participant.id, "member", now, null);
		}
		return response.status(201).json({ conversation: { id: conversation.id, title: conversation.title, participant: publicUser(participant) } });
	});

	app.post("/api/chat/groups", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		if (user.profile_role !== "staff") return response.status(403).json({ error: "staffRequired" });
		const title = String(request.body?.title || "").trim();
		const participantIds = [...new Set(Array.isArray(request.body?.participantIds) ? request.body.participantIds.map(String) : [])];
		if (!title || title.length > 80 || participantIds.length < 1 || participantIds.length > 100) return response.status(400).json({ error: "invalidGroup" });
		const participants = database.prepare(`SELECT id FROM users WHERE id IN (${participantIds.map(() => "?").join(",")}) AND profile_role = 'participant' AND deleted_at IS NULL`).all(...participantIds);
		if (participants.length !== participantIds.length) return response.status(404).json({ error: "participantNotFound" });
		const now = new Date().toISOString(); const id = crypto.randomUUID();
		database.prepare(`INSERT INTO conversations (id, type, title, created_by, created_at, updated_at) VALUES (?, 'group', ?, ?, ?, ?)`).run(id, title, user.id, now, now);
		const add = database.prepare(`INSERT INTO conversation_members (conversation_id, user_id, member_role, joined_at, last_read_at) VALUES (?, ?, ?, ?, ?)`);
		add.run(id, user.id, "owner", now, now); participants.forEach((participant) => add.run(id, participant.id, "member", now, null));
		return response.status(201).json({ conversation: { id, type: "group", title, memberCount: participants.length + 1 } });
	});

	app.post("/api/chat/conversations/:id/members", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const conversation = database.prepare(`SELECT c.* FROM conversations c JOIN conversation_members mine ON mine.conversation_id = c.id WHERE c.id = ? AND c.type = 'group' AND mine.user_id = ? AND mine.member_role IN ('owner','moderator')`).get(request.params.id, user.id);
		if (!conversation || user.profile_role !== "staff") return response.status(403).json({ error: "conversationAccessDenied" });
		const participant = database.prepare(`SELECT id FROM users WHERE id = ? AND profile_role = 'participant' AND deleted_at IS NULL`).get(String(request.body?.participantId || ""));
		if (!participant) return response.status(404).json({ error: "participantNotFound" });
		const now = new Date().toISOString();
		database.prepare(`INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, member_role, joined_at, last_read_at) VALUES (?, ?, 'member', ?, NULL)`).run(conversation.id, participant.id, now);
		database.prepare(`UPDATE conversations SET updated_at = ? WHERE id = ?`).run(now, conversation.id);
		return response.json({ ok: true });
	});

	app.get("/api/chat/conversations/:id/details", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret); if (!user) return response.status(401).json({ error: "unauthorized" });
		const conversation = database.prepare(`SELECT c.*, mine.member_role AS myRole FROM conversations c JOIN conversation_members mine ON mine.conversation_id = c.id WHERE c.id = ? AND c.deleted_at IS NULL AND mine.user_id = ?`).get(request.params.id, user.id);
		if (!conversation) return response.status(403).json({ error: "conversationAccessDenied" });
		const members = database.prepare(`SELECT u.id, u.name, CASE WHEN ? = 'staff' THEN u.phone ELSE '' END AS phone, u.profile_role AS profileRole, cm.member_role AS memberRole FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ? AND u.deleted_at IS NULL ORDER BY CASE cm.member_role WHEN 'owner' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END, u.name`).all(user.profile_role, conversation.id);
		return response.json({ conversation: { id: conversation.id, type: conversation.type, title: conversation.title, myRole: conversation.myRole, canManage: user.profile_role === "staff" && ["owner", "moderator"].includes(conversation.myRole) }, members });
	});

	app.patch("/api/chat/conversations/:id", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret); if (!user) return response.status(401).json({ error: "unauthorized" });
		const group = database.prepare(`SELECT c.*, mine.member_role AS myRole FROM conversations c JOIN conversation_members mine ON mine.conversation_id = c.id WHERE c.id = ? AND c.type = 'group' AND c.deleted_at IS NULL AND mine.user_id = ?`).get(request.params.id, user.id);
		if (!group || user.profile_role !== "staff" || !["owner", "moderator"].includes(group.myRole)) return response.status(403).json({ error: "conversationAccessDenied" });
		const title = String(request.body?.title || "").trim(); if (!title || title.length > 80) return response.status(400).json({ error: "invalidGroup" });
		database.prepare(`UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?`).run(title, new Date().toISOString(), group.id);
		request.admin = { user, account: { system_role: "project_staff" } }; writeSystemLog(database, request, "group.rename", "conversation", group.id, { before: group.title, after: title });
		return response.json({ ok: true, title });
	});

	app.delete("/api/chat/conversations/:id", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret); if (!user) return response.status(401).json({ error: "unauthorized" });
		const group = database.prepare(`SELECT c.*, mine.member_role AS myRole FROM conversations c JOIN conversation_members mine ON mine.conversation_id = c.id WHERE c.id = ? AND c.type = 'group' AND c.deleted_at IS NULL AND mine.user_id = ?`).get(request.params.id, user.id);
		if (!group) return response.status(404).json({ error: "conversationNotFound" });
		if (request.query.mode === "leave") {
			if (group.myRole === "owner") return response.status(400).json({ error: "ownerMustDissolve" });
			database.prepare(`DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?`).run(group.id, user.id);
			return response.json({ ok: true });
		}
		if (user.profile_role !== "staff" || group.myRole !== "owner") return response.status(403).json({ error: "conversationAccessDenied" });
		const now = new Date().toISOString(); database.prepare(`UPDATE conversations SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(now, now, group.id);
		request.admin = { user, account: { system_role: "project_staff" } }; writeSystemLog(database, request, "group.dissolve", "conversation", group.id, { title: group.title });
		return response.json({ ok: true });
	});

	app.get("/api/chat/conversations/:id/messages", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const membership = database.prepare(`
			SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?
		`).get(request.params.id, user.id);
		if (!membership) return response.status(403).json({ error: "conversationAccessDenied" });
		const messages = chatMessages(database, user.id, request.params.id, boundedLimit(request.query.limit, 150, 300));
		database.prepare(`
			UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?
		`).run(new Date().toISOString(), request.params.id, user.id);
		return response.json({ messages });
	});

	app.post("/api/chat/conversations/:id/messages", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const membership = database.prepare(`
			SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?
		`).get(request.params.id, user.id);
		if (!membership) return response.status(403).json({ error: "conversationAccessDenied" });
		const messageType = String(request.body?.type || "text");
		const text = String(request.body?.text || "").trim();
		const imageData = String(request.body?.imageData || "");
		if (!new Set(["text", "image"]).has(messageType)) return response.status(400).json({ error: "invalidMessageType" });
		if (messageType === "text" && (!text || text.length > 2_000)) return response.status(400).json({ error: "invalidMessage" });
		if (messageType === "image" && (!/^data:image\/(jpeg|png|webp);base64,/.test(imageData) || imageData.length > 2_500_000)) {
			return response.status(400).json({ error: "invalidImage" });
		}
		const recentCount = database.prepare(`
			SELECT COUNT(*) AS count FROM messages WHERE sender_id = ? AND created_at >= datetime('now', '-1 minute')
		`).get(user.id).count;
		if (recentCount >= 20) return response.status(429).json({ error: "chatRateLimited" });
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		database.prepare(`
			INSERT INTO messages (id, conversation_id, sender_id, message_type, body, metadata_json, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`).run(id, request.params.id, user.id, messageType, messageType === "text" ? text : null, JSON.stringify(messageType === "image" ? { imageData } : {}), now);
		database.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(now, request.params.id);
		database.prepare(`UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?`).run(now, request.params.id, user.id);
		return response.status(201).json({ message: chatMessages(database, user.id, request.params.id, 300).find((item) => item.id === id) });
	});

	app.post("/api/chat/conversations/:conversationId/messages/:messageId/reactions", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const membership = database.prepare(`SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?`).get(request.params.conversationId, user.id);
		if (!membership) return response.status(403).json({ error: "conversationAccessDenied" });
		const emoji = String(request.body?.emoji || "");
		if (!CHAT_REACTIONS.has(emoji)) return response.status(400).json({ error: "invalidReaction" });
		const message = database.prepare(`SELECT id FROM messages WHERE id = ? AND conversation_id = ? AND deleted_at IS NULL`).get(request.params.messageId, request.params.conversationId);
		if (!message) return response.status(404).json({ error: "messageNotFound" });
		const existing = database.prepare(`SELECT 1 FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`).get(message.id, user.id, emoji);
		if (existing) database.prepare(`DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`).run(message.id, user.id, emoji);
		else database.prepare(`INSERT INTO message_reactions (message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)`).run(message.id, user.id, emoji, new Date().toISOString());
		return response.json({ ok: true });
	});

	app.get("/api/chat/notifications", (request, response) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const notifications = database.prepare(`
			SELECT m.id, m.conversation_id AS conversationId, m.message_type AS messageType,
				CASE WHEN m.message_type = 'image' THEN '[图片]' ELSE COALESCE(m.body, '') END AS preview,
				m.created_at AS createdAt, u.name AS senderName, c.title AS conversationTitle
			FROM conversation_members mine
			JOIN conversations c ON c.id = mine.conversation_id
			JOIN messages m ON m.conversation_id = c.id
			JOIN users u ON u.id = m.sender_id
			WHERE mine.user_id = ? AND m.sender_id != ? AND m.deleted_at IS NULL
				AND m.created_at > COALESCE(mine.last_read_at, '1970-01-01T00:00:00.000Z')
			ORDER BY m.created_at DESC LIMIT 20
		`).all(user.id, user.id);
		return response.json({ notifications });
	});

	app.use("/api/admin", (request, response, next) => {
		const user = authenticatedUser(request, database, jwtSecret);
		if (!user) return response.status(401).json({ error: "unauthorized" });
		const account = database.prepare("SELECT * FROM admin_accounts WHERE user_id = ?").get(user.id);
		if (!account || !account.is_active || !ADMIN_ROLES.has(account.system_role)) {
			return response.status(403).json({ error: "adminRequired" });
		}
		request.admin = { user, account, permissions: parsePermissions(account) };
		next();
	});

	const requirePermission = (permission) => (request, response, next) => {
		if (!request.admin.permissions.includes(permission)) {
			return response.status(403).json({ error: "permissionDenied" });
		}
		next();
	};

	app.get("/api/admin/me", (request, response) => {
		return response.json({
			user: publicUser(request.admin.user),
			admin: {
				systemRole: request.admin.account.system_role,
				permissions: request.admin.permissions,
			},
		});
	});

	app.get("/api/admin/overview", requirePermission("dashboard.read"), (_request, response) => {
		const counts = database.prepare(`
			SELECT
				(SELECT COUNT(*) FROM users) AS users,
				(SELECT COUNT(*) FROM sms_verifications) AS smsRequests,
				(SELECT COUNT(*) FROM sms_verifications WHERE verified_at IS NOT NULL) AS smsVerified,
				(SELECT COUNT(*) FROM research_events) AS researchEvents,
				(SELECT COUNT(*) FROM conversations) AS conversations,
				(SELECT COUNT(*) FROM messages WHERE deleted_at IS NULL) AS messages,
				(SELECT COUNT(*) FROM research_consents WHERE status = 'granted') AS activeConsents
		`).get();
		const roles = database.prepare(`
			SELECT profile_role AS role, COUNT(*) AS count FROM users GROUP BY profile_role ORDER BY count DESC
		`).all();
		const eventTypes = database.prepare(`
			SELECT event_name AS eventName, COUNT(*) AS count
			FROM research_events GROUP BY event_name ORDER BY count DESC, event_name LIMIT 12
		`).all();
		const registrations = database.prepare(`
			SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
			FROM users
			WHERE created_at >= datetime('now', '-30 days')
			GROUP BY substr(created_at, 1, 10) ORDER BY day
		`).all();
		return response.json({ counts, roles, eventTypes, registrations });
	});

	app.get("/api/admin/users", requirePermission("users.read"), (request, response) => {
		const search = String(request.query.search || "").trim();
		const limit = boundedLimit(request.query.limit, 200, 500);
		const pattern = `%${search.replace(/[%_]/g, "")}%`;
		const users = database.prepare(`
			SELECT id, name, phone, COALESCE(email, '') AS email, profile_role AS profileRole,
				created_at AS createdAt, updated_at AS updatedAt
			FROM users
			WHERE deleted_at IS NULL AND (? = '' OR name LIKE ? OR phone LIKE ? OR COALESCE(email, '') LIKE ?)
			ORDER BY created_at DESC LIMIT ?
		`).all(search, pattern, pattern, pattern, limit);
		return response.json({ users });
	});

	app.post("/api/admin/users", requirePermission("users.edit"), async (request, response) => {
		const name = String(request.body?.name || "").trim();
		const countryCode = String(request.body?.countryCode || "+852");
		const phone = normalizePhone(request.body?.phone, countryCode);
		const email = normalizeEmail(request.body?.email);
		const profileRole = String(request.body?.profileRole || "participant");
		const password = String(request.body?.password || "");
		if (!name || !isValidE164(phone) || !PROFILE_ROLES.has(profileRole) || password.length < 8) {
			return response.status(400).json({ error: "invalidRegistration" });
		}
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return response.status(400).json({ error: "invalidEmail" });
		}
		const duplicate = database.prepare("SELECT phone, email FROM users WHERE phone = ? OR (? IS NOT NULL AND email = ?)").get(phone, email, email);
		if (duplicate) return response.status(409).json({ error: duplicate.phone === phone ? "phoneExists" : "emailExists" });
		const passwordRecord = await hashPassword(password);
		const now = new Date().toISOString();
		const user = { id: crypto.randomUUID(), name, phone, email, profile_role: profileRole, password_salt: passwordRecord.salt, password_hash: passwordRecord.hash, created_at: now, updated_at: now };
		database.prepare(`
			INSERT INTO users (id, name, phone, email, profile_role, password_salt, password_hash, created_at, updated_at)
			VALUES (@id, @name, @phone, @email, @profile_role, @password_salt, @password_hash, @created_at, @updated_at)
		`).run(user);
		writeSystemLog(database, request, "user.create", "user", user.id, { user: publicUser(user) });
		return response.status(201).json({ user: publicUser(user) });
	});

	app.patch("/api/admin/users/:id", requirePermission("users.edit"), (request, response) => {
		const target = database.prepare("SELECT * FROM users WHERE id = ?").get(request.params.id);
		if (!target) return response.status(404).json({ error: "userNotFound" });
		const name = String(request.body?.name ?? target.name).trim();
		const email = normalizeEmail(request.body?.email ?? target.email);
		const profileRole = String(request.body?.profileRole ?? target.profile_role);
		if (!name || !PROFILE_ROLES.has(profileRole)) return response.status(400).json({ error: "invalidUserUpdate" });
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return response.status(400).json({ error: "invalidEmail" });
		}
		const duplicateEmail = email
			? database.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, target.id)
			: null;
		if (duplicateEmail) return response.status(409).json({ error: "emailExists" });
		const updatedAt = new Date().toISOString();
		database.prepare(`
			UPDATE users SET name = ?, email = ?, profile_role = ?, updated_at = ? WHERE id = ?
		`).run(name, email, profileRole, updatedAt, target.id);
		writeSystemLog(database, request, "user.update", "user", target.id, {
			before: publicUser(target),
			after: { name, email: email || "", profileRole },
		});
		const updated = database.prepare("SELECT * FROM users WHERE id = ?").get(target.id);
		return response.json({ user: publicUser(updated) });
	});

	app.delete("/api/admin/users/:id", requirePermission("users.edit"), async (request, response) => {
		const target = database.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").get(request.params.id);
		if (!target) return response.status(404).json({ error: "userNotFound" });
		if (target.id === request.admin.user.id) return response.status(400).json({ error: "cannotDeleteSelf" });
		if (database.prepare("SELECT 1 FROM admin_accounts WHERE user_id = ?").get(target.id)) return response.status(409).json({ error: "adminAccountMustBeRemovedFirst" });
		const now = new Date().toISOString(); const passwordRecord = await hashPassword(crypto.randomUUID());
		database.prepare(`UPDATE users SET name = '已删除用户', phone = ?, email = NULL, password_salt = ?, password_hash = ?, updated_at = ?, deleted_at = ? WHERE id = ?`).run(`deleted-${target.id}`, passwordRecord.salt, passwordRecord.hash, now, now, target.id);
		writeSystemLog(database, request, "user.delete", "user", target.id, { before: publicUser(target), anonymized: true });
		return response.json({ ok: true });
	});

	app.get("/api/admin/research-events", requirePermission("research.read"), (request, response) => {
		const limit = boundedLimit(request.query.limit, 200, 500);
		const events = database.prepare(`
			SELECT e.id, e.event_name AS eventName, e.event_time AS eventTime,
				e.app_version AS appVersion, e.metadata_json AS metadataJson,
				u.id AS participantId, u.name AS participantName
			FROM research_events e JOIN users u ON u.id = e.participant_id
			ORDER BY e.event_time DESC LIMIT ?
		`).all(limit);
		return response.json({ events });
	});

	app.get("/api/admin/content", requirePermission("users.edit"), (_request, response) => {
		const items = database.prepare(`SELECT id, page_key AS pageKey, content_type AS contentType, title, value, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM content_items ORDER BY page_key, sort_order, created_at`).all().map((item) => ({ ...item, isActive: Boolean(item.isActive) }));
		return response.json({ items });
	});
	app.post("/api/admin/content", requirePermission("users.edit"), (request, response) => {
		const pageKey = String(request.body?.pageKey || "").trim(); const contentType = String(request.body?.contentType || ""); const title = String(request.body?.title || "").trim(); const value = String(request.body?.value || "").trim();
		if (!/^[a-zA-Z0-9_.:-]{1,80}$/.test(pageKey) || !new Set(["video","text","feature"]).has(contentType) || !title || !value) return response.status(400).json({ error: "invalidContent" });
		const now = new Date().toISOString(); const id = crypto.randomUUID(); database.prepare(`INSERT INTO content_items (id,page_key,content_type,title,value,sort_order,is_active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,1,?,?,?)`).run(id,pageKey,contentType,title,value,Number(request.body?.sortOrder)||0,request.admin.user.id,now,now);
		writeSystemLog(database, request, "content.create", "content", id, { pageKey, contentType, title }); return response.status(201).json({ id });
	});
	app.patch("/api/admin/content/:id", requirePermission("users.edit"), (request, response) => {
		const item = database.prepare(`SELECT * FROM content_items WHERE id = ?`).get(request.params.id); if (!item) return response.status(404).json({ error: "contentNotFound" });
		const title = String(request.body?.title ?? item.title).trim(); const value = String(request.body?.value ?? item.value).trim(); const isActive = request.body?.isActive === undefined ? item.is_active : request.body.isActive ? 1 : 0; if (!title || !value) return response.status(400).json({ error: "invalidContent" });
		database.prepare(`UPDATE content_items SET title=?,value=?,sort_order=?,is_active=?,updated_at=? WHERE id=?`).run(title,value,Number(request.body?.sortOrder ?? item.sort_order)||0,isActive,new Date().toISOString(),item.id); writeSystemLog(database, request, "content.update", "content", item.id, { title, isActive: Boolean(isActive) }); return response.json({ ok:true });
	});

	app.delete("/api/admin/content/:id", requirePermission("users.edit"), (request, response) => {
		const item = database.prepare(`SELECT * FROM content_items WHERE id = ?`).get(request.params.id);
		if (!item) return response.status(404).json({ error: "contentNotFound" });
		database.prepare(`DELETE FROM content_items WHERE id = ?`).run(item.id);
		writeSystemLog(database, request, "content.delete", "content", item.id, { pageKey: item.page_key, contentType: item.content_type, title: item.title });
		return response.json({ ok: true });
	});

	app.get("/api/admin/messages", requirePermission("messages.read"), (request, response) => {
		const limit = boundedLimit(request.query.limit, 100, 500);
		const messages = database.prepare(`
			SELECT m.id, m.conversation_id AS conversationId, m.message_type AS messageType,
				m.body, m.created_at AS createdAt, m.edited_at AS editedAt, m.deleted_at AS deletedAt,
				u.name AS senderName, COALESCE(c.title, c.type) AS conversationTitle
			FROM messages m
			JOIN users u ON u.id = m.sender_id
			JOIN conversations c ON c.id = m.conversation_id
			ORDER BY m.created_at DESC LIMIT ?
		`).all(limit);
		return response.json({ messages });
	});

	app.get("/api/admin/chat-users", requirePermission("messages.read"), (_request, response) => {
		const users = database.prepare(`
			SELECT u.id, u.name, u.phone, COALESCE(u.email, '') AS email,
				COUNT(DISTINCT m.id) AS messageCount, MAX(m.created_at) AS lastMessageAt
			FROM users u
			JOIN conversation_members member ON member.user_id = u.id
			JOIN messages m ON m.conversation_id = member.conversation_id
			GROUP BY u.id, u.name, u.phone, u.email
			ORDER BY lastMessageAt DESC
		`).all();
		return response.json({ users });
	});

	app.get("/api/admin/chat-users/:userId/messages", requirePermission("messages.read"), (request, response) => {
		const user = database.prepare("SELECT id, name, phone, COALESCE(email, '') AS email FROM users WHERE id = ?").get(request.params.userId);
		if (!user) return response.status(404).json({ error: "userNotFound" });
		const messages = database.prepare(`
			SELECT m.id, m.conversation_id AS conversationId, m.message_type AS messageType,
				m.body, m.created_at AS createdAt, m.edited_at AS editedAt, m.deleted_at AS deletedAt,
				sender.name AS senderName, COALESCE(c.title, c.type) AS conversationTitle
			FROM conversation_members member
			JOIN conversations c ON c.id = member.conversation_id
			JOIN messages m ON m.conversation_id = c.id
			JOIN users sender ON sender.id = m.sender_id
			WHERE member.user_id = ?
			ORDER BY m.created_at DESC LIMIT 500
		`).all(user.id);
		return response.json({ user, messages });
	});

	app.get("/api/admin/personnel", requirePermission("operators.manage"), (request, response) => {
		const roleFilter = request.admin.account.system_role === "super_admin" ? "" : "WHERE a.system_role = 'operator'";
		const personnel = database.prepare(`
			SELECT a.*, u.name, u.phone, u.email,
				a.created_at AS admin_created_at, a.updated_at AS admin_updated_at
			FROM admin_accounts a JOIN users u ON u.id = a.user_id
			${roleFilter}
			ORDER BY CASE a.system_role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, u.name
		`).all().map(publicAdminAccount);
		return response.json({ personnel });
	});

	app.post("/api/admin/personnel", requirePermission("operators.manage"), (request, response) => {
		const target = findUserByIdentifier(database, request.body?.identifier, request.body?.countryCode);
		if (!target) return response.status(404).json({ error: "userNotFound" });
		if (database.prepare("SELECT user_id FROM admin_accounts WHERE user_id = ?").get(target.id)) {
			return response.status(409).json({ error: "adminAccountExists" });
		}
		const requestedRole = String(request.body?.systemRole || "operator");
		const canCreateAdmin = request.admin.account.system_role === "super_admin";
		if (requestedRole !== "operator" && !(canCreateAdmin && requestedRole === "admin")) {
			return response.status(403).json({ error: "cannotAssignRole" });
		}
		const requestedPermissions = Array.isArray(request.body?.permissions) ? request.body.permissions : [];
		const permissions = requestedRole === "operator"
			? [...new Set(requestedPermissions.filter((permission) => OPERATOR_PERMISSIONS.has(permission)))]
			: [];
		const now = new Date().toISOString();
		database.prepare(`
			INSERT INTO admin_accounts
				(user_id, system_role, permissions_json, is_active, created_by, created_at, updated_at)
			VALUES (?, ?, ?, 1, ?, ?, ?)
		`).run(target.id, requestedRole, JSON.stringify(permissions), request.admin.user.id, now, now);
		writeSystemLog(database, request, "admin_account.create", "admin_account", target.id, {
			systemRole: requestedRole,
			permissions,
		});
		const created = database.prepare(`
			SELECT a.*, u.name, u.phone, u.email,
				a.created_at AS admin_created_at, a.updated_at AS admin_updated_at
			FROM admin_accounts a JOIN users u ON u.id = a.user_id WHERE a.user_id = ?
		`).get(target.id);
		return response.status(201).json({ account: publicAdminAccount(created) });
	});

	app.patch("/api/admin/personnel/:userId", requirePermission("operators.manage"), (request, response) => {
		const target = database.prepare(`
			SELECT a.*, u.name, u.phone, u.email,
				a.created_at AS admin_created_at, a.updated_at AS admin_updated_at
			FROM admin_accounts a JOIN users u ON u.id = a.user_id WHERE a.user_id = ?
		`).get(request.params.userId);
		if (!target) return response.status(404).json({ error: "adminAccountNotFound" });
		const actorRole = request.admin.account.system_role;
		if (target.system_role !== "operator" && actorRole !== "super_admin") {
			return response.status(403).json({ error: "cannotManageRole" });
		}
		if (target.system_role === "super_admin") {
			return response.status(403).json({ error: "cannotModifySuperAdmin" });
		}
		const requestedRole = String(request.body?.systemRole ?? target.system_role);
		if (requestedRole !== "operator" && !(actorRole === "super_admin" && requestedRole === "admin")) {
			return response.status(403).json({ error: "cannotAssignRole" });
		}
		const requestedPermissions = Array.isArray(request.body?.permissions)
			? request.body.permissions
			: parsePermissions(target);
		const permissions = requestedRole === "operator"
			? [...new Set(requestedPermissions.filter((permission) => OPERATOR_PERMISSIONS.has(permission)))]
			: [];
		const isActive = request.body?.isActive === undefined ? Boolean(target.is_active) : Boolean(request.body.isActive);
		const now = new Date().toISOString();
		database.prepare(`
			UPDATE admin_accounts
			SET system_role = ?, permissions_json = ?, is_active = ?, updated_at = ?
			WHERE user_id = ?
		`).run(requestedRole, JSON.stringify(permissions), isActive ? 1 : 0, now, target.user_id);
		writeSystemLog(database, request, "admin_account.update", "admin_account", target.user_id, {
			before: publicAdminAccount(target),
			after: { systemRole: requestedRole, permissions, isActive },
		});
		const updated = database.prepare(`
			SELECT a.*, u.name, u.phone, u.email,
				a.created_at AS admin_created_at, a.updated_at AS admin_updated_at
			FROM admin_accounts a JOIN users u ON u.id = a.user_id WHERE a.user_id = ?
		`).get(target.user_id);
		return response.json({ account: publicAdminAccount(updated) });
	});

	app.get("/api/admin/system-logs", requirePermission("system_logs.read"), (request, response) => {
		if (request.admin.account.system_role !== "super_admin") {
			return response.status(403).json({ error: "superAdminRequired" });
		}
		const limit = boundedLimit(request.query.limit, 200, 1000);
		const logs = database.prepare(`
			SELECT l.id, l.actor_user_id AS actorUserId, COALESCE(u.name, '系统') AS actorName,
				l.actor_role AS actorRole, l.action, l.target_type AS targetType,
				l.target_id AS targetId, l.created_at AS createdAt, l.ip_address AS ipAddress,
				l.metadata_json AS metadataJson
			FROM system_logs l LEFT JOIN users u ON u.id = l.actor_user_id
			ORDER BY l.created_at DESC LIMIT ?
		`).all(limit);
		return response.json({ logs });
	});

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: "internalError" });
  });

  return app;
}
